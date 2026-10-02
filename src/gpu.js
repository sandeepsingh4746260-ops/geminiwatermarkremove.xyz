// High-performance browser GPU pipeline.
// WebGPU uses VideoFrame -> importExternalTexture(), avoiding CPU pixel copies.
export async function createWebGpuWatermarkProcessor(width, height, meta, alphaMap) {
  if (!navigator.gpu) return { processor: null, reason: 'WebGPU unavailable' };
  let adapter;
  try {
    adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
    if (!adapter) return { processor: null, reason: 'No compatible GPU adapter' };
    const device = await adapter.requestDevice();

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('webgpu', { alphaMode: 'opaque' });
    if (!context) return { processor: null, reason: 'WebGPU canvas unavailable' };

    const format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({ device, format, alphaMode: 'opaque' });

    const shader = device.createShaderModule({ code: `
      struct VSOut { @builtin(position) position: vec4f, @location(0) uv: vec2f };
      @vertex fn vs(@builtin(vertex_index) i: u32) -> VSOut {
        var p = array<vec2f, 4>(vec2f(-1,-1), vec2f(1,-1), vec2f(-1,1), vec2f(1,1));
        var uv = array<vec2f, 4>(vec2f(0,1), vec2f(1,1), vec2f(0,0), vec2f(1,0));
        var o: VSOut; o.position = vec4f(p[i],0,1); o.uv = uv[i]; return o;
      }

      @group(0) @binding(0) var videoTex: texture_external;
      @group(0) @binding(1) var videoSampler: sampler;
      @group(0) @binding(2) var alphaTex: texture_2d<f32>;
      @group(0) @binding(3) var alphaSampler: sampler;
      @group(0) @binding(4) var<uniform> params: vec4f;
      @group(0) @binding(5) var<uniform> region: vec4f;

      @fragment fn fs(in: VSOut) -> @location(0) vec4f {
        let src = textureSampleBaseClampToEdge(videoTex, videoSampler, in.uv).rgb;
        let px = vec2f(in.uv.x * params.x, (1.0 - in.uv.y) * params.y);
        let inside = step(region.x, px.x) * step(region.y, px.y) * step(px.x, region.x + region.z) * step(px.y, region.y + region.w);
        let auv = (px - region.xy + vec2f(0.5)) / region.zw;
        let raw = textureSampleLevel(alphaTex, alphaSampler, auv, 0.0).r;
        let mag = abs(raw);
        let signal = max(0.0, mag - (3.0 / 255.0)) * params.z;
        let a = min(mag * params.z, 0.99);
        let logo = select(255.0, 0.0, raw < 0.0);
        let restored = (src * 255.0 - vec3f(a * logo)) / (1.0 - a) / 255.0;
        let active = inside * step(0.002, signal);
        return vec4f(clamp(mix(src, restored, active), vec3f(0.0), vec3f(1.0)), 1.0);
      }
    ` });

    const pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: { module: shader, entryPoint: 'vs' },
      fragment: { module: shader, entryPoint: 'fs', targets: [{ format }] },
      primitive: { topology: 'triangle-strip' }
    });

    const alphaTexture = device.createTexture({
      size: { width: meta.position.width, height: meta.position.height, depthOrArrayLayers: 1 },
      format: 'r32float',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
    const alphaRowBytes = meta.position.width * 4;
    const paddedRowBytes = Math.ceil(alphaRowBytes / 256) * 256;
    const paddedAlpha = paddedRowBytes === alphaRowBytes ? alphaMap : (() => {
      const out = new Float32Array((paddedRowBytes / 4) * meta.position.height);
      for (let y = 0; y < meta.position.height; y++) {
        out.set(alphaMap.subarray(y * meta.position.width, (y + 1) * meta.position.width), y * (paddedRowBytes / 4));
      }
      return out;
    })();
    device.queue.writeTexture(
      { texture: alphaTexture },
      paddedAlpha,
      { bytesPerRow: paddedRowBytes, rowsPerImage: meta.position.height },
      { width: meta.position.width, height: meta.position.height, depthOrArrayLayers: 1 }
    );

    const videoSampler = device.createSampler({ magFilter: 'linear', minFilter: 'linear' });
    const alphaSampler = device.createSampler({ type: 'non-filtering', magFilter: 'nearest', minFilter: 'nearest' });
    const params = device.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    device.queue.writeBuffer(params, 0, new Float32Array([width, height, Number(meta.alphaGain) > 0 ? meta.alphaGain : 1, 0]));
    const region = device.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    device.queue.writeBuffer(region, 0, new Float32Array([meta.position.x, meta.position.y, meta.position.width, meta.position.height]));

    let destroyed = false;
    const processor = {
      canvas, width, height,
      async render(videoFrame) {
        if (destroyed) throw new Error('GPU processor destroyed');
        const external = device.importExternalTexture({ source: videoFrame });
        const view = context.getCurrentTexture().createView();
        const bindGroup = device.createBindGroup({
          layout: pipeline.getBindGroupLayout(0),
          entries: [
            { binding: 0, resource: external },
            { binding: 1, resource: videoSampler },
            { binding: 2, resource: alphaTexture.createView() },
            { binding: 3, resource: alphaSampler },
            { binding: 4, resource: { buffer: params } },
            { binding: 5, resource: { buffer: region } },
          ]
        });
        const command = device.createCommandEncoder();
        const pass = command.beginRenderPass({
          colorAttachments: [{ view, clearValue: { r: 0, g: 0, b: 0, a: 1 }, loadOp: 'clear', storeOp: 'store' }]
        });
        pass.setPipeline(pipeline); pass.setBindGroup(0, bindGroup); pass.draw(4); pass.end();
        device.queue.submit([command.finish()]);
        // WebGPU rendering is asynchronous. Wait for completion before taking a
        // VideoFrame snapshot; otherwise the encoder can capture the canvas
        // before the GPU has written the pixels (black-frame output).
        await device.queue.onSubmittedWorkDone();
        return new VideoFrame(canvas, {
          timestamp: videoFrame.timestamp,
          duration: videoFrame.duration,
        });
      },
      preview(target) {
        if (!target) return;
        const maxW = 520;
        const scale = Math.min(1, maxW / width);
        target.width = Math.max(1, Math.round(width * scale));
        target.height = Math.max(1, Math.round(height * scale));
        target.getContext('2d').drawImage(canvas, 0, 0, target.width, target.height);
      },
      destroy() {
        destroyed = true;
        alphaTexture.destroy(); params.destroy(); region.destroy();
        device.destroy();
      }
    };

    return { processor, reason: 'WebGPU active' };
  } catch (error) {
    console.warn('WebGPU unavailable:', error);
    return { processor: null, reason: error?.message || 'WebGPU initialization failed' };
  }
}

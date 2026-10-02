import { removeWatermarkFromImageData } from '@pilio/gemini-watermark-remover';
import './style.css';

const app = document.querySelector('#app');
app.innerHTML = `
<header class="nav">
  <div class="brand"><span class="spark">✦</span><span>GeminiWatermarkRemove<span class="dot">.xyz</span></span></div>
  <nav><button class="link" id="toolsNav" type="button">Tools⌄</button><button class="link" id="videoNav" type="button">Gemini Video Remover</button></nav>
  <div class="actions"><a class="ghost" href="https://github.com/GargantuaX/gemini-watermark-remover" target="_blank" rel="noreferrer">◉ <b>Open Source</b></a></div>
</header>
<main>
<section class="hero">
  <h1>Gemini Watermark Remover</h1>
  <p>Remove visible Gemini watermarks from images and videos.<br><span>No upload, no sign-up — fast, private processing.</span></p>
  <div class="tabs"><button class="tab active" id="imageTab" type="button">▧ &nbsp; Images</button><button class="tab" id="videoTab" type="button">▷ &nbsp; Videos <small>BETA</small></button></div>

  <div id="drop" class="drop">
    <div class="decor left"></div><div class="decor right"></div>

    <div id="uploadPanel" class="uploadPanel">
      <label class="pick" id="mediaPick" for="mediaFile">
        <span>＋</span> <span id="pickText">Choose image</span>
      </label>
      <p><b id="dropText">or drag an image here</b></p><p class="hint" id="fileHint">PNG, JPG or WebP · up to 20 MB</p>
    </div>

    <div id="workArea" class="workArea hidden">
      <div class="resultHead"><strong id="status">Ready</strong><button id="reset" class="reset" type="button">Start over</button></div>
      <div id="compareGrid" class="compareGrid">
        <article class="mediaCard">
          <div class="mediaLabel">WITH WATERMARK</div>
          <div class="mediaFrame"><img id="beforeImage" class="media imageMedia" alt="Original image"><video id="beforeVideo" class="media videoMedia" controls playsinline></video></div>
        </article>
        <article class="mediaCard cleanCard">
          <div class="mediaLabel">WITHOUT WATERMARK</div>
          <div class="mediaFrame"><img id="afterImage" class="media imageMedia" alt="Cleaned image"><div id="videoResultPreview" class="videoResultPreview hidden"><canvas id="afterPreviewCanvas"></canvas><div class="frameCounter"><span id="frameCount">0</span> / <span id="totalFrames">—</span> frames cleaned</div></div><video id="afterVideo" class="media videoMedia hidden" controls playsinline></video></div>
          <div id="progressWrap" class="progressWrap hidden"><div id="progressBar" class="progressBar"></div></div><div id="frameProgress" class="frameProgress hidden"><b id="frameProgressText">0 / — frames</b><span id="accelerationBadge">GPU ready</span></div>
          <div class="resultActions"><button id="removeButton" class="removeButton" type="button">✦ Remove Watermark</button><button id="download" class="black big hidden" type="button">Download result</button><button id="copy" class="ghost big hidden" type="button">Copy image</button></div>
        </article>
      </div>
    </div>
    <p id="errorText" class="errorText hidden" role="alert"></p>
  </div>

  <section class="trust"><div><b>Private</b><span>Your media is processed without an upload workflow.</span></div><div><b>Free</b><span>No account or credits required.</span></div><div><b>Accelerated</b><span>Uses supported hardware acceleration automatically.</span></div></section>
  <section class="seo" aria-labelledby="about-tool"><h2 id="about-tool">Free Gemini watermark remover for images and videos</h2><p>Remove visible Gemini watermarks from supported images and videos directly in your browser. The tool detects the watermark once, reuses the detected mask for video frames, and prefers GPU-accelerated WebGPU or WebGL processing when available.</p><div class="seoGrid"><article><h3>How to remove a Gemini watermark</h3><ol><li>Choose or drag an image or video into the tool.</li><li>Click <b>Remove Watermark</b>.</li><li>Preview the cleaned result and download it.</li></ol></article><article><h3>Supported files</h3><p>Images: PNG, JPG and WebP. Videos: MP4, WebM and MOV. Video performance depends on resolution, frame rate, codec, browser and device hardware.</p></article><article><h3>Is my media uploaded?</h3><p>The processing flow is designed to run in your browser. The site does not need to upload the selected media to a processing server.</p></article><article><h3>Why can processing speed vary?</h3><p>Modern browsers can expose WebGPU and hardware video codecs differently. The tool automatically selects the fastest compatible path and keeps a CPU fallback for compatibility.</p></article></div><div class="faq"><h2>Frequently asked questions</h2><details><summary>Can I remove a Gemini watermark from a video?</summary><p>Yes, supported video files can be processed frame by frame and exported as an MP4 when the browser can decode and encode the source.</p></details><details><summary>Does the tool work on phones?</summary><p>Yes, the interface is responsive. Performance depends on the phone's browser, GPU, video codec and available memory.</p></details><details><summary>Does GPU acceleration always work?</summary><p>No. WebGPU and hardware video acceleration depend on browser, operating system, drivers and device support. A compatible fallback is used when the preferred path is unavailable.</p></details></div></section>
</section>
</main>
<footer>Built for fast, private in-browser processing · <a href="https://github.com/GargantuaX/gemini-watermark-remover" target="_blank" rel="noreferrer">Open-source engine</a></footer>`;

const file = document.querySelector('#mediaFile');
const videoFile = null;
const drop = document.querySelector('#drop');
const uploadPanel = document.querySelector('#uploadPanel');
const workArea = document.querySelector('#workArea');
const beforeImage = document.querySelector('#beforeImage');
const afterImage = document.querySelector('#afterImage');
const beforeVideo = document.querySelector('#beforeVideo');
const afterVideo = document.querySelector('#afterVideo');
const videoResultPreview = document.querySelector('#videoResultPreview');
const afterPreviewCanvas = document.querySelector('#afterPreviewCanvas');
const frameCount = document.querySelector('#frameCount');
const totalFrames = document.querySelector('#totalFrames');
const frameProgress = document.querySelector('#frameProgress');
const frameProgressText = document.querySelector('#frameProgressText');
const accelerationBadge = document.querySelector('#accelerationBadge');
const status = document.querySelector('#status');
const removeButton = document.querySelector('#removeButton');
const download = document.querySelector('#download');
const copy = document.querySelector('#copy');
const reset = document.querySelector('#reset');
const imageTab = document.querySelector('#imageTab');
const videoTab = document.querySelector('#videoTab');
const videoNav = document.querySelector('#videoNav');
const toolsNav = document.querySelector('#toolsNav');
const progressWrap = document.querySelector('#progressWrap');
const progressBar = document.querySelector('#progressBar');
const errorText = document.querySelector('#errorText');

let mode = 'image';
let selectedFile = null;
let outputBlob = null;
let beforeUrl = null;
let afterUrl = null;
let busy = false;
let lastConsumedFile = null;

// Native file-input flow. The input is physically inside the visible button,
// so Chromium/Edge/Firefox all activate the same native picker without any
// programmatic showPicker()/click() call.

videoNav.onclick = () => setMode('video');
toolsNav.onclick = () => document.querySelector('.tabs')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
imageTab.onclick = () => setMode('image');
videoTab.onclick = () => setMode('video');

['dragover', 'dragenter'].forEach((eventName) => drop.addEventListener(eventName, (event) => {
  event.preventDefault();
  if (!busy) drop.classList.add('drag');
}));
['dragleave', 'drop'].forEach((eventName) => drop.addEventListener(eventName, (event) => {
  event.preventDefault();
  drop.classList.remove('drag');
}));
['dragover', 'drop'].forEach((eventName) => window.addEventListener(eventName, (event) => {
  if (!drop.contains(event.target)) event.preventDefault();
}));
drop.addEventListener('drop', (event) => {
  if (busy) return;
  const f = event.dataTransfer.files?.[0];
  if (!f) return;
  selectMedia(f, f.type.startsWith('video/') ? 'video' : 'image');
});

// Single native file input for both image and video. The File API exposes the
// selected File through the change event; detection uses both MIME and extension.
function consumeSelectedFile() {
  const f = file?.files?.[0];
  if (!f || f === lastConsumedFile) return false;
  lastConsumedFile = f;
  const name = String(f.name || '').toLowerCase();
  const mime = String(f.type || '').toLowerCase();
  const isVideo = mime.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(name);
  const isImage = mime.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(name);
  if (!isVideo && !isImage) {
    try { file.value = ''; } catch { /* ignore */ }
    showError('Unsupported file. Choose PNG, JPG, WebP, MP4, WebM or MOV.');
    return false;
  }
  // Clear the input so (a) change/input/custom event do not process the same
  // selection three times and (b) picking the same file again still fires.
  try { file.value = ''; } catch { /* ignore */ }
  selectMedia(f, isVideo ? 'video' : 'image');
  return true;
}

// Robust native file-input path. The input lives in index.html (not inside the
// styled label), and the label uses a standard `for` relationship. No
// showPicker(), input.click(), overlay input, or nested-label behavior is used.
file.addEventListener('change', consumeSelectedFile, true);
file.addEventListener('input', consumeSelectedFile, true);
window.addEventListener('media-file-selected', consumeSelectedFile);
const mediaPick = document.querySelector('#mediaPick');
mediaPick?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    // Native label activation remains the primary path. This keyboard fallback
    // is only for accessibility and is still a direct user gesture.
    event.preventDefault();
    mediaPick.click();
  }
});
mediaPick && (mediaPick.tabIndex = 0);

function setMode(nextMode) {
  if (busy) return;
  mode = nextMode;
  if (mode === 'video') ensureOfficialVideoPipeline().catch(() => {});
  imageTab.classList.toggle('active', mode === 'image');
  videoTab.classList.toggle('active', mode === 'video');
  uploadPanel.classList.toggle('hidden', !!selectedFile);
  const pickText = document.querySelector('#pickText');
  const dropText = document.querySelector('#dropText');
  const fileHint = document.querySelector('#fileHint');
  if (pickText) pickText.textContent = mode === 'video' ? 'Choose video' : 'Choose image';
  if (dropText) dropText.textContent = mode === 'video' ? 'or drag a video here' : 'or drag an image here';
  if (fileHint) fileHint.textContent = mode === 'video' ? 'MP4, WebM or MOV · no size limit' : 'PNG, JPG or WebP · up to 20 MB';
  if (!selectedFile) workArea.classList.add('hidden');
}

function selectMedia(fileObj, type) {
  if (!fileObj) return;
  const filename = String(fileObj.name || '').toLowerCase();
  const detectedVideo = String(fileObj.type || '').toLowerCase().startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(filename);
  type = detectedVideo ? 'video' : 'image';
  if (type === 'video') mode = 'video';
  else mode = 'image';
  // Videos have no size limit (they are streamed from disk by the engine).
  // Images are decoded fully in memory, so they keep a 20 MB guard.
  if (type === 'image' && fileObj.size > 20 * 1024 * 1024) {
    showError('Please choose an image under 20 MB.');
    return;
  }
  const name = String(fileObj.name || '').toLowerCase();
  const imageByExtension = /\.(png|jpe?g|webp)$/i.test(name);
  const videoByExtension = /\.(mp4|webm|mov|m4v)$/i.test(name);
  const mime = String(fileObj.type || '').toLowerCase();
  const isImage = mime.startsWith('image/') || imageByExtension;
  const isVideo = /^video\/(mp4|webm|quicktime|x-m4v)$/.test(mime) || videoByExtension;

  // The picker already scopes files by mode. Do not reject a valid video just
  // because Windows reports an empty or unusual MIME type.
  if (type === 'image' && !isImage) return showError('Please choose a PNG, JPG or WebP image.');
  if (type === 'video' && !isVideo) return showError('Please choose an MP4, WebM or MOV video.');

  clearError();
  selectedFile = fileObj;
  console.info('[GeminiWatermarkRemove] file selected:', fileObj.name, fileObj.type, fileObj.size);
  mode = type;
  imageTab.classList.toggle('active', mode === 'image');
  videoTab.classList.toggle('active', mode === 'video');
  uploadPanel.classList.add('hidden');
  workArea.classList.remove('hidden');
  removeButton.classList.remove('hidden');
  download.classList.add('hidden');
  copy.classList.toggle('hidden', type !== 'image');
  progressWrap.classList.add('hidden');
  progressBar.style.width = '0%';
  outputBlob = null;

  revokeUrls();
  beforeUrl = URL.createObjectURL(fileObj);
  if (type === 'image') {
    beforeImage.src = beforeUrl;
    afterImage.removeAttribute('src');
    beforeImage.classList.remove('hidden');
    afterImage.classList.remove('hidden');
    videoResultPreview.classList.add('hidden');
    beforeVideo.classList.add('hidden');
    afterVideo.classList.add('hidden');
  } else {
    beforeVideo.src = beforeUrl;
    afterVideo.removeAttribute('src');
    beforeImage.classList.add('hidden');
    afterImage.classList.add('hidden');
    beforeVideo.classList.remove('hidden');
    afterVideo.classList.add('hidden');
    videoResultPreview.classList.remove('hidden');
  }
  const prettyName = String(fileObj.name || 'Selected file');
  status.textContent = `${prettyName} selected — click Remove Watermark`;
  if (type === 'image') {
    beforeImage.onload = () => { status.textContent = `${prettyName} selected — click Remove Watermark`; };
    beforeImage.onerror = () => showError('The selected image could not be previewed by this browser.');
  } else {
    beforeVideo.onloadedmetadata = () => { status.textContent = `${prettyName} selected — click Remove Watermark`; };
    beforeVideo.onerror = () => showError('The selected video could not be decoded by this browser. Try MP4 (H.264).');
  }

  // Warm the official video engine after selection, not before. This moves
  // model/runtime startup out of the actual processing click without wasting
  // bandwidth for users who only use image removal.
  if (type === 'video') {
    ensureOfficialVideoPipeline().catch(() => {});
  }
}

download.onclick = () => {
  if (!outputBlob) return;
  const ext = mode === 'video' ? 'mp4' : 'png';
  const a = document.createElement('a');
  const url = URL.createObjectURL(outputBlob);
  a.href = url;
  a.download = `gemini-watermark-removed.${ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

copy.onclick = async () => {
  if (!outputBlob || mode !== 'image') return;
  try {
    if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') throw new Error('Clipboard image copy is not supported in this browser.');
    await navigator.clipboard.write([new ClipboardItem({ [outputBlob.type || 'image/png']: outputBlob })]);
    status.textContent = 'Clean image copied to clipboard';
  } catch (error) {
    showError(error?.message || 'Could not copy the image. Use Download result instead.');
  }
};

removeButton.onclick = async () => {
  if (!selectedFile || busy) return;
  if (mode === 'image') await processImage(selectedFile);
  else await processVideo(selectedFile);
};

reset.onclick = () => {
  if (busy) return;
  revokeUrls();
  selectedFile = null;
  outputBlob = null;
  beforeUrl = null;
  afterUrl = null;
  file.value = '';
  lastConsumedFile = null;
  beforeImage.removeAttribute('src');
  afterImage.removeAttribute('src');
  beforeVideo.removeAttribute('src');
  afterVideo.removeAttribute('src');
  uploadPanel.classList.remove('hidden');
  const pickText = document.querySelector('#pickText');
  const dropText = document.querySelector('#dropText');
  const fileHint = document.querySelector('#fileHint');
  if (pickText) pickText.textContent = mode === 'video' ? 'Choose video' : 'Choose image';
  if (dropText) dropText.textContent = mode === 'video' ? 'or drag a video here' : 'or drag an image here';
  if (fileHint) fileHint.textContent = mode === 'video' ? 'MP4, WebM or MOV · no size limit' : 'PNG, JPG or WebP · up to 20 MB';
  workArea.classList.add('hidden');
  removeButton.classList.remove('hidden');
  download.classList.add('hidden');
  copy.classList.add('hidden');
  progressWrap.classList.add('hidden');
  frameProgress.classList.add('hidden');
  videoResultPreview.classList.add('hidden');
  clearError();
  status.textContent = 'Ready';
};

async function processImage(img) {
  busy = true;
  removeButton.disabled = true;
  clearError();
  status.textContent = 'Removing watermark…';
  try {
    const image = await loadImage(img);
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const result = await removeWatermarkFromImageData(imageData, { adaptiveMode: 'auto' });
    const out = document.createElement('canvas');
    out.width = canvas.width;
    out.height = canvas.height;
    out.getContext('2d').putImageData(result.imageData, 0, 0);
    outputBlob = await canvasToBlob(out, 'image/png');
    if (afterUrl) URL.revokeObjectURL(afterUrl);
    afterUrl = URL.createObjectURL(outputBlob);
    afterImage.src = afterUrl;
    download.classList.remove('hidden');
    copy.classList.remove('hidden');
    status.textContent = result.meta?.applied === false ? 'No removable Gemini watermark detected' : 'Watermark removed successfully';
  } catch (error) {
    console.error(error);
    status.textContent = 'Could not process this image';
    showError(error?.message || 'Image processing failed. Try another Gemini image.');
  } finally {
    busy = false;
    removeButton.disabled = false;
  }
}

let officialVideoFrame = null;
let officialVideoReady = null;

function ensureOfficialVideoPipeline() {
  if (officialVideoReady) return officialVideoReady;
  officialVideoReady = new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.title = 'Video processing engine';
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.position = 'fixed';
    iframe.style.left = '-10000px';
    iframe.style.top = '0';
    // Keep a realistic viewport: the engine page lays out canvases/video by width,
    // and a 2px iframe collapses them to zero size. Still invisible and off-screen.
    iframe.style.width = '1280px';
    iframe.style.height = '720px';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    iframe.style.border = '0';
    const fail = (message) => {
      clearTimeout(timer);
      iframe.remove();
      officialVideoReady = null; // allow a clean retry instead of caching the failure
      reject(new Error(message));
    };
    const timer = setTimeout(() => fail('Video engine took too long to load. Reload the page and try again.'), 60000);
    iframe.src = '/official-video/video-preview.html';
    iframe.onload = () => {
      const win = iframe.contentWindow;
      const doc = iframe.contentDocument;
      if (!win || !doc?.getElementById('fileInput') || !doc.getElementById('processBtn')) {
        fail('Video engine files are missing. Run "npm install" so public/official-video is created.');
        return;
      }
      clearTimeout(timer);
      officialVideoFrame = iframe;
      resolve(iframe);
    };
    iframe.onerror = () => fail('Official video engine failed to load.');
    document.body.appendChild(iframe);
  });
  return officialVideoReady;
}

function readOfficialProgress(iframe, fallbackTotal) {
  const doc = iframe?.contentDocument;
  const engineBar = doc?.getElementById('progressBar');
  const frameProgressTextEl = doc?.getElementById('frameProgressText');
  const statusEl = doc?.getElementById('status');
  const progress = engineBar ? Number.parseFloat(String(engineBar.style.width).replace('%', '')) : NaN;
  const text = frameProgressTextEl?.textContent?.trim() || '';
  const match = text.match(/(\d+)\s*\/\s*(\d+|—)/);
  if (match) {
    const done = Number(match[1]);
    const total = match[2] === '—' ? fallbackTotal : Number(match[2]);
    updateFrameProgress(done, Number.isFinite(total) ? total : fallbackTotal);
  }
  if (Number.isFinite(progress)) {
    progressBar.style.width = `${Math.max(0, Math.min(100, progress))}%`;
    status.textContent = `Removing watermark… ${Math.round(progress)}%`;
  } else if (statusEl?.textContent) {
    status.textContent = englishText(statusEl.textContent, 'Processing video…');
  }
}

async function processOfficialVideo(fileObj) {
  const iframe = await ensureOfficialVideoPipeline();
  const doc = iframe.contentDocument;
  const fileInput = doc.getElementById('fileInput');
  const processBtn = doc.getElementById('processBtn');
  const downloadBtn = doc.getElementById('downloadBtn');
  const statusEl = doc.getElementById('status');
  const totalEl = doc.getElementById('frameEstimate');

  // Reset the official page between jobs so its internal state is clean.
  doc.getElementById('resetBtn')?.click();
  await new Promise((resolve) => setTimeout(resolve, 30));

  // The engine lives in an iframe, which has its own Blob/File classes. Passing a
  // File created in this page makes the engine's `instanceof Blob` check fail
  // ("blob must be a Blob."). Re-wrap the bytes with the iframe's own constructors.
  const win = iframe.contentWindow;
  const ext = (fileObj.name.match(/\.([a-z0-9]+)$/i)?.[1] || '').toLowerCase();
  const typeByExt = { mp4: 'video/mp4', m4v: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime' };
  const frameFile = new win.File([fileObj], fileObj.name, {
    type: fileObj.type || typeByExt[ext] || 'video/mp4',
    lastModified: fileObj.lastModified
  });
  const transfer = new win.DataTransfer();
  transfer.items.add(frameFile);
  fileInput.files = transfer.files;
  fileInput.dispatchEvent(new Event('change', { bubbles: true }));

  await new Promise((resolve) => setTimeout(resolve, 120));
  processBtn.click();

  const startedAt = performance.now();
  let lastStatus = '';
  while (performance.now() - startedAt < 30 * 60 * 1000) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    readOfficialProgress(iframe, null);
    const officialStatus = englishText(statusEl?.textContent, '');
    if (officialStatus && officialStatus !== lastStatus) {
      lastStatus = officialStatus;
      status.textContent = officialStatus;
    }

    const href = downloadBtn?.getAttribute('href');
    const disabled = downloadBtn?.getAttribute('aria-disabled') === 'true';
    if (href && !disabled) {
      const blob = await fetch(href).then((response) => {
        if (!response.ok) throw new Error(`Could not read processed video (${response.status}).`);
        return response.blob();
      });
      if (!blob.size) throw new Error('Processed video is empty.');
      return blob;
    }

    const tone = statusEl?.dataset?.tone;
    if (tone === 'error') {
      throw new Error(englishText(statusEl?.textContent, 'Video processing failed.'));
    }
  }
  throw new Error('Video processing timed out.');
}

async function processVideo(videoFileObj) {
  busy = true;
  removeButton.disabled = true;
  clearError();
  progressWrap.classList.remove('hidden');
  frameProgress.classList.remove('hidden');
  progressBar.style.width = '0%';
  frameCount.textContent = '0';
  totalFrames.textContent = '—';
  frameProgressText.textContent = '0 / — frames';
  accelerationBadge.textContent = 'Official WebCodecs + ONNX';
  status.textContent = 'Preparing video…';

  try {
    const video = document.createElement('video');
    video.preload = 'metadata';
    const probeUrl = URL.createObjectURL(videoFileObj);
    video.src = probeUrl;
    try {
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = resolve;
        video.onerror = () => reject(new Error('This browser cannot decode the selected video. Try an MP4 (H.264) file.'));
      });
    } finally {
      URL.revokeObjectURL(probeUrl);
    }
    if (Number.isFinite(video.duration) && video.duration > 0) {
      // The official engine reports the exact/estimated frame count during export.
      // Keep the UI alive while it detects and processes frames.
      totalFrames.textContent = '—';
    }

    const blob = await processOfficialVideo(videoFileObj);
    outputBlob = blob;
    if (afterUrl) URL.revokeObjectURL(afterUrl);
    afterUrl = URL.createObjectURL(outputBlob);
    afterVideo.src = afterUrl;
    afterVideo.load();
    afterVideo.classList.remove('hidden');
    videoResultPreview.classList.add('hidden');
    download.classList.remove('hidden');
    copy.classList.add('hidden');
    progressBar.style.width = '100%';
    status.textContent = 'Watermark removed successfully';
    frameProgressText.textContent = `${frameCount.textContent} / ${totalFrames.textContent} frames`;
  } catch (error) {
    console.error('Video processing error:', error);
    status.textContent = 'Video processing failed';
    showError(error?.message || 'Video processing failed. Use a current Chrome or Edge browser.');
  } finally {
    busy = false;
    removeButton.disabled = false;
  }
}

function updateFrameProgress(done, total) {
  frameCount.textContent = String(done);
  totalFrames.textContent = total ? String(total) : '—';
  frameProgressText.textContent = `${done} / ${total || '—'} frames`;
  if (total) progressBar.style.width = `${Math.min(100, Math.round(done / total * 100))}%`;
}

// ---------------------------------------------------------------------------
// Helpers: these were referenced throughout this file but never defined, which
// threw "ReferenceError" as soon as any file was selected.
// ---------------------------------------------------------------------------
// Any text coming from the video engine is shown only if it is English; if some
// untranslated Chinese string ever slips through, show a neutral English fallback.
function englishText(text, fallback) {
  const t = String(text || '').trim();
  return t && !/[\u3000-\u303f\u3400-\u9fff\uff00-\uffef]/.test(t) ? t : fallback;
}

function showError(message) {
  errorText.textContent = String(message || 'Something went wrong.');
  errorText.classList.remove('hidden');
}

function clearError() {
  errorText.textContent = '';
  errorText.classList.add('hidden');
}

function revokeUrls() {
  if (beforeUrl) URL.revokeObjectURL(beforeUrl);
  if (afterUrl) URL.revokeObjectURL(afterUrl);
  beforeUrl = null;
  afterUrl = null;
}

function loadImage(fileObj) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(fileObj);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('The selected image could not be decoded.')); };
    img.src = url;
  });
}

function canvasToBlob(canvas, type = 'image/png') {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not encode the result image.'))), type);
  });
}

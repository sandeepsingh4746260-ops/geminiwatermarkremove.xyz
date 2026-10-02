// Translates the Chinese UI/status strings of the official video engine to English.
// Runs automatically from prepare-official-video.mjs after the engine is copied.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Strings inside video-app.js (decoded form, exactly as they appear in the code).
const JS = {
  '${f}，已处理 ${u.processedFrames} 帧。${g}': '${f}, processed ${u.processedFrames} frames. ${g}',
  '${w} 帧': '${w} frames',
  '1920x1080 已确认': '1920x1080 confirmed',
  'AI 去水印已完成': 'AI watermark removal complete',
  'AI 自动处理': 'AI auto processing',
  '不支持的文件类型。': 'Unsupported file type.',
  '低置信': 'Low confidence',
  '准备就绪': 'Ready',
  '匹配水印': 'Matching watermark',
  '去水印已完成': 'Watermark removal complete',
  '可导出': 'Ready to export',
  '处理中': 'Processing',
  '处理中…': 'Processing…',
  '失败 ✗': 'Failed ✗',
  '完成': 'Done',
  '导出中 ${R}': 'Exporting ${R}',
  '导出失败': 'Export failed',
  '已停止处理，剩余队列已取消。已下载的文件不受影响。': 'Processing stopped. The remaining queue was cancelled. Files already downloaded are not affected.',
  '已取消': 'Cancelled',
  '已完成 ✓': 'Done ✓',
  '已应用迁移锚点复核预设：Canvas 足迹抛光、12Mbps、允许低置信。此预设用于人工复核，不是默认策略。': 'Applied the relocated-anchor review preset: Canvas footprint polish, 12 Mbps, low confidence allowed. This preset is for manual review, not the default strategy.',
  '已自动选择：${r.label}。': 'Automatically selected: ${r.label}.',
  '已跳过': 'Skipped',
  '开始': 'Start',
  '当前浏览器不支持 WebCodecs H.264/AVC 编码，请使用新版 Chrome 或 Edge。': 'This browser does not support WebCodecs H.264/AVC encoding. Please use a recent version of Chrome or Edge.',
  '当前浏览器不支持本地文件暂存，请直接打开目标调试页后重新选择文件。': 'This browser does not support local file staging. Please reselect the file.',
  '当前浏览器缺少 WebCodecs，请使用新版 Chrome 或 Edge。': 'This browser does not support WebCodecs. Please use a recent version of Chrome or Edge.',
  '当前环境没有可用 Canvas': 'No usable Canvas is available in this environment.',
  '批量处理完成：成功 ${e.done}/${e.total}，结果已自动下载。': 'Batch finished: ${e.done}/${e.total} succeeded, results downloaded automatically.',
  '抽帧': 'Sampling frames',
  '抽帧 ${a}/${i}': 'Sampling frames ${a}/${i}',
  '排队中': 'Queued',
  '播放': 'Play',
  '文件中没有可处理的视频轨': 'No processable video track was found in the file.',
  '无法从视频中抽取检测帧': 'Could not extract detection frames from the video.',
  '无法创建 2D Canvas 上下文': 'Could not create a 2D canvas context.',
  '无法打开本地文件暂存。': 'Could not open local file staging.',
  '无法进入图片调试流程，请打开单图页后重新选择文件。': 'Could not start the image workflow. Please reselect the file.',
  '暂停': 'Pause',
  '未知': 'Unknown',
  '本地文件暂存失败。': 'Local file staging failed.',
  '本地文件暂存已取消。': 'Local file staging was cancelled.',
  '检测中': 'Detecting',
  '检测失败': 'Detection failed',
  '检测完成': 'Detection complete',
  '检测完成，导出时会使用 AI 去水印。': 'Detection complete. AI watermark removal will be used when exporting.',
  '检测置信度偏低，仍可尝试 AI 导出。': 'Detection confidence is low. You can still try the AI export.',
  '正在停止处理并释放资源…': 'Stopping and releasing resources…',
  '正在加载 AI FDnCNN ONNX 模型，首次加载会稍慢...': 'Loading the AI FDnCNN ONNX model (the first load is slower)...',
  '正在匹配水印候选，页面会保持响应...': 'Matching watermark candidates...',
  '正在启用 WebGPU AI 去水印...': 'Enabling WebGPU AI watermark removal...',
  '正在导出视频，已处理 ${R}${N}。': 'Exporting video, processed ${R}${N}.',
  '正在抽帧检测右下角水印...': 'Sampling frames to detect the bottom-right watermark...',
  '正在抽帧检测水印...': 'Sampling frames to detect the watermark...',
  '正在抽帧检测水印：${a}/${i}': 'Sampling frames to detect the watermark: ${a}/${i}',
  '正在本地逐帧处理，页面保持打开即可。': 'Processing frame by frame in your browser. Keep this page open.',
  '正在检测水印候选...': 'Detecting watermark candidates...',
  '正在读取视频元数据...': 'Reading video metadata...',
  '正在进入图片调试流程...': 'Starting the image workflow...',
  '比例推断，实验性': 'Inferred from aspect ratio (experimental)',
  '浏览器阻止了播放，请再点一次播放按钮。': 'The browser blocked playback. Click the play button again.',
  '等待视频': 'Waiting for video',
  '缺少 96px Gemini alpha map，无法生成视频水印模板': 'The 96px Gemini alpha map is missing, so the video watermark template cannot be created.',
  '自动检测水印位置并使用 AI 模型清理，无需手动调参。': 'Automatically detects the watermark position and cleans it with an AI model. No manual tuning needed.',
  '视频导出失败，输出为空': 'Video export failed: the output is empty.',
  '视频已载入，点击导出即可使用 AI 去水印。': 'Video loaded. Click export to remove the watermark with AI.',
  '视频水印检测置信度偏低，已停止导出。可打开低置信导出后重试。': 'Watermark detection confidence is too low, so export was stopped. Enable low-confidence export and try again.',
  '请选择图片或视频文件。视频会在本页处理，图片会回到单图对比页。': 'Please choose an image or video file.',
  '读取本地文件暂存失败。': 'Failed to read local file staging.',
  '读取本地文件暂存已取消。': 'Reading local file staging was cancelled.',
  '读取视频': 'Reading video',
  '读取视频失败': 'Failed to read the video',
  '读取视频暂存失败，请重新选择文件。': 'Failed to read the staged video. Please reselect the file.',
  '默认使用本地 AI 模型处理右下角 Gemini/Veo 水印。': 'Uses a local AI model by default to remove the bottom-right Gemini/Veo watermark.'
};

// Text nodes / attribute values in video-preview.html.
const HTML = {
  'Gemini 视频水印本地处理 MVP': 'Gemini Video Watermark Local Processing',
  'WebCodecs + Mediabunny，文件只在浏览器内解码、逐帧处理、重新封装 MP4。': 'WebCodecs + Mediabunny: files are decoded, processed frame by frame and re-muxed to MP4 entirely in your browser.',
  '当前范围：右下角 72px Gemini/Veo 风格水印；视频轨重编码，兼容音频轨自动透传。': 'Scope: the 72px Gemini/Veo-style watermark in the bottom-right corner. The video track is re-encoded; compatible audio is passed through automatically.',
  'Before / After 对比': 'Before / After',
  '等待视频': 'Waiting for video',
  '选择或拖入图片 / 视频': 'Choose or drop an image / video',
  '导出完成后显示右侧对比': 'The comparison appears on the right after export',
  '选择文件': 'Choose file',
  '视频会在本页处理，图片会回到单图对比页。10 秒 1080p MP4 样例最适合当前 MVP。': 'Videos are processed on this page.',
  '自动处理': 'Auto processing',
  'AI 自动处理': 'AI auto processing',
  '选择视频后自动检测水印，导出时使用本地 AI 模型清理。': 'After you choose a video, the watermark is detected automatically and cleaned with a local AI model on export.',
  '检测水印': 'Detect watermark',
  '重置': 'Reset',
  '停止处理': 'Stop',
  '自动导出无水印视频': 'Export video without watermark',
  '下载结果': 'Download result',
  '关闭': 'Close',
  'Canvas 边缘去噪': 'Canvas edge denoise',
  'Canvas 边缘带去噪': 'Canvas edge-band denoise',
  'Canvas 边缘核心去噪': 'Canvas edge-core denoise',
  'Canvas 足迹抛光': 'Canvas footprint polish',
  'Canvas 时序 Delta 稳定': 'Canvas temporal delta stabilization',
  'Canvas 匹配 Delta 稳定': 'Canvas matched delta stabilization',
  'Canvas 时序稳定': 'Canvas temporal stabilization',
  'Canvas 纹理回填': 'Canvas texture refill',
  '迁移锚点复核预设': 'Relocated-anchor review preset',
  '导出会重新编码视频轨，并在 MP4 支持原音频编码时透传音频轨。': 'Export re-encodes the video track and passes the audio track through when MP4 supports its codec.',
  '视频信息': 'Video info',
  '检测结果': 'Detection result',
  '视频对比': 'Video comparison',
  '播放': 'Play',
  '播放进度': 'Playback progress',
  '处理设置': 'Processing settings',
  '批量队列': 'Batch queue',
  '处理进度': 'Processing progress'
};


// Fragments that live inside HTML templates / mixed-quote strings in video-app.js.
const FRAG = {
  '无法加载': 'Failed to load',
  '模型：': 'model: ',
  '自动处理': 'auto processing',
  '选择视频后自动检测水印，导出时使用本地': 'After you choose a video, the watermark is detected automatically and, on export, cleaned with a local',
  '模型清理。': 'model.',
  '等待载入视频': 'Waiting for video',
  '尺寸': 'Size',
  '时长': 'Duration',
  '帧率': 'Frame rate',
  '视频码率': 'Video bitrate',
  '水印规格': 'Watermark spec',
  '先检测或直接导出': 'Detect first or export directly',
  '候选': 'Candidates',
  '位置': 'Position',
  '大小': 'Size',
  '均值分数': 'Mean score',
  '投票': 'Votes',
  '状态': 'Status',
  '音频已保留：': 'Audio kept: ',
  '音频未保留：': 'Audio not kept: ',
  '，': ', ',
  '。': '.'
};

const CJK = /[\u3000-\u303f\u3400-\u9fff\uff00-\uffef]/;
const decode = (s) => s.replace(/\\u([0-9A-Fa-f]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
const STRING_LITERAL = /(["`'])((?:[^"`'\\\n]|\\u[0-9A-Fa-f]{4}|\\.)*?)\1/g;

export async function localizeOfficialVideo(dir) {
  const jsPath = path.join(dir, 'video-app.js');
  const htmlPath = path.join(dir, 'video-preview.html');
  const missing = new Set();
  let replaced = 0;

  let js = await readFile(jsPath, 'utf8');
  js = js.replace(STRING_LITERAL, (whole, quote, body) => {
    if (!body.includes('\\u')) return whole;
    const text = decode(body);
    if (!CJK.test(text)) return whole;
    const en = JS[text];
    if (en === undefined) { missing.add(text); return whole; }
    if (en.includes(quote) || en.includes('\\')) throw new Error(`Translation contains ${quote} or backslash: ${en}`);
    replaced += 1;
    return quote + en + quote;
  });

  // Second pass: fragments inside templates that the string-literal pass cannot parse.
  js = js.replace(/(?:\\u[0-9A-Fa-f]{4}|[\u3400-\u9fff])+/g, (run) => {
    const text = decode(run);
    if (!CJK.test(text)) return run;
    const en = FRAG[text];
    if (en === undefined) { missing.add(text); return run; }
    replaced += 1;
    return en;
  });

  let html = await readFile(htmlPath, 'utf8');
  html = html.replace(/<html lang="[^"]*"/, '<html lang="en"');
  for (const key of Object.keys(HTML).sort((a, b) => b.length - a.length)) {
    html = html.split(key).join(HTML[key]);
  }

  const leftoverJs = (js.match(/\\u[3-9][0-9A-Fa-f]{3}/g) || []).filter((h) => CJK.test(decode(h))).length + (js.match(/[\u3400-\u9fff]/g) || []).length;
  const leftoverHtml = (html.match(/[\u3400-\u9fff\uff00-\uffef]/g) || []).length;

  await writeFile(jsPath, js);
  await writeFile(htmlPath, html);

  console.log(`Localized official video engine to English (${replaced} JS strings).`);
  if (missing.size || leftoverJs || leftoverHtml) {
    console.warn(`WARNING: untranslated Chinese remains (js=${leftoverJs}, html=${leftoverHtml}). Add these to scripts/localize-official-video.mjs:`);
    for (const m of missing) console.warn('  ' + JSON.stringify(m));
  }
  return { replaced, missing: [...missing], leftoverJs, leftoverHtml };
}

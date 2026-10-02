# v7.1 Test Report

## Root cause of "image/video upload not working"
`src/main.js` called `showError`, `clearError`, `revokeUrls`, `loadImage` and `canvasToBlob`, but none of them were defined.
Selecting any file reached `clearError()` in `selectMedia()` and threw `ReferenceError`, so the work area never opened.
`node --check` (used in the old report) only checks syntax and cannot catch this.

## What was actually run in this environment
| Test | Result |
|---|---|
| Original code, pick PNG and MP4 in jsdom | REPRODUCED: `ReferenceError: clearError is not defined`, work area stays hidden |
| Fixed code, pick PNG and MP4 | PASS: preview opens, status shows the file name, 0 runtime errors |
| One selection is processed exactly once | PASS |
| Same file picked again (after Start over) | PASS |
| Unsupported file (.pdf) and oversize image: error visible on upload screen | PASS |
| `.mov` with empty MIME (common on Windows) | PASS |
| `.mkv` rejected with a clear message | PASS |
| "Install Chrome Extension" button removed, "Open Source" link kept | PASS |
| `npm install` + `prepare` script | PASS (creates `public/official-video`) |
| `vite build` | PASS |
| Production preview serves engine HTML/JS, `.wasm` (application/wasm), `.onnx` models | PASS |
| `robots.txt` / `sitemap.xml` present in `dist` | PASS (were missing before) |
| Real `removeWatermarkFromImageData` call with the page's arguments | PASS: returns `imageData` + `meta.applied` |

| Cross-realm File: parent File `instanceof` iframe Blob | FALSE (reproduced); after re-wrapping with iframe `File` | TRUE |
| Engine localized: Chinese chars left in `video-app.js` / `video-preview.html` | 0 / 0 (was 818 escaped + 284 in HTML) |
| Localized `video-app.js` still parses; engine page loads in jsdom with English status/labels | PASS |
| 5 GB and 50 GB video accepted by the UI (no size limit) | PASS |
| Image over 20 MB still rejected | PASS |

## NOT tested (no real browser available in the sandbox)
- Real watermark removal on an actual Gemini image/video.
- Video export through the hidden engine iframe (WebCodecs + ONNX).
- Copy-to-clipboard, download button, mobile layout.
Please test these once in current Chrome/Edge with `npm run dev`.

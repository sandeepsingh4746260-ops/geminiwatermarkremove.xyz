# Gemini Watermark Remover — official video pipeline integration

This build keeps the existing one-page UI and image workflow, but routes video processing through the same open-source video pipeline shipped by the Gemini Watermark Remover project.

## Video pipeline
- Official `@pilio/gemini-watermark-remover` video application assets are copied from the installed package during `npm install`.
- Video processing runs inside a hidden same-origin iframe using the project's bundled video engine.
- The official pipeline uses Mediabunny/WebCodecs for browser video decode/encode and ONNX Runtime Web for the AI cleanup path used by the site's automatic preset.
- The official engine samples video frames for detection, then processes the video using its production cleanup/reuse logic.
- Audio is preserved when the source codec can be copied into MP4.
- No server-side video processing is added by this integration.

## Install

```bash
npm install
npm run dev
```

The `prepare` script copies the official package `dist/` assets, including the ONNX models and WebCodecs video application, into `public/official-video/`.

## Important

The official project is MIT licensed. Keep `THIRD_PARTY_NOTICES.txt` and the upstream license/notice files when distributing the site.


## Upload fix
The image/video buttons use native `<input type="file">` controls inside their labels. This avoids programmatic picker restrictions and lets the browser deliver the selected File directly to the app. Video engine initialization also starts when the Videos tab is opened so model/runtime startup can overlap with user selection.


## v6.7.2 upload architecture
- Uses one native browser file input for both image and video selection.
- Video/image type is inferred from the selected File MIME type and filename extension.
- Selected video is immediately previewed with `URL.createObjectURL()` before processing.
- No programmatic `showPicker()` or `input.click()` is required.
- Canonical site: https://geminiwatermarkremove.xyz/

## Final hardening
- Native file input is a sibling of its label and uses the browser-standard `change`/`input` events.
- A focus-return fallback also consumes the selected file.
- Download and image clipboard actions are wired.
- Tools navigation is wired.


## v7.1 fixes
- **Upload bug (root cause):** `showError`, `clearError`, `revokeUrls`, `loadImage` and `canvasToBlob` were called in `src/main.js` but never defined. Picking any image/video threw `ReferenceError` before the preview opened, so nothing appeared to upload. All five helpers are now defined.
- A selected file is consumed exactly once (change/input/custom event no longer triple-fire) and the input is cleared, so choosing the same file again works.
- Validation errors (wrong type, too large) are now visible on the upload screen (the error box moved out of the hidden work area).
- Only MP4, WebM, MOV and M4V videos are accepted (what the hint text and engine support); `.mkv/.avi/.mpeg` are rejected up front with a clear message.
- Video progress bar now moves (a variable shadowed the host bar and the update was written into the hidden engine page instead).
- Engine start-up has a 60 s timeout, shows a clear message if `public/official-video` is missing, and no longer caches a failed attempt.
- Removed the "Install Chrome Extension" button.
- Removed dead WebGL code that called an undefined `linkProgram` (`src/gpu.js` is unused and was left untouched).
- `robots.txt` and `sitemap.xml` moved to `public/` so Vite actually deploys them.
- **Video error "blob must be a Blob.":** the selected File was created in the page but checked with `instanceof Blob` inside the engine iframe (different realm). The file is now re-wrapped with the iframe's own `File`/`DataTransfer` before it is handed to the engine.
- **Video size:** no size limit for videos any more (images keep a 20 MB guard). Very large files are limited only by your browser/device memory.
- **English only:** the official engine ships Chinese UI/status text. `scripts/localize-official-video.mjs` translates it to English every time `public/official-video` is generated (`npm install`, `npm run dev`, `npm run build`). If a future engine version adds new Chinese strings, the script prints them as a warning, and `main.js` shows a neutral English fallback meanwhile.

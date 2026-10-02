
import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { localizeOfficialVideo } from './localize-official-video.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'node_modules', '@pilio', 'gemini-watermark-remover', 'dist');
const target = path.join(root, 'public', 'official-video');

await mkdir(path.dirname(target), { recursive: true });
await rm(target, { recursive: true, force: true });
await cp(source, target, { recursive: true });
console.log('Copied official video pipeline to public/official-video');
await localizeOfficialVideo(target);

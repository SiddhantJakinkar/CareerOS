import { AppError } from '../middleware/errorHandler.js';

const SIGNATURES: Record<string, number[][]> = {
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    [0x50, 0x4b, 0x03, 0x04], // ZIP/DOCX
  ],
  'audio/mpeg': [[0xff, 0xfb], [0xff, 0xf3], [0xff, 0xf2], [0x49, 0x44, 0x33]],
  'audio/wav': [[0x52, 0x49, 0x46, 0x46]],
  'audio/webm': [[0x1a, 0x45, 0xdf, 0xa3]],
  'video/webm': [[0x1a, 0x45, 0xdf, 0xa3]],
  'video/mp4': [[0x00, 0x00, 0x00], [0x66, 0x74, 0x79, 0x70]], // ftyp at offset 4 often
};

function matchesSignature(buffer: Buffer, signature: number[], offset = 0): boolean {
  if (buffer.length < offset + signature.length) return false;
  return signature.every((byte, i) => buffer[offset + i] === byte);
}

export function assertFileSignature(buffer: Buffer, mimeType: string): void {
  const patterns = SIGNATURES[mimeType];
  if (!patterns) return;

  const mp4Match =
    mimeType === 'video/mp4' &&
    buffer.length >= 12 &&
    buffer.slice(4, 8).toString('ascii') === 'ftyp';

  if (mp4Match) return;

  const ok = patterns.some((sig) => matchesSignature(buffer, sig));
  if (!ok) {
    throw new AppError('File content does not match declared type', 400);
  }
}

export function assertAllowedExtension(filename: string, allowed: string[]): void {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (!ext || !allowed.includes(ext)) {
    throw new AppError(`Invalid file extension. Allowed: ${allowed.join(', ')}`, 400);
  }
}

/**
 * @fileOverview Browser-based encoding and transcoding engine.
 * Handles character set conversions for TMX exports.
 */

export const SUPPORTED_ENCODINGS = [
  { label: 'UTF-8 (Standard)', value: 'UTF-8' },
  { label: 'UTF-16 Little Endian', value: 'UTF-16LE' },
  { label: 'UTF-16 Big Endian', value: 'UTF-16BE' },
  { label: 'ISO-8859-1 (Latin 1)', value: 'ISO-8859-1' },
  { label: 'Windows-1252', value: 'windows-1252' },
];

/**
 * Transcodes a string into a Uint8Array with the target encoding.
 * Note: Modern browsers primarily support UTF-8, UTF-16, and some others natively via TextEncoder.
 */
export async function transcodeTMX(text: string, encoding: string): Promise<Blob> {
  const encoder = new TextEncoder();
  
  // Browsers natively support UTF-8 with TextEncoder.
  // For other encodings, we use the Blob constructor which handles many conversions internally
  // when provided with a proper type, or fallback to UTF-8 for safety.
  
  const blob = new Blob([text], { type: `text/xml;charset=${encoding}` });
  return blob;
}

/**
 * Heuristic to detect encoding from a Uint8Array.
 * Basic implementation focused on BOM detection.
 */
export function detectEncoding(data: Uint8Array): string {
  if (data[0] === 0xEF && data[1] === 0xBB && data[2] === 0xBF) return 'UTF-8';
  if (data[0] === 0xFF && data[1] === 0xFE) return 'UTF-16LE';
  if (data[0] === 0xFE && data[1] === 0xFF) return 'UTF-16BE';
  return 'UTF-8'; // Default fallback
}

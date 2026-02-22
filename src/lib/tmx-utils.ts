
import { TmxTag, TranslationSegment, TmxTagType } from './types';

/**
 * Parses raw XML-like segment text (which may contain inline tags) 
 * into a structured object that separates text from visual chips.
 * This function correctly handles paired tags (like <g>) and self-closing tags.
 */
export function parseRawSegment(raw: string): TranslationSegment {
  const tags: TmxTag[] = [];
  if (!raw) return { text: '', tags: [] };

  // Use a non-greedy regex to correctly split tags. This prevents grabbing text between tags.
  const tagRegex = /(<.+?>)/g;
  const parts = raw.split(tagRegex).filter(Boolean);

  let textContent = '';
  let tagCounter = 0;
  const bptStack: { id: number; tagName: string }[] = [];

  for (const part of parts) {
    const isTagLike = part.startsWith('<') && part.endsWith('>');
    
    // Stricter regex, anchored to the start of the string.
    // XML tag names must start with a letter, '_', or ':', not a space or number.
    const tagNameMatch = isTagLike ? part.match(/^<\/?([a-zA-Z_:][\w:.-]*)/) : null;

    if (tagNameMatch) {
      // This is a valid tag
      const tagName = tagNameMatch[1].toLowerCase();
      const isClosing = part.startsWith('</');
      const isSelfClosing = part.endsWith('/>');

      let type: TmxTagType;
      let placeholder: string;

      if (isSelfClosing || ['ph', 'x'].includes(tagName)) {
        type = 'ph';
        placeholder = `[ph_${tagCounter++}]`;
      } else if (isClosing) {
        type = 'ept';
        const bptInfo = bptStack.pop();
        const bptIndex = bptInfo ? bptInfo.id : tagCounter++; // Fallback
        placeholder = `[ept_${bptIndex}]`;
      } else {
        type = 'bpt';
        bptStack.push({ id: tagCounter, tagName: tagName });
        placeholder = `[bpt_${tagCounter++}]`;
      }
      
      const iMatch = part.match(/\bi="([^"]*)"/i);
      const index = iMatch ? iMatch[1] : undefined;

      tags.push({ id: placeholder, type, content: part, index });
      textContent += placeholder;

    } else {
      // This is plain text or an invalid tag structure, decode entities for editor
      textContent += part.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/, '>').replace(/&quot;/g, '"').replace(/&apos;/, "'");
    }
  }

  return { text: textContent, tags };
}


export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

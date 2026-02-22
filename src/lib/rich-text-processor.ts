
import ExcelJS from 'exceljs';

/**
 * Converts a segment string and its highlights into an ExcelJS RichText value.
 * Highlights are rendered as Red Bold text (#FF0000).
 */
export function processRichText(text: string, highlights: { start: number, end: number }[] = []): ExcelJS.CellRichTextValue | string {
  if (!highlights || highlights.length === 0) {
    return text;
  }

  // Sort and merge overlapping highlights
  const sorted = [...highlights].sort((a, b) => a.start - b.start);
  const merged: { start: number, end: number }[] = [];

  if (sorted.length > 0) {
    let current = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].start < current.end) {
        current.end = Math.max(current.end, sorted[i].end);
      } else {
        merged.push(current);
        current = sorted[i];
      }
    }
    merged.push(current);
  }

  const richText: ExcelJS.RichText[] = [];
  let lastPos = 0;

  merged.forEach(h => {
    // Regular text before highlight
    if (h.start > lastPos) {
      richText.push({ text: text.substring(lastPos, h.start) });
    }
    // Highlighted text (Red Bold)
    richText.push({
      text: text.substring(h.start, h.end),
      font: {
        color: { argb: 'FFFF0000' },
        bold: true
      }
    });
    lastPos = h.end;
  });

  // Remaining regular text
  if (lastPos < text.length) {
    richText.push({ text: text.substring(lastPos) });
  }

  return { richText };
}

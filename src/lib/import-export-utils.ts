
/**
 * Utility for exporting string arrays to plain text files.
 */
export function exportToTextFile(list: string[], filename: string) {
  const blob = new Blob([list.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Parses pasted text into a clean list of strings.
 * Supports newlines and commas.
 */
export function parsePastedList(text: string): string[] {
  return text
    .split(/[\n,]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

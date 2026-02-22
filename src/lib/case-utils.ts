
/**
 * Utility for detecting character casing across different locales.
 */

export function isUpperCase(char: string, locale: string = 'en-US'): boolean {
  if (!char || !/[a-zA-Z\u00C0-\u017F]/.test(char)) return false;
  return char === char.toLocaleUpperCase(locale);
}

export function isLowerCase(char: string, locale: string = 'en-US'): boolean {
  if (!char || !/[a-zA-Z\u00C0-\u017F]/.test(char)) return false;
  return char === char.toLocaleLowerCase(locale);
}

export function getFirstAlpha(text: string): string | null {
  const match = text.match(/[a-zA-Z\u00C0-\u017F]/);
  return match ? match[0] : null;
}



import { QAIssue, QASettings, QuotePair } from './types';
import { INTERNAL_TAG_REGEX, mapStrippedToOriginal } from './qa-utils';

/**
 * Validates quotation marks and apostrophes based on settings.
 */
export function validateQuotesAndApostrophes(
  source: string,
  target: string,
  settings: QASettings,
  issues: QAIssue[]
) {
  // Use placeholder for tags to maintain correct indexing for mapping
  const sWithTags = source.replace(INTERNAL_TAG_REGEX, '\uFFFC');
  const tWithTags = target.replace(INTERNAL_TAG_REGEX, '\uFFFC');
  const cleanTarget = tWithTags.replace(/\uFFFC/g, '').trim();
  if (!cleanTarget) return;

  // 1. Apostrophe Check
  if (settings.checkApostrophes) {
    const apoRegex = /['’ʼ′]/g;
    let match;
    const highlights: { start: number, end: number }[] = [];
    while ((match = apoRegex.exec(tWithTags)) !== null) {
      if (!settings.allowedApostrophes.includes(match[0])) {
        highlights.push(mapStrippedToOriginal(match.index, 1, target, INTERNAL_TAG_REGEX));
      }
    }
    if (highlights.length > 0) {
      issues.push({
        id: crypto.randomUUID(),
        type: 'warning',
        message: `Incorrect apostrophe type used.`,
        code: 'Invalid apostrophe sign',
        ruleId: 'checkApostrophes',
        targetHighlights: highlights
      });
    }
  }

  // 2. Quotation Marks Check
  if (settings.checkQuotes) {
    const sourceIssues: QAIssue[] = [];
    validateQuoteBalance(source, sWithTags, settings.allowedQuotePairs, sourceIssues);
    
    // Only check target if source is balanced
    if (sourceIssues.length === 0) {
        validateQuoteBalance(target, tWithTags, settings.allowedQuotePairs, issues);
    }
  }
}

function validateQuoteBalance(rawText: string, textWithTags: string, pairs: QuotePair[], issues: QAIssue[]) {
  const openers = pairs.map(p => p.open);
  const closers = pairs.map(p => p.close);
  const allMarks = [...new Set([...openers, ...closers])];
  
  const stack: { char: string; index: number }[] = [];

  const unclosedHighlights: { start: number, end: number }[] = [];
  const mismatchedHighlights: { start: number, end: number }[] = [];

  for (let i = 0; i < textWithTags.length; i++) {
    const char = textWithTags[i];
    if (!allMarks.includes(char)) continue;

    const openerIndex = openers.indexOf(char);
    const closerIndex = closers.indexOf(char);

    // Handle identical marks (like straight quotes)
    if (openerIndex !== -1 && openerIndex === closerIndex) {
      if (stack.length > 0 && stack[stack.length - 1].char === char) {
        stack.pop();
      } else {
        stack.push({ char, index: i });
      }
      continue;
    }

    if (openerIndex !== -1) {
      stack.push({ char, index: i });
    } else if (closerIndex !== -1) {
      if (stack.length === 0) {
        unclosedHighlights.push(mapStrippedToOriginal(i, 1, rawText, INTERNAL_TAG_REGEX));
      } else {
        const last = stack.pop();
        const expectedOpener = pairs[closerIndex].open;
        if (last?.char !== expectedOpener) {
          mismatchedHighlights.push(mapStrippedToOriginal(i, 1, rawText, INTERNAL_TAG_REGEX));
          // Don't push the opener back on, to avoid cascading errors.
        }
      }
    }
  }

  while (stack.length > 0) {
    const unclosed = stack.pop();
    if (unclosed) {
      unclosedHighlights.push(mapStrippedToOriginal(unclosed.index, 1, rawText, INTERNAL_TAG_REGEX));
    }
  }

  if (unclosedHighlights.length > 0) {
    issues.push({
      id: crypto.randomUUID(),
      type: 'error',
      message: `Unbalanced or unclosed quotation marks found.`,
      code: 'Unclosed quotation mark',
      ruleId: 'checkQuotes',
      targetHighlights: unclosedHighlights
    });
  }
  if (mismatchedHighlights.length > 0) {
    issues.push({
      id: crypto.randomUUID(),
      type: 'error',
      message: `Mismatched quotation marks found (e.g., opening with “ and closing with »).`,
      code: 'Mismatched quotation mark',
      ruleId: 'checkQuotes',
      targetHighlights: mismatchedHighlights
    });
  }
}

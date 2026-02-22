
import { QAIssue, QASettings } from './types';
import { isUpperCase } from './case-utils';
import { INTERNAL_TAG_REGEX, mapStrippedToOriginal } from './qa-utils';

export function validateLetterCase(
  source: string, 
  target: string, 
  settings: QASettings, 
  targetLang: string, 
  issues: QAIssue[]
) {
  const tagPlaceholder = '\uFFFC';
  const sWithTags = source.replace(INTERNAL_TAG_REGEX, tagPlaceholder);
  const tWithTags = target.replace(INTERNAL_TAG_REGEX, tagPlaceholder);

  if (settings.checkInitialCapitalization) {
    const alphaRegex = /[a-zA-Z\u00C0-\u017F]/;
    const sMatch = sWithTags.match(alphaRegex);
    const tMatch = tWithTags.match(alphaRegex);

    if (sMatch && tMatch) {
      if (isUpperCase(sMatch[0], 'en-US') !== isUpperCase(tMatch[0], targetLang)) {
        const sRange = mapStrippedToOriginal(sMatch.index!, 1, source, INTERNAL_TAG_REGEX);
        const tRange = mapStrippedToOriginal(tMatch.index!, 1, target, INTERNAL_TAG_REGEX);
        issues.push({
          id: crypto.randomUUID(),
          type: 'warning',
          message: 'Initial capitalization mismatch with source.',
          code: 'Inconsistent capitalization of the first letter in source and target',
          ruleId: 'checkInitialCapitalization',
          sourceHighlights: [sRange],
          targetHighlights: [tRange]
        });
      }
    }
  }

  if (settings.checkCamelCase) {
    const camelRegex = /\b[a-z]+[A-Z][a-z]+/g;
    const specialCasesSet = new Set((settings.specialCases || []).map(s => s.toLowerCase()));
    const matches = Array.from(tWithTags.matchAll(camelRegex));
    
    const highlights = matches
        .filter(match => {
            // Exclude if it's a known special case.
            if (specialCasesSet.has(match[0].toLowerCase())) {
                return false;
            }
            // Exclude if the exact same cased word is in the source.
            if (source.includes(match[0])) {
                return false;
            }
            return true;
        })
        .map(match => mapStrippedToOriginal(match.index!, match[0].length, target, INTERNAL_TAG_REGEX));
    
    if (highlights.length > 0) {
        issues.push({ id: crypto.randomUUID(), type: 'info', message: 'Suspicious mid-word capitalization detected.', code: 'Suspicious mid-word capitalization', ruleId: 'checkCamelCase', targetHighlights: highlights });
    }
  }

  if (settings.checkSpecialCase && settings.specialCases?.length > 0) {
    const highlights: {start: number, end: number}[] = [];
    const termMessages: string[] = [];

    settings.specialCases.forEach(term => {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
      let m;
      while ((m = regex.exec(tWithTags)) !== null) {
        if (m[0] !== term) {
          highlights.push(mapStrippedToOriginal(m.index, m[0].length, target, INTERNAL_TAG_REGEX));
          if (!termMessages.includes(term)) termMessages.push(term);
        }
      }
    });

    if (highlights.length > 0) {
        const message = `Invalid special casing. Expected: "${termMessages.join('", "')}".`;
        issues.push({ id: crypto.randomUUID(), type: 'error', message: message, code: 'Invalid special casing', ruleId: 'checkSpecialCase', targetHighlights: highlights });
    }
  }
}

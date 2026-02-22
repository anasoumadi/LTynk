
import { TranslationUnit, QASettings, QAIssue } from './types';
import { INTERNAL_TAG_REGEX, mapStrippedToOriginal } from './qa-utils';

/**
 * Validates untranslatable terms based on settings.
 */
export function validateUntranslatables(tu: TranslationUnit, settings: QASettings, issues: QAIssue[]) {
  if (!settings.checkUntranslatables || !settings.untranslatables || settings.untranslatables.length === 0) return;

  const tagPlaceholder = '\uFFFC';
  const normalize = (text: string) => {
    // Replace tags with 1-char placeholder to maintain coordinate mapping compatibility
    let result = text.replace(INTERNAL_TAG_REGEX, tagPlaceholder);
    if (settings.ignoreSpaceTypes) {
      result = result.replace(/\u00A0/g, ' ');
    }
    return result;
  };

  const sTextProcessed = normalize(tu.source.text);
  const tTextProcessed = normalize(tu.target.text);

  // Build master regex for active list
  const escapedTerms = settings.untranslatables
    .filter(Boolean)
    .map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  
  if (escapedTerms.length === 0) return;
  
  const termRegex = new RegExp(`\\b(${escapedTerms.join('|')})\\b`, 'gi');

  const sMatches = Array.from(sTextProcessed.matchAll(termRegex));
  const tMatches = Array.from(tTextProcessed.matchAll(termRegex));

  const sCounts: Record<string, number> = {};
  sMatches.forEach(m => {
    const term = m[0].toLowerCase();
    sCounts[term] = (sCounts[term] || 0) + 1;
  });

  const tCounts: Record<string, number> = {};
  tMatches.forEach(m => {
    const term = m[0].toLowerCase();
    tCounts[term] = (tCounts[term] || 0) + 1;
  });

  const allDetectedTerms = new Set([...Object.keys(sCounts), ...Object.keys(tCounts)]);

  allDetectedTerms.forEach(termLower => {
    const sCount = sCounts[termLower] || 0;
    const tCount = tCounts[termLower] || 0;
    
    // Determine display casing from first match found
    const sampleMatch = sMatches.find(m => m[0].toLowerCase() === termLower) || 
                        tMatches.find(m => m[0].toLowerCase() === termLower);
    const termDisplay = sampleMatch ? sampleMatch[0] : termLower;

    if (settings.untranslatableScope === 'source' || settings.untranslatableScope === 'both') {
      if (sCount > 0 && tCount === 0) {
        // Highlight in source since it's missing in target
        const sourceHighlights = sMatches
          .filter(m => m[0].toLowerCase() === termLower)
          .map(m => mapStrippedToOriginal(m.index!, m[0].length, tu.source.text, INTERNAL_TAG_REGEX));
          
        issues.push({
          id: crypto.randomUUID(),
          type: 'error',
          message: `Untranslatable term missing in target: "${termDisplay}" found in source but missing in target.`,
          code: 'Untranslatable term missing in target',
          ruleId: 'untranslatables',
          sourceHighlights
        });
      }
    }

    if (settings.untranslatableScope === 'target' || settings.untranslatableScope === 'both') {
      if (tCount > 0 && sCount === 0) {
        // Highlight in target since it's extra/missing in source
        const targetHighlights = tMatches
          .filter(m => m[0].toLowerCase() === termLower)
          .map(m => mapStrippedToOriginal(m.index!, m[0].length, tu.target.text, INTERNAL_TAG_REGEX));

        issues.push({
          id: crypto.randomUUID(),
          type: 'error',
          message: `Untranslatable term missing in source: "${termDisplay}" found in target but not in source.`,
          code: 'Untranslatable term missing in source',
          ruleId: 'untranslatables',
          targetHighlights
        });
      }
    }

    if (settings.checkUntranslatableCount && sCount > 0 && tCount > 0 && sCount !== tCount) {
      const sourceHighlights = sMatches
        .filter(m => m[0].toLowerCase() === termLower)
        .map(m => mapStrippedToOriginal(m.index!, m[0].length, tu.source.text, INTERNAL_TAG_REGEX));
      const targetHighlights = tMatches
        .filter(m => m[0].toLowerCase() === termLower)
        .map(m => mapStrippedToOriginal(m.index!, m[0].length, tu.target.text, INTERNAL_TAG_REGEX));

      issues.push({
        id: crypto.randomUUID(),
        type: 'warning',
        message: `Untranslatable count mismatch: "${termDisplay}" appears ${sCount}x in source but ${tCount}x in target.`,
        code: 'Different amount of untranslatables',
        ruleId: 'checkUntranslatableCount',
        sourceHighlights,
        targetHighlights
      });
    }
  });
}

/**
 * Scans segments to find potential untranslatable terms based on heuristics.
 */
export function findPotentialUntranslatables(segments: TranslationUnit[], settings: QASettings): string[] {
  const potentials = new Set<string>();
  
  const technicalRegex = /[a-zA-Z0-9]+[-_][a-zA-Z0-9_-]+/g;
  const mixedCaseRegex = /\b[a-z]+[A-Z][a-z]+\b/g;
  const upperCaseRegex = /\b[A-Z]{2,}\b/g;

  segments.slice(0, 1000).forEach(tu => {
    // Strip tags for scanning
    const text = tu.source.text.replace(INTERNAL_TAG_REGEX, '');
    
    if (settings.includeTechnical) {
      const matches = text.match(technicalRegex);
      matches?.forEach(m => potentials.add(m));
    }
    
    if (settings.includeMixedCase) {
      const matches = text.match(mixedCaseRegex);
      matches?.forEach(m => potentials.add(m));
    }
    
    if (settings.includeUpperCase) {
      const matches = text.match(upperCaseRegex);
      matches?.forEach(m => potentials.add(m));
    }
  });

  // Filter out those already in the active list
  return Array.from(potentials).filter(p => !settings.untranslatables.includes(p)).sort();
}

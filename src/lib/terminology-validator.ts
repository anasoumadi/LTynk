
import { QAIssue, QASettings, GlossaryTerm } from './types';
import { escapeRegExp } from './qa-utils';

/**
 * High-performance terminology validation engine.
 * Ensures consistent use of glossary terms and detects forbidden translations.
 */
export function validateTerminology(
  source: string,
  target: string,
  settings: QASettings,
  glossary: GlossaryTerm[],
  issues: QAIssue[]
) {
  if ((!settings.checkTerminology && !settings.detectForbiddenTerms) || glossary.length === 0) return;

  // --- Main Terminology Check ---
  if (settings.checkTerminology) {
    // Group glossary terms by source for efficient lookup of multiple valid translations (word forms)
    const glossaryMap = new Map<string, { original: string, targets: string[] }>();
    glossary.forEach(term => {
      // Don't include forbidden terms in the "approved" list
      if (!term.isForbidden && term.source && term.target) {
        const sourceLower = term.source.toLowerCase();
        if (!glossaryMap.has(sourceLower)) {
          glossaryMap.set(sourceLower, { original: term.source, targets: [] });
        }
        glossaryMap.get(sourceLower)!.targets.push(term.target);
      }
    });
    
    glossaryMap.forEach((entry, sourceLower) => {
      // Use word boundaries for accurate matching. Regex is case-insensitive for matching source term keys.
      const sPattern = `\\b${escapeRegExp(entry.original)}\\b`;
      const sRegex = new RegExp(sPattern, 'gi');
      
      const sourceMatches = Array.from(source.matchAll(sRegex));

      if (sourceMatches.length > 0) {
        // Check if ANY of the approved target terms are present
        let anyTargetFound = false;
        let totalTargetMatches = 0;
        const allTargetHighlights: { start: number; end: number; }[] = [];

        entry.targets.forEach(targetTerm => {
          const tPattern = `\\b${escapeRegExp(targetTerm)}\\b`;
          const tRegex = new RegExp(tPattern, 'gi'); // Case-insensitive target search
          const targetMatches = Array.from(target.matchAll(tRegex));

          if (targetMatches.length > 0) {
            anyTargetFound = true;
            totalTargetMatches += targetMatches.length;
            targetMatches.forEach(m => {
                allTargetHighlights.push({ start: m.index!, end: m.index! + m[0].length });
            });
          }
        });

        // If no approved variant was found, flag an error.
        if (!anyTargetFound) {
          issues.push({
            id: crypto.randomUUID(),
            type: 'error',
            message: `Terminology violation: Source has "${entry.original}", but no approved translation (${entry.targets.join(' / ')}) was found in target.`,
            code: 'Terminology violation',
            ruleId: 'checkTerminology',
            sourceHighlights: sourceMatches.map(m => ({ start: m.index!, end: m.index! + m[0].length }))
          });
        } 
        // If an approved variant was found but the count is wrong, flag a warning.
        else if (settings.checkTermCount && totalTargetMatches < sourceMatches.length) {
          issues.push({
            id: crypto.randomUUID(),
            type: 'warning',
            message: `Terminology count mismatch: "${entry.original}" (${sourceMatches.length}x) vs approved translations (${totalTargetMatches}x).`,
            code: 'Terminology count mismatch',
            ruleId: 'checkTermCount',
            sourceHighlights: sourceMatches.map(m => ({ start: m.index!, end: m.index! + m[0].length })),
            targetHighlights: allTargetHighlights
          });
        }
      }
    });
  }
  
  // --- Forbidden Term Check ---
  if (settings.detectForbiddenTerms) {
    const forbiddenTerms = glossary.filter(t => t.isForbidden && t.target);
    
    forbiddenTerms.forEach(term => {
        const forbiddenPattern = `\\b${escapeRegExp(term.target!)}\\b`;
        const forbiddenRegex = new RegExp(forbiddenPattern, 'gi');
        const matches = Array.from(target.matchAll(forbiddenRegex));

        if (matches.length > 0) {
            issues.push({
            id: crypto.randomUUID(),
            type: 'error',
            message: `Forbidden term used: "${term.target}" is prohibited.`,
            code: 'Forbidden term detected',
            ruleId: 'detectForbiddenTerms',
            targetHighlights: matches.map(m => ({ start: m.index!, end: m.index! + m[0].length }))
            });
        }
    });
  }
}

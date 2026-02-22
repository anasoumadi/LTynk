
import { QAIssue, QASettings } from './types';

/**
 * Validates target segments against a list of forbidden expressions.
 * Implements word-boundary matching and a source-exception rule to reduce false positives.
 */
export function validateForbiddenWords(source: string, target: string, settings: QASettings, issues: QAIssue[]) {
  // Do not run if the check is disabled or the list is empty.
  if (!settings.checkForbiddenWords || !settings.forbiddenWords || settings.forbiddenWords.length === 0) {
    return;
  }

  settings.forbiddenWords.forEach(expr => {
    if (!expr.trim()) return;

    try {
      // 1. Construct a robust, case-insensitive, whole-word regex from the expression.
      // This ensures "cat" doesn't flag "category".
      // We also check if the user provided their own regex with boundary markers.
      const pattern = expr.startsWith('\\b') || expr.endsWith('\\b') || expr.includes('^') || expr.includes('$')
        ? expr
        : `\\b${expr}\\b`;
      
      // Use 'gi' for global (find all) and case-insensitive matching.
      const forbiddenRegex = new RegExp(pattern, 'gi');

      // 2. Find all occurrences of the forbidden term in the target segment.
      const targetMatches = Array.from(target.matchAll(forbiddenRegex));

      // If no matches, we can stop here for this expression.
      if (targetMatches.length === 0) {
        return;
      }

      // 3. CRITICAL: Implement the "Source Exception" logic.
      // If the setting is enabled, we check if the forbidden term *also* exists in the source.
      // If it does, we suppress the error, assuming it's a required part of the text (e.g., a product name).
      if (settings.ignoreForbiddenIfInSource) {
        // Create a new regex instance to test against the source to avoid state issues with the global flag.
        const sourcePresenceRegex = new RegExp(pattern, 'gi');
        if (sourcePresenceRegex.test(source)) {
          return; // Suppress the error and move to the next expression.
        }
      }
      
      // 4. If all checks pass and the term should be flagged, add it to the issues list.
      // We collect all matches to highlight them in the UI.
      issues.push({
        id: crypto.randomUUID(),
        type: 'error',
        message: `Forbidden expression detected in target: "${expr}"`,
        code: 'Forbidden expression detected',
        ruleId: 'checkForbiddenWords',
        targetHighlights: targetMatches.map(m => ({ start: m.index!, end: m.index! + m[0].length }))
      });

    } catch (e) {
      // Catch any invalid regex patterns provided by the user to prevent crashing the QA run.
      console.warn(`Invalid regex in forbidden words list: "${expr}"`, e);
    }
  });
}

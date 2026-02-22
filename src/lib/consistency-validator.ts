
import { QAIssue, QASettings, TranslationUnit } from './types';
import { stripTags } from './filter-engine';

/**
 * Normalizes text for consistency checking based on user preferences.
 */
export function normalizeForConsistency(text: string, options: QASettings['targetInconsistencyOptions'], lang: string): string {
  let result = text;

  // 1. Remove tags if requested
  if (options.checkWithoutTags) {
    result = stripTags(result);
  }

  // 2. Handle whitespace
  if (options.ignoreSpaceTypes) {
    result = result.replace(/\u00A0/g, ' ');
  }

  // 3. Case sensitivity
  if (options.ignoreCase) {
    result = result.toLowerCase();
  }

  // 4. Number normalization
  if (options.ignoreNumbers) {
    result = result.replace(/[0-9]/g, '#');
  }

  // 5. Punctuation stripping
  if (options.ignorePunctuation) {
    // Unicode-aware non-alphanumeric strip (keeping spaces for word separation)
    result = result.replace(/[^\p{L}\p{N}\s]/gu, '');
  }

  // 6. English Plurals (Heuristic)
  if (options.ignorePluralEnglish && lang.toLowerCase().startsWith('en')) {
    // Simple heuristic: strip trailing 's' or 'es' from words longer than 3 chars
    result = result.split(/\s+/).map(word => {
      if (word.length <= 3) return word;
      if (word.endsWith('es')) return word.slice(0, -2);
      if (word.endsWith('s')) return word.slice(0, -1);
      return word;
    }).join(' ');
  }

  // Final cleanup: collapse spaces and trim
  return result.trim().replace(/\s+/g, ' ');
}


/**
 * Runs a project-wide consistency validation and adds issues to TUs.
 */
export function validateConsistency(segments: TranslationUnit[], settings: QASettings, targetLang: string) {
  if (!settings.targetInconsistencyOptions.enabled && !settings.sourceInconsistencyOptions.enabled) {
    return;
  }
  
  // --- Target Inconsistency Check ---
  if (settings.targetInconsistencyOptions.enabled) {
    const sourceMap = new Map<string, Set<string>>();
    segments.forEach(tu => {
        const normalizedSource = normalizeForConsistency(tu.source.text, settings.targetInconsistencyOptions, targetLang);
        const normalizedTarget = normalizeForConsistency(tu.target.text, settings.targetInconsistencyOptions, targetLang);
        if (!sourceMap.has(normalizedSource)) {
            sourceMap.set(normalizedSource, new Set<string>());
        }
        sourceMap.get(normalizedSource)!.add(normalizedTarget);
    });

    sourceMap.forEach((targets, normalizedSourceKey) => {
        if (targets.size > 1) {
            segments.forEach(tu => {
                if (normalizeForConsistency(tu.source.text, settings.targetInconsistencyOptions, targetLang) === normalizedSourceKey) {
                    if (!tu.qaIssues) tu.qaIssues = [];
                    tu.qaIssues.push({
                        id: crypto.randomUUID(),
                        code: 'Target inconsistency',
                        message: 'This source text has multiple different translations in the project.',
                        type: 'warning',
                        groupId: normalizedSourceKey,
                        ruleId: 'targetInconsistencyOptions'
                    });
                }
            });
        }
    });
  }
  
  // --- Source Inconsistency Check ---
  if (settings.sourceInconsistencyOptions.enabled) {
    const targetMap = new Map<string, Set<string>>();
    segments.forEach(tu => {
        const normalizedSource = normalizeForConsistency(tu.source.text, settings.sourceInconsistencyOptions, targetLang);
        const normalizedTarget = normalizeForConsistency(tu.target.text, settings.sourceInconsistencyOptions, targetLang);
        if (!targetMap.has(normalizedTarget)) {
            targetMap.set(normalizedTarget, new Set<string>());
        }
        targetMap.get(normalizedTarget)!.add(normalizedSource);
    });

    targetMap.forEach((sources, normalizedTargetKey) => {
        if (sources.size > 1) {
            segments.forEach(tu => {
                if (normalizeForConsistency(tu.target.text, settings.sourceInconsistencyOptions, targetLang) === normalizedTargetKey) {
                     if (!tu.qaIssues) tu.qaIssues = [];
                    tu.qaIssues.push({
                        id: crypto.randomUUID(),
                        code: 'Source inconsistency',
                        message: 'This translation is used for multiple different source texts.',
                        type: 'warning',
                        groupId: normalizedTargetKey,
                        ruleId: 'sourceInconsistencyOptions'
                    });
                }
            });
        }
    });
  }
}

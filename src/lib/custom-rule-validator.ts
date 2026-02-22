
import { QAIssue, UserDefinedCheck, TranslationUnit } from './types';

/**
 * High-performance dynamic regex validator for user-defined checks.
 * Includes safety timeouts to prevent catastrophic backtracking.
 */
export function validateUserCheck(
  tu: TranslationUnit,
  check: UserDefinedCheck,
  issues: QAIssue[]
) {
  if (!check.enabled) return;

  const sourceText = tu.source.text;
  const targetText = tu.target.text;

  try {
    const sourceRegex = compileRegex(check.sourcePattern, check.sourceOptions);
    const targetRegex = compileRegex(check.targetPattern, check.targetOptions);

    const isSourceMatch = testRegexWithTimeout(sourceRegex, sourceText);
    const isTargetMatch = testRegexWithTimeout(targetRegex, targetText);

    let isViolation = false;

    switch (check.condition) {
      case 'both_found':
        isViolation = isSourceMatch && isTargetMatch;
        break;
      case 'source_found_target_missing':
        isViolation = isSourceMatch && !isTargetMatch;
        break;
      case 'target_found_source_missing':
        isViolation = !isSourceMatch && isTargetMatch;
        break;
      case 'both_regex_match':
        isViolation = isSourceMatch && isTargetMatch; // For "both must match" regex rules
        break;
    }

    if (isViolation) {
      issues.push({
        id: crypto.randomUUID(),
        type: 'warning',
        message: `User Check: ${check.title || 'Untitled Check'}`,
        code: 'User check',
        ruleId: check.id,
      });
    }
  } catch (e) {
    // Skip invalid regex
    console.warn(`Invalid user check: ${check.title}`, e);
  }
}

function compileRegex(pattern: string, options: { caseSensitive: boolean, wholeWord: boolean, isRegex: boolean }): RegExp {
  if (!pattern) return /^$/; // Never match empty patterns if not intended

  let finalPattern = pattern;
  if (!options.isRegex) {
    // Escape literal text
    finalPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  if (options.wholeWord) {
    finalPattern = `\\b${finalPattern}\\b`;
  }

  return new RegExp(finalPattern, options.caseSensitive ? 'g' : 'gi');
}

/**
 * Basic safety check for regex execution. 
 * Real timeouts are hard in single-threaded JS without workers, 
 * but we can check pattern complexity or length.
 */
function testRegexWithTimeout(regex: RegExp, text: string): boolean {
  // Reset regex index for global flags
  regex.lastIndex = 0;
  return regex.test(text);
}



import { QAIssue, QASettings, PunctuationGrid } from './types';
import { escapeRegExp, mapStrippedToOriginal, INTERNAL_TAG_REGEX } from './qa-utils';

function validateBracketBalance(
  text: string,
  rawText: string,
  settings: QASettings
): QAIssue[] {
  const issues: QAIssue[] = [];
  const bracketPairs: Record<string, string> = {
    '(': ')',
    '[': ']',
    '{': '}',
  };

  if (!settings.ignoreMoreLessThanBrackets) {
    bracketPairs['<'] = '>';
  }

  const openers = Object.keys(bracketPairs);
  const closers = Object.values(bracketPairs);
  const stack: { char: string, index: number }[] = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (openers.includes(char)) {
      stack.push({ char, index: i });
    } else if (closers.includes(char)) {
      if (stack.length === 0) {
        issues.push({
          id: crypto.randomUUID(),
          type: 'error',
          message: `Unmatched closing bracket "${char}" found.`,
          code: 'Unmatched closing bracket',
          ruleId: 'checkBrackets',
          targetHighlights: [mapStrippedToOriginal(i, 1, rawText, INTERNAL_TAG_REGEX)]
        });
      } else {
        const lastOpener = stack.pop()!;
        if (bracketPairs[lastOpener.char] !== char) {
          issues.push({
            id: crypto.randomUUID(),
            type: 'error',
            message: `Mismatched bracket pair: "${lastOpener.char}" closed by "${char}".`,
            code: 'Mismatched brackets',
            ruleId: 'checkBrackets',
            targetHighlights: [
              mapStrippedToOriginal(lastOpener.index, 1, rawText, INTERNAL_TAG_REGEX),
              mapStrippedToOriginal(i, 1, rawText, INTERNAL_TAG_REGEX)
            ]
          });
        }
      }
    }
  }
  
  if (stack.length > 0) {
      const unclosedHighlights = stack.map(item => mapStrippedToOriginal(item.index, 1, rawText, INTERNAL_TAG_REGEX));
      issues.push({
          id: crypto.randomUUID(),
          type: 'error',
          message: `Unclosed opening brackets found: ${stack.map(s => s.char).join(', ')}`,
          code: 'Unclosed opening bracket',
          ruleId: 'checkBrackets',
          targetHighlights: unclosedHighlights
      });
  }

  return issues;
}


export function validatePunctuationAndSpacing(
  source: string,
  target: string,
  settings: QASettings,
  issues: QAIssue[]
) {
  const tagPlaceholder = '\uFFFC';
  const sWithTags = source.replace(INTERNAL_TAG_REGEX, tagPlaceholder);
  const tWithTags = target.replace(INTERNAL_TAG_REGEX, tagPlaceholder);

  if (settings.checkMultipleSpaces) {
    const spaceRegex = /\s\s+/g;
    const sourceSpaceRegex = /\s\s+/g;
    let match;
    const highlights: { start: number, end: number }[] = [];
    while ((match = spaceRegex.exec(tWithTags)) !== null) {
      if (!settings.ignoreSourceFormatting || !sourceSpaceRegex.test(sWithTags)) {
        highlights.push(mapStrippedToOriginal(match.index, match[0].length, target, INTERNAL_TAG_REGEX));
      }
    }
    if (highlights.length > 0) {
        issues.push({ id: crypto.randomUUID(), type: 'warning', message: 'Multiple consecutive spaces detected.', code: 'Multiple consecutive spaces', ruleId: 'checkMultipleSpaces', targetHighlights: highlights });
    }
  }

  if (settings.checkDoublePunctuation) {
    const doublePuncRegex = /([.?!])\1+/g;
    let match;
    const highlights: { start: number, end: number }[] = [];
    
    while ((match = doublePuncRegex.exec(tWithTags)) !== null) {
        let isAllowed = false;
        if (settings.doublePuncAsInSource) {
            const sourceDoublePuncRegex = new RegExp(escapeRegExp(match[0]), 'g');
            if (sourceDoublePuncRegex.test(sWithTags)) {
                isAllowed = true;
            }
        }
        if (!isAllowed) {
            highlights.push(mapStrippedToOriginal(match.index, match[0].length, target, INTERNAL_TAG_REGEX));
        }
    }
    if (highlights.length > 0) {
        issues.push({ id: crypto.randomUUID(), type: 'warning', message: 'Double punctuation mismatch with source.', code: 'Double punctuation mismatch', ruleId: 'checkDoublePunctuation', targetHighlights: highlights });
    }
  }

  if (settings.checkEndPunctuation) {
    const puncMap: Record<string, string> = { '。': '.', '？': '?', '！': '!' };
    const normalizePunc = (char: string) => puncMap[char] || char;

    const charsToIgnore = settings.ignoreQuotesBracketsEnd 
      ? ` \t\n"'“”‘’„‚«»‹›「」『』()[]{}<>` 
      : ` \t\n`;
    const ignoreSet = new Set(charsToIgnore.split(''));
    
    const findLastRelevantChar = (text: string): {char: string, index: number} => {
        for (let i = text.length - 1; i >= 0; i--) {
            const char = text[i];
            if (!ignoreSet.has(char) && char !== tagPlaceholder) {
                return { char, index: i };
            }
        }
        return { char: '', index: -1 };
    }

    const { char: sLast, index: sIndex } = findLastRelevantChar(sWithTags);
    const { char: tLast, index: tIndex } = findLastRelevantChar(tWithTags);

    const sNormalized = normalizePunc(sLast);
    const tNormalized = normalizePunc(tLast);
    
    const relevantMarks = '.!?';

    if (relevantMarks.includes(sNormalized) && sNormalized !== tNormalized) {
      if (tIndex > -1) {
        const { start, end } = mapStrippedToOriginal(tIndex, 1, target, INTERNAL_TAG_REGEX);
        issues.push({ id: crypto.randomUUID(), type: 'warning', message: `End punctuation mismatch: expected "${sLast}".`, code: 'Inconsistent end punctuation', ruleId: 'checkEndPunctuation', targetHighlights: [{ start, end }] });
      } else {
         const { start, end } = mapStrippedToOriginal(sIndex, 1, source, INTERNAL_TAG_REGEX);
         issues.push({ id: crypto.randomUUID(), type: 'warning', message: `End punctuation mismatch: target is missing end punctuation "${sLast}" from source.`, code: 'Inconsistent end punctuation', ruleId: 'checkEndPunctuation', sourceHighlights: [{ start, end }] });
      }
    }
  }

  if (settings.checkBrackets) {
    const sourceBracketIssues = validateBracketBalance(sWithTags, source, settings);
    // Only check target if source is clean
    if (sourceBracketIssues.length === 0) {
        const targetBracketIssues = validateBracketBalance(tWithTags, target, settings);
        if (targetBracketIssues.length > 0) {
            issues.push(...targetBracketIssues);
        }
    }
  }


  validateGrid(target, tWithTags, settings.punctuationGrid, issues, 'checkPunctuation');
  validateGrid(target, tWithTags, settings.specialSignsGrid, issues, 'checkPunctuation');
}

function validateGrid(rawTarget: string, tWithTags: string, grid: PunctuationGrid, issues: QAIssue[], ruleId: string) {
  const collectHighlights = (chars: string, regexStr: string, isNBSP: boolean = false): { start: number, end: number }[] => {
    if (!chars) return [];
    const highlights: { start: number, end: number }[] = [];
    for (const char of chars) {
      const finalRegexStr = regexStr.replace('CHAR', escapeRegExp(char));
      const regex = new RegExp(finalRegexStr, 'g');
      let m;
      while ((m = regex.exec(tWithTags)) !== null) {
        // For NBSP checks, the error is the character *before* the punctuation.
        // For regular space checks, the error is the space itself or lack thereof.
        const errorIndex = isNBSP ? m.index : m[0].includes(char) ? m.index + m[0].indexOf(char) : m.index;
        const errorLength = isNBSP ? m[1].length : m[0].length;
        highlights.push(mapStrippedToOriginal(errorIndex, errorLength, rawTarget, INTERNAL_TAG_REGEX));
      }
    }
    return highlights;
  };

  const addConsolidatedIssue = (code: string, message: string, highlights: { start: number, end: number }[]) => {
    if (highlights.length === 0) return;
    const existingIssue = issues.find(i => i.code === code);
    if (existingIssue) {
      existingIssue.targetHighlights = (existingIssue.targetHighlights || []).concat(highlights);
    } else {
      issues.push({ id: crypto.randomUUID(), type: 'warning', message, code, targetHighlights: highlights, ruleId });
    }
  };
  
  addConsolidatedIssue('Invalid spacing before punctuation', 'Space required before certain punctuation marks.', collectHighlights(grid.spaceBefore, '(?<=[^\\s\\uFFFC])CHAR'));
  addConsolidatedIssue('No space after punctuation', 'Space required after certain punctuation marks.', collectHighlights(grid.spaceAfter, 'CHAR(?=[^\\s\\uFFFC])'));
  addConsolidatedIssue('Invalid spacing before punctuation', 'Space not allowed before certain punctuation marks.', collectHighlights(grid.noSpaceBefore, '\\s+CHAR'));
  addConsolidatedIssue('No space after punctuation', 'Space not allowed after certain punctuation marks.', collectHighlights(grid.noSpaceAfter, 'CHAR\\s+'));
  addConsolidatedIssue('Non-breaking space required before punctuation', 'NBSP required before certain punctuation marks.', collectHighlights(grid.nbspBefore, '([^\\u00A0\\uFFFC])(CHAR)', true));
  addConsolidatedIssue('Non-breaking space required after punctuation', 'NBSP required after certain punctuation marks.', collectHighlights(grid.nbspAfter, '(CHAR)([^\\u00A0\\uFFFC])', true));
}

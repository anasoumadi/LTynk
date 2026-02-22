import { QAIssue, QASettings, TranslationUnit } from './types';
import { INTERNAL_TAG_REGEX } from './qa-utils';

/**
 * Validates integrity, order, and spacing of TMX tags and XML entities.
 */
export function validateTags(tu: TranslationUnit, settings: QASettings, issues: QAIssue[]) {
  const sText = tu.source.text;
  const tText = tu.target.text;
  const sTags = tu.source.tags;
  const tTags = tu.target.tags;

  // 1. Inconsistent Tags
  if (settings.checkTags) {
    const sIds = sTags.map(t => t.id).sort();
    const tIds = tTags.map(t => t.id).sort();

    if (sIds.length !== tIds.length) {
      addIssue(issues, 'error', `Tag count mismatch (Source: ${sIds.length}, Target: ${tIds.length}).`, 'Different amount of tags', 'checkTags');
    } else {
      for (let i = 0; i < sIds.length; i++) {
        if (sIds[i] !== tIds[i]) {
          addIssue(issues, 'error', `Mismatched tag types or IDs found in target.`, 'Inconsistent tags in source and target', 'checkTags');
          break;
        }
      }
    }
  }

  // 2. Tag Order
  if (settings.checkTagOrder) {
    const sMatches = (sText.match(INTERNAL_TAG_REGEX) || []) as string[];
    const tMatches = (tText.match(INTERNAL_TAG_REGEX) || []) as string[];

    // This is the core logic from the user's directive, adapted for our data structures.
    // It filters each sequence to only include tags present in the other, then compares the resulting order.
    const sOrderOfCommonTags = sMatches.filter(id => tMatches.includes(id));
    const tOrderOfCommonTags = tMatches.filter(id => sMatches.includes(id));

    if (sOrderOfCommonTags.join('|') !== tOrderOfCommonTags.join('|')) {
      addIssue(issues, 'warning', 'Tag sequence differs from source.', 'Inconsistent tag order', 'checkTagOrder');
    }
  }

  // 3. Spacing around tags
  if (settings.checkTagSpacing || settings.checkTagSpacingInconsistency) {
    let match;
    while ((match = INTERNAL_TAG_REGEX.exec(tText)) !== null) {
      const tagId = match[0];
      const index = match.index;

      const hasLeadingSpaceTarget = index > 0 && /\s/.test(tText[index - 1]);
      const hasTrailingSpaceTarget = (index + tagId.length) < tText.length && /\s/.test(tText[index + tagId.length]);

      if (settings.checkTagSpacingInconsistency) {
        const sIndex = sText.indexOf(tagId);
        if (sIndex !== -1) {
          const hasLeadingSpaceSource = sIndex > 0 && /\s/.test(sText[sIndex - 1]);
          const hasTrailingSpaceSource = (sIndex + tagId.length) < sText.length && /\s/.test(sText[sIndex + tagId.length]);

          if (hasLeadingSpaceTarget !== hasLeadingSpaceSource || hasTrailingSpaceTarget !== hasTrailingSpaceSource) {
            addIssue(issues, 'warning', `Inconsistent spacing around tag ${tagId}.`, 'Inconsistent spacing around tags', 'checkTagSpacingInconsistency');
          }
        }
      }
    }
  }

  // 4. Entities
  if (settings.checkEntities) {
    const entityRegex = /&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[a-f\d]+);)[a-z0-9#]*/gi;
    const badEntities = tText.match(entityRegex);
    if (badEntities && badEntities.some(e => e.length > 1)) {
      addIssue(issues, 'error', 'Malformed or unsupported XML entity detected.', 'Malformed XML entity', 'checkEntities');
    }

    const standardEntities = /&(?:amp|lt|gt|quot|apos);/g;
    const sEntCount = (sText.match(standardEntities) || []).length;
    const tEntCount = (tText.match(standardEntities) || []).length;
    if (sEntCount > tEntCount) {
      addIssue(issues, 'warning', 'XML entity present in source but missing in target.', 'XML entity present in source but missing in target', 'checkEntities');
    }
  }
}

function addIssue(issues: QAIssue[], type: QAIssue['type'], message: string, code: string, ruleId: string) {
  issues.push({ id: crypto.randomUUID(), type, message, code, ruleId });
}

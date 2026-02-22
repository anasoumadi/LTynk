
import { TranslationUnit, CustomFilter, CustomFilterCondition, BuiltInFilterType } from './types';

/**
 * Strips internal TMX tag placeholders [...] for clean text matching
 */
export function stripTags(text: string): string {
  return text.replace(/\[(bpt|ept|ph|it|ut|sub|x|g|bx|ex)(?::\d+)?_\d+\]/g, '');
}

/**
 * Checks if a single condition matches a translation unit
 */
function matchCondition(tu: TranslationUnit, condition: CustomFilterCondition, ignoreCase: boolean, ignoreTags: boolean): boolean {
  let textToSearch = '';
  
  // Determine search scope
  switch (condition.scope) {
    case 'source':
      textToSearch = tu.source.text;
      break;
    case 'target':
      textToSearch = tu.target.text;
      break;
    case 'comment':
      textToSearch = tu.note || '';
      break;
    case 'status':
      textToSearch = tu.status;
      break;
    default:
      if (condition.scope.startsWith('metadata.')) {
        const key = condition.scope.split('.')[1];
        textToSearch = String(tu.metadata[key] || '');
      }
  }

  if (ignoreTags && (condition.scope === 'source' || condition.scope === 'target')) {
    textToSearch = stripTags(textToSearch);
  }

  let searchValue = condition.value;
  if (ignoreCase) {
    textToSearch = textToSearch.toLowerCase();
    searchValue = searchValue.toLowerCase();
  }

  switch (condition.operator) {
    case 'contains':
      return textToSearch.includes(searchValue);
    case 'excludes':
      return !textToSearch.includes(searchValue);
    case 'equal':
      return textToSearch === searchValue;
    case 'not_equal':
      return textToSearch !== searchValue;
    default:
      return false;
  }
}

/**
 * Checks if a custom filter rule matches a translation unit
 */
export function matchCustomFilter(tu: TranslationUnit, filter: CustomFilter, ignoreCase: boolean, ignoreTags: boolean): boolean {
  if (filter.conditions.length === 0) return true;

  if (filter.matchType === 'and') {
    return filter.conditions.every(c => matchCondition(tu, c, ignoreCase, ignoreTags));
  } else {
    return filter.conditions.some(c => matchCondition(tu, c, ignoreCase, ignoreTags));
  }
}

/**
 * Logic for built-in filters
 */
export function matchBuiltInFilter(tu: TranslationUnit, filterType: BuiltInFilterType, ignoreTags: boolean): boolean {
  switch (filterType) {
    case 'all':
      return true;
    case 'same': {
      const s = ignoreTags ? stripTags(tu.source.text) : tu.source.text;
      const t = ignoreTags ? stripTags(tu.target.text) : tu.target.text;
      return s.trim() === t.trim() && s.trim().length > 0;
    }
    case 'untranslated':
      return !tu.target.text.trim();
    case 'comments':
      return !!tu.note && tu.note.trim().length > 0;
    case 'invalid':
      // Basic check for control characters or broken entities
      return /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(tu.target.text) || /&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[a-f\d]+);)/i.test(tu.target.text);
    case 'inconsistency':
      // Handled in use-tmx-store via global set, but this provides a fallback
      return !!tu.qaIssues?.some(i => 
        i.code === 'Target inconsistency' || i.code === 'Source inconsistency'
      );
    default:
      return true;
  }
}

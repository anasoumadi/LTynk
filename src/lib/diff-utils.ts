
import { diff_match_patch, DIFF_EQUAL, DIFF_DELETE, DIFF_INSERT } from 'diff-match-patch';

const dmp = new diff_match_patch();

export interface DiffPart {
  type: 'equal' | 'delete' | 'insert';
  value: string;
}

/**
 * Calculates differences between two strings and returns a structured array for highlighting.
 */
export function calculateDiff(text1: string, text2: string): DiffPart[] {
  const diffs = dmp.diff_main(text1, text2);
  dmp.diff_cleanupSemantic(diffs);

  return diffs.map(([type, value]) => ({
    type: type === DIFF_EQUAL ? 'equal' : type === DIFF_DELETE ? 'delete' : 'insert',
    value
  }));
}

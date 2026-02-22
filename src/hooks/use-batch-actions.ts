import { useCallback } from 'react';
import { useTmxStore } from './use-tmx-store';
import { toast } from './use-toast';
import { LanguageSet } from '@/lib/types';

export function useBatchActions(languageSet: LanguageSet | null) {
  const { ignoreIssueGroup } = useTmxStore();

  const ignoreAll = useCallback(async (code: string) => {
    await ignoreIssueGroup(code, true, languageSet);
    toast({ title: "Group Ignored", description: `All issues of type ${code} have been marked as ignored.` });
  }, [ignoreIssueGroup, languageSet]);

  const unignoreAll = useCallback(async (code: string) => {
    await ignoreIssueGroup(code, false, languageSet);
    toast({ title: "Group Unignored", description: `Reverted ignored status for ${code} group.` });
  }, [ignoreIssueGroup, languageSet]);

  return {
    ignoreAll,
    unignoreAll,
  };
}

"use client"

import React, { useState, useMemo } from 'react';
import { useTmxStore } from '@/hooks/use-tmx-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Wand2, ArrowRight, X, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { TUStatus, TranslationUnit } from '@/lib/types';

const HighlightMatches = ({ text, query, flags }: { text: string, query: string, flags: { case: boolean, whole: boolean, regex: boolean } }) => {
  if (!query || !text) {
    return <>{text}</>;
  }

  try {
    const flagStr = flags.case ? 'g' : 'gi';
    let regex: RegExp;

    if (flags.regex) {
      regex = new RegExp(query, flagStr);
    } else {
      let pattern = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (flags.whole) {
        pattern = `\\b${pattern}\\b`;
      }
      regex = new RegExp(pattern, flagStr);
    }

    if (!regex.test(text)) {
      return <>{text}</>;
    }

    regex.lastIndex = 0;

    const parts = text.split(regex);
    const matches = text.match(regex) || [];

    return (
      <>
        {parts.map((part, i) => (
          <React.Fragment key={i}>
            {part}
            {i < matches.length && (
              <span className="bg-primary/20 font-bold">{matches[i]}</span>
            )}
          </React.Fragment>
        ))}
      </>
    );
  } catch (e) {
    return <>{text}</>;
  }
};


export const SearchTab = ({ visibleColumns, segments }: { visibleColumns: any, segments: TranslationUnit[] }) => {
  const { selectedSegmentId, setSelectedSegment, updateSegment, batchUpdateSegments } = useTmxStore();

  const [sourceSearch, setSourceSearch] = useState('');
  const [targetSearch, setTargetSearch] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [searchMode, setSearchMode] = useState('both_found');

  const [sourceFlags, setSourceFlags] = useState({
    case: false,
    tags: true,
    whole: false,
    regex: false,
    power: false
  });

  const [targetFlags, setTargetFlags] = useState({
    case: false,
    tags: true,
    whole: false,
    regex: false,
    power: false
  });

  const [findNextIndex, setFindNextIndex] = useState(-1);

  const results = useMemo(() => {
    const hasSourceQuery = !!sourceSearch.trim();
    const hasTargetQuery = !!targetSearch.trim();

    if (!hasSourceQuery && !hasTargetQuery) return [];

    setFindNextIndex(-1);

    const checkMatch = (text: string, query: string, flags: typeof sourceFlags) => {
      if (!query) return true;
      let searchBase = flags.tags ? text : text.replace(/\[(bpt|ept|ph|it|ut|sub|x|g|bx|ex|mrk).*?_\d+\]/g, '');

      try {
        const flagStr = flags.case ? '' : 'i';
        if (flags.regex) {
          return new RegExp(query, flagStr).test(searchBase);
        }
        let pattern = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (flags.whole) pattern = `\\b${pattern}\\b`;
        return new RegExp(pattern, flagStr).test(searchBase);
      } catch (e) {
        return false;
      }
    };

    return segments.filter(s => {
      switch (searchMode) {
        case 'source_found_target_empty':
          if (!hasSourceQuery) return false;
          return checkMatch(s.source.text, sourceSearch, sourceFlags) && s.target.text.trim() === '';

        case 'source_found_target_not': {
          if (!hasSourceQuery) return false;
          const sourceMatches = checkMatch(s.source.text, sourceSearch, sourceFlags);
          if (!sourceMatches) return false;

          const effectiveTargetQuery = hasTargetQuery ? targetSearch : sourceSearch;
          const effectiveTargetFlags = hasTargetQuery ? targetFlags : sourceFlags;
          return !checkMatch(s.target.text, effectiveTargetQuery, effectiveTargetFlags);
        }

        case 'target_found_source_not': {
          if (!hasTargetQuery) return false;
          const targetMatches = checkMatch(s.target.text, targetSearch, targetFlags);
          if (!targetMatches) return false;

          const effectiveSourceQuery = hasSourceQuery ? sourceSearch : targetSearch;
          const effectiveSourceFlags = hasSourceQuery ? sourceFlags : targetFlags;
          return !checkMatch(s.source.text, effectiveSourceQuery, effectiveSourceFlags);
        }

        case 'both_found':
        default:
          return checkMatch(s.source.text, sourceSearch, sourceFlags) &&
            checkMatch(s.target.text, targetSearch, targetFlags);
      }
    });
  }, [segments, sourceSearch, targetSearch, searchMode, sourceFlags, targetFlags]);

  const handleFindNext = () => {
    if (results.length === 0) {
      toast({ title: "No Matches", description: "No segments match your search criteria." });
      return;
    }
    const newIndex = (findNextIndex + 1) % results.length;
    setFindNextIndex(newIndex);
    setSelectedSegment(results[newIndex].id);
  };

  const handleReplace = async () => {
    const segmentToUpdate = segments.find(s => s.id === selectedSegmentId);
    if (!segmentToUpdate || !targetSearch) {
      toast({ title: "Action Required", description: "Please select a segment and enter a target search pattern." });
      return;
    }

    try {
      const flagsStr = targetFlags.case ? 'g' : 'gi';
      let regex: RegExp;
      if (targetFlags.regex) {
        regex = new RegExp(targetSearch, flagsStr);
      } else {
        let pattern = targetSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (targetFlags.whole) pattern = `\\b${pattern}\\b`;
        regex = new RegExp(pattern, flagsStr);
      }

      const newText = segmentToUpdate.target.text.replace(regex, replaceText);

      if (newText !== segmentToUpdate.target.text && selectedSegmentId) {
        await updateSegment(selectedSegmentId, {
          target: { ...segmentToUpdate.target, text: newText },
          status: (newText.trim() ? 'translated' : 'empty') as TUStatus,
        });
        toast({ title: "Segment Updated", description: "Replacement applied successfully." });
      } else {
        toast({ title: "No Match Found", description: "The pattern was not found in the selected segment's target." });
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Replacement Failed", description: e.message });
    }
  };

  const handleReplaceAll = async () => {
    if (!targetSearch || results.length === 0) {
      toast({ title: "Nothing to replace", description: "Please enter a target search pattern and ensure matches exist." });
      return;
    }

    try {
      const flags_str = targetFlags.case ? 'g' : 'gi';
      let regex: RegExp;
      if (targetFlags.regex) {
        regex = new RegExp(targetSearch, flags_str);
      } else {
        let pattern = targetSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (targetFlags.whole) pattern = `\\b${pattern}\\b`;
        regex = new RegExp(pattern, flags_str);
      }

      const updatedResults = results.map(tu => {
        const newText = tu.target.text.replace(regex, replaceText);
        return {
          ...tu,
          target: { ...tu.target, text: newText },
          status: (newText.trim() ? 'translated' : 'empty') as TUStatus,
          lastModified: new Date(),
          qaIssues: []
        };
      }).filter(tu => tu.target.text !== segments.find(s => s.id === tu.id)?.target.text);

      if (updatedResults.length === 0) {
        toast({ title: "No Matches Found", description: "The pattern was not found in any of the filtered segments." });
        return;
      }

      await batchUpdateSegments(updatedResults, `Search & Replace: "${targetSearch}" -> "${replaceText}"`);
      toast({ title: "Replace All Complete", description: `Updated ${updatedResults.length} segments.` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Replacement Failed", description: e.message });
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* Search Console */}
      <div className="p-4 border-b bg-muted/10 space-y-3 shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button size="sm" className="h-8 gap-2 font-bold uppercase text-[10px]" onClick={handleFindNext}>
              <Search className="w-3.5 h-3.5" /> Find Next
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-2 font-bold uppercase text-[10px]" onClick={handleReplace}>
              Replace
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-2 font-bold uppercase text-[10px]" onClick={handleReplaceAll}>
              Replace All
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-2 font-bold uppercase text-[10px]">
              Add as User-Defined Check
            </Button>
          </div>

          <Select value={searchMode} onValueChange={setSearchMode}>
            <SelectTrigger className="h-8 w-64 text-[10px] font-bold uppercase bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="both_found" className="text-[10px] uppercase font-bold">Source and target texts are found</SelectItem>
              <SelectItem value="source_found_target_not" className="text-[10px] uppercase font-bold">Source text is found but target is not</SelectItem>
              <SelectItem value="target_found_source_not" className="text-[10px] uppercase font-bold">Target text is found but source is not</SelectItem>
              <SelectItem value="source_found_target_empty" className="text-[10px] uppercase font-bold">Source text is found but target is empty</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="relative group">
            <div className="absolute left-2 top-1/2 -translate-y-1/2 flex gap-1 z-10">
              <Tag flag="C" active={sourceFlags.case} onClick={() => setSourceFlags(f => ({ ...f, case: !f.case }))} title="Case Sensitive" />
              <Tag flag="T" active={sourceFlags.tags} onClick={() => setSourceFlags(f => ({ ...f, tags: !f.tags }))} title="Search within tags" />
              <Tag flag="W" active={sourceFlags.whole} onClick={() => setSourceFlags(f => ({ ...f, whole: !f.whole }))} title="Whole word" />
              <Tag flag="R" active={sourceFlags.regex} onClick={() => setSourceFlags(f => ({ ...f, regex: !f.regex }))} title="Regular Expression" />
              <Tag flag="B" active={sourceFlags.power} onClick={() => setSourceFlags(f => ({ ...f, power: !f.power }))} title="Power Search" />
            </div>
            <Input
              value={sourceSearch}
              onChange={(e) => setSourceSearch(e.target.value)}
              placeholder="Search in source"
              className="h-8 pl-32 text-xs bg-background border-muted-foreground/20 focus-visible:ring-primary/30"
            />
            {sourceSearch && <button onClick={() => setSourceSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>}
          </div>

          <div className="relative group">
            <div className="absolute left-2 top-1/2 -translate-y-1/2 flex gap-1 z-10">
              <Tag flag="C" active={targetFlags.case} onClick={() => setTargetFlags(f => ({ ...f, case: !f.case }))} title="Case Sensitive" />
              <Tag flag="T" active={targetFlags.tags} onClick={() => setTargetFlags(f => ({ ...f, tags: !f.tags }))} title="Search within tags" />
              <Tag flag="W" active={targetFlags.whole} onClick={() => setTargetFlags(f => ({ ...f, whole: !f.whole }))} title="Whole word" />
              <Tag flag="R" active={targetFlags.regex} onClick={() => setTargetFlags(f => ({ ...f, regex: !f.regex }))} title="Regular Expression" />
              <Tag flag="B" active={targetFlags.power} onClick={() => setTargetFlags(f => ({ ...f, power: !f.power }))} title="Power Search" />
            </div>
            <Input
              value={targetSearch}
              onChange={(e) => setTargetSearch(e.target.value)}
              placeholder="Search in target"
              className="h-8 pl-32 text-xs bg-background border-muted-foreground/20 focus-visible:ring-primary/30"
            />
            {targetSearch && <button onClick={() => setTargetSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>}
          </div>

          <div className="relative">
            <Input
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="Replace with"
              className="h-8 pl-8 text-xs bg-background border-dashed border-primary/30"
            />
            <ArrowRight className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary opacity-50" />
          </div>
        </div>
      </div>

      {/* Results View */}
      <div className="flex-1 min-h-0 bg-muted/5">
        {results.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <div className="w-24 h-24 bg-muted/20 rounded-full flex items-center justify-center mb-6">
              <Search className="w-10 h-10 opacity-20" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest">Search Console Ready</h3>
            <p className="text-xs mt-2 max-w-sm">Enter search parameters above to perform a deep scan of the project memory.</p>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <table className="w-full text-[11px] border-collapse">
              <thead className="bg-muted/30 border-b uppercase font-bold text-[9px] text-muted-foreground sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-1.5 text-left border-r w-8">#</th>
                  <th className="px-4 py-1.5 text-left border-r w-1/3">Source Segment</th>
                  <th className="px-4 py-1.5 text-left border-r w-1/3">Target Segment</th>
                  {visibleColumns.id && <th className="px-4 py-1.5 text-left border-r w-20">ID</th>}
                  <th className="px-4 py-1.5 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {results.map((item, idx) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedSegment(item.id)}
                    className={cn(
                      "group hover:bg-primary/5 cursor-pointer border-b last:border-0 transition-colors",
                      selectedSegmentId === item.id && "bg-primary/10",
                      idx % 2 === 0 ? "bg-background" : "bg-muted/5"
                    )}
                  >
                    <td className="px-4 py-3 border-r font-mono text-[9px] text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-3 border-r break-words" title={item.source.text}>
                      <HighlightMatches text={item.source.text} query={sourceSearch} flags={sourceFlags} />
                    </td>
                    <td className="px-4 py-3 border-r break-words" title={item.target.text}>
                      <HighlightMatches text={item.target.text} query={targetSearch} flags={targetFlags} />
                    </td>
                    {visibleColumns.id && <td className="px-4 py-3 border-r font-mono text-[9px]">{item.tu_id}</td>}
                    <td className="px-4 py-3">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight bg-muted border">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-2 px-4 bg-muted/30 border-t sticky bottom-0 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Total Hits: {results.length}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

const Tag = ({ flag, active, onClick, title }: { flag: string, active: boolean, onClick: () => void, title?: string }) => (
  <button
    onClick={onClick}
    title={title}
    className={cn(
      "w-5 h-5 rounded flex items-center justify-center text-[9px] font-black border transition-all",
      active ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-transparent hover:border-muted-foreground/30"
    )}
  >
    {flag}
  </button>
);

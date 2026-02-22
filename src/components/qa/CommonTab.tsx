"use client"

import React, { useMemo } from 'react';
import { useTmxStore } from '@/hooks/use-tmx-store';
import { TranslationUnit, LanguageSet } from '@/lib/types';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { AlertTriangle, Info, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { IssueGroupHeader } from './IssueGroupHeader';
import { useBatchActions } from '@/hooks/use-batch-actions';
import { ReportSegment } from './ReportSegment';
import { toast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { langMatch } from '@/lib/utils';

interface CommonTabProps {
  segments: TranslationUnit[];
  visibleColumns: any;
  expandedItems: string[];
  setExpandedItems: (items: string[]) => void;
  allIssueCodes: string[];
  sortAZ: boolean;
  setSortAZ: (sort: boolean) => void;
  languageSet: LanguageSet | null;
}

export const CommonTab: React.FC<CommonTabProps> = ({ 
  segments, 
  visibleColumns,
  expandedItems,
  setExpandedItems,
  allIssueCodes,
  sortAZ,
  setSortAZ,
  languageSet
 }) => {
  const { 
    selectedSegmentId, 
    setSelectedSegment, 
    selectedIssueId,
    setSelectedIssueId,
    showHiddenFormatting,
    qaSelection,
    toggleQaSelectionItem,
  } = useTmxStore();
  
  const issuesByCode = useMemo(() => {
    const groups: Record<string, { code: string, message: string, items: any[] }> = {};
    const otherTabCodes = [
      'Target inconsistency', 'Source inconsistency', 
      'Terminology violation', 'Terminology count mismatch', 'Forbidden term detected', 'User check'
    ];
    
    segments.forEach(s => {
      s.qaIssues?.forEach(issue => {
        if (otherTabCodes.includes(issue.code)) return;
        if (!groups[issue.code]) groups[issue.code] = { code: issue.code, message: issue.message, items: [] };
        groups[issue.code].items.push({ ...s, issue });
      });
    });
    
    let result = Object.values(groups);
    if (sortAZ) result.sort((a, b) => a.code.localeCompare(b.code));
    else result.sort((a, b) => b.items.length - a.items.length);
    return result;
  }, [segments, sortAZ]);
  
  if (issuesByCode.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-40">
        <AlertTriangle className="w-12 h-12 mb-4" />
        <p className="text-sm font-bold uppercase">No global issues found</p>
        <p className="text-xs mt-1">Run an audit to check for omissions, punctuation, and tag errors.</p>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <ScrollArea className="h-full bg-muted/5">
        <div className="p-0 border-collapse">
          <Accordion type="multiple" value={expandedItems} onValueChange={setExpandedItems} className="w-full">
            {issuesByCode.map((group) => {
              const activeCount = group.items.filter(i => !i.issue.isIgnored).length;
              const isAllIgnored = group.items.every(i => i.issue.isIgnored);
              
              return (
                <AccordionItem key={group.code} value={group.code} className="border-b last:border-0">
                  <AccordionTrigger className="px-4 py-2 hover:bg-muted/30 transition-all hover:no-underline [&[data-state=open]]:bg-muted/50 border-l-4 border-l-transparent [&[data-state=open]]:border-l-primary">
                    <IssueGroupHeader 
                      code={group.code} count={activeCount} isAllIgnored={isAllIgnored}
                      onExpandAll={() => setExpandedItems(allIssueCodes)}
                      onCollapseAll={() => setExpandedItems([])}
                      onSortAZ={() => setSortAZ(!sortAZ)}
                      languageSet={languageSet}
                    />
                  </AccordionTrigger>
                  <AccordionContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-[11px] border-collapse min-w-[800px]">
                        <thead className="bg-muted/30 sticky top-0 z-10 border-b uppercase font-bold text-[9px] text-muted-foreground">
                          <tr>
                            <th className="p-2 w-8 text-center border-r"></th>
                            <th className="px-4 py-1.5 text-left border-r w-8">#</th>
                            {visibleColumns.lang && <th className="px-4 py-1.5 text-left border-r w-20">Language</th>}
                            <th className="px-4 py-1.5 text-left border-r w-1/3">Source</th>
                            <th className="px-4 py-1.5 text-left border-r w-1/3">Target</th>
                            {visibleColumns.id && <th className="px-4 py-1.5 text-left border-r w-20">ID</th>}
                            {visibleColumns.status && <th className="px-4 py-1.5 text-left border-r w-24">Status</th>}
                            <th className="px-4 py-1.5 text-left">Issue Detail</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.items.map((item, idx) => {
                            const key = `${item.id}:${item.issue.id}`;
                            const isSelected = qaSelection.has(key);
                            const isIgnored = item.issue.isIgnored;
                            return (
                              <tr 
                                key={key} 
                                onClick={() => { setSelectedSegment(item.id); setSelectedIssueId(item.issue.id); }}
                                onContextMenu={(e) => {
                                  e.preventDefault();
                                  const keys = qaSelection.has(key) ? Array.from(qaSelection) : [key];
                                  if (keys.length > 0) {
                                    useTmxStore.getState().batchToggleIssueIgnore(keys);
                                    toast({ title: `Toggled ${keys.length} issue(s)` });
                                  }
                                }}
                                className={cn(
                                  "group hover:bg-primary/5 cursor-pointer border-b last:border-0 transition-colors",
                                  isSelected && "bg-primary/20 border-l-4 border-l-primary",
                                  !isSelected && (selectedSegmentId === item.id && selectedIssueId === item.issue.id) && "bg-primary/10",
                                  isIgnored && "opacity-40 grayscale"
                                )}
                              >
                                <td className="p-2 border-r text-center align-middle">
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => toggleQaSelectionItem(key)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </td>
                                <td className="px-4 py-2 border-r font-mono text-[9px] text-muted-foreground align-top">{idx + 1}</td>
                                {visibleColumns.lang && <td className="px-4 py-2 border-r font-mono text-[9px] align-top">{item.targetLang.toUpperCase()}</td>}
                                <td className="px-4 py-2 border-r align-top">
                                  <ReportSegment segment={item.source} highlights={item.issue.sourceHighlights} showHidden={showHiddenFormatting} />
                                </td>
                                <td className="px-4 py-2 border-r align-top">
                                  <ReportSegment segment={item.target} highlights={item.issue.targetHighlights} showHidden={showHiddenFormatting} />
                                </td>
                                {visibleColumns.id && <td className="px-4 py-2 border-r font-mono text-[9px] align-top">{item.tu_id}</td>}
                                {visibleColumns.status && (
                                  <td className="px-4 py-2 border-r align-top">
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight bg-muted border">
                                      {item.status === 'translated' ? 'TRA' : item.status === 'approved' ? 'APP' : 'MT'}
                                    </span>
                                  </td>
                                )}
                                <td className="px-4 py-2 align-top">
                                  <div className={cn("flex items-center gap-2", isIgnored && "line-through decoration-muted-foreground/50")}>
                                    <div className={cn(
                                      "w-1.5 h-1.5 rounded-full shrink-0",
                                      item.issue.type === 'error' ? "bg-destructive shadow-[0_0_5px_rgba(239,68,68,0.5)]" : "bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]",
                                      isIgnored && "bg-muted-foreground shadow-none"
                                    )} />
                                    <span className="text-foreground/80 group-hover:text-foreground line-clamp-2">{item.issue.message}</span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </ScrollArea>
    </TooltipProvider>
  );
};

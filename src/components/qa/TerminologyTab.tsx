
"use client"

import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useTmxStore } from '@/hooks/use-tmx-store';
import { TranslationUnit } from '@/lib/types';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Book, LayoutGrid, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { ReportSegment } from './ReportSegment';
import { Checkbox } from '@/components/ui/checkbox';
import { langMatch } from '@/lib/utils';

interface TerminologyTabProps {
  segments: TranslationUnit[];
  visibleColumns: any;
}

export const TerminologyTab: React.FC<TerminologyTabProps> = ({ segments, visibleColumns }) => {
  const { 
    selectedSegmentId, 
    setSelectedSegment,
    selectedIssueId,
    setSelectedIssueId,
    qaSelection,
    batchToggleIssueIgnore,
    toggleQaSelectionItem,
    showHiddenFormatting,
  } = useTmxStore();
  
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  
  const groupedByTerm = useMemo(() => {
    const groups: Record<string, { term: string, items: any[] }> = {};
    
    segments.forEach(s => {
      s.qaIssues?.forEach(issue => {
        if (issue.code === 'Terminology violation' || issue.code === 'Terminology count mismatch' || issue.code === 'Forbidden term detected') {
          const match = issue.message.match(/"([^"]+)"/);
          const term = match ? match[1] : 'Unknown term';
          
          if (!groups[term]) groups[term] = { term, items: [] };
          groups[term].items.push({ ...s, issue });
        }
      });
    });
    
    return Object.values(groups).sort((a, b) => b.items.length - a.items.length);
  }, [segments]);

  if (groupedByTerm.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-40">
        <LayoutGrid className="w-12 h-12 mb-4" />
        <p className="text-sm font-bold uppercase">No glossary violations</p>
        <p className="text-xs mt-1">Linguistic audit: All approved terminology is used correctly.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full bg-muted/5">
      <div className="p-0">
        <Accordion type="multiple" value={expandedItems} onValueChange={setExpandedItems} className="w-full">
          {groupedByTerm.map((group) => (
            <AccordionItem key={group.term} value={group.term} className="border-b">
              <AccordionTrigger className="px-4 py-3 hover:bg-muted/30 hover:no-underline [&[data-state=open]]:bg-muted/50 border-l-4 border-l-transparent [&[data-state=open]]:border-l-accent">
                <div className="flex items-center gap-3">
                  <Book className="w-4 h-4 text-accent" />
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="text-xs font-black uppercase tracking-widest text-foreground">
                      Term: "{group.term}"
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                      Flagged in {group.items.length} segments
                    </span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-0">
                <table className="w-full text-[11px] border-collapse bg-background">
                  <thead className="bg-muted/30 border-b uppercase font-bold text-[9px] text-muted-foreground sticky top-0 z-10">
                    <tr>
                      <th className="p-2 w-8 border-r text-center"></th>
                      <th className="px-4 py-1.5 text-left border-r w-8">#</th>
                      {visibleColumns.lang && <th className="px-4 py-1.5 text-left border-r w-20">Language</th>}
                      <th className="px-4 py-1.5 text-left border-r w-1/3">Source context</th>
                      <th className="px-4 py-1.5 text-left border-r w-1/3">Target segment</th>
                      <th className="px-4 py-1.5 text-left">Correction requirement</th>
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
                            "group hover:bg-accent/5 cursor-pointer border-b last:border-0 transition-colors",
                            isSelected && "bg-accent/20 border-l-4 border-l-accent",
                            !isSelected && (selectedSegmentId === item.id && selectedIssueId === item.issue.id) && "bg-accent/10",
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
                          <td className="px-4 py-3 border-r font-mono text-[9px] text-muted-foreground align-top">{idx + 1}</td>
                          {visibleColumns.lang && <td className="px-4 py-2 border-r font-mono text-[9px] align-top">{item.targetLang.toUpperCase()}</td>}
                          <td className="px-4 py-3 border-r align-top max-w-0" title={item.source.text}>
                            <ReportSegment segment={item.source} highlights={item.issue.sourceHighlights} showHidden={showHiddenFormatting} />
                          </td>
                          <td className="px-4 py-3 border-r align-top max-w-0" title={item.target.text}>
                            <ReportSegment segment={item.target} highlights={item.issue.targetHighlights} showHidden={showHiddenFormatting} />
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className={cn("flex items-center gap-2 text-destructive", isIgnored && "line-through decoration-muted-foreground/50")}>
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span className="font-medium">{item.issue.message}</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </ScrollArea>
  );
};

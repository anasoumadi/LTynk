
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
import { ShieldCheck, User, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { ReportSegment } from './ReportSegment';
import { Checkbox } from '@/components/ui/checkbox';
import { langMatch } from '@/lib/utils';

interface UserDefinedTabProps {
  segments: TranslationUnit[];
  visibleColumns: any;
}

export const UserDefinedTab: React.FC<UserDefinedTabProps> = ({ segments, visibleColumns }) => {
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
  
  const groupedByRule = useMemo(() => {
    const groups: Record<string, { title: string, items: any[] }> = {};
    
    segments.forEach(s => {
      s.qaIssues?.forEach(issue => {
        if (issue.code === 'User check') {
          const title = issue.message.replace('User Check: ', '');
          
          if (!groups[title]) groups[title] = { title, items: [] };
          groups[title].items.push({ ...s, issue });
        }
      });
    });
    
    return Object.values(groups).sort((a, b) => b.items.length - a.items.length);
  }, [segments]);

  if (groupedByRule.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-40">
        <ShieldCheck className="w-12 h-12 mb-4" />
        <p className="text-sm font-bold uppercase">No custom rule violations</p>
        <p className="text-xs mt-1">Audit Trail: Your specific regex and logic checks passed.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full bg-muted/5">
      <div className="p-0">
        <Accordion type="multiple" value={expandedItems} onValueChange={setExpandedItems} className="w-full">
          {groupedByRule.map((group) => (
            <AccordionItem key={group.title} value={group.title} className="border-b">
              <AccordionTrigger className="px-4 py-3 hover:bg-muted/30 hover:no-underline [&[data-state=open]]:bg-muted/50 border-l-4 border-l-transparent [&[data-state=open]]:border-l-primary">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-primary" />
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="text-xs font-black uppercase tracking-widest text-foreground">
                      {group.title}
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
                      <th className="px-4 py-1.5 text-left border-r w-1/3">Source</th>
                      <th className="px-4 py-1.5 text-left border-r w-1/3">Target</th>
                      {visibleColumns.id && <th className="px-4 py-1.5 text-left border-r w-20">ID</th>}
                      <th className="px-4 py-1.5 text-left">Logic Status</th>
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
                          <td className="px-4 py-3 border-r font-mono text-[9px] text-muted-foreground align-top">{idx + 1}</td>
                          {visibleColumns.lang && <td className="px-4 py-2 border-r font-mono text-[9px] align-top">{item.targetLang.toUpperCase()}</td>}
                          <td className="px-4 py-3 border-r max-w-0" title={item.source.text}>
                            <ReportSegment segment={item.source} highlights={item.issue.sourceHighlights} showHidden={showHiddenFormatting} />
                          </td>
                          <td className="px-4 py-3 border-r max-w-0" title={item.target.text}>
                            <ReportSegment segment={item.target} highlights={item.issue.targetHighlights} showHidden={showHiddenFormatting} />
                          </td>
                          {visibleColumns.id && <td className="px-4 py-3 border-r font-mono text-[9px] align-top">{item.tu_id}</td>}
                          <td className="px-4 py-3 align-top">
                            <span className={cn(
                              "text-[10px] font-bold uppercase bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200",
                              isIgnored ? "text-muted-foreground line-through" : "text-amber-600"
                            )}>Violation Detected</span>
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

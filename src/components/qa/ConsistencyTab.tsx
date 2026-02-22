
"use client"

import React, { useMemo } from 'react';
import { useTmxStore } from '@/hooks/use-tmx-store';
import { TranslationUnit } from '@/lib/types';
import { calculateDiff } from '@/lib/diff-utils';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { RefreshCw, ArrowRight, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { langMatch } from '@/lib/utils';

interface ConsistencyTabProps {
  segments: TranslationUnit[];
  visibleColumns: any;
}

export const ConsistencyTab: React.FC<ConsistencyTabProps> = ({ segments, visibleColumns }) => {
  const { selectedSegmentId, setSelectedSegment, updateSegments } = useTmxStore();

  const clusters = useMemo(() => {
    const targetInconsistency: Record<string, any[]> = {};
    const sourceInconsistency: Record<string, any[]> = {};
    
    segments.forEach(s => {
      s.qaIssues?.forEach(issue => {
        if (issue.code === 'Target inconsistency' && issue.groupId) {
          if (!targetInconsistency[issue.groupId]) targetInconsistency[issue.groupId] = [];
          targetInconsistency[issue.groupId].push(s);
        }
        if (issue.code === 'Source inconsistency' && issue.groupId) {
          if (!sourceInconsistency[issue.groupId]) sourceInconsistency[issue.groupId] = [];
          sourceInconsistency[issue.groupId].push(s);
        }
      });
    });

    return { 
      target: Object.values(targetInconsistency), 
      source: Object.values(sourceInconsistency) 
    };
  }, [segments]);

  const handleApplyToAll = async (id: string, newTarget: string, groupIds: string[]) => {
    await updateSegments(groupIds, { 
      target: { text: newTarget, tags: [] }, // simplified for prototype
      status: 'translated'
    }, `Applied consistency fix across ${groupIds.length} segments`);
  };

  if (clusters.target.length === 0 && clusters.source.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-40">
        <RefreshCw className="w-12 h-12 mb-4" />
        <p className="text-sm font-bold uppercase">No inconsistencies detected</p>
        <p className="text-xs mt-1">Audit trail: Same source strings have matching translations.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full bg-muted/5">
      <div className="p-0">
        <div className="px-4 py-2 bg-primary/5 border-b flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Conflict resolution clusters</span>
        </div>

        <Accordion type="multiple" className="w-full">
          {clusters.target.map((group, gIdx) => {
            const sourceText = group[0].source.text;
            return (
              <AccordionItem key={`tgt-${gIdx}`} value={`tgt-${gIdx}`} className="border-b">
                <AccordionTrigger className="px-4 py-3 hover:bg-muted/30 hover:no-underline [&[data-state=open]]:bg-muted/50">
                  <div className="flex flex-col items-start gap-1 text-left min-w-0">
                    <span className="text-[9px] font-bold text-primary uppercase tracking-tighter">Conflict in target</span>
                    <span className="text-xs font-bold text-foreground truncate w-full" title={sourceText}>
                      Source: {sourceText}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-0">
                  <div className="divide-y border-t bg-background">
                    {group.map((item, iIdx) => (
                      <ConsistencyRow 
                        key={item.id} 
                        item={item} 
                        referenceText={group[0].target.text}
                        onSelect={() => setSelectedSegment(item.id)}
                        isSelected={selectedSegmentId === item.id}
                        onApplyAll={() => handleApplyToAll(item.id, item.target.text, group.map(g => g.id))}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}

          {clusters.source.map((group, gIdx) => {
            const targetText = group[0].target.text;
            return (
              <AccordionItem key={`src-${gIdx}`} value={`src-${gIdx}`} className="border-b">
                <AccordionTrigger className="px-4 py-3 hover:bg-muted/30 hover:no-underline [&[data-state=open]]:bg-muted/50">
                  <div className="flex flex-col items-start gap-1 text-left min-w-0">
                    <span className="text-[9px] font-bold text-accent uppercase tracking-tighter">Conflict in source</span>
                    <span className="text-xs font-bold text-foreground truncate w-full" title={targetText}>
                      Target: {targetText}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-0">
                  <div className="divide-y border-t bg-background">
                    {group.map((item, iIdx) => (
                      <ConsistencyRow 
                        key={item.id} 
                        item={item} 
                        isSourceComparison
                        referenceText={group[0].source.text}
                        onSelect={() => setSelectedSegment(item.id)}
                        isSelected={selectedSegmentId === item.id}
                        onApplyAll={() => {}} // Usually don't apply all for source inconsistency
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </ScrollArea>
  );
};

const ConsistencyRow = ({ 
  item, 
  referenceText, 
  onSelect, 
  isSelected, 
  onApplyAll,
  isSourceComparison = false
}: { 
  item: any, 
  referenceText: string, 
  onSelect: () => void, 
  isSelected: boolean, 
  onApplyAll: () => void,
  isSourceComparison?: boolean
}) => {
  const compareText = isSourceComparison ? item.source.text : item.target.text;
  const diffs = calculateDiff(referenceText, compareText);

  return (
    <div 
      onClick={onSelect}
      className={cn(
        "flex group items-center p-3 gap-4 cursor-pointer transition-colors border-l-4 border-l-transparent",
        isSelected ? "bg-primary/10 border-l-primary" : "hover:bg-muted/20"
      )}
    >
      <div className="w-12 text-[9px] font-mono text-muted-foreground shrink-0">#{item.tu_id}</div>
      <div className="flex-1 min-w-0 text-xs">
        <div className="flex items-center gap-2 mb-1">
           <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
             {isSourceComparison ? 'Source variation' : 'Translation variation'}
           </span>
        </div>
        <div className="leading-relaxed break-words">
          {diffs.map((part, i) => (
            <span 
              key={i} 
              className={cn(
                part.type === 'delete' && "bg-destructive/20 text-destructive line-through",
                part.type === 'insert' && "bg-pink-500/20 text-pink-600 font-bold"
              )}
            >
              {part.value}
            </span>
          ))}
        </div>
      </div>
      {!isSourceComparison && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={(e) => { e.stopPropagation(); onApplyAll(); }}
          className="h-7 text-[9px] font-bold uppercase gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Apply to all
        </Button>
      )}
    </div>
  );
};

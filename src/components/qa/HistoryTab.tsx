
"use client"

import React from 'react';
import { useTmxStore } from '@/hooks/use-tmx-store';
import { History as HistoryIcon, RotateCcw, Clock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

export const HistoryTab = ({ visibleColumns }: { visibleColumns: any }) => {
  const { history = [], restoreSnapshot } = useTmxStore();

  if (history.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-40">
        <Clock className="w-12 h-12 mb-4" />
        <p className="text-sm font-bold uppercase">No session history</p>
        <p className="text-xs mt-1">Audit Log: Modifications made during this session will appear here.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full bg-muted/5">
      <div className="p-0">
        <table className="w-full text-[11px] border-collapse">
          <thead className="bg-muted/30 border-b uppercase font-bold text-[9px] text-muted-foreground sticky top-0 z-10">
            <tr>
              <th className="px-4 py-2 text-left border-r w-12">Step</th>
              <th className="px-4 py-2 text-left border-r w-40">Timestamp</th>
              <th className="px-4 py-2 text-left border-r w-1/2">Operation Description</th>
              <th className="px-4 py-2 text-left border-r">Scope</th>
              <th className="px-4 py-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {history.map((step, idx) => (
              <tr 
                key={step.id} 
                className={cn(
                  "hover:bg-primary/5 border-b last:border-0 transition-colors",
                  idx % 2 === 0 ? "bg-background" : "bg-muted/5"
                )}
              >
                <td className="px-4 py-3 border-r font-mono text-[10px] text-primary">{history.length - idx}</td>
                <td className="px-4 py-3 border-r font-medium text-muted-foreground">
                  {step.timestamp.toLocaleTimeString()}
                </td>
                <td className="px-4 py-3 border-r">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground capitalize">{step.description}</span>
                  </div>
                </td>
                <td className="px-4 py-3 border-r text-muted-foreground italic">
                  {step.segments.length} segments in project
                </td>
                <td className="px-4 py-3 text-center">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => restoreSnapshot(step.id)}
                    className="h-7 text-[10px] font-black uppercase tracking-tighter gap-2 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Revert Session to This State
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ScrollArea>
  );
};

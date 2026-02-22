"use client"

import React from 'react';
import { 
  MoreVertical, 
  EyeOff, 
  Eye, 
  SortAsc, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useBatchActions } from '@/hooks/use-batch-actions';
import { cn } from '@/lib/utils';
import { LanguageSet } from '@/lib/types';

interface IssueGroupHeaderProps {
  code: string;
  count: number;
  isAllIgnored: boolean;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onSortAZ: () => void;
  languageSet: LanguageSet | null;
}

export const IssueGroupHeader: React.FC<IssueGroupHeaderProps> = ({ 
  code, 
  count, 
  isAllIgnored,
  onExpandAll, 
  onCollapseAll, 
  onSortAZ,
  languageSet
}) => {
  const { ignoreAll, unignoreAll } = useBatchActions(languageSet);

  const handleToggleGroup = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAllIgnored) {
      unignoreAll(code);
    } else {
      ignoreAll(code);
    }
  };

  return (
    <div className="flex items-center gap-2 group/header w-full pr-4">
      {/* Group Status Marker - Toggle entire error type */}
      <div 
        onClick={handleToggleGroup}
        onContextMenu={handleToggleGroup}
        className={cn(
          "w-2.5 h-2.5 rounded-sm shrink-0 transition-all cursor-pointer hover:scale-125 z-20",
          isAllIgnored 
            ? "bg-muted-foreground/40" 
            : "bg-destructive shadow-[0_0_4px_rgba(239,68,68,0.4)]"
        )} 
        title={isAllIgnored ? "Mark entire group as active" : "Mark entire group as false positive"}
      />

      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className={cn(
          "text-xs font-bold truncate transition-all text-left",
          isAllIgnored ? "text-muted-foreground line-through opacity-50 font-medium" : "text-foreground"
        )}>
          {code}
        </span>
        <span className={cn(
          "text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors",
          isAllIgnored ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
        )}>
          {count}
        </span>
      </div>

      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover/header:opacity-100 transition-opacity">
              <MoreVertical className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 text-[11px] font-bold uppercase tracking-tight">
            <DropdownMenuLabel className="text-[9px] opacity-50 px-2 py-1">Error Group</DropdownMenuLabel>
            <DropdownMenuItem className="gap-2" onClick={() => ignoreAll(code)}>
              <EyeOff className="w-3.5 h-3.5" />
              Ignore all errors <span className="ml-auto opacity-40 font-mono text-[9px]">Shift+Ctrl+Space</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2" onClick={() => unignoreAll(code)}>
              <Eye className="w-3.5 h-3.5" />
              Unignore all errors
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuLabel className="text-[9px] opacity-50 px-2 py-1">All error groups</DropdownMenuLabel>
            <DropdownMenuItem className="gap-2" onClick={onSortAZ}>
              <SortAsc className="w-3.5 h-3.5" />
              Sort A-Z
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2" onClick={onExpandAll}>
              <ChevronDown className="w-3.5 h-3.5" />
              Expand <span className="ml-auto opacity-40 font-mono text-[9px]">Shift+→</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2" onClick={onCollapseAll}>
              <ChevronUp className="w-3.5 h-3.5" />
              Collapse <span className="ml-auto opacity-40 font-mono text-[9px]">Shift+←</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

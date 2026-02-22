"use client"

import React from 'react';
import { UserDefinedCheck, UserCheckCondition } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Info, HelpCircle } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from '@/components/ui/tooltip';

interface CheckEditorProps {
  check: UserDefinedCheck;
  onUpdate: (updates: Partial<UserDefinedCheck>) => void;
}

export const CheckEditor: React.FC<CheckEditorProps> = ({ check, onUpdate }) => {
  const updateSourceOpt = (key: keyof UserDefinedCheck['sourceOptions'], val: boolean) => {
    onUpdate({ sourceOptions: { ...check.sourceOptions, [key]: val } });
  };

  const updateTargetOpt = (key: keyof UserDefinedCheck['targetOptions'], val: boolean) => {
    onUpdate({ targetOptions: { ...check.targetOptions, [key]: val } });
  };

  return (
    <div className="p-4 space-y-6 bg-muted/5 border-t">
      <div className="space-y-2">
        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Check Description</Label>
        <Input 
          value={check.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Untitled check: please give the check a proper description."
          className="h-9 bg-background border-border/50 text-sm font-medium"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-primary">Source Pattern</Label>
            <div className="flex gap-1">
              <TokenToggle label="C" active={check.sourceOptions.caseSensitive} onClick={() => updateSourceOpt('caseSensitive', !check.sourceOptions.caseSensitive)} tooltip="Case Sensitive" />
              <TokenToggle label="W" active={check.sourceOptions.wholeWord} onClick={() => updateSourceOpt('wholeWord', !check.sourceOptions.wholeWord)} tooltip="Whole Word" />
              <TokenToggle label="R" active={check.sourceOptions.isRegex} onClick={() => updateSourceOpt('isRegex', !check.sourceOptions.isRegex)} tooltip="Regular Expression" />
            </div>
          </div>
          <Input 
            value={check.sourcePattern}
            onChange={(e) => onUpdate({ sourcePattern: e.target.value })}
            placeholder="Search text or regex..."
            className={cn("h-9 bg-background font-mono text-xs", check.sourceOptions.isRegex && "border-primary/30")}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-primary">Target Pattern</Label>
            <div className="flex gap-1">
              <TokenToggle label="C" active={check.targetOptions.caseSensitive} onClick={() => updateTargetOpt('caseSensitive', !check.targetOptions.caseSensitive)} tooltip="Case Sensitive" />
              <TokenToggle label="W" active={check.targetOptions.wholeWord} onClick={() => updateTargetOpt('wholeWord', !check.targetOptions.wholeWord)} tooltip="Whole Word" />
              <TokenToggle label="R" active={check.targetOptions.isRegex} onClick={() => updateTargetOpt('isRegex', !check.targetOptions.isRegex)} tooltip="Regular Expression" />
            </div>
          </div>
          <Input 
            value={check.targetPattern}
            onChange={(e) => onUpdate({ targetPattern: e.target.value })}
            placeholder="Search text or regex..."
            className={cn("h-9 bg-background font-mono text-xs", check.targetOptions.isRegex && "border-primary/30")}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Report segments when</Label>
          <Select 
            value={check.condition} 
            onValueChange={(v: UserCheckCondition) => onUpdate({ condition: v })}
          >
            <SelectTrigger className="h-9 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="both_found" className="text-xs">Source and target patterns are both found</SelectItem>
              <SelectItem value="source_found_target_missing" className="text-xs">Source found but target is missing</SelectItem>
              <SelectItem value="target_found_source_missing" className="text-xs">Target found but source is missing</SelectItem>
              <SelectItem value="both_regex_match" className="text-xs">Regex match found in both</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Group in</Label>
          <Select 
            value={check.group} 
            onValueChange={(v) => onUpdate({ group: v })}
          >
            <SelectTrigger className="h-9 bg-background">
              <SelectValue placeholder="Select group..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="General" className="text-xs">General</SelectItem>
              <SelectItem value="Technical" className="text-xs">Technical</SelectItem>
              <SelectItem value="Marketing" className="text-xs">Marketing</SelectItem>
              <SelectItem value="Legal" className="text-xs">Legal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-md flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-[10px] text-muted-foreground leading-relaxed italic">
          Tip: Use the <strong>Token Toggles (C T R)</strong> to define how patterns are matched. 
          Regex patterns support capture groups and advanced lookaheads.
        </p>
      </div>
    </div>
  );
};

const TokenToggle = ({ label, active, onClick, tooltip }: { label: string, active: boolean, onClick: () => void, tooltip: string }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <button 
          onClick={onClick}
          className={cn(
            "w-6 h-6 rounded flex items-center justify-center text-[9px] font-black transition-all border",
            active 
              ? "bg-primary text-primary-foreground border-primary shadow-sm" 
              : "bg-background text-muted-foreground border-border/50 hover:border-primary/30"
          )}
        >
          {label}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-[9px] font-bold py-1 px-2 uppercase tracking-wider">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

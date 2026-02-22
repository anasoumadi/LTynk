"use client"

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Settings2, 
  X, 
  ChevronDown, 
  Eye, 
  EyeOff, 
  CaseSensitive, 
  Tags,
  AlertCircle,
  Hash,
  Star,
  Terminal,
  Activity
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useTmxStore, SearchMode } from '@/hooks/use-tmx-store';
import { BuiltInFilterType, TUStatus } from '@/lib/types';
import { CustomFilterDialog } from '../filters/CustomFilterDialog';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { LanguageSwitcher } from './LanguageSwitcher';

export const TopPanel = () => {
  const { 
    currentProject, 
    sourceQuery, 
    targetQuery, 
    setSourceQuery, 
    setTargetQuery,
    sourceSearchMode,
    targetSearchMode,
    setSourceSearchMode,
    setTargetSearchMode,
    activeFilterType,
    setActiveFilterType,
    statusFilter,
    setStatusFilter,
    ignoreCase,
    setIgnoreCase,
    ignoreTags,
    setIgnoreTags,
    customFilters,
    activeCustomFilterId,
    setActiveCustomFilterId,
    deleteCustomFilter
  } = useTmxStore();

  const isMobile = useIsMobile();
  const [customOpen, setCustomOpen] = useState(false);
  
  // Local state for debounced searching
  const [localSource, setLocalSource] = useState(sourceQuery);
  const [localTarget, setLocalTarget] = useState(targetQuery);

  // Sync local state with store when project changes or filters cleared
  useEffect(() => {
    setLocalSource(sourceQuery);
    setLocalTarget(targetQuery);
  }, [sourceQuery, targetQuery]);

  // Debounced update to the global store to improve responsiveness
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSource !== sourceQuery) setSourceQuery(localSource);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSource, sourceQuery, setSourceQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localTarget !== targetQuery) setTargetQuery(localTarget);
    }, 300);
    return () => clearTimeout(timer);
  }, [localTarget, targetQuery, setTargetQuery]);

  const handleFilterChange = (value: string) => {
    if (value === 'all' || value === 'same' || value === 'untranslated' || value === 'comments' || value === 'invalid' || value === 'inconsistency' || value === 'source_inconsistency' || value === 'repetitions') {
      setActiveFilterType(value as BuiltInFilterType);
    } else {
      setActiveCustomFilterId(value);
    }
  };

  const clearFilters = () => {
    setLocalSource('');
    setLocalTarget('');
    setSourceQuery('');
    setTargetQuery('');
    setActiveFilterType('all');
    setActiveCustomFilterId(null);
    setStatusFilter('all');
  };

  const hasActiveFilters = sourceQuery || targetQuery || activeFilterType !== 'all' || activeCustomFilterId || statusFilter !== 'all';

  return (
    <div className="bg-muted/30 border-b flex flex-col items-stretch p-3 sm:px-4 sm:py-2 gap-3 select-none shrink-0 overflow-x-auto custom-scrollbar">
       {currentProject?.type === 'multilingual' && <LanguageSwitcher />}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
        {/* Search Panel */}
        <div className="flex flex-col sm:flex-row items-center gap-2 flex-1">
          <div className="flex items-center gap-1.5 bg-background/50 border rounded-md px-2 py-1 flex-1 w-full">
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-muted-foreground uppercase w-8 shrink-0">Src</span>
                <Input 
                  placeholder="Search in source..."
                  value={localSource}
                  onChange={(e) => setLocalSource(e.target.value)}
                  className="h-6 text-[11px] bg-transparent border-none focus-visible:ring-0 p-0"
                />
                {!isMobile && <SearchModeSelector value={sourceSearchMode} onValueChange={setSourceSearchMode} />}
              </div>
              <div className="h-px bg-border/40 w-full" />
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-muted-foreground uppercase w-8 shrink-0">Tgt</span>
                <Input 
                  placeholder="Search in target..."
                  value={localTarget}
                  onChange={(e) => setLocalTarget(e.target.value)}
                  className="h-6 text-[11px] bg-transparent border-none focus-visible:ring-0 p-0"
                />
                {!isMobile && <SearchModeSelector value={targetSearchMode} onValueChange={setTargetSearchMode} />}
              </div>
            </div>
            <Search className="w-4 h-4 text-muted-foreground/50 ml-2" />
          </div>
        </div>

        {/* Filter Panel */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex flex-col gap-1 w-full sm:w-40 lg:w-44">
            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Status</Label>
            <Select 
              value={statusFilter} 
              onValueChange={(v: TUStatus | 'all') => setStatusFilter(v)}
            >
              <SelectTrigger className="h-8 text-[10px] font-bold uppercase bg-background border-border/50">
                 <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[10px] font-bold uppercase">Any Status</SelectItem>
                <SelectItem value="empty" className="text-[10px] font-bold uppercase">Empty</SelectItem>
                <SelectItem value="translated" className="text-[10px] font-bold uppercase">Translated</SelectItem>
                <SelectItem value="approved" className="text-[10px] font-bold uppercase">Approved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1 w-full sm:w-56 lg:w-60">
            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Linguistic Group</Label>
            <Select 
              value={activeCustomFilterId || activeFilterType} 
              onValueChange={handleFilterChange}
            >
              <SelectTrigger className="h-8 text-[10px] font-bold uppercase bg-background border-border/50">
                 <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel className="text-[9px] uppercase font-black text-primary/70">Automatic Filters</SelectLabel>
                  <SelectItem value="all" className="text-[10px] font-bold uppercase">All Segments</SelectItem>
                  <SelectItem value="same" className="text-[10px] font-bold uppercase">Target same as source</SelectItem>
                  <SelectItem value="untranslated" className="text-[10px] font-bold uppercase">Untranslated segments</SelectItem>
                  <SelectItem value="comments" className="text-[10px] font-bold uppercase">Segments with notes</SelectItem>
                  <SelectItem value="inconsistency" className="text-[10px] font-bold uppercase">Inconsistent targets</SelectItem>
                  <SelectItem value="source_inconsistency" className="text-[10px] font-bold uppercase">Inconsistent sources</SelectItem>
                  <SelectItem value="repetitions" className="text-[10px] font-bold uppercase">Repetitions</SelectItem>
                  <SelectItem value="invalid" className="text-[10px] font-bold uppercase">Invalid characters</SelectItem>
                </SelectGroup>
                
                {customFilters.length > 0 && (
                  <>
                    <SelectSeparator />
                    <SelectGroup>
                      <SelectLabel className="text-[9px] uppercase font-black text-primary/70">Custom Rule Presets</SelectLabel>
                      {customFilters.map(f => (
                        <div key={f.id} className="flex items-center justify-between group">
                          <SelectItem value={f.id} className="text-[10px] font-bold uppercase flex-1">
                            {f.name}
                          </SelectItem>
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteCustomFilter(f.id); }}
                            className="px-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </SelectGroup>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4 px-2 sm:px-4 sm:border-l sm:border-r border-border/40 h-8 sm:h-10">
             <div className="flex items-center space-x-2">
                <Checkbox 
                  id="ignoreCase" 
                  checked={ignoreCase} 
                  onCheckedChange={(v: boolean) => setIgnoreCase(v)} 
                  className="scale-75"
                />
                <Label htmlFor="ignoreCase" className="text-[10px] font-bold uppercase cursor-pointer flex items-center gap-1 text-muted-foreground hover:text-foreground">
                  Case
                </Label>
             </div>
             <div className="flex items-center space-x-2">
                <Checkbox 
                  id="ignoreTags" 
                  checked={ignoreTags} 
                  onCheckedChange={(v: boolean) => setIgnoreTags(v)} 
                  className="scale-75"
                />
                <Label htmlFor="ignoreTags" className="text-[10px] font-bold uppercase cursor-pointer flex items-center gap-1 text-muted-foreground hover:text-foreground">
                  Tags
                </Label>
             </div>
          </div>

          <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setCustomOpen(true)}
              className="h-8 px-2 sm:px-3 gap-2 text-[10px] font-bold uppercase border border-border/50 hover:bg-primary/5"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Rule Editor</span>
            </Button>
            
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={clearFilters}
                title="Clear all filters"
                className="h-8 w-8 text-destructive hover:bg-destructive/10"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {isMobile && (
        <div className="flex gap-2 pt-1 border-t border-border/20">
          <SearchModeSelector value={sourceSearchMode} onValueChange={setSourceSearchMode} className="flex-1" label="Src Mode" />
          <SearchModeSelector value={targetSearchMode} onValueChange={setTargetSearchMode} className="flex-1" label="Tgt Mode" />
        </div>
      )}

      <CustomFilterDialog open={customOpen} onOpenChange={setCustomOpen} />
    </div>
  );
};

const SearchModeSelector = ({ value, onValueChange, className, label }: { value: SearchMode, onValueChange: (v: SearchMode) => void, className?: string, label?: string }) => (
  <Select value={value} onValueChange={onValueChange}>
    <SelectTrigger className={cn("w-20 h-5 text-[8px] font-black uppercase bg-muted/40 border-none hover:bg-muted/60 transition-colors focus:ring-0", className)}>
      <div className="flex items-center gap-1 truncate">
        {label && <span className="opacity-50">{label}:</span>}
        <SelectValue />
      </div>
    </SelectTrigger>
    <SelectContent className="w-32">
       <SelectItem value="normal" className="text-[10px] font-bold uppercase">Normal</SelectItem>
       <SelectItem value="regex" className="text-[10px] font-bold uppercase">Regex</SelectItem>
       <SelectItem value="wildcard" className="text-[10px] font-bold uppercase">Wildcard</SelectItem>
    </SelectContent>
  </Select>
);

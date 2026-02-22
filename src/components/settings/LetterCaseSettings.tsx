
"use client"

import React, { useState, useMemo, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { QASettings } from '@/lib/types';
import { exportToTextFile, parsePastedList } from '@/lib/import-export-utils';
import { 
  X, 
  Plus, 
  Trash2, 
  Download, 
  ArrowUp, 
  Eraser, 
  Search,
  ChevronDown,
  CaseSensitive,
  FileUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface LetterCaseSettingsProps {
  settings: QASettings;
  onChange: (updates: Partial<QASettings>) => void;
}

export const LetterCaseSettings: React.FC<LetterCaseSettingsProps> = ({ settings, onChange }) => {
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredCases = useMemo(() => {
    if (!searchQuery.trim()) return settings.specialCases || [];
    return (settings.specialCases || []).filter(w => 
      w.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [settings.specialCases, searchQuery]);

  const handleAddCase = (input: string) => {
    const newCases = parsePastedList(input);
    if (newCases.length === 0) return;
    
    const existingList = settings.specialCases || [];
    const existing = new Set(existingList);
    const added: string[] = [];
    
    newCases.forEach(w => {
      if (!existing.has(w)) {
        existing.add(w);
        added.push(w);
      }
    });
    
    if (added.length > 0) {
      onChange({ specialCases: Array.from(existing) });
      toast({ title: "Special Cases Updated", description: `Added ${added.length} term(s).` });
    }
    setInputValue('');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const newCases = parsePastedList(text);
      if (newCases.length === 0) return;

      const existingList = settings.specialCases || [];
      const existing = new Set(existingList);
      const added: string[] = [];
      
      newCases.forEach(w => {
        if (!existing.has(w)) {
          existing.add(w);
          added.push(w);
        }
      });

      if (added.length > 0) {
        onChange({ specialCases: Array.from(existing) });
        toast({ 
          title: "Import Successful", 
          description: `Added ${added.length} new special casing rules.` 
        });
      } else {
        toast({ title: "No new terms", description: "All items in the file are already in your repository." });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Import Failed", description: "Failed to read the text file." });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveCase = (word: string) => {
    onChange({ specialCases: (settings.specialCases || []).filter(w => w !== word) });
  };

  const handleClearAll = () => {
    if (confirm("Permanently clear all special casing rules?")) {
      onChange({ specialCases: [] });
    }
  };

  const handleExport = () => {
    if (!settings.specialCases || settings.specialCases.length === 0) {
      toast({ variant: "destructive", title: "Export Failed", description: "No terms found to export." });
      return;
    }
    exportToTextFile(settings.specialCases, 'special_cases.txt');
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 pt-4">
      {/* Left Panel: Configuration */}
      <div className="flex-1 space-y-6">
        <div className="space-y-4">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
            Audit Rules
          </Label>
          
          <LetterCaseOption 
            id="checkInitialCapitalization" 
            label="Initial capitalization" 
            description="Sentence-start casing must match source exactly."
            checked={settings.checkInitialCapitalization}
            onChange={(v) => onChange({ checkInitialCapitalization: v })}
          />

          <LetterCaseOption 
            id="checkCamelCase" 
            label="Uppercase character after lowercase" 
            description="Detect suspicious mid-word caps like 'MultiTerm'."
            checked={settings.checkCamelCase}
            onChange={(v) => onChange({ checkCamelCase: v })}
          />

          <LetterCaseOption
            id="checkMixedScripts"
            label="Mixed script detection (Latin/Cyrillic)"
            description="Flag words containing both Latin and Cyrillic characters (e.g. 'cоmputer')."
            checked={settings.checkMixedScripts}
            onChange={(v) => onChange({ checkMixedScripts: v })}
          />

          <div className="pt-2 border-t mt-4">
            <LetterCaseOption 
              id="checkSpecialCase" 
              label="Words with special letter case" 
              description="Enforce casing for product names or technical terms."
              checked={settings.checkSpecialCase}
              onChange={(v) => onChange({ checkSpecialCase: v })}
            />
          </div>
        </div>
      </div>

      {/* Right Panel: List Management */}
      <div className="flex-1 flex flex-col min-h-[400px] border rounded-lg bg-muted/5 overflow-hidden">
        <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">Special Cases Repository</span>
            <span className="text-[9px] text-muted-foreground font-medium">{(settings.specialCases || []).length} Precision Rules</span>
          </div>
          <div className="flex gap-1">
             <input 
               type="file" 
               ref={fileInputRef} 
               className="hidden" 
               accept=".txt,.csv" 
               onChange={handleImport} 
             />
             <Button 
               variant="ghost" 
               size="icon" 
               className="w-7 h-7" 
               onClick={() => fileInputRef.current?.click()} 
               title="Import Special Cases"
             >
               <FileUp className="w-3.5 h-3.5" />
             </Button>
             <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })} title="Scroll to top"><ArrowUp className="w-3.5 h-3.5" /></Button>
             <Button variant="ghost" size="icon" className="w-7 h-7" onClick={handleExport} title="Download List"><Download className="w-3.5 h-3.5" /></Button>
             <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive" onClick={handleClearAll} title="Clear All"><Eraser className="w-3.5 h-3.5" /></Button>
          </div>
        </div>

        <div className="p-3 border-b bg-background">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input 
              placeholder="Filter special cases..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs bg-muted/30 border-none"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="flex flex-wrap gap-2">
            {(!settings.specialCases || settings.specialCases.length === 0) ? (
              <div className="w-full text-center py-12 text-muted-foreground space-y-2">
                <CaseSensitive className="w-10 h-10 mx-auto opacity-10" />
                <div className="flex flex-col items-center">
                  <p className="text-[10px] font-medium uppercase italic">Add terms requiring specific casing</p>
                  <ChevronDown className="w-4 h-4 mt-2 animate-bounce opacity-30" />
                </div>
              </div>
            ) : filteredCases.length === 0 ? (
              <div className="w-full text-center py-12 text-[10px] text-muted-foreground italic">No matches for "{searchQuery}"</div>
            ) : (
              filteredCases.map(word => (
                <Badge key={word} variant="outline" className="gap-1.5 py-1 px-2.5 text-[10px] font-bold tracking-tighter bg-background hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30 transition-all group">
                  {word}
                  <button onClick={() => handleRemoveCase(word)} className="opacity-50 group-hover:opacity-100">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="p-3 border-t bg-background shadow-inner">
          <div className="flex gap-2">
            <Input 
              placeholder="Add expression or paste list..." 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCase(inputValue)}
              className="h-8 text-xs bg-muted/30 border-none"
            />
            <Button size="sm" className="h-8 px-3" onClick={() => handleAddCase(inputValue)}>
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const LetterCaseOption = ({ id, label, description, checked, onChange }: { id: string, label: string, description: string, checked: boolean, onChange: (v: boolean) => void }) => (
  <div className="flex items-start justify-between gap-4">
    <div className="space-y-0.5">
      <Label htmlFor={id} className="text-xs font-bold leading-none cursor-pointer">{label}</Label>
      <p className="text-[10px] text-muted-foreground leading-tight">{description}</p>
    </div>
    <Checkbox id={id} checked={checked} onCheckedChange={onChange} className="scale-90" />
  </div>
);


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
  AlertOctagon,
  ChevronDown,
  FileUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface ForbiddenWordsSettingsProps {
  settings: QASettings;
  onChange: (updates: Partial<QASettings>) => void;
}

export const ForbiddenWordsSettings: React.FC<ForbiddenWordsSettingsProps> = ({ settings, onChange }) => {
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredWords = useMemo(() => {
    if (!searchQuery.trim()) return settings.forbiddenWords;
    return settings.forbiddenWords.filter(w => 
      w.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [settings.forbiddenWords, searchQuery]);

  const handleAddWord = (input: string) => {
    const newWords = parsePastedList(input);
    if (newWords.length === 0) return;
    
    const existing = new Set(settings.forbiddenWords);
    const added: string[] = [];
    
    newWords.forEach(w => {
      if (!existing.has(w)) {
        existing.add(w);
        added.push(w);
      }
    });
    
    if (added.length > 0) {
      onChange({ forbiddenWords: Array.from(existing) });
      toast({ title: "Blacklist Updated", description: `Added ${added.length} expression(s).` });
    } else {
      toast({ title: "No new expressions", description: "All entered items are already blacklisted." });
    }
    
    setInputValue('');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const newWords = parsePastedList(text);
      if (newWords.length === 0) return;

      const existing = new Set(settings.forbiddenWords);
      const added: string[] = [];
      
      newWords.forEach(w => {
        if (!existing.has(w)) {
          existing.add(w);
          added.push(w);
        }
      });

      if (added.length > 0) {
        onChange({ forbiddenWords: Array.from(existing) });
        toast({ 
          title: "Import Successful", 
          description: `Added ${added.length} new forbidden expressions.` 
        });
      } else {
        toast({ title: "No new expressions", description: "All items in the file are already in your blacklist." });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Import Failed", description: "Failed to read the text file." });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveWord = (word: string) => {
    onChange({ forbiddenWords: settings.forbiddenWords.filter(w => w !== word) });
  };

  const handleClearAll = () => {
    if (confirm("Permanently clear the forbidden expressions blacklist?")) {
      onChange({ forbiddenWords: [] });
    }
  };

  const handleExport = () => {
    if (settings.forbiddenWords.length === 0) {
      toast({ variant: "destructive", title: "Export Failed", description: "No expressions found to export." });
      return;
    }
    exportToTextFile(settings.forbiddenWords, 'forbidden_expressions.txt');
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 pt-4">
      {/* Left Panel: Config */}
      <div className="flex-1 space-y-6">
        <div className="space-y-4">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
            Audit Rules
          </Label>
          
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="checkForbiddenWords" className="text-xs font-bold">Check Forbidden Expressions</Label>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Scan target segments for prohibited terminology or phrasing.
              </p>
            </div>
            <Checkbox 
              id="checkForbiddenWords" 
              checked={settings.checkForbiddenWords} 
              onCheckedChange={(v: boolean) => onChange({ checkForbiddenWords: v })} 
              className="scale-90"
            />
          </div>

          <div className={cn("pl-6 space-y-3 transition-opacity duration-200", !settings.checkForbiddenWords && "opacity-40 pointer-events-none")}>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="ignoreForbiddenIfInSource" className="text-[11px] font-bold leading-none cursor-pointer">
                  Source Exception
                </Label>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Don't report errors if the source also contains the forbidden expression.
                </p>
              </div>
              <Checkbox 
                id="ignoreForbiddenIfInSource" 
                checked={settings.ignoreForbiddenIfInSource} 
                onCheckedChange={(v: boolean) => onChange({ ignoreForbiddenIfInSource: v })}
                className="scale-75"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: List Management */}
      <div className="flex-1 flex flex-col min-h-[400px] border rounded-lg bg-muted/5 overflow-hidden">
        <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">Blacklist Repository</span>
            <span className="text-[9px] text-muted-foreground font-medium">{settings.forbiddenWords.length} Active Prohibitions</span>
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
               title="Import Blacklist"
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
              placeholder="Search blacklisted expressions..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs bg-muted/30 border-none"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="flex flex-wrap gap-2">
            {settings.forbiddenWords.length === 0 ? (
              <div className="w-full text-center py-12 text-muted-foreground space-y-2">
                <AlertOctagon className="w-10 h-10 mx-auto opacity-10" />
                <div className="flex flex-col items-center">
                  <p className="text-[10px] font-medium uppercase italic">Enter an expression below or import a list</p>
                  <ChevronDown className="w-4 h-4 mt-2 animate-bounce opacity-30" />
                </div>
              </div>
            ) : filteredWords.length === 0 ? (
              <div className="w-full text-center py-12 text-[10px] text-muted-foreground italic">No matches for "{searchQuery}"</div>
            ) : (
              filteredWords.map(word => (
                <Badge key={word} variant="outline" className="gap-1.5 py-1 px-2.5 text-[10px] font-bold tracking-tighter bg-background hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30 transition-all group">
                  {word}
                  <button onClick={() => handleRemoveWord(word)} className="opacity-50 group-hover:opacity-100">
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
              placeholder="Add word, regex, or paste list..." 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddWord(inputValue)}
              className="h-8 text-xs bg-muted/30 border-none"
            />
            <Button size="sm" className="h-8 px-3 bg-primary hover:bg-primary/90" onClick={() => handleAddWord(inputValue)}>
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


"use client"

import React, { useState, useMemo, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { QASettings } from '@/lib/types';
import { findPotentialUntranslatables } from '@/lib/untranslatable-logic';
import { useTmxStore } from '@/hooks/use-tmx-store';
import { getLanguageName } from '@/lib/locale-registry';
import { parsePastedList } from '@/lib/import-export-utils';
import {
  X,
  Plus,
  Trash2,
  Download,
  ArrowUp,
  Eraser,
  Tag,
  RotateCcw,
  Globe,
  FileUp,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface UntranslatableSettingsProps {
  settings: QASettings;
  onChange: (updates: Partial<QASettings>) => void;
}

export const UntranslatableSettings: React.FC<UntranslatableSettingsProps> = ({ settings, onChange }) => {
  const { segments, currentProject, applyLocaleDefaults } = useTmxStore();
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const targetLang = currentProject?.targetLangs[0] || 'en-US';

  const potentialTerms = useMemo(() => {
    if (!showSuggestions) return [];
    return findPotentialUntranslatables(segments, settings);
  }, [showSuggestions, segments, settings]);

  const handleAddTerm = (term: string) => {
    const clean = term.trim();
    if (!clean) return;
    if (settings.untranslatables.includes(clean)) {
      toast({ title: "Term exists", description: `"${clean}" is already in your list.` });
      return;
    }
    onChange({ untranslatables: [...settings.untranslatables, clean] });
    setInputValue('');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const newTerms = parsePastedList(text);
      if (newTerms.length === 0) return;

      const existing = new Set(settings.untranslatables);
      const added: string[] = [];

      newTerms.forEach(t => {
        if (!existing.has(t)) {
          existing.add(t);
          added.push(t);
        }
      });

      if (added.length > 0) {
        onChange({ untranslatables: Array.from(existing) });
        toast({
          title: "Import Successful",
          description: `Added ${added.length} new untranslatable terms.`
        });
      } else {
        toast({ title: "No new terms", description: "All terms in the file are already in your repository." });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Import Failed", description: "Failed to read the text file." });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveTerm = (term: string) => {
    onChange({ untranslatables: settings.untranslatables.filter(t => t !== term) });
  };

  const handleClearAll = () => {
    if (confirm("Clear all untranslatable terms?")) {
      onChange({ untranslatables: [] });
    }
  };

  const handleExport = () => {
    if (settings.untranslatables.length === 0) return;
    const blob = new Blob([settings.untranslatables.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'untranslatable_terms.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4 pt-2">
      <div className="flex items-center justify-between bg-muted/20 p-2 rounded-md border border-border/50">
        <div className="flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">
            Standard: {getLanguageName(targetLang)}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => applyLocaleDefaults(targetLang)}
          className="h-6 text-[9px] gap-1 font-bold uppercase hover:bg-primary/5 text-primary"
        >
          <RotateCcw className="w-3 h-3" /> Reset to Defaults
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Configuration Panel (Left) */}
        <div className="flex-1 space-y-6">
          <SettingItem
            id="checkUntranslatables"
            label="Enable Untranslatable Term Check"
            description="Validate words that should not be translated (e.g., brand names)."
            checked={settings.checkUntranslatables}
            onChange={(v) => onChange({ checkUntranslatables: v })}
          />
          <div className={cn("pl-6 space-y-6 border-l ml-3", !settings.checkUntranslatables && "opacity-40 pointer-events-none")}>
            <div className="space-y-4">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                Validation Scope
              </Label>
              <RadioGroup
                value={settings.untranslatableScope}
                onValueChange={(v: any) => onChange({ untranslatableScope: v })}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="source" id="ut-source" className="scale-75" />
                  <Label htmlFor="ut-source" className="text-xs cursor-pointer">Source</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="target" id="ut-target" className="scale-75" />
                  <Label htmlFor="ut-target" className="text-xs cursor-pointer">Target</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="both" id="ut-both" className="scale-75" />
                  <Label htmlFor="ut-both" className="text-xs cursor-pointer">Both</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-4 border-t pt-4">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                Detection Logic
              </Label>

              <SettingItem
                id="checkUntranslatableCount"
                label="Enforce count parity"
                description="Flag if a term appears more times in source than target."
                checked={settings.checkUntranslatableCount}
                onChange={(v) => onChange({ checkUntranslatableCount: v })}
              />

              <SettingItem
                id="includeTechnical"
                label="Technical Strings"
                description="Recognize IDs like 'Model-123_A'."
                checked={settings.includeTechnical}
                onChange={(v) => onChange({ includeTechnical: v })}
              />

              <SettingItem
                id="includeMixedCase"
                label="Mixed-case Latin"
                description="Include words like 'iPhone' or 'eBay'."
                checked={settings.includeMixedCase}
                onChange={(v) => onChange({ includeMixedCase: v })}
              />

              <SettingItem
                id="includeUpperCase"
                label="Acronyms (ALL CAPS)"
                description="Include terms like 'IEEE' or 'CDMA'."
                checked={settings.includeUpperCase}
                onChange={(v) => onChange({ includeUpperCase: v })}
              />

              <SettingItem
                id="ignoreSpaceTypes"
                label="Normalize whitespace"
                description="Treat non-breaking spaces as regular spaces."
                checked={settings.ignoreSpaceTypes}
                onChange={(v) => onChange({ ignoreSpaceTypes: v })}
              />
            </div>
          </div>
        </div>

        {/* List Management Interface (Right) */}
        <div className="flex-1 flex flex-col min-h-[400px] border rounded-lg bg-muted/5 overflow-hidden">
          <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">Term Repository</span>
              <span className="text-[9px] text-muted-foreground font-medium">{settings.untranslatables.length} Active Protections</span>
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
                title="Import List"
              >
                <FileUp className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="w-7 h-7" onClick={handleExport} title="Download List"><Download className="w-3.5 h-3.5" /></Button>
              <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive" onClick={handleClearAll} title="Clear All"><Eraser className="w-3.5 h-3.5" /></Button>
            </div>
          </div>

          <div className="p-3 border-b bg-background">
            <div className="flex gap-2">
              <Input
                placeholder="Add term or paste list..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTerm(inputValue)}
                className="h-8 text-xs bg-muted/30 border-none"
              />
              <Button size="sm" className="h-8 px-3" onClick={() => handleAddTerm(inputValue)}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="flex flex-wrap gap-2">
              {settings.untranslatables.length === 0 ? (
                <div className="w-full text-center py-12 text-muted-foreground">
                  <Tag className="w-10 h-10 mx-auto opacity-10 mb-2" />
                  <p className="text-[10px] font-medium uppercase italic">No protected terms defined</p>
                </div>
              ) : (
                settings.untranslatables.map(term => (
                  <Badge
                    key={term}
                    variant="secondary"
                    className="gap-1.5 py-1 px-2.5 text-[10px] font-bold tracking-tighter border bg-background hover:bg-muted transition-colors"
                  >
                    {term}
                    <button onClick={() => handleRemoveTerm(term)} className="hover:text-destructive transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Suggestions Section */}
          <div className="border-t bg-primary/5">
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="w-full p-3 flex items-center justify-between hover:bg-primary/10 transition-colors"
            >
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary">
                <Zap className="w-3 h-3 fill-primary" />
                Heuristic Suggestions
              </div>
              <ArrowUp className={cn("w-3 h-3 text-primary transition-transform", !showSuggestions && "rotate-180")} />
            </button>

            {showSuggestions && (
              <ScrollArea className="h-32 p-3 pt-0">
                <div className="flex flex-wrap gap-1.5 pb-2">
                  {potentialTerms.length === 0 ? (
                    <p className="text-[9px] text-muted-foreground italic w-full text-center py-4">Scanning segments for potential terms...</p>
                  ) : (
                    potentialTerms.map(term => (
                      <button
                        key={term}
                        onClick={() => handleAddTerm(term)}
                        className="px-2 py-1 rounded text-[9px] font-bold bg-background border hover:bg-primary/10 hover:border-primary/30 transition-all tracking-tighter"
                      >
                        + {term}
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SettingItem = ({ id, label, description, checked, onChange }: { id: string, label: string, description: string, checked: boolean, onChange: (v: boolean) => void }) => (
  <div className="flex items-start justify-between gap-4">
    <div className="space-y-0.5">
      <Label htmlFor={id} className="text-[11px] font-bold leading-none cursor-pointer">{label}</Label>
      <p className="text-[10px] text-muted-foreground leading-tight">{description}</p>
    </div>
    <Checkbox id={id} checked={checked} onCheckedChange={(v: boolean) => onChange(v)} className="scale-90" />
  </div>
);

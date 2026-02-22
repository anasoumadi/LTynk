"use client"

import React, { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { QASettings, QuotePair } from '@/lib/types';
import { QUOTE_PRESETS, TYPOGRAPHIC_CHARS, getQuotePreset } from '@/lib/quote-presets';
import { Plus, Trash2, Quote, Languages, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuotesSettingsProps {
  settings: QASettings;
  onChange: (updates: Partial<QASettings>) => void;
  targetLang?: string;
}

export const QuotesSettings: React.FC<QuotesSettingsProps> = ({ settings, onChange, targetLang }) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('en-US');

  useEffect(() => {
    if (targetLang && !settings.quoteLocalePreset) {
      const preset = getQuotePreset(targetLang);
      setSelectedPresetId(preset.id);
      onChange({
        quoteLocalePreset: preset.id,
        allowedQuotePairs: preset.pairs,
        allowedApostrophes: preset.apostrophes
      });
    } else if (settings.quoteLocalePreset) {
      setSelectedPresetId(settings.quoteLocalePreset);
    }
  }, [targetLang, settings.quoteLocalePreset, onChange]);

  const handlePresetChange = (id: string) => {
    setSelectedPresetId(id);
    const preset = QUOTE_PRESETS.find(p => p.id === id);
    if (preset) {
      onChange({
        quoteLocalePreset: id,
        allowedQuotePairs: preset.pairs,
        allowedApostrophes: preset.apostrophes
      });
    }
  };

  const addPair = () => {
    const newPairs = [...settings.allowedQuotePairs, { open: '“', close: '”' }];
    onChange({ allowedQuotePairs: newPairs });
  };

  const removePair = (index: number) => {
    const newPairs = settings.allowedQuotePairs.filter((_, i) => i !== index);
    onChange({ allowedQuotePairs: newPairs });
  };

  const updatePair = (index: number, side: 'open' | 'close', val: string) => {
    const newPairs = settings.allowedQuotePairs.map((p, i) => 
      i === index ? { ...p, [side]: val } : p
    );
    onChange({ allowedQuotePairs: newPairs });
  };

  const addApostrophe = () => {
    onChange({ allowedApostrophes: [...settings.allowedApostrophes, '’'] });
  };

  const removeApostrophe = (index: number) => {
    onChange({ allowedApostrophes: settings.allowedApostrophes.filter((_, i) => i !== index) });
  };

  const updateApostrophe = (index: number, val: string) => {
    const newApos = settings.allowedApostrophes.map((a, i) => i === index ? val : a);
    onChange({ allowedApostrophes: newApos });
  };

  return (
    <div className="flex flex-col space-y-8 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-muted/20 p-4 rounded-lg border border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Quote className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest">Quotes & Apostrophes</h4>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Define Typographic Standards</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Label className="text-[10px] font-bold uppercase text-muted-foreground">Target Preset:</Label>
          <Select value={selectedPresetId} onValueChange={handlePresetChange}>
            <SelectTrigger className="h-8 w-48 text-[10px] font-bold uppercase bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUOTE_PRESETS.map(p => (
                <SelectItem key={p.id} value={p.id} className="text-[10px] font-bold uppercase">{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Side: Rule Checklist */}
        <div className="flex-1 space-y-6">
          <div className="space-y-4">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
              Auditing Rules
            </Label>

            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="checkQuotes" className="text-xs font-bold leading-none cursor-pointer">Quotation marks</Label>
                <p className="text-[10px] text-muted-foreground leading-tight">Validate opening/closing pair balance and type.</p>
              </div>
              <Checkbox 
                id="checkQuotes" 
                checked={settings.checkQuotes} 
                onCheckedChange={(v: boolean) => onChange({ checkQuotes: v })} 
                className="scale-90"
              />
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="checkApostrophes" className="text-xs font-bold leading-none cursor-pointer">Apostrophes</Label>
                <p className="text-[10px] text-muted-foreground leading-tight">Enforce correct typographic apostrophe usage.</p>
              </div>
              <Checkbox 
                id="checkApostrophes" 
                checked={settings.checkApostrophes} 
                onCheckedChange={(v: boolean) => onChange({ checkApostrophes: v })} 
                className="scale-90"
              />
            </div>
          </div>
        </div>

        {/* Right Side: Dynamic Builder */}
        <div className="flex-1 flex flex-col border rounded-lg bg-muted/5 overflow-hidden">
          <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">Character Authorization Matrix</span>
            <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter bg-background px-2 py-0.5 rounded border">
              Active Validation Characters
            </div>
          </div>

          <div className="p-4 space-y-6">
            {/* Quote Pairs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Approved Quotation Pairs</Label>
                <Button variant="ghost" size="sm" onClick={addPair} className="h-6 text-[9px] gap-1 uppercase font-bold text-primary">
                  <Plus className="w-3 h-3" /> Add Pair
                </Button>
              </div>
              <div className="space-y-2">
                {settings.allowedQuotePairs.map((pair, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <CharSelector 
                        value={pair.open} 
                        onChange={(v) => updatePair(idx, 'open', v)} 
                        placeholder="Open"
                      />
                      <CharSelector 
                        value={pair.close} 
                        onChange={(v) => updatePair(idx, 'close', v)} 
                        placeholder="Close"
                      />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removePair(idx)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Apostrophes */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Approved Apostrophes</Label>
                <Button variant="ghost" size="sm" onClick={addApostrophe} className="h-6 text-[9px] gap-1 uppercase font-bold text-primary">
                  <Plus className="w-3 h-3" /> Add Mark
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {settings.allowedApostrophes.map((apos, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <div className="flex-1">
                      <CharSelector 
                        value={apos} 
                        onChange={(v) => updateApostrophe(idx, v)} 
                        placeholder="Mark"
                      />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeApostrophe(idx)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-3 bg-primary/5 border-t flex items-start gap-3">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-[9px] text-muted-foreground leading-tight italic">
              The engine will flag any quotation mark or apostrophe used in the target that is not present in the authorization matrix above.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const CharSelector = ({ value, onChange, placeholder }: { value: string, onChange: (v: string) => void, placeholder: string }) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className="h-8 text-xs bg-background">
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent>
      {TYPOGRAPHIC_CHARS.map(c => (
        <SelectItem key={c.char} value={c.char} className="text-[10px]">
          <div className="flex items-center justify-between w-48 gap-4">
            <span className="font-bold text-lg text-primary">{c.char}</span>
            <span className="text-[9px] text-muted-foreground font-mono">Alt+{c.code}</span>
            <span className="text-[8px] truncate max-w-[100px] text-muted-foreground">{c.name}</span>
          </div>
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

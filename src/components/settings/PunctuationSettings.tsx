
"use client"

import React, { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { QASettings, PunctuationGrid } from '@/lib/types';
import { PUNCTUATION_PRESETS, getPunctuationPreset } from '@/lib/punctuation-presets';
import { cn } from '@/lib/utils';
import { Info, Settings2, Languages } from 'lucide-react';

interface PunctuationSettingsProps {
  settings: QASettings;
  onChange: (updates: Partial<QASettings>) => void;
  targetLang?: string;
}

export const PunctuationSettings: React.FC<PunctuationSettingsProps> = ({ settings, onChange, targetLang }) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('en');

  useEffect(() => {
    if (targetLang) {
      const preset = getPunctuationPreset(targetLang);
      setSelectedPresetId(preset.id);
    }
  }, [targetLang]);

  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = PUNCTUATION_PRESETS.find(p => p.id === presetId);
    if (preset) {
      onChange({
        punctuationGrid: preset.punctuationGrid,
        specialSignsGrid: preset.specialSignsGrid
      });
    }
  };

  const updateGrid = (gridKey: 'punctuationGrid' | 'specialSignsGrid', field: keyof PunctuationGrid, value: string) => {
    const currentGrid = settings[gridKey];
    onChange({ [gridKey]: { ...currentGrid, [field]: value } });
  };

  return (
    <div className="flex flex-col space-y-8 pt-4">
      {/* Adaptive Header */}
      <div className="flex items-center justify-between bg-muted/20 p-4 rounded-lg border border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Languages className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest">Typographic Standards</h4>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Presets adapt rules to target language</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Label className="text-[10px] font-bold uppercase text-muted-foreground">Target Preset:</Label>
          <Select value={selectedPresetId} onValueChange={handlePresetChange}>
            <SelectTrigger className="h-8 w-40 text-[10px] font-bold uppercase bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PUNCTUATION_PRESETS.map(p => (
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
              Global Constraints
            </Label>

            <PuncOption 
              id="checkMultipleSpaces" 
              label="Multiple spacing" 
              description="Flag consecutive whitespaces."
              checked={settings.checkMultipleSpaces}
              onChange={(v) => onChange({ checkMultipleSpaces: v })}
            >
              <SubOption id="ignoreSourceFormatting" label="Ignore source formatting" checked={settings.ignoreSourceFormatting} onChange={(v) => onChange({ ignoreSourceFormatting: v })} />
            </PuncOption>

            <PuncOption 
              id="checkEndPunctuation" 
              label="End punctuation" 
              description="Match ending markers from source."
              checked={settings.checkEndPunctuation}
              onChange={(v) => onChange({ checkEndPunctuation: v })}
            >
              <SubOption id="ignoreQuotesBracketsEnd" label="Ignore quotation marks and brackets" checked={settings.ignoreQuotesBracketsEnd} onChange={(v) => onChange({ ignoreQuotesBracketsEnd: v })} />
            </PuncOption>

            <PuncOption 
              id="checkDoublePunctuation" 
              label="Double punctuation" 
              description="Find repeated marks like '!!' or '??'."
              checked={settings.checkDoublePunctuation}
              onChange={(v) => onChange({ checkDoublePunctuation: v })}
            >
              <SubOption id="doublePuncAsInSource" label="Allow as in source" checked={settings.doublePuncAsInSource} onChange={(v) => onChange({ doublePuncAsInSource: v })} />
            </PuncOption>

            <PuncOption 
              id="checkBrackets" 
              label="Bracket and Quote Matching" 
              description="Verify nesting of (), [], {}, etc."
              checked={settings.checkBrackets}
              onChange={(v) => onChange({ checkBrackets: v })}
            >
              <SubOption id="ignoreMoreLessThan" label="Ignore '&lt;' and '&gt;'" checked={settings.ignoreMoreLessThanBrackets} onChange={(v) => onChange({ ignoreMoreLessThanBrackets: v })} />
              <SubOption id="ignoreUnmatchedSource" label="Ignore if unmatched in source" checked={settings.ignoreUnmatchedBracketsSource} onChange={(v) => onChange({ ignoreUnmatchedBracketsSource: v })} />
            </PuncOption>

            <PuncOption 
              id="checkStartEndSpaces" 
              label="Start and end spaces" 
              description="Verify leading/trailing space parity."
              checked={settings.checkStartEndSpaces}
              onChange={(v) => onChange({ checkStartEndSpaces: v })}
            />
          </div>
        </div>

        {/* Right Side: Punctuation Grid */}
        <div className="flex-1 flex flex-col border rounded-lg bg-muted/5 overflow-hidden">
          <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings2 className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">Typographic Matrix</span>
            </div>
            <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter bg-background px-2 py-0.5 rounded border">
              Manual Override Active
            </div>
          </div>

          <div className="p-0 overflow-x-auto">
            <table className="w-full text-[10px] border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b">
                  <th className="p-2 text-left font-bold uppercase text-muted-foreground w-1/3">Rule</th>
                  <th className="p-2 text-left font-bold uppercase text-primary border-l border-r">Punctuation</th>
                  <th className="p-2 text-left font-bold uppercase text-accent">Special Signs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                <GridRow label="Space before" field="spaceBefore" settings={settings} updateGrid={updateGrid} />
                <GridRow label="Space after" field="spaceAfter" settings={settings} updateGrid={updateGrid} />
                <GridRow label="No space before" field="noSpaceBefore" settings={settings} updateGrid={updateGrid} />
                <GridRow label="No space after" field="noSpaceAfter" settings={settings} updateGrid={updateGrid} />
                <GridRow label="NBSP before" field="nbspBefore" settings={settings} updateGrid={updateGrid} />
                <GridRow label="NBSP after" field="nbspAfter" settings={settings} updateGrid={updateGrid} />
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-primary/5 border-t flex items-start gap-3">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-[9px] text-muted-foreground leading-tight italic">
              Enter multiple characters without separators. Each character in the string will trigger its respective whitespace rule during the audit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const PuncOption = ({ id, label, description, checked, onChange, children }: { id: string, label: string, description: string, checked: boolean, onChange: (v: boolean) => void, children?: React.ReactNode }) => (
  <div className="space-y-2">
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-0.5">
        <Label htmlFor={id} className="text-xs font-bold leading-none cursor-pointer">{label}</Label>
        <p className="text-[10px] text-muted-foreground leading-tight">{description}</p>
      </div>
      <Checkbox id={id} checked={checked} onCheckedChange={onChange} className="scale-90" />
    </div>
    {children && checked && (
      <div className="pl-6 space-y-2 animate-in fade-in slide-in-from-left-1 duration-200">
        {children}
      </div>
    )}
  </div>
);

const SubOption = ({ id, label, checked, onChange }: { id: string, label: string, checked: boolean, onChange: (v: boolean) => void }) => (
  <div className="flex items-center space-x-2">
    <Checkbox id={id} checked={checked} onCheckedChange={onChange} className="scale-75" />
    <Label htmlFor={id} className="text-[10px] font-medium leading-none cursor-pointer text-muted-foreground hover:text-foreground">{label}</Label>
  </div>
);

const GridRow = ({ label, field, settings, updateGrid }: { label: string, field: keyof PunctuationGrid, settings: QASettings, updateGrid: (g: any, f: any, v: string) => void }) => (
  <tr className="hover:bg-muted/10 transition-colors">
    <td className="p-2 font-bold text-muted-foreground whitespace-nowrap bg-muted/5">{label}</td>
    <td className="p-1 border-l border-r">
      <Input 
        value={settings.punctuationGrid[field]} 
        onChange={(e) => updateGrid('punctuationGrid', field, e.target.value)}
        className="h-7 text-xs bg-transparent border-none focus-visible:ring-0 px-2 font-mono"
        placeholder="..."
      />
    </td>
    <td className="p-1">
      <Input 
        value={settings.specialSignsGrid[field]} 
        onChange={(e) => updateGrid('specialSignsGrid', field, e.target.value)}
        className="h-7 text-xs bg-transparent border-none focus-visible:ring-0 px-2 font-mono"
        placeholder="..."
      />
    </td>
  </tr>
);

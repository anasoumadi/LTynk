
"use client"

import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { QASettings } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useTmxStore } from '@/hooks/use-tmx-store';
import { getLanguageName } from '@/lib/locale-registry';
import { RotateCcw, Globe } from 'lucide-react';

interface OmissionSettingsProps {
  settings: QASettings;
  onChange: (updates: Partial<QASettings>) => void;
}

export const OmissionSettings: React.FC<OmissionSettingsProps> = ({ settings, onChange }) => {
  const { currentProject, applyLocaleDefaults } = useTmxStore();
  const targetLang = currentProject?.targetLangs[0] || 'en-US';

  return (
    <div className="space-y-6 pt-2">
      <div className="flex items-center justify-between mb-4 bg-muted/20 p-2 rounded-md border border-border/50">
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

      {/* Empty Segments */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <Label htmlFor="checkEmpty" className="text-xs font-bold">Empty Segments</Label>
          <p className="text-[10px] text-muted-foreground leading-tight">
            Flag segments where the target is missing or contains only whitespace.
          </p>
        </div>
        <Switch 
          id="checkEmpty" 
          checked={settings.checkEmpty} 
          onCheckedChange={(v) => onChange({ checkEmpty: v })} 
          className="scale-75 origin-right" 
        />
      </div>

      {/* Same Target and Source */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor="checkSameAsSource" className="text-xs font-bold">Same Target and Source</Label>
            <p className="text-[10px] text-muted-foreground leading-tight">
              Flag if the target exactly matches the source (after stripping tags).
            </p>
          </div>
          <Switch 
            id="checkSameAsSource" 
            checked={settings.checkSameAsSource} 
            onCheckedChange={(v) => onChange({ checkSameAsSource: v })} 
            className="scale-75 origin-right" 
          />
        </div>

        {/* Sub-options for Same as Source */}
        <div className={cn("pl-6 space-y-3 transition-opacity duration-200", !settings.checkSameAsSource && "opacity-40 pointer-events-none")}>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="ignoreMathOnly" 
              checked={settings.ignoreMathOnly} 
              onCheckedChange={(v: boolean) => onChange({ ignoreMathOnly: v })}
              className="scale-75"
            />
            <Label htmlFor="ignoreMathOnly" className="text-[10px] font-medium leading-none cursor-pointer">
              Ignore segments with numbers and math signs only
            </Label>
          </div>
        </div>
      </div>

      {/* Partially Translated */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor="checkPartialTranslation" className="text-xs font-bold">Partially Translated Segments</Label>
            <p className="text-[10px] text-muted-foreground leading-tight">
              Heuristic check for untranslated source words remaining in the target.
            </p>
          </div>
          <Switch 
            id="checkPartialTranslation" 
            checked={settings.checkPartialTranslation} 
            onCheckedChange={(v) => onChange({ checkPartialTranslation: v })} 
            className="scale-75 origin-right" 
          />
        </div>

        {/* Sub-options for Partial */}
        <div className={cn("pl-6 space-y-4 transition-opacity duration-200", !settings.checkPartialTranslation && "opacity-40 pointer-events-none")}>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-2">
              Minimum number of words
              <span className="text-primary font-mono">{settings.minWordsPartial}</span>
            </Label>
            <Input 
              type="number" 
              value={settings.minWordsPartial}
              onChange={(e) => onChange({ minWordsPartial: parseInt(e.target.value) || 0 })}
              className="h-7 w-20 text-[10px] bg-muted/30 border-none"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="ignoreWordsWithNumbersHyphens" 
              checked={settings.ignoreWordsWithNumbersHyphens} 
              onCheckedChange={(v: boolean) => onChange({ ignoreWordsWithNumbersHyphens: v })}
              className="scale-75"
            />
            <Label htmlFor="ignoreWordsWithNumbersHyphens" className="text-[10px] font-medium leading-none cursor-pointer">
              Ignore words with numbers and hyphens (Model-123)
            </Label>
          </div>
        </div>
      </div>

      {/* Sentence Count */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <Label htmlFor="checkSentenceCount" className="text-xs font-bold">Sentence Count Mismatch</Label>
          <p className="text-[10px] text-muted-foreground leading-tight">
            Verify parity in sentence markers (.!?。？) between source and target.
          </p>
        </div>
        <Switch 
          id="checkSentenceCount" 
          checked={settings.checkSentenceCount} 
          onCheckedChange={(v) => onChange({ checkSentenceCount: v })} 
          className="scale-75 origin-right" 
        />
      </div>
    </div>
  );
};

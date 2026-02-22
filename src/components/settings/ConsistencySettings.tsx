"use client"

import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { QASettings, ConsistencyRuleOptions } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';

interface ConsistencySettingsProps {
  settings: QASettings;
  onChange: (updates: Partial<QASettings>) => void;
}

export const ConsistencySettings: React.FC<ConsistencySettingsProps> = ({ settings, onChange }) => {
  const updateRule = (key: 'targetInconsistencyOptions' | 'sourceInconsistencyOptions', updates: Partial<ConsistencyRuleOptions>) => {
    onChange({ [key]: { ...settings[key], ...updates } });
  };

  return (
    <div className="flex flex-col space-y-8 pt-4">
      <div className="p-4 bg-primary/5 border rounded-lg flex gap-3">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-[10px] text-muted-foreground leading-relaxed italic">
          Consistency checks perform a full-file scan to detect variations in translation across the entire project. 
          Normalization options allow you to collapse conceptual duplicates (e.g., ignoring case or punctuation) before grouping.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Left Column: Target Inconsistency */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Target Inconsistency</h4>
              <div className="h-px flex-1 bg-border/40" />
            </div>
            
            <OptionItem 
              id="targetEnabled" 
              label="Check target inconsistency" 
              description="Flag if same source has multiple translations."
              checked={settings.targetInconsistencyOptions.enabled}
              onChange={(v) => updateRule('targetInconsistencyOptions', { enabled: v })}
            />

            <div className={cn("pl-6 space-y-3 transition-opacity", !settings.targetInconsistencyOptions.enabled && "opacity-40 pointer-events-none")}>
              <SubOptionItem id="t-st" label="Ignore space types" checked={settings.targetInconsistencyOptions.ignoreSpaceTypes} onChange={(v) => updateRule('targetInconsistencyOptions', { ignoreSpaceTypes: v })} />
              <SubOptionItem id="t-ic" label="Ignore case" checked={settings.targetInconsistencyOptions.ignoreCase} onChange={(v) => updateRule('targetInconsistencyOptions', { ignoreCase: v })} />
              <SubOptionItem id="t-wt" label="Check without tags" checked={settings.targetInconsistencyOptions.checkWithoutTags} onChange={(v) => updateRule('targetInconsistencyOptions', { checkWithoutTags: v })} />
              <SubOptionItem id="t-in" label="Ignore numbers" checked={settings.targetInconsistencyOptions.ignoreNumbers} onChange={(v) => updateRule('targetInconsistencyOptions', { ignoreNumbers: v })} />
              <SubOptionItem id="t-pe" label="Ignore plural form (English)" checked={settings.targetInconsistencyOptions.ignorePluralEnglish} onChange={(v) => updateRule('targetInconsistencyOptions', { ignorePluralEnglish: v })} />
              <SubOptionItem id="t-ip" label="Ignore punctuation and spaces" checked={settings.targetInconsistencyOptions.ignorePunctuation} onChange={(v) => updateRule('targetInconsistencyOptions', { ignorePunctuation: v })} />
            </div>
          </div>
        </div>

        {/* Right Column: Source Inconsistency */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Source Inconsistency</h4>
              <div className="h-px flex-1 bg-border/40" />
            </div>

            <OptionItem 
              id="sourceEnabled" 
              label="Check source inconsistency" 
              description="Flag if different sources have same translation."
              checked={settings.sourceInconsistencyOptions.enabled}
              onChange={(v) => updateRule('sourceInconsistencyOptions', { enabled: v })}
            />

            <div className={cn("pl-6 space-y-3 transition-opacity", !settings.sourceInconsistencyOptions.enabled && "opacity-40 pointer-events-none")}>
              <SubOptionItem id="s-st" label="Ignore space types" checked={settings.sourceInconsistencyOptions.ignoreSpaceTypes} onChange={(v) => updateRule('sourceInconsistencyOptions', { ignoreSpaceTypes: v })} />
              <SubOptionItem id="s-ic" label="Ignore case" checked={settings.sourceInconsistencyOptions.ignoreCase} onChange={(v) => updateRule('sourceInconsistencyOptions', { ignoreCase: v })} />
              <SubOptionItem id="s-wt" label="Check without tags" checked={settings.sourceInconsistencyOptions.checkWithoutTags} onChange={(v) => updateRule('sourceInconsistencyOptions', { checkWithoutTags: v })} />
              <SubOptionItem id="s-in" label="Ignore numbers" checked={settings.sourceInconsistencyOptions.ignoreNumbers} onChange={(v) => updateRule('sourceInconsistencyOptions', { ignoreNumbers: v })} />
              <SubOptionItem id="s-pe" label="Ignore plural form (English)" checked={settings.sourceInconsistencyOptions.ignorePluralEnglish} onChange={(v) => updateRule('sourceInconsistencyOptions', { ignorePluralEnglish: v })} />
              <SubOptionItem id="s-ip" label="Ignore punctuation and spaces" checked={settings.sourceInconsistencyOptions.ignorePunctuation} onChange={(v) => updateRule('sourceInconsistencyOptions', { ignorePunctuation: v })} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const OptionItem = ({ id, label, description, checked, onChange }: { id: string, label: string, description: string, checked: boolean, onChange: (v: boolean) => void }) => (
  <div className="flex items-start justify-between gap-4">
    <div className="space-y-0.5">
      <Label htmlFor={id} className="text-xs font-bold leading-none cursor-pointer">{label}</Label>
      <p className="text-[10px] text-muted-foreground leading-tight">{description}</p>
    </div>
    <Checkbox id={id} checked={checked} onCheckedChange={onChange} className="scale-90" />
  </div>
);

const SubOptionItem = ({ id, label, checked, onChange }: { id: string, label: string, checked: boolean, onChange: (v: boolean) => void }) => (
  <div className="flex items-center space-x-2">
    <Checkbox id={id} checked={checked} onCheckedChange={onChange} className="scale-75" />
    <Label htmlFor={id} className="text-[10px] font-medium leading-none cursor-pointer text-muted-foreground hover:text-foreground">{label}</Label>
  </div>
);

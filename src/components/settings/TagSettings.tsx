
"use client"

import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { QASettings } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TagSettingsProps {
  settings: QASettings;
  onChange: (updates: Partial<QASettings>) => void;
}

export const TagSettings: React.FC<TagSettingsProps> = ({ settings, onChange }) => {
  return (
    <div className="space-y-6 pt-2">
      <div className="space-y-4">
        <TagOption 
          id="checkTags" 
          label="Inconsistent tags in source and target" 
          description="Flag missing, extra, or mismatched tags."
          checked={settings.checkTags}
          onChange={(v) => onChange({ checkTags: v })}
        />

        <TagOption 
          id="checkTagSpacing" 
          label="Spaces around tags" 
          description="Flag illegal whitespace inside or immediately adjacent to tags."
          checked={settings.checkTagSpacing}
          onChange={(v) => onChange({ checkTagSpacing: v })}
        />

        <TagOption 
          id="checkTagSpacingInconsistency" 
          label="Inconsistent spaces around tags in source and target" 
          description="Ensure target preserves source tag spacing patterns."
          checked={settings.checkTagSpacingInconsistency}
          onChange={(v) => onChange({ checkTagSpacingInconsistency: v })}
        />

        <TagOption 
          id="checkEntities" 
          label="Entities" 
          description="Validate XML/HTML entities like &amp;amp;, &amp;lt;, &amp;gt;."
          checked={settings.checkEntities}
          onChange={(v) => onChange({ checkEntities: v })}
        />

        <TagOption 
          id="checkTagOrder" 
          label="Tag order" 
          description="Ensure target tags follow the same relative order as source."
          checked={settings.checkTagOrder}
          onChange={(v) => onChange({ checkTagOrder: v })}
        />
      </div>
    </div>
  );
};

const TagOption = ({ id, label, description, checked, onChange }: { id: string, label: string, description: string, checked: boolean, onChange: (v: boolean) => void }) => (
  <div className="flex items-start justify-between gap-4">
    <div className="space-y-0.5">
      <Label htmlFor={id} className="text-xs font-bold leading-none cursor-pointer">{label}</Label>
      <p className="text-[10px] text-muted-foreground leading-tight">{description}</p>
    </div>
    <Checkbox id={id} checked={checked} onCheckedChange={onChange} className="scale-90" />
  </div>
);

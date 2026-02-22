
"use client"

import React, { useEffect, useState, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { QASettings, DigitToTextEntry } from '@/lib/types';
import { NUMBER_PRESETS, getNumberPreset } from '@/lib/number-presets';
import { 
  Plus, 
  Trash2, 
  Search, 
  Hash, 
  ArrowRightLeft, 
  Settings2,
  AlertCircle
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface NumberSettingsProps {
  settings: QASettings;
  onChange: (updates: Partial<QASettings>) => void;
  targetLang?: string;
}

export const NumberSettings: React.FC<NumberSettingsProps> = ({ settings, onChange, targetLang }) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('en-US');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (targetLang && !settings.numberLocalePreset) {
      const preset = getNumberPreset(targetLang);
      setSelectedPresetId(preset.id);
      onChange({
        numberLocalePreset: preset.id,
        decimalSeparator: preset.decimalSeparator,
        thousandSeparator: preset.thousandSeparator,
        preferredRangeSymbol: preset.rangeSymbol,
        rangeSpacing: preset.rangeSpacing,
        preferredNumberSign: preset.numberSign
      });
    } else if (settings.numberLocalePreset) {
      setSelectedPresetId(settings.numberLocalePreset);
    }
  }, [targetLang, settings.numberLocalePreset, onChange]);

  const handlePresetChange = (id: string) => {
    setSelectedPresetId(id);
    const preset = NUMBER_PRESETS.find(p => p.id === id);
    if (preset) {
      onChange({
        numberLocalePreset: id,
        decimalSeparator: preset.decimalSeparator,
        thousandSeparator: preset.thousandSeparator,
        preferredRangeSymbol: preset.rangeSymbol,
        rangeSpacing: preset.rangeSpacing,
        preferredNumberSign: preset.numberSign
      });
    }
  };

  const filteredDigitMap = useMemo(() => {
    if (!searchQuery.trim()) return settings.digitToTextMap;
    return settings.digitToTextMap.filter(e => 
      e.digit.toString().includes(searchQuery) || 
      e.forms.some(f => f.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [settings.digitToTextMap, searchQuery]);

  const addRow = () => {
    const newEntry: DigitToTextEntry = { id: crypto.randomUUID(), digit: 0, forms: [] };
    onChange({ digitToTextMap: [...settings.digitToTextMap, newEntry] });
  };

  const deleteRows = () => {
    if (selectedRows.size === 0) return;
    onChange({ digitToTextMap: settings.digitToTextMap.filter(e => !selectedRows.has(e.id)) });
    setSelectedRows(new Set());
    toast({ title: "Mappings Deleted" });
  };

  const updateEntry = (id: string, field: keyof DigitToTextEntry, val: any) => {
    const updated = settings.digitToTextMap.map(e => e.id === id ? { ...e, [field]: val } : e);
    onChange({ digitToTextMap: updated });
  };

  return (
    <div className="flex flex-col space-y-8 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-muted/20 p-4 rounded-lg border border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Hash className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest">Numerical Integrity</h4>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Locale standards and range validation</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Label className="text-[10px] font-bold uppercase text-muted-foreground">Target Preset:</Label>
          <Select value={selectedPresetId} onValueChange={handlePresetChange}>
            <SelectTrigger className="h-8 w-40 text-[10px] font-bold uppercase bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NUMBER_PRESETS.map(p => (
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
            <Label className="text-[10px] font-bold uppercase tracking-widest text-primary">Auditing Rules</Label>

            <NumberOption 
              id="checkNumbersAndRanges" 
              label="Inconsistent numbers" 
              description="Flag missing or mismatching numerical sequences."
              checked={settings.checkNumbersAndRanges}
              onChange={(v) => onChange({ checkNumbersAndRanges: v })}
            >
              <SubCheck id="digitToText" label="Digit to text conversion" checked={settings.digitToTextEnabled} onChange={(v) => onChange({ digitToTextEnabled: v })} />
              <SubCheck id="skipImperial" label="Skip imperial units in parentheses" checked={settings.skipImperialInParens} onChange={(v) => onChange({ skipImperialInParens: v })} />
              <SubCheck id="omitZeros" label="Omit start and end zeros (.5 vs 0.5)" checked={settings.omitStartEndZeros} onChange={(v) => onChange({ omitStartEndZeros: v })} />
            </NumberOption>

            <NumberOption 
              id="numberFormatting" 
              label="Number formatting" 
              description="Validate thousand and decimal separators."
              checked={settings.numberFormattingEnabled}
              onChange={(v) => onChange({ numberFormattingEnabled: v })}
            >
              <SubCheck id="strictSpacing" label="Strict grouping spacing (NBSP)" checked={settings.strictNumberSpacing} onChange={(v) => onChange({ strictNumberSpacing: v })} />
              <SubCheck id="allowZeros" label="Allow zeros ahead of whole numbers" checked={settings.allowLeadingZeros} onChange={(v) => onChange({ allowLeadingZeros: v })} />
            </NumberOption>

            <div className="space-y-3 pt-2 border-t">
              <NumberOption 
                id="checkRanges" 
                label="Numerical Ranges" 
                description="Verify consistency of spans (e.g. 10-20)."
                checked={settings.checkRanges}
                onChange={(v) => onChange({ checkRanges: v })}
              />
              <NumberOption 
                id="checkNumbersOrder" 
                label="Numbers order" 
                description="Flag if numerical sequence sequence is reversed."
                checked={settings.checkNumbersOrder}
                onChange={(v) => onChange({ checkNumbersOrder: v })}
              />
            </div>
          </div>
        </div>

        {/* Right Side: Matrix & Table */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Digit to Text Map */}
          <div className="flex flex-col border rounded-lg bg-muted/5 overflow-hidden">
            <div className="p-3 border-b bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">Digit to Text Dictionary</span>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={addRow}><Plus className="w-3.5 h-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={deleteRows}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
            <div className="p-2 border-b bg-background">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <Input placeholder="Search mappings..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-7 pl-7 text-[10px] bg-muted/30 border-none" />
              </div>
            </div>
            <ScrollArea className="h-40">
              <Table className="text-[10px]">
                <TableHeader className="bg-muted/30 sticky top-0 z-10"><TableRow className="h-8 hover:bg-transparent"><TableHead className="w-8 p-0 text-center"></TableHead><TableHead className="font-bold uppercase h-8 py-0">Digit</TableHead><TableHead className="font-bold uppercase h-8 py-0">Target Forms (comma-separated)</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filteredDigitMap.length === 0 ? (<TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground italic">No mappings defined.</TableCell></TableRow>) : (
                    filteredDigitMap.map(entry => (
                      <TableRow key={entry.id} className={cn("h-8 group", selectedRows.has(entry.id) && "bg-primary/5")}>
                        <TableCell className="p-0 text-center"><Checkbox checked={selectedRows.has(entry.id)} onCheckedChange={() => { const s = new Set(selectedRows); if (s.has(entry.id)) s.delete(entry.id); else s.add(entry.id); setSelectedRows(s); }} className="scale-75" /></TableCell>
                        <TableCell className="p-1"><Input type="number" value={entry.digit} onChange={(e) => updateEntry(entry.id, 'digit', parseInt(e.target.value))} className="h-6 w-12 text-[10px] bg-transparent border-none font-bold" /></TableCell>
                        <TableCell className="p-1"><Input value={entry.forms.join(', ')} onChange={(e) => updateEntry(entry.id, 'forms', e.target.value.split(',').map(s => s.trim()))} className="h-6 text-[10px] bg-transparent border-none" /></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>

          {/* Formats Grid */}
          <div className="p-4 border rounded-lg bg-muted/5 space-y-6">
            <h5 className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2"><Settings2 className="w-3.5 h-3.5" /> Formatting Symbols</h5>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Decimal Separator</Label>
                <Select value={settings.decimalSeparator} onValueChange={(v: any) => onChange({ decimalSeparator: v })}>
                  <SelectTrigger className="h-8 text-[10px] bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dot" className="text-[10px]">Dot (.)</SelectItem>
                    <SelectItem value="comma" className="text-[10px]">Comma (,)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Digit Grouping</Label>
                <Select value={settings.thousandSeparator} onValueChange={(v: any) => onChange({ thousandSeparator: v })}>
                  <SelectTrigger className="h-8 text-[10px] bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="space" className="text-[10px]">Space (1 000)</SelectItem>
                    <SelectItem value="nbsp" className="text-[10px]">NBSP (1&nbsp;000)</SelectItem>
                    <SelectItem value="comma" className="text-[10px]">Comma (1,000)</SelectItem>
                    <SelectItem value="dot" className="text-[10px]">Dot (1.000)</SelectItem>
                    <SelectItem value="none" className="text-[10px]">None (1000)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-4 border-t space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Range Symbol</Label>
                  <p className="text-[9px] text-muted-foreground">Preferred span character</p>
                </div>
                <Select value={settings.preferredRangeSymbol} onValueChange={(v) => onChange({ preferredRangeSymbol: v })}>
                  <SelectTrigger className="h-8 w-24 text-[10px] bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-">- (Hyphen)</SelectItem>
                    <SelectItem value="–">– (En-dash)</SelectItem>
                    <SelectItem value="à">à (French)</SelectItem>
                    <SelectItem value="~">~ (Tilde)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <RadioGroup value={settings.rangeSpacing} onValueChange={(v: any) => onChange({ rangeSpacing: v })} className="flex gap-4">
                <div className="flex items-center space-x-2"><RadioGroupItem value="space" id="r-space" className="scale-75" /><Label htmlFor="r-space" className="text-[10px]">1 – 3</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="no-space" id="r-nospace" className="scale-75" /><Label htmlFor="r-nospace" className="text-[10px]">1–3</Label></div>
              </RadioGroup>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const NumberOption = ({ id, label, description, checked, onChange, children }: { id: string, label: string, description: string, checked: boolean, onChange: (v: boolean) => void, children?: React.ReactNode }) => (
  <div className="space-y-2">
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-0.5"><Label htmlFor={id} className="text-xs font-bold cursor-pointer">{label}</Label><p className="text-[10px] text-muted-foreground leading-tight">{description}</p></div>
      <Checkbox id={id} checked={checked} onCheckedChange={onChange} className="scale-90" />
    </div>
    {children && checked && <div className="pl-6 space-y-2 animate-in fade-in slide-in-from-left-1 duration-200">{children}</div>}
  </div>
);

const SubCheck = ({ id, label, checked, onChange }: { id: string, label: string, checked: boolean, onChange: (v: boolean) => void }) => (
  <div className="flex items-center space-x-2">
    <Checkbox id={id} checked={checked} onCheckedChange={onChange} className="scale-75" />
    <Label htmlFor={id} className="text-[10px] font-medium text-muted-foreground hover:text-foreground cursor-pointer">{label}</Label>
  </div>
);


"use client"

import React, { useEffect, useState, useMemo, useRef } from 'react';
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
import { QASettings, MeasurementUnit } from '@/lib/types';
import { UNIT_PRESETS, getUnitPreset } from '@/lib/unit-presets';
import { 
  Plus, 
  Trash2, 
  Search, 
  Upload, 
  Settings2, 
  Scale, 
  ArrowUp,
  Info,
  FileUp
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface MeasurementSettingsProps {
  settings: QASettings;
  onChange: (updates: Partial<QASettings>) => void;
  targetLang?: string;
}

export const MeasurementSettings: React.FC<MeasurementSettingsProps> = ({ settings, onChange, targetLang }) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('en');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (targetLang) {
      const preset = getUnitPreset(targetLang);
      setSelectedPresetId(preset.id);
    }
  }, [targetLang]);

  const handlePresetChange = (id: string) => {
    setSelectedPresetId(id);
    const preset = UNIT_PRESETS.find(p => p.id === id);
    if (preset) {
      onChange({
        measurementLocalePreset: id,
        measurementUnits: preset.units.map(u => ({ id: crypto.randomUUID(), ...u })),
        measurementSpacing: preset.spacing,
        temperatureSpacing: preset.tempSpacing,
        measurementRequireNbsp: preset.requireNbsp
      });
    }
  };

  const filteredUnits = useMemo(() => {
    if (!searchQuery.trim()) return settings.measurementUnits;
    return settings.measurementUnits.filter(u => 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.targetUnit.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [settings.measurementUnits, searchQuery]);

  const addRow = () => {
    const newUnit: MeasurementUnit = { id: crypto.randomUUID(), name: 'New Unit', targetUnit: 'u' };
    onChange({ measurementUnits: [...settings.measurementUnits, newUnit] });
  };

  const deleteRows = () => {
    if (selectedRows.size === 0) return;
    const newUnits = settings.measurementUnits.filter(u => !selectedRows.has(u.id));
    onChange({ measurementUnits: newUnits });
    setSelectedRows(new Set());
    toast({ title: "Units Deleted", description: `Removed ${selectedRows.size} unit(s).` });
  };

  const updateUnit = (id: string, field: keyof MeasurementUnit, val: string) => {
    const newUnits = settings.measurementUnits.map(u => 
      u.id === id ? { ...u, [field]: val } : u
    );
    onChange({ measurementUnits: newUnits });
  };

  const toggleRow = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedRows(newSelected);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      if (rows.length === 0) {
        toast({ variant: "destructive", title: "Import Error", description: "The Excel file appears to be empty." });
        return;
      }

      const newUnits: MeasurementUnit[] = [];
      const existingNames = new Set(settings.measurementUnits.map(u => u.name.toLowerCase()));

      // Assume row 0 might be header, but let's just check for content
      rows.forEach((row, index) => {
        const name = String(row[0] || '').trim();
        const abbr = String(row[1] || '').trim();

        if (name && abbr && !existingNames.has(name.toLowerCase())) {
          newUnits.push({
            id: crypto.randomUUID(),
            name,
            targetUnit: abbr
          });
          existingNames.add(name.toLowerCase());
        }
      });

      if (newUnits.length > 0) {
        onChange({ measurementUnits: [...settings.measurementUnits, ...newUnits] });
        toast({ 
          title: "Import Successful", 
          description: `Added ${newUnits.length} new units from ${file.name}.` 
        });
      } else {
        toast({ title: "No new units", description: "No new unique units found in the file." });
      }
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Import Failed", description: "Failed to parse the Excel file." });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col space-y-8 pt-4">
      {/* Adaptive Header */}
      <div className="flex items-center justify-between bg-muted/20 p-4 rounded-lg border border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Scale className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest">Measurement Logic</h4>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Units and spacing standards</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Label className="text-[10px] font-bold uppercase text-muted-foreground">Target Preset:</Label>
          <Select value={selectedPresetId} onValueChange={handlePresetChange}>
            <SelectTrigger className="h-8 w-40 text-[10px] font-bold uppercase bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNIT_PRESETS.map(p => (
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

            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <Label htmlFor="checkMeasurementUnits" className="text-xs font-bold leading-none cursor-pointer">Measurement units</Label>
                  <p className="text-[10px] text-muted-foreground leading-tight">Validate units like m, kg, ko based on list.</p>
                </div>
                <Checkbox 
                  id="checkMeasurementUnits" 
                  checked={settings.checkMeasurementUnits} 
                  onCheckedChange={(v: boolean) => onChange({ checkMeasurementUnits: v })} 
                  className="scale-90"
                />
              </div>
              {settings.checkMeasurementUnits && (
                <div className="pl-6 flex items-center space-x-2 animate-in fade-in slide-in-from-left-1 duration-200">
                  <Checkbox 
                    id="ignoreCustomUnits" 
                    checked={settings.ignoreCustomUnits} 
                    onCheckedChange={(v: boolean) => onChange({ ignoreCustomUnits: v })}
                    className="scale-75"
                  />
                  <Label htmlFor="ignoreCustomUnits" className="text-[10px] text-muted-foreground">Don't report custom measurement units in target</Label>
                </div>
              )}
            </div>

            <div className="flex items-start justify-between gap-4 pt-2 border-t">
              <div className="space-y-0.5">
                <Label htmlFor="checkTemperatureSigns" className="text-xs font-bold leading-none cursor-pointer">Temperature and angular degree signs</Label>
                <p className="text-[10px] text-muted-foreground leading-tight">Enforce parity for symbols like °C, °F, and °.</p>
              </div>
              <Checkbox 
                id="checkTemperatureSigns" 
                checked={settings.checkTemperatureSigns} 
                onCheckedChange={(v: boolean) => onChange({ checkTemperatureSigns: v })} 
                className="scale-90"
              />
            </div>
          </div>
        </div>

        {/* Right Side: Unit Manager and Spacing */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Unit Table */}
          <div className="flex flex-col border rounded-lg bg-muted/5 overflow-hidden">
            <div className="p-3 border-b bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">Unit Repository</span>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={addRow} title="Add Row"><Plus className="w-3.5 h-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={deleteRows} title="Delete Selected"><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>

            <div className="p-2 border-b bg-background flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <Input 
                  placeholder="Search units..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-7 pl-7 text-[10px] bg-muted/30 border-none"
                />
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".xlsx,.xls" 
                onChange={handleFileChange} 
              />
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-[9px] gap-1 px-2 font-bold uppercase border-muted-foreground/20"
                onClick={handleImportClick}
              >
                <FileUp className="w-3 h-3" /> Import
              </Button>
            </div>

            <ScrollArea className="h-48">
              <Table className="text-[10px]">
                <TableHeader className="bg-muted/30 sticky top-0 z-10">
                  <TableRow className="h-8 hover:bg-transparent">
                    <TableHead className="w-8 p-0 text-center"></TableHead>
                    <TableHead className="font-bold uppercase h-8 py-0">Full Name</TableHead>
                    <TableHead className="font-bold uppercase h-8 py-0">Target Abbr.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUnits.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground italic">No units found.</TableCell></TableRow>
                  ) : (
                    filteredUnits.map((unit) => (
                      <TableRow key={unit.id} className={cn("h-8 group", selectedRows.has(unit.id) && "bg-primary/5")}>
                        <TableCell className="p-0 text-center">
                          <Checkbox checked={selectedRows.has(unit.id)} onCheckedChange={() => toggleRow(unit.id)} className="scale-75" />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input 
                            value={unit.name} 
                            onChange={(e) => updateUnit(unit.id, 'name', e.target.value)}
                            className="h-6 text-[10px] bg-transparent border-none focus-visible:ring-0 p-1 font-medium"
                          />
                        </TableCell>
                        <TableCell className="p-1">
                          <Input 
                            value={unit.targetUnit} 
                            onChange={(e) => updateUnit(unit.id, 'targetUnit', e.target.value)}
                            className="h-6 text-[10px] bg-transparent border-none focus-visible:ring-0 p-1 font-mono font-bold text-primary"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>

          {/* Spacing Logic */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg bg-muted/5 space-y-4">
              <h5 className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                Unit Spacing
              </h5>
              <RadioGroup 
                value={settings.measurementSpacing} 
                onValueChange={(v: any) => onChange({ measurementSpacing: v })}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="space" id="ms-space" className="scale-75" />
                  <Label htmlFor="ms-space" className="text-xs cursor-pointer flex items-center gap-2">
                    3 cm <span className="text-[10px] text-muted-foreground font-normal">(With space)</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no-space" id="ms-nospace" className="scale-75" />
                  <Label htmlFor="ms-nospace" className="text-xs cursor-pointer flex items-center gap-2">
                    3cm <span className="text-[10px] text-muted-foreground font-normal">(No space)</span>
                  </Label>
                </div>
              </RadioGroup>
              <div className="pt-2 border-t flex items-center space-x-2">
                <Checkbox 
                  id="ms-nbsp" 
                  checked={settings.measurementRequireNbsp} 
                  onCheckedChange={(v: boolean) => onChange({ measurementRequireNbsp: v })}
                  className="scale-75"
                />
                <Label htmlFor="ms-nbsp" className="text-[10px] font-medium leading-none cursor-pointer">Require non-breaking space (NBSP)</Label>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-muted/5 space-y-4">
              <h5 className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                Degree Spacing
              </h5>
              <RadioGroup 
                value={settings.temperatureSpacing} 
                onValueChange={(v: any) => onChange({ temperatureSpacing: v })}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="space" id="ts-space" className="scale-75" />
                  <Label htmlFor="ts-space" className="text-xs cursor-pointer flex items-center gap-2">
                    3 °C <span className="text-[10px] text-muted-foreground font-normal">(With space)</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no-space" id="ts-nospace" className="scale-75" />
                  <Label htmlFor="ts-nospace" className="text-xs cursor-pointer flex items-center gap-2">
                    3°C <span className="text-[10px] text-muted-foreground font-normal">(No space)</span>
                  </Label>
                </div>
              </RadioGroup>
              <div className="pt-2 border-t flex items-center space-x-2">
                <Checkbox 
                  id="ts-nbsp" 
                  checked={settings.temperatureRequireNbsp} 
                  onCheckedChange={(v: boolean) => onChange({ temperatureRequireNbsp: v })}
                  className="scale-75"
                />
                <Label htmlFor="ts-nbsp" className="text-[10px] font-medium leading-none cursor-pointer">Require non-breaking space (NBSP)</Label>
              </div>
            </div>
          </div>

          <div className="p-3 bg-primary/5 border rounded-md flex items-start gap-3">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-[9px] text-muted-foreground leading-tight italic">
              NBSP validation checks for Unicode character \u00A0. Standard spaces will be flagged as errors when this is active.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

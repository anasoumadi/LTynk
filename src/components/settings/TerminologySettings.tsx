"use client"

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { QASettings, Glossary, GlossaryTerm } from '@/lib/types';
import { useTmxStore } from '@/hooks/use-tmx-store';
import { 
  Plus, 
  Trash2, 
  Search, 
  Upload, 
  Book, 
  Download, 
  FileUp,
  MoreVertical,
  X,
  Languages,
  ArrowRight,
  Database
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';

interface TerminologySettingsProps {
  settings: QASettings;
  onChange: (updates: Partial<QASettings>) => void;
}

export const TerminologySettings: React.FC<TerminologySettingsProps> = ({ settings, onChange }) => {
  const { glossaries, addGlossary, deleteGlossary, updateGlossaryTerms, activeGlossaryId, setActiveGlossaryId } = useTmxStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newGlossaryName, setNewGlossaryName] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState({ source: 0, target: 1 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeGlossary = useMemo(() => 
    glossaries.find(g => g.id === activeGlossaryId), 
  [glossaries, activeGlossaryId]);

  const filteredTerms = useMemo(() => {
    if (!activeGlossary) return [];
    if (!searchQuery.trim()) return activeGlossary.terms;
    return activeGlossary.terms.filter(t => 
      t.source.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.target.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeGlossary, searchQuery]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    
    // Quick read to get columns
    const text = await file.text();
    const rows = text.split('\n').filter(Boolean);
    if (rows.length > 0) {
      const firstRow = rows[0].split(/[,\t]/);
      setCsvColumns(firstRow);
      setImportDialogOpen(true);
    }
  };

  const processImport = async () => {
    if (!importFile) return;
    const text = await importFile.text();
    const rows = text.split('\n').filter(Boolean);
    const terms: GlossaryTerm[] = [];
    
    // Skip header if requested (assume first row is header for now)
    rows.slice(1).forEach(row => {
      const cols = row.split(/[,\t]/);
      const source = cols[mapping.source]?.trim();
      const target = cols[mapping.target]?.trim();
      if (source && target) {
        terms.push({ id: crypto.randomUUID(), source, target });
      }
    });

    const newGlossary: Glossary = {
      id: crypto.randomUUID(),
      name: importFile.name,
      terms,
      createdAt: new Date()
    };

    await addGlossary(newGlossary);
    setActiveGlossaryId(newGlossary.id);
    setImportDialogOpen(false);
    toast({ title: "Glossary Imported", description: `Added ${terms.length} terms.` });
  };

  const handleCreateGlossary = async () => {
    if (!newGlossaryName.trim()) return;
    
    const newGlossary: Glossary = {
      id: crypto.randomUUID(),
      name: newGlossaryName.trim(),
      terms: [],
      createdAt: new Date()
    };

    await addGlossary(newGlossary);
    setActiveGlossaryId(newGlossary.id);
    setCreateDialogOpen(false);
    setNewGlossaryName('');
    toast({ title: "Glossary Created", description: `"${newGlossary.name}" is ready for use.` });
  };

  const handleAddTerm = () => {
    if (!activeGlossary) return;
    const newTerm: GlossaryTerm = { id: crypto.randomUUID(), source: 'New term', target: 'Translation' };
    updateGlossaryTerms(activeGlossary.id, [...activeGlossary.terms, newTerm]);
  };

  const handleDeleteTerm = (termId: string) => {
    if (!activeGlossary) return;
    updateGlossaryTerms(activeGlossary.id, activeGlossary.terms.filter(t => t.id !== termId));
  };

  const updateTermField = (termId: string, field: keyof GlossaryTerm, val: string) => {
    if (!activeGlossary) return;
    const newTerms = activeGlossary.terms.map(t => t.id === termId ? { ...t, [field]: val } : t);
    updateGlossaryTerms(activeGlossary.id, newTerms);
  };

  return (
    <div className="flex gap-8 pt-4 h-[600px]">
      {/* Sidebar: Rules & Glossary List */}
      <div className="w-80 flex flex-col gap-6 shrink-0 border-r pr-8">
        <div className="space-y-4">
          <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
            Terminology Rules
          </Label>
          
          <TerminologyOption 
            id="checkTerminology" 
            label="Check terminology" 
            description="Verify target uses approved translations."
            checked={settings.checkTerminology}
            onChange={(v) => onChange({ checkTerminology: v })}
          />

          <div className={cn("pl-6 space-y-3 transition-opacity", !settings.checkTerminology && "opacity-40 pointer-events-none")}>
            <SubOption id="termCount" label="Ensure term count parity" checked={settings.checkTermCount} onChange={(v) => onChange({ checkTermCount: v })} />
            <SubOption id="skipUt" label="Skip untranslatable terms" checked={settings.skipUntranslatablesInTerm} onChange={(v) => onChange({ skipUntranslatablesInTerm: v })} />
            <SubOption id="termTags" label="Verify tag boundaries" checked={settings.checkTermTags} onChange={(v) => onChange({ checkTermTags: v })} />
            <SubOption id="revCheck" label="Enable reverse check" checked={settings.reverseTermCheck} onChange={(v) => onChange({ reverseTermCheck: v })} />
          </div>

          <div className="pt-2 border-t">
            <TerminologyOption 
              id="detectForbidden" 
              label="Detect forbidden terms" 
              description="Flag use of prohibited terminology."
              checked={settings.detectForbiddenTerms}
              onChange={(v) => onChange({ detectForbiddenTerms: v })}
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-foreground">Active Glossaries</Label>
            <div className="flex gap-1">
              <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.txt" onChange={handleFileUpload} />
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => fileInputRef.current?.click()} title="Upload Glossary"><FileUp className="w-3.5 h-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCreateDialogOpen(true)} title="Create New"><Plus className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
          
          <ScrollArea className="flex-1 -mr-2 pr-2">
            <div className="space-y-1">
              {glossaries.length === 0 ? (
                <div className="p-4 text-center border-2 border-dashed rounded-md bg-muted/10">
                  <p className="text-[10px] text-muted-foreground italic">No glossaries found. Click '+' to create or upload.</p>
                </div>
              ) : (
                glossaries.map(g => (
                  <div 
                    key={g.id} 
                    className={cn(
                      "p-2 rounded-md border flex items-center justify-between group cursor-pointer transition-all",
                      activeGlossaryId === g.id ? "bg-primary/5 border-primary ring-1 ring-primary/20" : "hover:bg-muted/50"
                    )}
                    onClick={() => setActiveGlossaryId(g.id)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Book className={cn("w-3.5 h-3.5 shrink-0", activeGlossaryId === g.id ? "text-primary" : "text-muted-foreground")} />
                      <span className="text-[11px] font-bold truncate">{g.name}</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteGlossary(g.id); }}
                      className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Main Content: Term Grid */}
      <div className="flex-1 flex flex-col min-w-0 bg-muted/5 rounded-xl border overflow-hidden">
        {activeGlossary ? (
          <>
            <div className="p-3 border-b bg-muted/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input 
                    placeholder="Search terminology..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 pl-8 text-xs bg-background border-none"
                  />
                </div>
                <div className="h-4 w-px bg-border hidden sm:block" />
                <div className="flex items-center gap-2 hidden lg:flex">
                  <Languages className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Mapping Active</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="h-8 px-3 gap-2 uppercase text-[10px] font-bold" onClick={handleAddTerm}>
                  <Plus className="w-3.5 h-3.5" /> Add Term
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <Table className="text-xs">
                <TableHeader className="bg-muted/50 sticky top-0 z-10">
                  <TableRow className="h-9">
                    <TableHead className="w-[45%] font-black uppercase tracking-tighter">Source Term</TableHead>
                    <TableHead className="w-[45%] font-black uppercase tracking-tighter">Target Translation</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTerms.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-12 text-muted-foreground italic">
                        No terms match your search criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTerms.map(term => (
                      <TableRow key={term.id} className="h-9 hover:bg-primary/5 group transition-colors">
                        <TableCell className="p-1 px-3">
                          <Input 
                            value={term.source} 
                            onChange={(e) => updateTermField(term.id, 'source', e.target.value)}
                            className="h-7 text-xs bg-transparent border-none focus-visible:ring-0 font-medium"
                          />
                        </TableCell>
                        <TableCell className="p-1 px-3">
                          <Input 
                            value={term.target} 
                            onChange={(e) => updateTermField(term.id, 'target', e.target.value)}
                            className="h-7 text-xs bg-transparent border-none focus-visible:ring-0 text-primary font-bold"
                          />
                        </TableCell>
                        <TableCell className="p-1 text-right">
                          <button 
                            onClick={() => handleDeleteTerm(term.id)}
                            className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Database className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest">No Glossary Selected</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Select a glossary from the list, upload a file, or create a new manual list to start terminology validation.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 gap-2 uppercase text-[10px] font-bold" onClick={() => fileInputRef.current?.click()}>
                <FileUp className="w-3.5 h-3.5" /> Upload CSV/TXT
              </Button>
              <Button variant="secondary" size="sm" className="h-8 gap-2 uppercase text-[10px] font-bold" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-3.5 h-3.5" /> Create New
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create New Glossary Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Glossary</DialogTitle>
            <DialogDescription>Enter a descriptive name for your manual terminology list.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="grid gap-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Glossary Name</Label>
              <Input 
                placeholder="e.g., Project_Technical_Terms" 
                value={newGlossaryName}
                onChange={(e) => setNewGlossaryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateGlossary()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateGlossary} disabled={!newGlossaryName.trim()}>Create Glossary</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Column Mapping Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import Mapping</DialogTitle>
            <DialogDescription>Identify the columns for source and target terms.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label className="text-xs">Source Language Column</Label>
              <Select value={mapping.source.toString()} onValueChange={(v) => setMapping(m => ({ ...m, source: parseInt(v) }))}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {csvColumns.map((col, idx) => (
                    <SelectItem key={idx} value={idx.toString()}>Column {idx + 1}: {col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs">Target Language Column</Label>
              <Select value={mapping.target.toString()} onValueChange={(v) => setMapping(m => ({ ...m, target: parseInt(v) }))}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {csvColumns.map((col, idx) => (
                    <SelectItem key={idx} value={idx.toString()}>Column {idx + 1}: {col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setImportDialogOpen(false)}>Cancel</Button>
            <Button onClick={processImport}>Confirm Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const TerminologyOption = ({ id, label, description, checked, onChange }: { id: string, label: string, description: string, checked: boolean, onChange: (v: boolean) => void }) => (
  <div className="flex items-start justify-between gap-4">
    <div className="space-y-0.5">
      <Label htmlFor={id} className="text-xs font-bold leading-none cursor-pointer">{label}</Label>
      <p className="text-[10px] text-muted-foreground leading-tight">{description}</p>
    </div>
    <Checkbox id={id} checked={checked} onCheckedChange={onChange} className="scale-90" />
  </div>
);

const SubOption = ({ id, label, checked, onChange }: { id: string, label: string, checked: boolean, onChange: (v: boolean) => void }) => (
  <div className="flex items-center space-x-2">
    <Checkbox id={id} checked={checked} onCheckedChange={onChange} className="scale-75" />
    <Label htmlFor={id} className="text-[10px] font-medium leading-none cursor-pointer text-muted-foreground hover:text-foreground">{label}</Label>
  </div>
);

"use client"

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTmxStore } from '@/hooks/use-tmx-store';
import { BatchConfig, BatchRule } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { 
  Layers, 
  Play, 
  Plus, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  RotateCcw,
  User,
  Calendar,
  Settings2,
  History as HistoryIcon,
  Clock
} from 'lucide-react';

interface BatchTransformDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_RULE: Omit<BatchRule, 'id'> = {
  find: '',
  replace: '',
  isRegex: false,
  caseSensitive: false,
  wholeWord: false,
  diacriticSensitive: true
};

export const BatchTransformDialog: React.FC<BatchTransformDialogProps> = ({ open, onOpenChange }) => {
  const { runBatchTransform, restoreSnapshot, history = [], filteredSegments, segments } = useTmxStore();
  
  // Local state for the form
  const [rules, setRules] = useState<BatchRule[]>([]);
  const [scope, setScope] = useState<'target' | 'source' | 'both'>('target');
  const [onlyFiltered, setOnlyFiltered] = useState(false);
  const [updateUser, setUpdateUser] = useState(true);
  const [userName, setUserName] = useState('batch_editor');
  const [updateDate, setUpdateDate] = useState(true);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState<{ modified: number } | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Reset settings whenever the dialog is opened
  useEffect(() => {
    if (open) {
      setRules([{ ...DEFAULT_RULE, id: crypto.randomUUID() }]);
      setScope('target');
      setOnlyFiltered(false);
      setUpdateUser(true);
      setUserName('batch_editor');
      setUpdateDate(true);
      setSummary(null);
      setProgress(0);
      setIsProcessing(false);
    }
  }, [open]);

  // Handle mounting to prevent hydration errors for dates/ids
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const addRule = () => setRules([...rules, { ...DEFAULT_RULE, id: crypto.randomUUID() }]);
  
  const removeRule = (id: string) => {
    if (rules.length > 1) {
      setRules(rules.filter(r => r.id !== id));
    }
  };

  const updateRule = (id: string, updates: Partial<BatchRule>) => {
    setRules(rules.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const handleRun = async () => {
    if (rules.every(r => !r.find)) {
      toast({ variant: "destructive", title: "Error", description: "At least one 'Find' pattern is required." });
      return;
    }

    setIsProcessing(true);
    setSummary(null);
    setProgress(0);

    const config: BatchConfig = {
      scope,
      onlyFiltered,
      rules: rules.filter(r => r.find),
      metadataUpdates: { updateUser, userName, updateDate }
    };

    try {
      const result = await runBatchTransform(config, setProgress);
      setSummary(result);
      toast({ title: "Batch Complete", description: `Modified ${result.modified} segments.` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Batch Failed", description: e.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUndo = async (historyId?: string) => {
    await restoreSnapshot(historyId);
    setSummary(null);
    toast({ title: "Operation Undone", description: "Restored project to selected historical state." });
  };

  const activeCount = onlyFiltered ? filteredSegments.length : segments.length;

  // Don't render content until client-side hydration is complete to avoid ID/Date mismatches
  if (!isMounted) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] p-0 overflow-hidden bg-card">
        <DialogHeader className="p-6 bg-muted/30 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Layers className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Batch Transform Engine</DialogTitle>
              <DialogDescription className="text-xs">
                Apply multi-step replacements and metadata updates to {activeCount} segments.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isProcessing ? (
          <div className="p-16 flex flex-col items-center justify-center space-y-6">
            <div className="w-full space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-primary">
                <span>Transforming Records...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            <p className="text-[10px] text-muted-foreground animate-pulse">Processing local database chunks to keep UI responsive.</p>
          </div>
        ) : summary ? (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-6">
             <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
               <CheckCircle2 className="w-8 h-8 text-green-500" />
             </div>
             <div>
               <h3 className="text-lg font-bold">Operation Successful</h3>
               <p className="text-sm text-muted-foreground mt-1">
                 Modified <strong>{summary.modified}</strong> segments in the current project.
               </p>
             </div>
             <div className="flex gap-3">
               <Button variant="outline" onClick={() => handleUndo()} className="gap-2">
                 <RotateCcw className="w-4 h-4" /> Undo Last Action
               </Button>
               <Button onClick={() => setSummary(null)}>Start New Batch</Button>
             </div>
          </div>
        ) : (
          <div className="flex flex-col h-[500px]">
            <Tabs defaultValue="search" className="flex-1 flex flex-col">
              <TabsList className="px-6 py-2 bg-muted/20 border-b h-auto justify-start gap-2 rounded-none">
                <TabsTrigger value="search" className="text-[10px] font-bold uppercase tracking-tight">Search & Replace</TabsTrigger>
                <TabsTrigger value="scope" className="text-[10px] font-bold uppercase tracking-tight">Scope & Rules</TabsTrigger>
                <TabsTrigger value="metadata" className="text-[10px] font-bold uppercase tracking-tight">Metadata</TabsTrigger>
                <TabsTrigger value="history" className="text-[10px] font-bold uppercase tracking-tight gap-2">
                  <HistoryIcon className="w-3 h-3" />
                  Undo History ({history?.length || 0})
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto">
                <TabsContent value="search" className="m-0 p-6 space-y-4">
                  <div className="space-y-3">
                    {rules.map((rule, idx) => (
                      <div key={rule.id} className="p-4 bg-muted/30 border rounded-lg space-y-4 relative group">
                        <div className="flex items-center justify-between">
                           <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest">Step {idx + 1}</span>
                           <button onClick={() => removeRule(rule.id)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                             <Trash2 className="w-3.5 h-3.5" />
                           </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1.5">
                             <Label className="text-[10px] font-bold uppercase text-muted-foreground">Find Pattern</Label>
                             <Input 
                               value={rule.find}
                               onChange={(e) => updateRule(rule.id, { find: e.target.value })}
                               placeholder="Text or Regex..." 
                               className="h-8 text-xs font-mono" 
                             />
                           </div>
                           <div className="space-y-1.5">
                             <Label className="text-[10px] font-bold uppercase text-muted-foreground">Replace With</Label>
                             <Input 
                               value={rule.replace}
                               onChange={(e) => updateRule(rule.id, { replace: e.target.value })}
                               placeholder="Replacement (supports $1, $2...)" 
                               className="h-8 text-xs font-mono" 
                             />
                           </div>
                        </div>
                        <div className="flex flex-wrap gap-4 pt-1">
                          <RuleToggle label="Regex" checked={rule.isRegex} onCheckedChange={(v) => updateRule(rule.id, { isRegex: v })} />
                          <RuleToggle label="Case Sensitive" checked={rule.caseSensitive} onCheckedChange={(v) => updateRule(rule.id, { caseSensitive: v })} />
                          <RuleToggle label="Whole Word" checked={rule.wholeWord} onCheckedChange={(v) => updateRule(rule.id, { wholeWord: v })} />
                        </div>
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" onClick={addRule} className="w-full border-2 border-dashed h-10 gap-2 text-muted-foreground hover:text-primary hover:border-primary/50">
                      <Plus className="w-4 h-4" /> Add Chained Replacement
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="scope" className="m-0 p-6 space-y-8">
                  <div className="space-y-4">
                     <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                       <Settings2 className="w-3.5 h-3.5" /> Transform Scope
                     </h4>
                     <RadioGroup value={scope} onValueChange={(v: any) => setScope(v)} className="grid grid-cols-3 gap-4">
                        <ScopeCard value="target" label="Target Only" description="Update translations only." active={scope === 'target'} />
                        <ScopeCard value="source" label="Source Only" description="Update source segments." active={scope === 'source'} />
                        <ScopeCard value="both" label="Both Sides" description="Update both columns." active={scope === 'both'} />
                     </RadioGroup>
                  </div>

                  <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg flex gap-3">
                     <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                     <div className="space-y-1">
                       <p className="text-[11px] font-bold text-amber-500 uppercase tracking-tight">Safety Warning</p>
                       <p className="text-[10px] text-muted-foreground leading-relaxed">
                         Changing source text can break the structural integrity of your translation memory if not handled carefully.
                       </p>
                     </div>
                  </div>

                  <div className="flex items-center space-x-2 border p-3 rounded-lg bg-muted/20">
                    <Checkbox id="onlyFiltered" checked={onlyFiltered} onCheckedChange={(v: any) => setOnlyFiltered(v)} />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="onlyFiltered" className="text-xs font-bold leading-none cursor-pointer">
                        Limit to Active Filters
                      </Label>
                      <p className="text-[10px] text-muted-foreground">
                        Only process the {filteredSegments.length} segments matching current search/filter criteria.
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="metadata" className="m-0 p-6 space-y-6">
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                         <div className="flex items-center gap-2 mb-2">
                            <User className="w-3.5 h-3.5 text-primary" />
                            <h4 className="text-[10px] font-bold uppercase tracking-widest">Ownership Update</h4>
                         </div>
                         <div className="flex items-center space-x-2">
                            <Checkbox id="updateUser" checked={updateUser} onCheckedChange={(v: any) => setUpdateUser(v)} />
                            <Label htmlFor="updateUser" className="text-xs">Update Change ID</Label>
                         </div>
                         <Input 
                            value={userName} 
                            onChange={(e) => setUserName(e.target.value)}
                            disabled={!updateUser}
                            placeholder="User identifier..." 
                            className="h-8 text-xs bg-background" 
                         />
                      </div>
                      <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                         <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-3.5 h-3.5 text-primary" />
                            <h4 className="text-[10px] font-bold uppercase tracking-widest">Timestamp Update</h4>
                         </div>
                         <div className="flex items-center space-x-2">
                            <Checkbox id="updateDate" checked={updateDate} onCheckedChange={(v: any) => setUpdateDate(v)} />
                            <Label htmlFor="updateDate" className="text-xs">Touch Modified Date</Label>
                         </div>
                         <p className="text-[9px] text-muted-foreground leading-tight">
                            Sets the 'changedate' to current system time for all affected units.
                         </p>
                      </div>
                   </div>
                </TabsContent>

                <TabsContent value="history" className="m-0 p-6 h-full flex flex-col">
                  {!history || history.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
                      <Clock className="w-12 h-12 text-muted-foreground opacity-20" />
                      <div>
                        <p className="text-sm font-bold">No Undo States Available</p>
                        <p className="text-xs text-muted-foreground">States are captured automatically before each batch job.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded flex items-center gap-3">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        <p className="text-[10px] text-muted-foreground leading-tight">
                          Restoring a snapshot will revert the current project to its state before the selected batch operation.
                        </p>
                      </div>
                      <div className="space-y-2">
                        {history.map((item, idx) => (
                          <div key={item.id} className="p-3 border rounded-lg flex items-center justify-between hover:bg-muted/30 transition-colors group">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-primary uppercase">Snapshot {history.length - idx}</span>
                                <span className="text-[9px] text-muted-foreground">
                                  {item.timestamp.toLocaleString()}
                                </span>
                              </div>
                              <p className="text-xs font-medium">{item.description}</p>
                              <p className="text-[9px] text-muted-foreground">{item.segments.length} segments in project</p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleUndo(item.id)}
                              className="h-8 text-[10px] font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity gap-2"
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> Revert
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>

            <DialogFooter className="p-4 bg-muted/10 border-t flex justify-between items-center">
              <div className="flex flex-col">
                 <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Targeting</span>
                 <span className="text-xs font-bold text-primary">{activeCount} segments</span>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-xs h-8 font-bold">Cancel</Button>
                <Button onClick={handleRun} className="text-xs h-8 font-bold bg-primary hover:bg-primary/90 gap-2 px-6">
                  <Play className="w-3.5 h-3.5" /> Run Batch Job
                </Button>
              </div>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const RuleToggle = ({ label, checked, onCheckedChange }: { label: string, checked: boolean, onCheckedChange: (v: boolean) => void }) => (
  <div className="flex items-center space-x-2 bg-background/50 px-2 py-1 rounded border border-border/50">
    <Checkbox id={`toggle-${label}`} checked={checked} onCheckedChange={onCheckedChange} className="scale-75" />
    <Label htmlFor={`toggle-${label}`} className="text-[10px] cursor-pointer whitespace-nowrap">{label}</Label>
  </div>
);

const ScopeCard = ({ value, label, description, active }: { value: string, label: string, description: string, active: boolean }) => (
  <Label 
    className={`flex flex-col p-3 border rounded-lg cursor-pointer transition-all ${active ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'bg-background hover:bg-muted/50'}`}
  >
    <RadioGroupItem value={value} className="sr-only" />
    <span className="text-[11px] font-bold">{label}</span>
    <span className="text-[9px] text-muted-foreground mt-1 leading-tight">{description}</span>
  </Label>
);


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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useTmxStore } from '@/hooks/use-tmx-store';
import { CustomFilter, CustomFilterCondition, FilterScope, FilterOperator } from '@/lib/types';
import { Plus, Trash2, Filter as FilterIcon, Settings2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CustomFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_CONDITION = (): CustomFilterCondition => ({
  id: crypto.randomUUID(),
  scope: 'source',
  operator: 'contains',
  value: ''
});

export const CustomFilterDialog: React.FC<CustomFilterDialogProps> = ({ open, onOpenChange }) => {
  const { addCustomFilter } = useTmxStore();
  
  const [name, setName] = useState('');
  const [matchType, setMatchType] = useState<'and' | 'or'>('and');
  const [conditions, setConditions] = useState<CustomFilterCondition[]>([DEFAULT_CONDITION()]);

  useEffect(() => {
    if (open) {
      setName('');
      setMatchType('and');
      setConditions([DEFAULT_CONDITION()]);
    }
  }, [open]);

  const addCondition = () => setConditions([...conditions, DEFAULT_CONDITION()]);
  const removeCondition = (id: string) => {
    if (conditions.length > 1) {
      setConditions(conditions.filter(c => c.id !== id));
    }
  };

  const updateCondition = (id: string, updates: Partial<CustomFilterCondition>) => {
    setConditions(conditions.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast({ variant: "destructive", title: "Missing Name", description: "Please provide a name for this filter." });
      return;
    }
    
    if (conditions.some(c => !c.value.trim() && c.operator !== 'contains' && c.operator !== 'excludes')) {
       // Allow empty contains/excludes, but check for others if needed
    }

    const filter: CustomFilter = {
      id: crypto.randomUUID(),
      name,
      matchType,
      conditions
    };

    addCustomFilter(filter);
    onOpenChange(false);
    toast({ title: "Filter Saved", description: `"${name}" is now available in the filter list.` });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-card">
        <DialogHeader className="p-6 bg-muted/30 border-b">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
               <Settings2 className="w-5 h-5 text-primary" />
             </div>
             <div>
               <DialogTitle className="text-lg font-bold">Edit Filter Rule</DialogTitle>
               <DialogDescription className="text-xs uppercase font-bold tracking-tight text-muted-foreground">
                 Create sophisticated multi-condition segments
               </DialogDescription>
             </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6 max-h-[500px] overflow-y-auto custom-scrollbar">
           <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Filter Name</Label>
              <Input 
                placeholder="e.g., Recently Updated by Admin" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 bg-muted/20 border-border/50 focus:ring-1 focus:ring-primary/30"
              />
           </div>

           <div className="space-y-4">
              <div className="flex items-center justify-between">
                 <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Conditions</Label>
                 <RadioGroup value={matchType} onValueChange={(v: any) => setMatchType(v)} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                       <RadioGroupItem value="and" id="and" className="scale-75" />
                       <Label htmlFor="and" className="text-[10px] font-bold uppercase cursor-pointer">Meet All (AND)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                       <RadioGroupItem value="or" id="or" className="scale-75" />
                       <Label htmlFor="or" className="text-[10px] font-bold uppercase cursor-pointer">Meet One (OR)</Label>
                    </div>
                 </RadioGroup>
              </div>

              <div className="space-y-3">
                {conditions.map((condition, idx) => (
                  <div key={condition.id} className="flex gap-2 items-end p-3 bg-muted/10 border rounded-lg animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex-1 space-y-1.5">
                       <Label className="text-[9px] font-bold uppercase text-muted-foreground">Scope</Label>
                       <Select value={condition.scope} onValueChange={(v: FilterScope) => updateCondition(condition.id, { scope: v })}>
                         <SelectTrigger className="h-8 text-xs bg-background">
                            <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                            <SelectItem value="source">Source Text</SelectItem>
                            <SelectItem value="target">Target Text</SelectItem>
                            <SelectItem value="comment">Comment/Note</SelectItem>
                            <SelectItem value="status">Status</SelectItem>
                            <SelectItem value="metadata.creationid">Originator ID</SelectItem>
                            <SelectItem value="metadata.changedate">Change Date</SelectItem>
                         </SelectContent>
                       </Select>
                    </div>

                    <div className="w-32 space-y-1.5">
                       <Label className="text-[9px] font-bold uppercase text-muted-foreground">Operator</Label>
                       <Select value={condition.operator} onValueChange={(v: FilterOperator) => updateCondition(condition.id, { operator: v })}>
                         <SelectTrigger className="h-8 text-xs bg-background">
                            <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                            <SelectItem value="contains">Contains</SelectItem>
                            <SelectItem value="excludes">Excludes</SelectItem>
                            <SelectItem value="equal">Equals</SelectItem>
                            <SelectItem value="not_equal">Not Equal</SelectItem>
                         </SelectContent>
                       </Select>
                    </div>

                    <div className="flex-1 space-y-1.5">
                       <Label className="text-[9px] font-bold uppercase text-muted-foreground">Value</Label>
                       <Input 
                         value={condition.value}
                         onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                         placeholder="Keyword..." 
                         className="h-8 text-xs bg-background" 
                       />
                    </div>

                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeCondition(condition.id)}
                    >
                       <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button variant="ghost" size="sm" onClick={addCondition} className="w-full border-2 border-dashed h-10 gap-2 text-muted-foreground hover:text-primary hover:border-primary/50">
                 <Plus className="w-4 h-4" /> Add Condition
              </Button>
           </div>
        </div>

        <DialogFooter className="p-4 bg-muted/10 border-t flex justify-between items-center">
           <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-tight">
              Rules are applied instantly to the current view.
           </div>
           <div className="flex gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-xs h-8 font-bold">Cancel</Button>
              <Button onClick={handleSave} className="text-xs h-8 font-bold bg-primary hover:bg-primary/90 px-8">
                 Save Filter Rule
              </Button>
           </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

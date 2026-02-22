"use client"

import React, { useState, useMemo } from 'react';
import { useTmxStore } from '@/hooks/use-tmx-store';
import { UserDefinedCheck } from '@/lib/types';
import { cn } from '@/lib/utils';
import { 
  Plus, 
  Trash2, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Type, 
  Sparkles,
  CheckSquare,
  Square,
  MoreVertical,
  Copy,
  Wand2,
  FileSearch,
  Settings2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CheckEditor } from './CheckEditor';
import { toast } from '@/hooks/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { generateCustomRule } from '@/ai/flows/rule-generator-flow';

export const UserDefinedChecks = () => {
  const { qaSettings, addUserCheck, updateUserCheck, deleteUserCheck, setUserChecks } = useTmxStore();
  const checks = qaSettings.userDefinedChecks || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const filteredChecks = useMemo(() => {
    if (!searchQuery.trim()) return checks;
    return checks.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [checks, searchQuery]);

  const handleAddCheck = async () => {
    const newCheck: UserDefinedCheck = {
      id: crypto.randomUUID(),
      enabled: true,
      title: 'Untitled check: please give the check a proper description.',
      sourcePattern: '',
      sourceOptions: { caseSensitive: false, wholeWord: false, isRegex: false },
      targetPattern: '',
      targetOptions: { caseSensitive: false, wholeWord: false, isRegex: false },
      condition: 'source_found_target_missing',
      languages: [],
      group: 'General'
    };
    await addUserCheck(newCheck);
    setExpandedItems([newCheck.id]);
    toast({ title: "New Check Created", description: "Define your search patterns below." });
  };

  const handleToggleAll = (enabled: boolean) => {
    const updated = checks.map(c => ({ ...c, enabled }));
    setUserChecks(updated);
    // Persist all to DB
    updated.forEach(async (c) => await updateUserCheck(c.id, { enabled }));
  };

  const handleClone = async (check: UserDefinedCheck) => {
    const clone = { ...check, id: crypto.randomUUID(), title: `Copy of ${check.title}` };
    await addUserCheck(clone);
    toast({ title: "Check Cloned" });
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiGenerating(true);
    try {
      const result = await generateCustomRule({ description: aiPrompt });
      const newCheck: UserDefinedCheck = {
        id: crypto.randomUUID(),
        enabled: true,
        title: result.title,
        sourcePattern: result.sourcePattern,
        sourceOptions: { caseSensitive: result.caseSensitive, wholeWord: result.wholeWord, isRegex: result.isRegex },
        targetPattern: result.targetPattern,
        targetOptions: { caseSensitive: result.caseSensitive, wholeWord: result.wholeWord, isRegex: result.isRegex },
        condition: result.condition,
        languages: [],
        group: 'General'
      };
      await addUserCheck(newCheck);
      setAiDialogOpen(false);
      setAiPrompt('');
      setExpandedItems([newCheck.id]);
      toast({ title: "AI Generation Successful", description: "A new rule has been created based on your description." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "AI Generation Failed", description: e.message });
    } finally {
      setIsAiGenerating(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4 pt-4">
      {/* Sticky Toolbar */}
      <div className="flex items-center justify-between bg-muted/20 p-3 rounded-lg border border-border/50 sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Button size="sm" className="h-8 gap-2 text-[10px] font-bold uppercase tracking-wider" onClick={handleAddCheck}>
            <Plus className="w-3.5 h-3.5" /> Add New Check
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-2 text-[10px] font-bold uppercase tracking-wider border-primary/30 text-primary hover:bg-primary/5" onClick={() => setAiDialogOpen(true)}>
            <Sparkles className="w-3.5 h-3.5 fill-primary/20" /> Generate with AI
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input 
              placeholder="Search custom checks..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs bg-background border-none"
            />
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleAll(true)} title="Enable All"><CheckSquare className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleAll(false)} title="Disable All"><Square className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setExpandedItems(checks.map(c => c.id))} title="Expand All"><ChevronDown className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setExpandedItems([])} title="Collapse All"><ChevronUp className="w-4 h-4" /></Button>
          </div>
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-2">
        {filteredChecks.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed rounded-xl bg-muted/5">
            <FileSearch className="w-12 h-12 mx-auto text-muted-foreground/20 mb-4" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">No Custom Checks Found</h3>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-tight">Create a "Search & Flag" rule to automate complex audits.</p>
          </div>
        ) : (
          <Accordion type="multiple" value={expandedItems} onValueChange={setExpandedItems} className="w-full space-y-2">
            {filteredChecks.map((check) => (
              <AccordionItem key={check.id} value={check.id} className="border rounded-lg bg-card overflow-hidden transition-all data-[state=open]:ring-1 data-[state=open]:ring-primary/20">
                <div className="flex items-center px-4 h-12 gap-4">
                  <Checkbox 
                    checked={check.enabled} 
                    onCheckedChange={(v: boolean) => updateUserCheck(check.id, { enabled: v })}
                    className="scale-90"
                  />
                  <AccordionTrigger className="flex-1 py-0 hover:no-underline text-left">
                    <span className={cn(
                      "text-xs font-bold uppercase tracking-tight truncate",
                      !check.enabled && "text-muted-foreground line-through opacity-50"
                    )}>
                      {check.title}
                    </span>
                  </AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black bg-muted px-1.5 py-0.5 rounded text-muted-foreground uppercase tracking-widest">
                      {check.group}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted-foreground/10">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem className="text-[10px] font-bold uppercase gap-2" onClick={() => setExpandedItems([check.id])}>
                          <Settings2 className="w-3.5 h-3.5" /> Edit Rule
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-[10px] font-bold uppercase gap-2" onClick={() => handleClone(check)}>
                          <Copy className="w-3.5 h-3.5" /> Clone
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-[10px] font-bold uppercase gap-2 text-destructive" onClick={() => deleteUserCheck(check.id)}>
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <AccordionContent>
                  <CheckEditor 
                    check={check} 
                    onUpdate={(updates) => updateUserCheck(check.id, updates)} 
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      {/* AI Dialog */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary fill-primary/20" />
              Generate QA Rule with AI
            </DialogTitle>
            <DialogDescription className="text-xs">
              Describe the error you want to flag in natural language. Our AI will configure the regex and logic for you.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Textarea 
              placeholder="e.g., Flag if the source has the word 'Email' but the target doesn't contain 'Courriel'." 
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="min-h-[120px] text-xs leading-relaxed"
            />
            <div className="p-3 bg-muted/30 rounded-md text-[10px] text-muted-foreground italic leading-tight">
              AI generation creates a new check based on your prompt. You can review and refine the regex patterns after creation.
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAiDialogOpen(false)} disabled={isAiGenerating}>Cancel</Button>
            <Button 
              onClick={handleAiGenerate} 
              disabled={isAiGenerating || !aiPrompt.trim()}
              className="gap-2 font-bold uppercase text-xs"
            >
              {isAiGenerating ? <Wand2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

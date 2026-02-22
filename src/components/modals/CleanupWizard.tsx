
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useTmxStore } from '@/hooks/use-tmx-store';
import { CleanupConfig, CleanupReport } from '@/lib/types';
import { runCleanupBatch } from '@/lib/cleanup-logic';
import { toast } from '@/hooks/use-toast';
import { Wand2, CheckCircle2, AlertCircle, Trash2, Tag, FileText } from 'lucide-react';

interface CleanupWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_CONFIG: CleanupConfig = {
  removeEmpty: true,
  removeUntranslated: false,
  cleanXmlEntities: true,
  stripControlChars: true,
  trimWhitespace: true,
  normalizeSpacing: true,
  fixPunctuationSpacing: false,
  smartQuotes: false,
  stripAllTags: false,
  autoCloseTags: true,
  removeOrphanTags: true,
  liftOuterTags: false,
  deleteExactDuplicates: true,
  anonymizeUsers: false,
  batchDateUpdate: true,
  customRegexEnabled: false,
  customRegexFind: '',
  customRegexReplace: '',
};

export const CleanupWizard: React.FC<CleanupWizardProps> = ({ open, onOpenChange }) => {
  const { segments, setSegments } = useTmxStore();
  const [config, setConfig] = useState<CleanupConfig>(DEFAULT_CONFIG);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState<CleanupReport | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted status to prevent hydration errors
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Reset wizard state whenever it is opened via the "Wand" icon
  useEffect(() => {
    if (open) {
      setReport(null);
      setProgress(0);
      setIsProcessing(false);
      setConfig(DEFAULT_CONFIG);
    }
  }, [open]);

  const handleToggle = (key: keyof CleanupConfig) => {
    setConfig(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRun = async () => {
    setIsProcessing(true);
    setReport(null);
    setProgress(0);

    // Give UI a chance to render progress bar
    setTimeout(() => {
      try {
        const { updatedSegments, report: cleanupReport } = runCleanupBatch(
          segments,
          config,
          (p) => setProgress(p)
        );

        setSegments(updatedSegments);
        setReport(cleanupReport);
        toast({
          title: "Cleanup Complete",
          description: `Processed ${segments.length} segments. ${cleanupReport.modified} modified, ${cleanupReport.deleted} deleted.`,
        });
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Cleanup Failed",
          description: error.message || "An error occurred during batch processing.",
        });
      } finally {
        setIsProcessing(false);
      }
    }, 100);
  };

  if (!isMounted) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-card">
        <DialogHeader className="p-6 bg-muted/30 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">TMX Cleanup Wizard</DialogTitle>
              <DialogDescription className="text-xs">
                Perform batch operations to sanitize and deduplicate your translation memory.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isProcessing ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-6">
            <div className="relative w-24 h-24">
               <div className="absolute inset-0 border-4 border-primary/10 rounded-full"></div>
               <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
               <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-primary">
                 {progress}%
               </div>
            </div>
            <div className="text-center">
               <p className="text-sm font-bold text-foreground uppercase tracking-widest">Running Batch Operations</p>
               <p className="text-[10px] text-muted-foreground mt-1">Applying structural fixes and sanitation rules...</p>
            </div>
            <Progress value={progress} className="w-full h-1.5" />
          </div>
        ) : report ? (
          <div className="p-8 space-y-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-base font-bold">Cleanup Summary</h3>
              <p className="text-xs text-muted-foreground">The following modifications were applied to the local database.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <SummaryCard label="Segments Modified" value={report.modified} icon={<FileText className="w-3.5 h-3.5" />} />
              <SummaryCard label="Units Deleted" value={report.deleted} icon={<Trash2 className="w-3.5 h-3.5" />} />
              <SummaryCard label="Duplicates Removed" value={report.duplicatesRemoved} icon={<AlertCircle className="w-3.5 h-3.5" />} />
              <SummaryCard label="Tags Repaired" value={report.tagsFixed} icon={<Tag className="w-3.5 h-3.5" />} />
            </div>

            <div className="flex justify-center mt-4">
              <Button onClick={() => onOpenChange(false)} className="px-8 font-bold text-xs uppercase tracking-widest">
                Close Wizard
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-[400px]">
            <Tabs defaultValue="hygiene" className="flex-1 flex flex-col">
              <TabsList className="px-6 py-2 bg-muted/20 border-b h-auto justify-start gap-2 rounded-none">
                <TabsTrigger value="hygiene" className="text-[10px] font-bold uppercase tracking-tight data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Structural</TabsTrigger>
                <TabsTrigger value="text" className="text-[10px] font-bold uppercase tracking-tight data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Text</TabsTrigger>
                <TabsTrigger value="tags" className="text-[10px] font-bold uppercase tracking-tight data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Tags</TabsTrigger>
                <TabsTrigger value="data" className="text-[10px] font-bold uppercase tracking-tight data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Maintenance</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto p-6">
                <TabsContent value="hygiene" className="m-0 space-y-4">
                  <CleanupOption 
                    id="removeEmpty" 
                    label="Remove Empty Units" 
                    description="Delete TUs where target is missing or contains only whitespace."
                    checked={config.removeEmpty}
                    onCheckedChange={() => handleToggle('removeEmpty')}
                  />
                  <CleanupOption 
                    id="removeUntranslated" 
                    label="Remove Untranslated Segments" 
                    description="Delete TUs where source and target text are identical."
                    checked={config.removeUntranslated}
                    onCheckedChange={() => handleToggle('removeUntranslated')}
                  />
                  <CleanupOption 
                    id="stripControlChars" 
                    label="Strip Control Characters" 
                    description="Remove non-printing ASCII chars (0x00-0x1F) often found in PDF exports."
                    checked={config.stripControlChars}
                    onCheckedChange={() => handleToggle('stripControlChars')}
                  />
                </TabsContent>

                <TabsContent value="text" className="m-0 space-y-4">
                  <CleanupOption 
                    id="trimWhitespace" 
                    label="Trim Leading/Trailing Whitespace" 
                    description="Remove spaces at the start and end of all segments."
                    checked={config.trimWhitespace}
                    onCheckedChange={() => handleToggle('trimWhitespace')}
                  />
                  <CleanupOption 
                    id="normalizeSpacing" 
                    label="Normalize Internal Spacing" 
                    description="Collapse multiple consecutive spaces into a single space."
                    checked={config.normalizeSpacing}
                    onCheckedChange={() => handleToggle('normalizeSpacing')}
                  />
                  <div className="pt-4 space-y-2 border-t mt-4">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Regex Correction</Label>
                    <div className="grid grid-cols-2 gap-2">
                       <Input 
                        placeholder="Find pattern..." 
                        className="h-8 text-xs bg-muted/50 border-none"
                        value={config.customRegexFind}
                        onChange={(e) => setConfig(prev => ({ ...prev, customRegexFind: e.target.value, customRegexEnabled: !!e.target.value }))}
                       />
                       <Input 
                        placeholder="Replace with..." 
                        className="h-8 text-xs bg-muted/50 border-none"
                        value={config.customRegexReplace}
                        onChange={(e) => setConfig(prev => ({ ...prev, customRegexReplace: e.target.value }))}
                       />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="tags" className="m-0 space-y-4">
                  <CleanupOption 
                    id="stripAllTags" 
                    label="Strip All Inline Tags" 
                    description="Convert TMX to plain text by removing all bpt/ept/ph markers."
                    checked={config.stripAllTags}
                    onCheckedChange={() => handleToggle('stripAllTags')}
                  />
                  <CleanupOption 
                    id="autoCloseTags" 
                    label="Auto-repair Unbalanced Tags" 
                    description="Fix missing closing tags at the end of segments."
                    checked={config.autoCloseTags}
                    onCheckedChange={() => handleToggle('autoCloseTags')}
                  />
                </TabsContent>

                <TabsContent value="data" className="m-0 space-y-4">
                  <CleanupOption 
                    id="deleteExactDuplicates" 
                    label="Delete Exact Duplicates" 
                    description="Consolidate units with identical source/target pairs."
                    checked={config.deleteExactDuplicates}
                    onCheckedChange={() => handleToggle('deleteExactDuplicates')}
                  />
                  <CleanupOption 
                    id="anonymizeUsers" 
                    label="Anonymize Metadata" 
                    description="Set all creation/change IDs to 'anonymous' for GDPR compliance."
                    checked={config.anonymizeUsers}
                    onCheckedChange={() => handleToggle('anonymizeUsers')}
                  />
                  <CleanupOption 
                    id="batchDateUpdate" 
                    label="Touch Modified Dates" 
                    description="Set change dates of modified units to current timestamp."
                    checked={config.batchDateUpdate}
                    onCheckedChange={() => handleToggle('batchDateUpdate')}
                  />
                </TabsContent>
              </div>
            </Tabs>

            <DialogFooter className="p-4 bg-muted/10 border-t flex justify-between items-center">
              <p className="text-[9px] text-muted-foreground max-w-[200px] leading-tight font-medium uppercase tracking-tighter">
                Batch operations will modify your local database and cannot be undone via simple Ctrl+Z.
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-xs h-8 font-bold">Cancel</Button>
                <Button onClick={handleRun} className="text-xs h-8 font-bold bg-primary hover:bg-primary/90 gap-2 px-6">
                  <Wand2 className="w-3.5 h-3.5" /> Run Wizard
                </Button>
              </div>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const CleanupOption = ({ id, label, description, checked, onCheckedChange }: { id: string, label: string, description: string, checked: boolean, onCheckedChange: () => void }) => (
  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors border border-transparent hover:border-border/50">
    <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} className="mt-1" />
    <div className="space-y-0.5">
      <Label htmlFor={id} className="text-xs font-bold leading-none cursor-pointer">{label}</Label>
      <p className="text-[10px] text-muted-foreground leading-relaxed">{description}</p>
    </div>
  </div>
);

const SummaryCard = ({ label, value, icon }: { label: string, value: number, icon: React.ReactNode }) => (
  <div className="p-3 bg-muted/20 border rounded-md flex flex-col gap-1">
    <div className="flex items-center gap-2 text-muted-foreground">
      {icon}
      <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
    </div>
    <span className="text-lg font-bold text-foreground font-mono">{value}</span>
  </div>
);

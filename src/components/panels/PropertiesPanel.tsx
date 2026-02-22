
"use client"

import React from 'react';
import { useTmxStore } from '@/hooks/use-tmx-store';
import { Info, Clock, User, Code, FileText, Hash, AlertTriangle, CheckCircle, InfoIcon } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export const PropertiesPanel = () => {
  const { selectedSegmentId, segments, currentProject } = useTmxStore();
  const selectedSegment = segments.find(s => s.id === selectedSegmentId);

  if (!selectedSegment) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-card">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
           <Info className="w-6 h-6 text-muted-foreground/30" />
        </div>
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">Inspector</h3>
        <p className="text-[10px] text-muted-foreground leading-relaxed">Select a translation unit to inspect metadata and raw structure.</p>
      </div>
    );
  }

  const qaIssues = selectedSegment.qaIssues || [];

  return (
    <div className="h-full flex flex-col bg-card w-full">
      <div className="px-4 py-3 border-b flex items-center justify-between bg-muted/10">
        <div className="flex items-center gap-2">
           <Hash className="w-3.5 h-3.5 text-primary" />
           <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">Unit #{selectedSegment.tu_id}</h3>
        </div>
        <span className="text-[9px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20">
           {selectedSegment.status.toUpperCase()}
        </span>
      </div>
      
      <Tabs defaultValue="details" className="flex-1 flex flex-col min-h-0">
        <div className="px-3 pt-3">
          <TabsList className="w-full grid grid-cols-3 h-8 bg-muted/50 p-1">
            <TabsTrigger value="details" className="text-[10px] font-bold uppercase tracking-tight">Details</TabsTrigger>
            <TabsTrigger value="qa" className="text-[10px] font-bold uppercase tracking-tight relative">
              QA
              {qaIssues.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive text-[8px] flex items-center justify-center rounded-full text-white font-bold">
                  {qaIssues.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="xml" className="text-[10px] font-bold uppercase tracking-tight">Raw XML</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="details" className="flex-1 outline-none min-h-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
              <section>
                <div className="flex items-center gap-2 mb-3">
                   <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                   <h4 className="text-[10px] font-black text-foreground uppercase tracking-widest">Metadata</h4>
                </div>
                <div className="space-y-2.5">
                  <PropertyItem label="Internal DB UID" value={selectedSegment.id} mono />
                  <PropertyItem label="Creation Date" value={selectedSegment.metadata.creationdate || 'N/A'} />
                  <PropertyItem label="Last Updated" value={selectedSegment.lastModified?.toLocaleString() || 'N/A'} />
                </div>
              </section>

              <Separator className="bg-border/40" />

              <section>
                <div className="flex items-center gap-2 mb-3">
                   <User className="w-3.5 h-3.5 text-muted-foreground" />
                   <h4 className="text-[10px] font-black text-foreground uppercase tracking-widest">Ownership</h4>
                </div>
                <div className="space-y-2.5">
                  <PropertyItem label="Originator" value={selectedSegment.metadata.creationid || 'Anonymous'} />
                  <PropertyItem label="Active Editor" value={selectedSegment.lastModifiedBy || 'N/A'} />
                </div>
              </section>

              <Separator className="bg-border/40" />

              <section>
                <div className="flex items-center gap-2 mb-3">
                   <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                   <h4 className="text-[10px] font-black text-foreground uppercase tracking-widest">Analytics</h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <PropertyItem label="Source Words" value={selectedSegment.source.text.split(/\s+/).filter(Boolean).length.toString()} />
                  <PropertyItem label="Target Words" value={selectedSegment.target.text.split(/\s+/).filter(Boolean).length.toString()} />
                  <PropertyItem label="Tags Count" value={selectedSegment.target.tags.length.toString()} />
                  <PropertyItem label="Similarity" value="100%" />
                </div>
              </section>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="qa" className="flex-1 outline-none min-h-0">
          <ScrollArea className="h-full">
             <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                   <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground" />
                   <h4 className="text-[10px] font-black text-foreground uppercase tracking-widest">Quality Assurance</h4>
                </div>
                
                {qaIssues.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center bg-green-500/5 rounded-md border border-green-500/10">
                     <CheckCircle className="w-8 h-8 text-green-500/30 mb-2" />
                     <p className="text-[10px] font-bold text-green-500 uppercase tracking-tight">No issues found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {qaIssues.map((issue) => (
                      <div key={issue.id} className={cn(
                        "p-3 rounded-md border text-xs flex gap-3",
                        issue.type === 'error' ? "bg-destructive/5 border-destructive/20 text-destructive" :
                        issue.type === 'warning' ? "bg-amber-500/5 border-amber-500/20 text-amber-500" :
                        "bg-blue-500/5 border-blue-500/20 text-blue-500"
                      )}>
                        <div className="mt-0.5">
                           {issue.type === 'error' ? <AlertTriangle className="w-3.5 h-3.5" /> : 
                            issue.type === 'warning' ? <AlertTriangle className="w-3.5 h-3.5" /> : 
                            <InfoIcon className="w-3.5 h-3.5" />}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-[10px] uppercase mb-1">{issue.code}</div>
                          <div className="text-[11px] leading-relaxed opacity-90">{issue.message}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="xml" className="flex-1 outline-none p-3 min-h-0">
          <div className="h-full bg-slate-900 rounded-md border border-slate-800 p-4 font-code text-[11px] text-slate-400 leading-relaxed overflow-auto custom-scrollbar shadow-inner">
            <span className="text-blue-400">&lt;tu tuid="{selectedSegment.tu_id}"&gt;</span>
            <br />
            <span className="ml-4 text-blue-400">&lt;tuv xml:lang="{selectedSegment.sourceLang || 'en'}"&gt;</span>
            <br />
            <span className="ml-8 text-blue-400">&lt;seg&gt;</span>
            <span className="text-slate-100">{selectedSegment.source.text}</span>
            <span className="text-blue-400">&lt;/seg&gt;</span>
            <br />
            <span className="ml-4 text-blue-400">&lt;/tuv&gt;</span>
            <br />
            <span className="ml-4 text-blue-400">&lt;tuv xml:lang="{selectedSegment.targetLang || 'fr'}"&gt;</span>
            <br />
            <span className="ml-8 text-blue-400">&lt;seg&gt;</span>
            <span className="text-slate-100">{selectedSegment.target.text}</span>
            <span className="text-blue-400">&lt;/seg&gt;</span>
            <br />
            <span className="ml-4 text-blue-400">&lt;/tuv&gt;</span>
            <br />
            <span className="text-blue-400">&lt;/tu&gt;</span>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const PropertyItem = ({ label, value, mono }: { label: string, value: string, mono?: boolean }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter opacity-70">{label}</span>
    <span className={cn(
      "text-[11px] bg-muted/50 p-1.5 px-2 rounded truncate border border-border/30 text-foreground block",
      mono && "font-mono"
    )} title={value}>
      {value}
    </span>
  </div>
);


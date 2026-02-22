"use client"

import React, { useState } from 'react';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTmxStore } from '@/hooks/use-tmx-store';
import { LqaExportEngine } from '@/lib/export-engine';
import { toast } from '@/hooks/use-toast';
import { LanguageSet } from '@/lib/types';
import { LqaExportDialog } from '../modals/LqaExportDialog';
import { langMatch } from '@/lib/utils';

export const LqaExportButton = () => {
  const { currentProject, segments, projectFiles, projectLanguageSets } = useTmxStore();
  const [isExporting, setIsExporting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const startExport = async (languageSet?: LanguageSet) => {
    if (!currentProject || segments.length === 0) {
      toast({ variant: "destructive", title: "Export Error", description: "No project data available to export." });
      return;
    }

    setIsExporting(true);
    try {
      // Filter segments if a specific language set is provided
      const segmentsToExport = languageSet
        ? segments.filter(s => langMatch(s.sourceLang, languageSet.src) && langMatch(s.targetLang, languageSet.tgt))
        : segments;

      if (segmentsToExport.length === 0) {
        toast({ title: "No Data", description: "There are no segments for the selected language pair to export." });
        setIsExporting(false);
        return;
      }
      
      const engine = new LqaExportEngine(currentProject, projectFiles, languageSet);
      await engine.generate(segmentsToExport);
      toast({ title: "LQA Export Complete", description: "The audit report has been generated successfully." });
    } catch (error: any) {
      console.error(error);
      toast({ variant: "destructive", title: "Export Failed", description: error.message || "Failed to generate Excel report." });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportClick = () => {
    if (currentProject?.type === 'multilingual' && projectLanguageSets.length > 1) {
      setIsDialogOpen(true);
    } else {
      // For monolingual or single-pair projects, export directly
      startExport(projectLanguageSets[0]);
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleExportClick}
        disabled={isExporting || segments.length === 0}
        className="h-7 text-[10px] font-bold uppercase gap-2 border-primary/30 text-primary hover:bg-primary/5"
      >
        {isExporting ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Preparing Report...
          </>
        ) : (
          <>
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export LQA
          </>
        )}
      </Button>
      {currentProject?.type === 'multilingual' && (
         <LqaExportDialog 
           open={isDialogOpen}
           onOpenChange={setIsDialogOpen}
           languageSets={projectLanguageSets}
           onExport={startExport}
         />
      )}
    </>
  );
};

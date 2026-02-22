
"use client"

import React, { useRef, useState } from 'react';
import {
  FileUp,
  Save,
  Settings,
  Undo2,
  Redo2,
  Command,
  Download,
  Layers,
  Zap,
  Globe,
  Database,
  CheckCircle2,
  Wand2,
  Eye,
  EyeOff,
  Info,
  Wrench,
  LayoutGrid
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from '@/components/ui/tooltip';
import { useTmxStore } from '@/hooks/use-tmx-store';
import { db } from '@/lib/db';
import { toast } from '@/hooks/use-toast';
import { CleanupWizard } from '../modals/CleanupWizard';
import { BatchTransformDialog } from '../modals/BatchTransformDialog';
import { UtilitiesDashboard } from '../modals/UtilitiesDashboard';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ImportWizard } from '../modals/ImportWizard';
import { BrandLogo } from './BrandLogo';

export const Toolbar = () => {
  const {
    segments,
    runProjectQA,
    currentProject,
    undoStack,
    redoStack,
    undo,
    redo,
    showHiddenFormatting,
    setShowHiddenFormatting,
    rightPanelCollapsed,
    setRightPanelCollapsed,
    closeProject
  } = useTmxStore();

  const [cleanupOpen, setCleanupOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [utilitiesOpen, setUtilitiesOpen] = useState(false);
  const [importWizardOpen, setImportWizardOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleSaveSnapshot = async () => {
    if (!currentProject) return;
    try {
      await db.projects.update(currentProject.id, { lastOpened: new Date() });
      await db.segments.bulkPut(segments);
      toast({ title: "Project Saved", description: "Progress persisted to local cache." });
    } catch (error) {
      console.error("Failed to save snapshot:", error)
      toast({ variant: "destructive", title: "Save Failed", description: "Could not persist changes to the local database." });
    }
  };

  const handleExport = () => {
    if (!currentProject || segments.length === 0) return;
    setUtilitiesOpen(true);
  };

  const handleUndo = async () => {
    await undo();
    toast({ title: "Undo", description: "Reverted to previous state." });
  };

  const handleRedo = async () => {
    await redo();
    toast({ title: "Redo", description: "Applied redone state." });
  };

  return (
    <TooltipProvider delayDuration={400}>
      <div className="h-10 border-b bg-muted/30 flex items-center px-2 sm:px-3 gap-1 select-none z-30">

        <div className="flex-shrink-0 mr-2 sm:mr-4">
          <BrandLogo className="h-8" />
        </div>

        <Separator orientation="vertical" className="h-5 mx-1 sm:mx-2 hidden xs:block" />

        <ScrollArea className="flex-1 h-full">
          <div className="flex items-center h-full gap-1 min-w-max pr-4">
            <div className="flex items-center gap-1">
              <ToolbarButton icon={<LayoutGrid />} label="Project Dashboard" onClick={closeProject} />
              <ToolbarButton icon={<FileUp />} label="New Project" onClick={() => setImportWizardOpen(true)} />
              <ToolbarButton icon={<Save />} label="Save Local Snapshot" onClick={handleSaveSnapshot} />
              <ToolbarButton icon={<Download />} label="Export & Utilities" onClick={handleExport} />
            </div>

            <Separator orientation="vertical" className="mx-1 sm:mx-2 h-5" />

            <div className="flex items-center gap-1">
              <ToolbarButton
                icon={<Undo2 />}
                label="Undo (Ctrl+Z)"
                disabled={undoStack.length === 0}
                onClick={handleUndo}
              />
              <ToolbarButton
                icon={<Redo2 />}
                label="Redo (Ctrl+Y)"
                disabled={redoStack.length === 0}
                onClick={handleRedo}
              />
            </div>

            <Separator orientation="vertical" className="mx-1 sm:mx-2 h-5" />

            <div className="flex items-center gap-1">
              <ToolbarButton icon={<CheckCircle2 />} label="Run QA Checks" onClick={() => runProjectQA()} />
              <ToolbarButton icon={<Wand2 />} label="Cleanup Wizard" onClick={() => setCleanupOpen(true)} />
              <ToolbarButton icon={<Wrench />} label="Utilities Dashboard" onClick={() => setUtilitiesOpen(true)} />
              <ToolbarButton icon={<Layers />} label="Batch Transform Engine" onClick={() => setBatchOpen(true)} />
              <ToolbarButton
                icon={showHiddenFormatting ? <EyeOff /> : <Eye />}
                label={showHiddenFormatting ? "Hide Formatting" : "Show Hidden Formatting"}
                onClick={() => setShowHiddenFormatting(!showHiddenFormatting)}
                className={cn(showHiddenFormatting && "text-primary bg-primary/10")}
              />
            </div>
          </div>
          <ScrollBar orientation="horizontal" className="h-1 opacity-0 group-hover:opacity-100 transition-opacity" />
        </ScrollArea>

        <div className="ml-auto flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <ThemeToggle />
          <ToolbarButton
            icon={<Info />}
            label={rightPanelCollapsed ? "Show Inspector" : "Hide Inspector"}
            onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
            className={cn(!rightPanelCollapsed && "text-primary bg-primary/10")}
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-2 px-2 text-[10px] bg-muted/50 hover:bg-muted font-bold border border-border/50 text-muted-foreground hover:text-foreground hidden lg:flex"
          >
            <Command className="w-3 h-3" />
            <span>CTRL + K</span>
          </Button>
          <ToolbarButton icon={<Settings />} label="Preferences" />
        </div>

        <CleanupWizard open={cleanupOpen} onOpenChange={setCleanupOpen} />
        <BatchTransformDialog open={batchOpen} onOpenChange={setBatchOpen} />
        <UtilitiesDashboard open={utilitiesOpen} onOpenChange={setUtilitiesOpen} />
        <ImportWizard open={importWizardOpen} onOpenChange={setImportWizardOpen} />
      </div>
    </TooltipProvider>
  );
};

const ToolbarButton = ({ icon, label, onClick, disabled, className }: { icon: React.ReactNode, label: string, onClick?: () => void, disabled?: boolean, className?: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        disabled={disabled}
        className={cn("w-8 h-8 rounded-md hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground", className)}
        onClick={onClick}
      >
        {React.cloneElement(icon as React.ReactElement<any>, { size: 16 })}
      </Button>
    </TooltipTrigger>
    <TooltipContent side="bottom" className="text-[10px] font-bold py-1 px-2 uppercase tracking-wider">
      {label}
    </TooltipContent>
  </Tooltip>
);

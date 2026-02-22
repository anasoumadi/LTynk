
"use client"

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Toolbar } from './Toolbar';
import { TopPanel } from './TopPanel';
import { EditorGrid } from '../editor/EditorGrid';
import { PropertiesPanel } from '../panels/PropertiesPanel';
import { CommandPalette } from '../command-palette/CommandPalette';
import {
  History,
  Database,
  Settings,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  FileText,
  MoreVertical,
  Download,
  FileUp,
  Filter,
  SortAsc,
  Trash2,
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTmxStore } from '@/hooks/use-tmx-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { formatBytes } from '@/lib/tmx-utils';
import { useIsMobile } from '@/hooks/use-mobile';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { db } from '@/lib/db';
import { OmissionSettings } from '../settings/OmissionSettings';
import { UntranslatableSettings } from '../settings/UntranslatableSettings';
import { ForbiddenWordsSettings } from '../settings/ForbiddenWordsSettings';
import { LetterCaseSettings } from '../settings/LetterCaseSettings';
import { PunctuationSettings } from '../settings/PunctuationSettings';
import { QuotesSettings } from '../settings/QuotesSettings';
import { MeasurementSettings } from '../settings/MeasurementSettings';
import { TagSettings } from '../settings/TagSettings';
import { NumberSettings } from '../settings/NumberSettings';
import { ConsistencySettings } from '../settings/ConsistencySettings';
import { TerminologySettings } from '../settings/TerminologySettings';
import { UserDefinedChecks } from '../settings/UserDefinedChecks';
import { ProfileManager } from '../settings/ProfileManager';
import { QAReportDashboard } from '../qa/QAReportDashboard';

export const EditorLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('files');
  const currentProject = useTmxStore(state => state.currentProject);
  const rightPanelCollapsed = useTmxStore(state => state.rightPanelCollapsed);
  const setRightPanelCollapsed = useTmxStore(state => state.setRightPanelCollapsed);
  const isMobile = useIsMobile();

  // Auto-collapse panels on smaller screens
  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true);
      setRightPanelCollapsed(true);
    }
  }, [isMobile, setRightPanelCollapsed]);

  // Determine if we are in Full Screen modes or Editor mode
  const isSettingsMode = activeTab === 'settings';
  const isQAReportMode = activeTab === 'qa';

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden text-sm bg-background">
      <Toolbar />
      {(!isSettingsMode && !isQAReportMode) && <TopPanel />}

      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Sidebar (Icon Rail) */}
        <div className="w-12 border-r bg-muted/20 flex flex-col items-center py-4 gap-4 flex-shrink-0 z-30 relative">
          <SidebarIcon
            icon={<Database />}
            label="Projects"
            active={activeTab === 'files'}
            onClick={() => { setActiveTab('files'); setSidebarCollapsed(false); }}
          />
          <SidebarIcon
            icon={<AlertTriangle />}
            label="QA Report Dashboard"
            active={activeTab === 'qa'}
            onClick={() => { setActiveTab('qa'); setSidebarCollapsed(true); }}
          />
          <SidebarIcon
            icon={<Settings />}
            label="QA Settings"
            active={activeTab === 'settings'}
            onClick={() => { setActiveTab('settings'); setSidebarCollapsed(true); }}
          />
          <div className="mt-auto flex flex-col gap-4">
            <SidebarIcon
              icon={<History />}
              label="Timeline"
              active={activeTab === 'history'}
              onClick={() => { setActiveTab('history'); setSidebarCollapsed(false); }}
            />
          </div>
        </div>

        {/* Dynamic Context Sidebar */}
        {!sidebarCollapsed && !isSettingsMode && !isQAReportMode && (
          <div className={cn(
            "border-r flex flex-col bg-card flex-shrink-0 animate-in slide-in-from-left duration-200 shadow-sm z-20",
            isMobile ? "absolute inset-y-0 left-12 right-0 bg-background/95 backdrop-blur-md" : "w-80"
          )}>
            <div className="p-3 h-10 border-b flex justify-between items-center bg-muted/30">
              <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                {activeTab === 'qa' ? 'QA Report' : activeTab === 'settings' ? 'QA Preferences' : 'Project Explorer'}
              </span>
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="p-1 hover:bg-muted rounded-full transition-colors"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {activeTab === 'files' && <ProjectExplorerPanel />}
              {activeTab === 'history' && <TimelinePanel />}
            </div>

            <div className="p-3 border-t bg-muted/20">
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <Activity className="w-3 3 text-green-500" />
                <span>Persistent Cache: ENABLED</span>
              </div>
            </div>
          </div>
        )}

        {sidebarCollapsed && !isMobile && !isSettingsMode && !isQAReportMode && (
          <div
            className="w-1 bg-muted border-r hover:bg-primary/20 cursor-pointer flex items-center justify-center group transition-colors z-20"
            onClick={() => setSidebarCollapsed(false)}
          >
            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-primary -ml-1 transition-opacity" />
          </div>
        )}

        {/* Editor Central Workspace */}
        <main className="flex-1 flex flex-col overflow-hidden relative bg-background">
          {isSettingsMode ? (
            <div className="flex-1 flex flex-col bg-card animate-in fade-in duration-300 overflow-hidden">
              <div className="p-6 border-b bg-muted/10 shrink-0">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">QA Preferences & Engine Rules</h2>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mt-1">Configure global validation parameters for automated audits</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('files')} className="gap-2 font-bold text-[10px] uppercase">
                    <Database className="w-3.5 h-3.5" /> Return to Projects
                  </Button>
                </div>
              </div>
              <ProfileManager />
              <QASettingsPanel />
            </div>
          ) : isQAReportMode ? (
            <QAReportDashboard />
          ) : (
            <EditorGrid />
          )}
        </main>

        {/* Right Panel (Inspector) */}
        {!rightPanelCollapsed && !isSettingsMode && !isQAReportMode && (
          <aside className={cn(
            "flex-shrink-0 flex h-full border-l animate-in slide-in-from-right duration-200 shadow-sm z-20 bg-card",
            isMobile ? "absolute inset-y-0 right-0 left-12 bg-background/95 backdrop-blur-md" : "w-[300px]"
          )}>
            <PropertiesPanel />
          </aside>
        )}
      </div>

      <footer className="h-6 bg-muted border-t text-muted-foreground flex items-center px-4 text-[10px] font-medium justify-between flex-shrink-0 overflow-hidden">
        <div className="flex items-center gap-4 truncate">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></span>
            <span className="hidden sm:inline">Local Database Active</span>
          </div>
          <span className="opacity-50 hidden sm:inline">|</span>
          <span className="truncate">{currentProject?.name || 'No Project Open'}</span>
          {currentProject && !isMobile && (
            <>
              <span className="opacity-50">|</span>
              <span>Source: {currentProject.sourceLang}</span>
              <span className="opacity-50">|</span>
              <span>Target: {currentProject.targetLangs.join(', ')}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-4 flex-shrink-0 ml-2">
          <span className="hidden md:flex items-center gap-1"><Monitor className="w-3 h-3" /> Virtual Render</span>
          <span className="opacity-50 hidden md:inline">|</span>
          <span>UTF-8</span>
          <span className="opacity-50 hidden sm:inline">|</span>
          <span className="hidden sm:inline">TMX 1.4b</span>
        </div>
      </footer>

      <CommandPalette />
    </div>
  );
};

const SidebarIcon = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    title={label}
    className={cn(
      "p-2 rounded-md transition-all hover:bg-primary/10 group relative",
      active ? "text-primary bg-primary/10" : "text-muted-foreground"
    )}
  >
    {React.cloneElement(icon as React.ReactElement<any>, { size: 18, className: cn(active ? "stroke-[2.5px]" : "stroke-[2px]") })}
    {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary rounded-r" />}
  </button>
);

const QASettingsPanel = () => {
  const { qaSettings, setQaSettings, currentProject } = useTmxStore();
  return (
    <div className="flex-1 flex flex-col bg-card overflow-hidden">
      <ScrollArea className="flex-1 custom-scrollbar">
        <div className="p-6 max-w-6xl mx-auto">
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-6">QA Engine Configuration</h4>
          <Accordion type="multiple" className="w-full space-y-4 pb-20">
            <AccordionItem value="omissions" className="border rounded-lg bg-muted/5 px-4">
              <AccordionTrigger className="py-4 text-sm font-bold uppercase tracking-wider hover:no-underline">Omissions & Completeness</AccordionTrigger>
              <AccordionContent>
                <OmissionSettings settings={qaSettings} onChange={setQaSettings} />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="untranslatables" className="border rounded-lg bg-muted/5 px-4">
              <AccordionTrigger className="py-4 text-sm font-bold uppercase tracking-wider hover:no-underline">Untranslatable Terms & IDs</AccordionTrigger>
              <AccordionContent>
                <UntranslatableSettings settings={qaSettings} onChange={setQaSettings} />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="forbidden" className="border rounded-lg bg-muted/5 px-4">
              <AccordionTrigger className="py-4 text-sm font-bold uppercase tracking-wider hover:no-underline">Forbidden Expressions</AccordionTrigger>
              <AccordionContent>
                <ForbiddenWordsSettings settings={qaSettings} onChange={setQaSettings} />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="lettercase" className="border rounded-lg bg-muted/5 px-4">
              <AccordionTrigger className="py-4 text-sm font-bold uppercase tracking-wider hover:no-underline">Letter Case & Special Casing</AccordionTrigger>
              <AccordionContent>
                <LetterCaseSettings settings={qaSettings} onChange={setQaSettings} />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="punctuation" className="border rounded-lg bg-muted/5 px-4">
              <AccordionTrigger className="py-4 text-sm font-bold uppercase tracking-wider hover:no-underline">Punctuation & Spacing</AccordionTrigger>
              <AccordionContent>
                <PunctuationSettings settings={qaSettings} onChange={setQaSettings} targetLang={currentProject?.targetLangs[0]} />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="quotes" className="border rounded-lg bg-muted/5 px-4">
              <AccordionTrigger className="py-4 text-sm font-bold uppercase tracking-wider hover:no-underline">Quotes & Apostrophes</AccordionTrigger>
              <AccordionContent>
                <QuotesSettings settings={qaSettings} onChange={setQaSettings} targetLang={currentProject?.targetLangs[0]} />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="measurements" className="border rounded-lg bg-muted/5 px-4">
              <AccordionTrigger className="py-4 text-sm font-bold uppercase tracking-wider hover:no-underline">Measurements & Spacing</AccordionTrigger>
              <AccordionContent>
                <MeasurementSettings settings={qaSettings} onChange={setQaSettings} targetLang={currentProject?.targetLangs[0]} />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="tags" className="border rounded-lg bg-muted/5 px-4">
              <AccordionTrigger className="py-4 text-sm font-bold uppercase tracking-wider hover:no-underline">Tags</AccordionTrigger>
              <AccordionContent>
                <TagSettings settings={qaSettings} onChange={setQaSettings} />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="numbers" className="border rounded-lg bg-muted/5 px-4">
              <AccordionTrigger className="py-4 text-sm font-bold uppercase tracking-wider hover:no-underline">Numbers & Ranges</AccordionTrigger>
              <AccordionContent>
                <NumberSettings settings={qaSettings} onChange={setQaSettings} targetLang={currentProject?.targetLangs[0]} />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="consistency" className="border rounded-lg bg-muted/5 px-4">
              <AccordionTrigger className="py-4 text-sm font-bold uppercase tracking-wider hover:no-underline">Consistency & Repetitions</AccordionTrigger>
              <AccordionContent>
                <ConsistencySettings settings={qaSettings} onChange={setQaSettings} />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="terminology" className="border rounded-lg bg-muted/5 px-4">
              <AccordionTrigger className="py-4 text-sm font-bold uppercase tracking-wider hover:no-underline">Terminology & Glossaries</AccordionTrigger>
              <AccordionContent>
                <TerminologySettings settings={qaSettings} onChange={setQaSettings} />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="userchecks" className="border rounded-lg bg-muted/5 px-4">
              <AccordionTrigger className="py-4 text-sm font-bold uppercase tracking-wider hover:no-underline flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                User-defined checks
              </AccordionTrigger>
              <AccordionContent>
                <UserDefinedChecks />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </ScrollArea>
    </div>
  );
};

const ProjectExplorerPanel = () => {
  const {
    projects,
    loadProject,
    deleteProject,
    clearAllProjects,
    currentProject,
    projectFiles,
    activeFileId,
    setActiveFileId
  } = useTmxStore();

  const handleClearAll = () => { if (confirm("Are you sure? This will delete all projects and data.")) { clearAllProjects(); toast({ title: "Cache Cleared" }); } };
  const handleDeleteProject = (id: string, name: string) => { if (confirm(`Delete project "${name}"?`)) { deleteProject(id); toast({ title: "Project Deleted" }); } };

  const otherProjects = projects.filter(p => p.id !== currentProject?.id);

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Current Project Files */}
      <div className="p-4 border-b bg-muted/10">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
          <Database className="w-3 h-3 text-primary" />
          Project Files
        </h4>
        <p className="text-[10px] text-muted-foreground truncate">{currentProject?.name}</p>
      </div>
      <ScrollArea className="flex-1 custom-scrollbar">
        <div className="p-2 space-y-1">
          {projectFiles.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-[10px] text-muted-foreground italic">No files in this project.</p>
            </div>
          ) : (
            <>
              <div
                key="all-files"
                className={cn(
                  "p-2 border rounded-md text-[11px] hover:bg-muted cursor-pointer transition-all group relative",
                  !activeFileId && "border-primary bg-primary/5 ring-1 ring-primary/20"
                )}
                onClick={() => setActiveFileId(null)}
              >
                <div className="font-bold truncate text-foreground">All Files</div>
                <div className="text-[9px] text-muted-foreground">{currentProject?.segmentCount} Segments</div>
              </div>
              {projectFiles.map(file => (
                <div
                  key={file.id}
                  className={cn(
                    "p-2 border rounded-md text-[11px] hover:bg-muted cursor-pointer transition-all group relative",
                    activeFileId === file.id && "border-primary bg-primary/5 ring-1 ring-primary/20"
                  )}
                  onClick={() => setActiveFileId(file.id)}
                >
                  <div className="font-bold truncate text-foreground">{file.name}</div>
                  <div className="text-[9px] text-muted-foreground">{file.segmentCount} Segments</div>
                </div>
              ))}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Other Projects */}
      <div className="p-4 border-y bg-muted/10 flex items-center justify-between">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-widest">Other Projects</h4>
        <Button variant="ghost" size="sm" onClick={handleClearAll} className="h-6 text-[9px] font-bold uppercase tracking-tighter text-destructive hover:bg-destructive/10 px-2">Clear All</Button>
      </div>
      <ScrollArea className="flex-1 custom-scrollbar">
        <div className="p-2 space-y-1">
          {otherProjects.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-[10px] text-muted-foreground italic">No other projects found.</p>
            </div>
          ) : (
            otherProjects.sort((a, b) => new Date(b.lastOpened).getTime() - new Date(a.lastOpened).getTime()).map(project => (
              <div
                key={project.id}
                className="p-2 bg-muted/50 border rounded text-[11px] hover:bg-muted cursor-pointer transition-all group relative pr-8"
                onClick={() => loadProject(project.id)}
              >
                <div className="font-bold truncate text-foreground">{project.name}</div>
                <div className="flex items-center justify-between mt-1 text-[9px] text-muted-foreground">
                  <span>{project.segmentCount} Segments</span>
                  <span>{formatBytes(0)}</span>
                </div>
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="w-6 h-6 rounded-md hover:bg-muted-foreground/10 text-destructive" onClick={() => handleDeleteProject(project.id, project.name)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

const TimelinePanel = () => <div className="p-4 text-xs text-muted-foreground italic">Revision history tracking active.</div>;



"use client"

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Panel,
  PanelGroup,
  PanelResizeHandle
} from 'react-resizable-panels';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTmxStore } from '@/hooks/use-tmx-store';
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  History as HistoryIcon,
  ChevronRight,
  ShieldCheck,
  Columns,
  MessageSquare,
  Eye,
  Type,
  LayoutGrid,
  Languages,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CommonTab } from './CommonTab';
import { ConsistencyTab } from './ConsistencyTab';
import { TerminologyTab } from './TerminologyTab';
import { UserDefinedTab } from './UserDefinedTab';
import { SearchTab } from './SearchTab';
import { HistoryTab } from './HistoryTab';
import { IntegratedEditor } from './IntegratedEditor';
import { LqaExportButton } from './LqaExportButton';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { getLanguageName } from '@/lib/locale-registry';
import { langMatch } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel
} from '@/components/ui/select';
import { useBatchActions } from '@/hooks/use-batch-actions';
import { LanguageSet } from '@/lib/types';

export const QAReportDashboard = () => {
  // anasoumadi: Hooking into the global TMX store for real-time project state
  const {
    segments,
    runProjectQA,
    isLoading,
    currentProject,
    projectLanguageSets,
    qaSelection,
    batchToggleIssueIgnore,
  } = useTmxStore();

  const get = useTmxStore.getState;

  const [activeTab, setActiveTab] = useState('common');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedLanguagePair, setSelectedLanguagePair] = useState<string>('all');

  const [visibleColumns, setVisibleColumns] = useState({
    match: false,
    status: true,
    lang: false,
    comment: true,
    id: true,
    resource: true,
    ignored: false
  });

  const [commonTabExpandedItems, setCommonTabExpandedItems] = useState<string[]>([]);
  const [sortAZ, setSortAZ] = useState(false);
  const allIssueCodesInCommonTabRef = useRef<string[]>([]);

  useEffect(() => {
    setVisibleColumns(cols => ({ ...cols, lang: currentProject?.type === 'multilingual' }));
    if (currentProject?.type === 'monolingual') {
      setSelectedLanguagePair('all');
    }
  }, [currentProject]);

  const filteredQaSegments = useMemo(() => {
    if (selectedLanguagePair === 'all') {
      return segments;
    }
    const [src, tgt] = selectedLanguagePair.split('___');
    return segments.filter(s =>
      langMatch(s.sourceLang, src) &&
      langMatch(s.targetLang, tgt)
    );
  }, [segments, selectedLanguagePair]);

  // AS: Groups issues by error code for the 'Common' tab.
  const commonTabIssuesByCode = useMemo(() => {
    const groups: Record<string, { code: string, message: string, items: any[] }> = {};
    const otherTabCodes = [
      'Target inconsistency', 'Source inconsistency',
      'Terminology violation', 'Terminology count mismatch', 'Forbidden term detected',
      'User check'
    ];

    filteredQaSegments.forEach(s => {
      s.qaIssues?.forEach(issue => {
        if (otherTabCodes.includes(issue.code)) return;
        if (!groups[issue.code]) groups[issue.code] = { code: issue.code, message: issue.message, items: [] };
        groups[issue.code].items.push({ ...s, issue });
      });
    });

    let result = Object.values(groups);
    if (sortAZ) result.sort((a, b) => a.code.localeCompare(b.code));
    else result.sort((a, b) => b.items.length - a.items.length);

    allIssueCodesInCommonTabRef.current = result.map(g => g.code);
    return result;
  }, [filteredQaSegments, sortAZ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const keys = Array.from(get().qaSelection);
        if (keys.length > 0) {
          get().batchToggleIssueIgnore(keys);
          toast({ title: `Toggled ${keys.length} issue(s)` });
        }
      }
      if (activeTab === 'common') {
        if (e.key === 'ArrowRight' && e.shiftKey) {
          e.preventDefault();
          setCommonTabExpandedItems(allIssueCodesInCommonTabRef.current);
        }
        if (e.key === 'ArrowLeft' && e.shiftKey) {
          e.preventDefault();
          setCommonTabExpandedItems([]);
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, get]);


  const issueCounts = useMemo(() => {
    const commonCodesExcl = [
      'Target inconsistency', 'Source inconsistency',
      'Terminology violation', 'Terminology count mismatch', 'Forbidden term detected',
      'User check'
    ];

    const countIssues = (codes: string[], include: boolean) =>
      filteredQaSegments.reduce((acc, s) => acc + (s.qaIssues?.filter(i =>
        !i.isIgnored &&
        (include ? codes.includes(i.code) : !codes.includes(i.code))
      ).length || 0), 0);

    return {
      common: countIssues(commonCodesExcl, false),
      consistency: countIssues(['Target inconsistency', 'Source inconsistency'], true),
      terminology: countIssues(['Terminology violation', 'Terminology count mismatch', 'Forbidden term detected'], true),
      user: countIssues(['User check'], true)
    };
  }, [filteredQaSegments]);

  const activeLanguageSet: LanguageSet | null = useMemo(() => {
    if (selectedLanguagePair === 'all') return null;
    const [src, tgt] = selectedLanguagePair.split('___');
    return { src, tgt };
  }, [selectedLanguagePair]);

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
      <PanelGroup direction="vertical">
        <Panel defaultSize={60} minSize={30}>
          <div className="h-full flex flex-col border-b overflow-hidden">

            {/* Header Tabs */}
            <div className="flex items-center justify-between px-4 bg-muted/20 border-b shrink-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                <TabsList className="bg-transparent h-10 p-0 gap-1">
                  <DashboardTab value="common" label="Common" count={issueCounts.common} icon={<CheckCircle2 />} />
                  <DashboardTab value="consistency" label="Consistency" count={issueCounts.consistency} icon={<RefreshCw />} />
                  <DashboardTab value="terminology" label="Terminology" count={issueCounts.terminology} icon={<LayoutGrid />} />
                  <DashboardTab value="user" label="User-defined" count={issueCounts.user} icon={<ShieldCheck />} />
                  <DashboardTab value="search" label="Search" icon={<Search />} />
                  <DashboardTab value="history" label="History of changes" icon={<HistoryIcon />} />
                </TabsList>
              </Tabs>

              <div className="flex items-center gap-2">
                {currentProject?.type === 'multilingual' && (
                  <Select value={selectedLanguagePair} onValueChange={setSelectedLanguagePair}>
                    <SelectTrigger className="h-7 w-52 text-[10px] font-bold uppercase bg-background">
                      <div className="flex items-center gap-2">
                        <Languages className="w-3.5 h-3.5" />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-[10px] font-bold uppercase">All Project Languages</SelectItem>
                      <SelectGroup>
                        <SelectLabel className="text-[9px] uppercase font-black text-primary/70">Language Pairs</SelectLabel>
                        {projectLanguageSets.map((set, idx) => (
                          <SelectItem key={idx} value={`${set.src}___${set.tgt}`} className="text-[10px] font-bold uppercase">
                            {getLanguageName(set.src)} → {getLanguageName(set.tgt)}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
                <LqaExportButton />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => runProjectQA(selectedLanguagePair)}
                  disabled={isLoading}
                  className="h-7 text-[10px] font-bold uppercase gap-2"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
                  Run audit
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className={cn("h-7 w-7", sidebarOpen && "text-primary bg-primary/10")}
                >
                  <Columns className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Results Area */}
            <Tabs value={activeTab} className="flex-1 flex flex-col min-h-0">
              <TabsContent value="common" className="m-0 flex-1 min-h-0">
                <CommonTab
                  segments={filteredQaSegments}
                  visibleColumns={visibleColumns}
                  expandedItems={commonTabExpandedItems}
                  setExpandedItems={setCommonTabExpandedItems}
                  allIssueCodes={allIssueCodesInCommonTabRef.current}
                  sortAZ={sortAZ}
                  setSortAZ={setSortAZ}
                  languageSet={activeLanguageSet}
                />
              </TabsContent>
              <TabsContent value="consistency" className="m-0 flex-1 min-h-0">
                <ConsistencyTab segments={filteredQaSegments} visibleColumns={visibleColumns} />
              </TabsContent>
              <TabsContent value="terminology" className="m-0 flex-1 min-h-0">
                <TerminologyTab segments={filteredQaSegments} visibleColumns={visibleColumns} />
              </TabsContent>
              <TabsContent value="user" className="m-0 flex-1 min-h-0">
                <UserDefinedTab segments={filteredQaSegments} visibleColumns={visibleColumns} />
              </TabsContent>
              <TabsContent value="search" className="m-0 flex-1 min-h-0">
                <SearchTab segments={filteredQaSegments} visibleColumns={visibleColumns} />
              </TabsContent>
              <TabsContent value="history" className="m-0 flex-1 min-h-0">
                <HistoryTab visibleColumns={visibleColumns} />
              </TabsContent>

              {/* Column Sidebar */}
              {sidebarOpen && (
                <div className="absolute top-0 right-0 bottom-0 w-48 bg-card border-l shadow-2xl z-50 p-4 animate-in slide-in-from-right duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Customize view</span>
                    <button onClick={() => setSidebarOpen(false)}><ChevronRight className="w-4 h-4" /></button>
                  </div>
                  <div className="space-y-3">
                    <ColumnToggle id="match" label="Match %" checked={visibleColumns.match} onChange={(v) => setVisibleColumns(prev => ({ ...prev, match: v }))} />
                    <ColumnToggle id="status" label="Segment status" checked={visibleColumns.status} onChange={(v) => setVisibleColumns(prev => ({ ...prev, status: v }))} />
                    <ColumnToggle id="lang" label="Source language" checked={visibleColumns.lang} onChange={(v) => setVisibleColumns(prev => ({ ...prev, lang: v }))} />
                    <ColumnToggle id="comment" label="Comment" checked={visibleColumns.comment} onChange={(v) => setVisibleColumns(prev => ({ ...prev, comment: v }))} />
                    <ColumnToggle id="id" label="TU ID" checked={visibleColumns.id} onChange={(v) => setVisibleColumns(prev => ({ ...prev, id: v }))} />
                    <ColumnToggle id="resource" label="Resource name" checked={visibleColumns.resource} onChange={(v) => setVisibleColumns(prev => ({ ...prev, resource: v }))} />
                    <ColumnToggle id="ignored" label="Ignored by" checked={visibleColumns.ignored} onChange={(v) => setVisibleColumns(prev => ({ ...prev, ignored: v }))} />
                  </div>
                </div>
              )}
            </Tabs>
          </div>
        </Panel>

        <PanelResizeHandle className="h-1 bg-border/50 hover:bg-primary/30 transition-colors cursor-row-resize" />

        <Panel defaultSize={40} minSize={20}>
          <div className="h-full bg-card">
            <IntegratedEditor />
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
};

const DashboardTab = ({ value, label, count, icon }: { value: string, label: string, count?: number, icon: React.ReactNode }) => (
  <TabsTrigger
    value={value}
    className="h-10 data-[state=active]:bg-background data-[state=active]:border-x border-b-2 data-[state=active]:border-b-primary rounded-none px-4 text-xs font-bold gap-2 text-muted-foreground transition-all"
  >
    {React.cloneElement(icon as React.ReactElement<any>, { className: "w-3.5 h-3.5" })}
    <span className="tracking-tight">{label}</span>
    {count !== undefined && count > 0 && (
      <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-full text-[10px] font-black">{count}</span>
    )}
  </TabsTrigger>
);

const ColumnToggle = ({ id, label, checked, onChange }: { id: string, label: string, checked: boolean, onChange: (v: boolean) => void }) => (
  <div className="flex items-center space-x-2">
    <Checkbox id={`col-${id}`} checked={checked} onCheckedChange={onChange} className="scale-75" />
    <Label htmlFor={`col-${id}`} className="text-[10px] font-bold uppercase cursor-pointer text-muted-foreground hover:text-foreground">{label}</Label>
  </div>
);

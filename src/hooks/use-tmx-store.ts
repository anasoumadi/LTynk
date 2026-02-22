
import { create } from 'zustand';
import {
  TranslationUnit,
  Project,
  TUStatus,
  GlossaryTerm,
  Glossary,
  QASettings,
  BatchConfig,
  CustomFilter,
  BuiltInFilterType,
  UserDefinedCheck,
  QAProfile,
  ProjectFile,
  LanguageSet
} from '@/lib/types';
import { db } from '@/lib/db';
import { runQA, DEFAULT_QA_SETTINGS } from '@/lib/qa-utils';
import { processUnitBatch } from '@/lib/batch-utils';
import { matchBuiltInFilter, matchCustomFilter, stripTags } from '@/lib/filter-engine';
import { normalizeForConsistency, validateConsistency } from '@/lib/consistency-validator';
import { getSettingsForLocale, getLanguageName } from '@/lib/locale-registry';
import { toast } from '@/hooks/use-toast';
import { validateQAProfile } from '@/lib/profile-validator';
import { langMatch } from '@/lib/utils';

export type SearchMode = 'normal' | 'regex' | 'wildcard';

export interface HistoryItem {
  id: string;
  segments: TranslationUnit[];
  timestamp: Date;
  description: string;
}

interface ConsistencySets {
  repetitions: Set<string>;
  inconsistentTargets: Set<string>;
  inconsistentSources: Set<string>;
}

interface TmxState {
  currentProject: Project | null;
  projects: Project[];
  segments: TranslationUnit[];
  filteredSegments: TranslationUnit[];
  projectFiles: ProjectFile[];
  activeFileId: string | null;
  projectLanguageSets: LanguageSet[];
  activeLanguageSet: LanguageSet | null;
  undoStack: HistoryItem[];
  redoStack: HistoryItem[];
  history: HistoryItem[];
  glossaries: Glossary[];
  activeGlossaryId: string | null;
  qaSettings: QASettings;
  isLoading: boolean;
  qaProgress: number;
  isInitializing: boolean;
  showHiddenFormatting: boolean;
  rightPanelCollapsed: boolean;
  selectedSegmentId: string | null;
  selectedSegmentIds: string[];
  selectedIssueId: string | null;
  lastSelectedId: string | null;

  qaSelection: Set<string>;
  qaSelectionAnchor: string | null;

  profiles: QAProfile[];
  activeProfileId: string | null;

  consistencySets: ConsistencySets | null;

  sourceQuery: string;
  targetQuery: string;
  sourceSearchMode: SearchMode;
  targetSearchMode: SearchMode;

  activeFilterType: BuiltInFilterType;
  ignoreCase: boolean;
  ignoreTags: boolean;
  customFilters: CustomFilter[];
  activeCustomFilterId: string | null;

  statusFilter: TUStatus | 'all';

  initStore: () => Promise<void>;
  fetchProjects: () => Promise<void>;
  createProject: (project: Project, projectFiles: ProjectFile[], segments: TranslationUnit[]) => Promise<void>;
  loadProject: (projectId: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  duplicateProject: (projectId: string) => Promise<void>;
  clearAllProjects: () => Promise<void>;
  closeProject: () => void;
  setProject: (project: Project | null) => void;
  setSegments: (segments: TranslationUnit[]) => void;
  updateSegment: (id: string, updates: Partial<TranslationUnit>, skipHistory?: boolean) => Promise<void>;
  updateSegments: (ids: string[], updates: Partial<TranslationUnit>, description?: string) => Promise<void>;
  batchUpdateSegments: (updates: TranslationUnit[], description: string) => Promise<void>;
  deleteSegment: (id: string) => Promise<void>;
  deleteSegments: (ids: string[]) => Promise<void>;
  setSelectedSegment: (id: string | null) => void;
  setSelectedIssueId: (id: string | null) => void;
  toggleSegmentSelection: (id: string, isMulti: boolean, isRange: boolean) => void;

  toggleQaSelectionItem: (key: string) => void;

  clearQaSelection: () => void;
  batchToggleIssueIgnore: (keys?: string[], shouldIgnore?: boolean) => Promise<void>;

  setSourceQuery: (query: string) => void;
  setTargetQuery: (query: string) => void;
  setSourceSearchMode: (mode: SearchMode) => void;
  setTargetSearchMode: (mode: SearchMode) => void;

  setActiveFilterType: (type: BuiltInFilterType) => void;
  setIgnoreCase: (ignore: boolean) => void;
  setIgnoreTags: (ignore: boolean) => void;
  addCustomFilter: (filter: CustomFilter) => void;
  deleteCustomFilter: (id: string) => void;
  setActiveCustomFilterId: (id: string | null) => void;
  setActiveFileId: (fileId: string | null) => void;
  setActiveLanguageSet: (languageSet: LanguageSet | null) => void;

  setStatusFilter: (filter: TUStatus | 'all') => void;
  setQaSettings: (settings: Partial<QASettings>) => void;
  setIsLoading: (loading: boolean) => void;
  setShowHiddenFormatting: (show: boolean) => void;
  setRightPanelCollapsed: (collapsed: boolean) => void;

  fetchGlossaries: () => Promise<void>;
  addGlossary: (glossary: Glossary) => Promise<void>;
  deleteGlossary: (id: string) => Promise<void>;
  setActiveGlossaryId: (id: string | null) => void;
  updateGlossaryTerms: (id: string, terms: GlossaryTerm[]) => Promise<void>;

  fetchUserChecks: () => Promise<void>;
  addUserCheck: (check: UserDefinedCheck) => Promise<void>;
  updateUserCheck: (id: string, updates: Partial<UserDefinedCheck>) => Promise<void>;
  deleteUserCheck: (id: string) => Promise<void>;
  setUserChecks: (checks: UserDefinedCheck[]) => void;

  fetchProfiles: () => Promise<void>;
  saveProfile: (name: string, isNew?: boolean) => Promise<void>;
  loadProfile: (id: string) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  importProfile: (file: File) => Promise<void>;
  exportProfile: (id: string) => void;

  applyLocaleDefaults: (locale: string) => void;

  applyFilters: () => void;
  runProjectQA: (languagePair?: string) => Promise<void>;
  analyzeConsistency: () => void;

  ignoreIssueGroup: (code: string, ignore: boolean, languageSet: LanguageSet | null) => Promise<void>;
  toggleIssueIgnore: (segmentId: string, issueId: string) => Promise<void>;

  copySourceToTarget: (id: string) => Promise<void>;
  copySourceToTargetBatch: (ids: string[]) => Promise<void>;
  clearTarget: (id: string) => Promise<void>;
  clearTargetBatch: (ids: string[]) => Promise<void>;
  toggleLock: (id: string) => Promise<void>;
  toggleLockBatch: (ids: string[]) => Promise<void>;
  approveBatch: (ids: string[]) => Promise<void>;
  concordanceSearch: (id: string) => void;
  placeTags: (id: string) => Promise<void>;

  createSnapshot: (description: string) => void;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  restoreSnapshot: (historyId?: string) => Promise<void>;
  runBatchTransform: (config: BatchConfig, onProgress: (p: number) => void) => Promise<{ modified: number }>;
}

const MAX_HISTORY = 50;

// AS: Re-validates consistency across all segments when certain settings or data changes.
// Using a Map for O(n) complexity to avoid nested loops over the entire segment list.
const revalidateAllConsistency = (segmentsToValidate: TranslationUnit[], globalSettings: QASettings): TranslationUnit[] => {
  // Clear all old consistency issues first
  segmentsToValidate.forEach(s => {
    if (s.qaIssues) {
      s.qaIssues = s.qaIssues.filter(i => i.code !== 'Target inconsistency' && i.code !== 'Source inconsistency');
    }
  });

  // Group segments by language pair
  const segmentsByLangPair = new Map<string, TranslationUnit[]>();
  segmentsToValidate.forEach(s => {
    const key = `${s.sourceLang}-${s.targetLang}`;
    if (!segmentsByLangPair.has(key)) {
      segmentsByLangPair.set(key, []);
    }
    segmentsByLangPair.get(key)!.push(s);
  });

  // Re-validate consistency for each language group
  for (const langSegments of segmentsByLangPair.values()) {
    if (langSegments.length === 0) continue;
    const targetLang = langSegments[0].targetLang;
    const localeSettings = getSettingsForLocale(targetLang);
    const finalSettings = { ...globalSettings, ...localeSettings };
    validateConsistency(langSegments, finalSettings, targetLang);
  }

  return segmentsToValidate;
}

// anasoumadi: The primary state store for the entire application.
// We use Zustand for high-performance reactive updates and Dexie.js for IndexedDB persistence.
// This architecture ensures a 100% local-first experience with zero latency on data operations.
export const useTmxStore = create<TmxState>((set, get) => ({
  currentProject: null,
  projects: [],
  segments: [],
  filteredSegments: [],
  projectFiles: [],
  activeFileId: null,
  projectLanguageSets: [],
  activeLanguageSet: null,
  undoStack: [],
  redoStack: [],
  history: [],
  glossaries: [],
  activeGlossaryId: null,
  qaSettings: DEFAULT_QA_SETTINGS,
  isLoading: false,
  qaProgress: 0,
  isInitializing: true,
  showHiddenFormatting: false,
  rightPanelCollapsed: true,
  selectedSegmentId: null,
  selectedSegmentIds: [],
  selectedIssueId: null,
  lastSelectedId: null,

  qaSelection: new Set(),
  qaSelectionAnchor: null,

  profiles: [],
  activeProfileId: null,
  consistencySets: null,

  sourceQuery: '',
  targetQuery: '',
  sourceSearchMode: 'normal',
  targetSearchMode: 'normal',

  activeFilterType: 'all',
  ignoreCase: true,
  ignoreTags: true,
  customFilters: [],
  activeCustomFilterId: null,

  statusFilter: 'all',

  // AS: Initializes the store by loading projects, glossaries, and profiles from Dexie (IndexedDB).
  initStore: async () => {
    set({ isInitializing: true });
    try {
      await db.open();
      const projects = await db.projects.toArray();
      const glossaries = await db.glossaries.toArray();
      const userChecks = await db.userChecks.toArray();
      const profiles = await db.profiles.toArray();
      const lastProfileId = typeof window !== 'undefined' ? localStorage.getItem('last_qa_profile') : null;

      set({
        projects,
        glossaries,
        profiles,
        qaSettings: { ...get().qaSettings, userDefinedChecks: userChecks },
      });

      if (lastProfileId) {
        const p = profiles.find(pr => pr.id === lastProfileId);
        if (p) set({ qaSettings: p.settings, activeProfileId: lastProfileId });
      }

    } catch (e) {
      console.error("Store initialization failed:", e);
    } finally {
      set({ isInitializing: false });
    }
  },

  fetchProjects: async () => {
    const projects = await db.projects.toArray();
    set({ projects });
  },

  createProject: async (project, projectFiles, segments) => {
    set({ isLoading: true });
    try {
      await db.projects.put(project);
      await db.files.bulkPut(projectFiles);
      await db.segments.bulkPut(segments);

      const sets = new Map<string, LanguageSet>();
      projectFiles.forEach(f => {
        const key = `${f.sourceLang}-${f.targetLang}`;
        if (!sets.has(key)) {
          sets.set(key, { src: f.sourceLang, tgt: f.targetLang });
        }
      });
      const languageSets = Array.from(sets.values());

      set({
        currentProject: project,
        segments: segments,
        filteredSegments: segments,
        projectFiles: projectFiles,
        projectLanguageSets: languageSets,
        activeLanguageSet: languageSets[0] || null,
        activeFileId: null,
        undoStack: [],
        redoStack: [],
        history: [],
        selectedSegmentId: null,
        selectedSegmentIds: [],
        selectedIssueId: null,
        lastSelectedId: null,
      });

      await get().fetchProjects();
      get().analyzeConsistency();
      get().applyFilters();
    } catch (e) {
      console.error("Failed to create project", e);
      toast({ variant: 'destructive', title: "Database Error", description: 'Could not save project.' });
    } finally {
      set({ isLoading: false });
    }
  },

  loadProject: async (projectId) => {
    set({ isLoading: true });
    try {
      const project = await db.projects.get(projectId);
      if (project) {
        const segmentsFromDb = await db.segments.where('projectId').equals(projectId).toArray();
        const segments = segmentsFromDb.sort((a, b) => a.order - b.order);
        const files = await db.files.where('projectId').equals(projectId).toArray();
        const userChecks = await db.userChecks.toArray();

        const sets = new Map<string, LanguageSet>();
        files.forEach(f => {
          const key = `${f.sourceLang}___${f.targetLang}`;
          if (!sets.has(key)) {
            sets.set(key, { src: f.sourceLang, tgt: f.targetLang });
          }
        });
        const languageSets = Array.from(sets.values());

        set(state => ({
          currentProject: project,
          segments: segments,
          filteredSegments: segments,
          projectFiles: files,
          projectLanguageSets: languageSets,
          activeLanguageSet: languageSets[0] || null,
          activeFileId: null,
          undoStack: [],
          redoStack: [],
          history: [],
          selectedSegmentId: null,
          selectedSegmentIds: [],
          selectedIssueId: null,
          lastSelectedId: null,
          qaSettings: { ...state.qaSettings, userDefinedChecks: userChecks }
        }));

        const targetLang = project.targetLangs?.[0];
        if (targetLang && targetLang !== "UNKNOWN") {
          get().applyLocaleDefaults(targetLang);
        }

        await db.projects.update(projectId, { lastOpened: new Date() });
        await get().fetchProjects();
        get().analyzeConsistency();
        get().applyFilters();
      }
    } finally {
      set({ isLoading: false });
    }
  },

  deleteProject: async (projectId) => {
    set({ isLoading: true });
    try {
      await db.files.where('projectId').equals(projectId).delete();
      await db.segments.where('projectId').equals(projectId).delete();
      await db.projects.delete(projectId);
      if (get().currentProject?.id === projectId) {
        set({ currentProject: null, segments: [], filteredSegments: [], projectFiles: [], undoStack: [], redoStack: [], history: [] });
      }
      await get().fetchProjects();
    } finally {
      set({ isLoading: false });
    }
  },

  duplicateProject: async (projectId: string) => {
    set({ isLoading: true });
    try {
      const projectToDuplicate = await db.projects.get(projectId);
      if (!projectToDuplicate) {
        toast({ variant: 'destructive', title: 'Error', description: 'Project not found.' });
        return;
      }

      const filesToDuplicate = await db.files.where('projectId').equals(projectId).toArray();
      const segmentsToDuplicate = await db.segments.where('projectId').equals(projectId).toArray();

      const newProjectId = crypto.randomUUID();
      const newProject: Project = {
        ...projectToDuplicate,
        id: newProjectId,
        name: `${''}${projectToDuplicate.name} (Copy)`,
        lastOpened: new Date(),
        createdAt: new Date(),
      };

      const newFiles: ProjectFile[] = [];
      const newSegments: TranslationUnit[] = [];
      const fileIdMap = new Map<string, string>();

      for (const file of filesToDuplicate) {
        const newFileId = crypto.randomUUID();
        fileIdMap.set(file.id, newFileId);
        newFiles.push({
          ...file,
          id: newFileId,
          projectId: newProjectId,
        });
      }

      for (const segment of segmentsToDuplicate) {
        newSegments.push({
          ...segment,
          id: crypto.randomUUID(),
          projectId: newProjectId,
          fileId: fileIdMap.get(segment.fileId) || '',
        });
      }

      await db.projects.put(newProject);
      await db.files.bulkPut(newFiles);
      await db.segments.bulkPut(newSegments);

      await get().fetchProjects();
      toast({ title: 'Project Duplicated', description: `"${newProject.name}" has been created.` });

    } catch (e: any) {
      console.error("Failed to duplicate project", e);
      toast({ variant: 'destructive', title: "Database Error", description: 'Could not duplicate project.' });
    } finally {
      set({ isLoading: false });
    }
  },

  clearAllProjects: async () => {
    set({ isLoading: true });
    try {
      await db.files.clear();
      await db.segments.clear();
      await db.projects.clear();
      set({ currentProject: null, segments: [], filteredSegments: [], projects: [], projectFiles: [], undoStack: [], redoStack: [], history: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  closeProject: () => {
    set({
      currentProject: null,
      segments: [],
      filteredSegments: [],
      projectFiles: [],
      activeFileId: null,
      projectLanguageSets: [],
      activeLanguageSet: null,
      undoStack: [],
      redoStack: [],
      history: [],
      selectedSegmentId: null,
      selectedSegmentIds: [],
      selectedIssueId: null,
      lastSelectedId: null,
    });
    toast({ title: 'Project Closed', description: 'Returning to project dashboard.' });
  },

  setProject: (project) => {
    if (project) {
      set({ currentProject: project, undoStack: [], redoStack: [], history: [] });
      const targetLang = project.targetLangs?.[0];
      if (targetLang && targetLang !== "UNKNOWN") {
        get().applyLocaleDefaults(targetLang);
      }
    } else {
      set({ currentProject: null, segments: [], filteredSegments: [] });
    }
    get().fetchProjects();
  },

  setSegments: (segments) => {
    set({ segments: segments });
    get().analyzeConsistency();
    get().applyFilters();
  },

  // anasoumadi: Centralized segment update logic. Handles history, DB sync, and QA re-validation.
  updateSegment: async (id, updates, skipHistory = false) => {
    const { segments, qaSettings } = get();
    if (!skipHistory) get().createSnapshot('Manual edit');

    let updatedSegments = segments.map(s =>
      s.id === id ? { ...s, ...updates, lastModified: new Date() } : s
    );

    const validatedSegments = revalidateAllConsistency(updatedSegments, qaSettings);

    const tu = validatedSegments.find(s => s.id === id);
    if (tu) await db.segments.put(tu);

    set({ segments: validatedSegments });
    get().analyzeConsistency();
    get().applyFilters();
  },

  updateSegments: async (ids, updates, description = 'Batch update') => {
    const { segments, qaSettings } = get();
    get().createSnapshot(description);

    let updatedSegments = segments.map(s =>
      ids.includes(s.id) ? { ...s, ...updates, lastModified: new Date() } : s
    );

    const validatedSegments = revalidateAllConsistency(updatedSegments, qaSettings);
    const affected = validatedSegments.filter(s => ids.includes(s.id));
    await db.segments.bulkPut(affected);

    set({ segments: validatedSegments });
    get().analyzeConsistency();
    get().applyFilters();
  },

  batchUpdateSegments: async (updatedUnits, description) => {
    get().createSnapshot(description);
    const { segments, qaSettings } = get();
    const updatedMap = new Map(updatedUnits.map(u => [u.id, u]));
    let newSegments = segments.map(s => updatedMap.get(s.id) || s);

    const validatedSegments = revalidateAllConsistency(newSegments, qaSettings);
    const finalUpdatedUnits = updatedUnits.map(unit => validatedSegments.find(s => s.id === unit.id)!);
    await db.segments.bulkPut(finalUpdatedUnits);

    set({ segments: validatedSegments });
    get().analyzeConsistency();
    get().applyFilters();
  },

  deleteSegment: async (id) => {
    await get().deleteSegments([id]);
  },

  deleteSegments: async (ids) => {
    if (ids.length === 0) return;
    const { segments, currentProject } = get();
    get().createSnapshot(`Delete ${ids.length} segments`);

    await db.segments.bulkDelete(ids);
    const newSegments = segments.filter(s => !ids.includes(s.id));

    if (currentProject) {
      const newTotal = newSegments.length;
      await db.projects.update(currentProject.id, { segmentCount: newTotal });
      set({ currentProject: { ...currentProject, segmentCount: newTotal } });
    }

    set({ segments: newSegments, selectedSegmentIds: [], selectedSegmentId: null });
    get().analyzeConsistency();
    get().applyFilters();
  },

  toggleSegmentSelection: (id, isMulti, isRange) => {
    const { filteredSegments, selectedSegmentIds, lastSelectedId } = get();
    if (isRange && lastSelectedId) {
      const startIdx = filteredSegments.findIndex(s => s.id === lastSelectedId);
      const endIdx = filteredSegments.findIndex(s => s.id === id);
      const range = filteredSegments.slice(Math.min(startIdx, endIdx), Math.max(startIdx, endIdx) + 1);
      const rangeIds = range.map(s => s.id);
      const newSelection = Array.from(new Set([...selectedSegmentIds, ...rangeIds]));
      set({ selectedSegmentIds: newSelection, selectedSegmentId: id, lastSelectedId: id });
    } else if (isMulti) {
      const newSelection = selectedSegmentIds.includes(id)
        ? selectedSegmentIds.filter(sid => sid !== id)
        : [...selectedSegmentIds, id];
      set({ selectedSegmentIds: newSelection, selectedSegmentId: id, lastSelectedId: id });
    } else {
      set({ selectedSegmentIds: [id], selectedSegmentId: id, lastSelectedId: id });
    }
  },

  setSelectedSegment: (id) => set({
    selectedSegmentId: id,
    selectedSegmentIds: id ? [id] : [],
    lastSelectedId: id
  }),

  setSelectedIssueId: (id) => set({ selectedIssueId: id }),

  toggleQaSelectionItem: (key: string) => {
    set(state => {
      const newSelection = new Set(state.qaSelection);
      if (newSelection.has(key)) {
        newSelection.delete(key);
      } else {
        newSelection.add(key);
      }
      return { qaSelection: newSelection };
    });
  },

  clearQaSelection: () => set({ qaSelection: new Set(), qaSelectionAnchor: null }),

  batchToggleIssueIgnore: async (keys?: string[], shouldIgnore?: boolean) => {
    const { segments, qaSelection } = get();
    const keysToToggleSet = keys ? new Set(keys) : qaSelection;
    if (keysToToggleSet.size === 0) return;

    let finalShouldIgnore = shouldIgnore;

    if (typeof finalShouldIgnore === 'undefined') {
      const firstKey = Array.from(keysToToggleSet)[0];
      const [segmentId, issueId] = firstKey.split(':');
      const firstSegment = segments.find(s => s.id === segmentId);
      const firstIssue = firstSegment?.qaIssues?.find(i => i.id === issueId);
      finalShouldIgnore = firstIssue ? !firstIssue.isIgnored : true;
    }

    const segmentsToUpdate: TranslationUnit[] = [];

    const updatedSegments = segments.map(segment => {
      if (!segment.qaIssues || !segment.qaIssues.some(issue => keysToToggleSet.has(`${segment.id}:${issue.id}`))) {
        return segment;
      }

      let hasChanged = false;
      const newIssues = segment.qaIssues.map(issue => {
        const key = `${segment.id}:${issue.id}`;
        if (keysToToggleSet.has(key)) {
          if (issue.isIgnored !== finalShouldIgnore) {
            hasChanged = true;
            return { ...issue, isIgnored: !!finalShouldIgnore, ignoredBy: finalShouldIgnore ? 'User' : undefined };
          }
        }
        return issue;
      });

      if (hasChanged) {
        const updatedSegment = { ...segment, qaIssues: newIssues };
        segmentsToUpdate.push(updatedSegment);
        return updatedSegment;
      }
      return segment;
    });

    if (segmentsToUpdate.length > 0) {
      set({ segments: updatedSegments });
      await db.segments.bulkPut(segmentsToUpdate);
      get().applyFilters();
    }
  },

  setIsLoading: (loading) => set({ isLoading: loading }),

  setSourceQuery: (query) => { set({ sourceQuery: query }); get().applyFilters(); },
  setTargetQuery: (query) => { set({ targetQuery: query }); get().applyFilters(); },
  setSourceSearchMode: (mode) => { set({ sourceSearchMode: mode }); get().applyFilters(); },
  setTargetSearchMode: (mode) => { set({ targetSearchMode: mode }); get().applyFilters(); },

  setActiveFilterType: (type) => { set({ activeFilterType: type, activeCustomFilterId: null }); get().applyFilters(); },
  setIgnoreCase: (ignore) => { set({ ignoreCase: ignore }); get().applyFilters(); },
  setIgnoreTags: (ignore) => { set({ ignoreTags: ignore }); get().applyFilters(); },
  addCustomFilter: (filter) => set(s => ({ customFilters: [...s.customFilters, filter] })),
  deleteCustomFilter: (id) => set(s => ({
    customFilters: s.customFilters.filter(f => f.id !== id),
    activeCustomFilterId: s.activeCustomFilterId === id ? null : s.activeCustomFilterId
  })),
  setActiveCustomFilterId: (id) => { set({ activeCustomFilterId: id, activeFilterType: id ? 'custom' : 'all' }); get().applyFilters(); },

  setActiveFileId: (fileId) => {
    if (fileId === null) {
      // User selected "All Files". Clear both file and language filters to show everything.
      set({ activeFileId: null, activeLanguageSet: null });
    } else {
      // User selected a specific file. Find its language set and make it active.
      const file = get().projectFiles.find(f => f.id === fileId);
      if (file) {
        set({
          activeFileId: fileId,
          activeLanguageSet: { src: file.sourceLang, tgt: file.targetLang }
        });
      }
    }
    get().applyFilters();
  },

  setActiveLanguageSet: (languageSet) => {
    // When user switches language, clear any specific file filter.
    set({ activeLanguageSet: languageSet, activeFileId: null });
    get().analyzeConsistency();
    get().applyFilters();
  },

  setStatusFilter: (filter) => { set({ statusFilter: filter }); get().applyFilters(); },

  setQaSettings: (settings: Partial<QASettings>) => {
    set(state => ({ qaSettings: { ...state.qaSettings, ...settings } }));
  },

  setShowHiddenFormatting: (show) => set({ showHiddenFormatting: show }),
  setRightPanelCollapsed: (collapsed) => set({ rightPanelCollapsed: collapsed }),

  fetchGlossaries: async () => {
    const glossaries = await db.glossaries.toArray();
    set({ glossaries });
  },
  addGlossary: async (glossary) => {
    await db.glossaries.put(glossary);
    await get().fetchGlossaries();
  },
  deleteGlossary: async (id) => {
    await db.glossaries.delete(id);
    if (get().activeGlossaryId === id) set({ activeGlossaryId: null });
    await get().fetchGlossaries();
  },
  setActiveGlossaryId: (id) => set({ activeGlossaryId: id }),
  updateGlossaryTerms: async (id, terms) => {
    await db.glossaries.update(id, { terms });
    await get().fetchGlossaries();
  },

  fetchUserChecks: async () => {
    const checks = await db.userChecks.toArray();
    set(state => ({ qaSettings: { ...state.qaSettings, userDefinedChecks: checks } }));
  },
  addUserCheck: async (check) => {
    await db.userChecks.put(check);
    await get().fetchUserChecks();
  },
  updateUserCheck: async (id, updates) => {
    await db.userChecks.update(id, updates);
    await get().fetchUserChecks();
  },
  deleteUserCheck: async (id) => {
    await db.userChecks.delete(id);
    await get().fetchUserChecks();
  },
  setUserChecks: (checks) => set(state => ({ qaSettings: { ...state.qaSettings, userDefinedChecks: checks } })),

  fetchProfiles: async () => {
    const profiles = await db.profiles.toArray();
    set({ profiles });
  },
  saveProfile: async (name, isNew = false) => {
    const { activeProfileId, qaSettings, currentProject } = get();
    const id = isNew ? crypto.randomUUID() : (activeProfileId || crypto.randomUUID());

    const profile: QAProfile = {
      id,
      profileName: name,
      targetLocale: currentProject?.targetLangs[0] || 'en-US',
      version: '1.0',
      lastModified: new Date().toISOString(),
      settings: qaSettings
    };

    await db.profiles.put(profile);
    if (typeof window !== 'undefined') localStorage.setItem('last_qa_profile', id);
    set({ activeProfileId: id });
    await get().fetchProfiles();
    toast({ title: isNew ? "Profile Created" : "Profile Updated", description: `"${name}" has been saved.` });
  },
  loadProfile: async (id) => {
    const profile = await db.profiles.get(id);
    if (profile) {
      set({ qaSettings: profile.settings, activeProfileId: id });
      if (typeof window !== 'undefined') localStorage.setItem('last_qa_profile', id);
      toast({ title: "Profile Loaded", description: `Active rules set to "${profile.profileName}".` });
    }
  },
  deleteProfile: async (id) => {
    await db.profiles.delete(id);
    if (get().activeProfileId === id) {
      set({ activeProfileId: null });
      if (typeof window !== 'undefined') localStorage.removeItem('last_qa_profile');
    }
    await get().fetchProfiles();
  },
  importProfile: async (file) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const validated = validateQAProfile(data);
      if (validated) {
        await db.profiles.put(validated);
        await get().fetchProfiles();
        toast({ title: "Profile Imported", description: `"${validated.profileName}" is now available.` });
      } else {
        toast({ variant: "destructive", title: "Invalid Profile", description: "The JSON file does not match the QA Profile schema." });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Import Error", description: "Failed to parse JSON file." });
    }
  },
  exportProfile: (id) => {
    const profile = get().profiles.find(p => p.id === id);
    if (profile) {
      const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${profile.profileName.replace(/\s+/g, '_')}_profile.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  },

  applyFilters: () => {
    const {
      segments, activeLanguageSet,
      sourceQuery, targetQuery,
      sourceSearchMode, targetSearchMode,
      activeFilterType, statusFilter,
      ignoreCase, ignoreTags,
      customFilters, activeCustomFilterId,
      activeFileId,
      consistencySets,
      qaSettings,
      currentProject
    } = get();

    let results = [...segments];

    // Language Set filter only applies if not in "All Files" mode for multilingual projects
    if (activeLanguageSet && currentProject?.type === 'multilingual') {
      results = results.filter(s =>
        langMatch(s.sourceLang, activeLanguageSet.src) &&
        langMatch(s.targetLang, activeLanguageSet.tgt)
      );
    }

    // File filter
    if (activeFileId) {
      results = results.filter(s => s.fileId === activeFileId);
    }

    // Status filter
    if (statusFilter !== 'all') {
      results = results.filter(s => s.status === statusFilter);
    }

    // Text search
    if (sourceQuery) {
      results = results.filter(s => {
        const text = ignoreTags ? stripTags(s.source.text) : s.source.text;
        const query = ignoreCase ? sourceQuery.toLowerCase() : sourceQuery;
        const compareText = ignoreCase ? text.toLowerCase() : text;

        if (sourceSearchMode === 'regex') {
          try {
            return new RegExp(query, ignoreCase ? 'i' : '').test(compareText);
          } catch { return false; }
        } else if (sourceSearchMode === 'wildcard') {
          const regex = new RegExp('^' + query.replace(/\*/g, '.*') + '$', ignoreCase ? 'i' : '');
          return regex.test(compareText);
        }
        return compareText.includes(query);
      });
    }

    if (targetQuery) {
      results = results.filter(s => {
        const text = ignoreTags ? stripTags(s.target.text) : s.target.text;
        const query = ignoreCase ? targetQuery.toLowerCase() : targetQuery;
        const compareText = ignoreCase ? text.toLowerCase() : text;

        if (targetSearchMode === 'regex') {
          try {
            return new RegExp(query, ignoreCase ? 'i' : '').test(compareText);
          } catch { return false; }
        } else if (targetSearchMode === 'wildcard') {
          const regex = new RegExp('^' + query.replace(/\*/g, '.*') + '$', ignoreCase ? 'i' : '');
          return regex.test(compareText);
        }
        return compareText.includes(query);
      });
    }

    // Built-in & Custom filters
    if (activeCustomFilterId) {
      const filter = customFilters.find(f => f.id === activeCustomFilterId);
      if (filter) results = results.filter(s => matchCustomFilter(s, filter, ignoreCase, ignoreTags));
    } else if (activeFilterType !== 'all') {
      if (consistencySets && (activeFilterType === 'inconsistency' || activeFilterType === 'source_inconsistency' || activeFilterType === 'repetitions')) {
        const targetLang = get().activeLanguageSet?.tgt || 'en';
        if (activeFilterType === 'inconsistency') {
          results = results.filter(s => consistencySets.inconsistentTargets.has(normalizeForConsistency(s.source.text, qaSettings.targetInconsistencyOptions, targetLang)));
        } else if (activeFilterType === 'source_inconsistency') {
          results = results.filter(s => consistencySets.inconsistentSources.has(normalizeForConsistency(s.target.text, qaSettings.sourceInconsistencyOptions, targetLang)));
        } else if (activeFilterType === 'repetitions') {
          results = results.filter(s => consistencySets.repetitions.has(normalizeForConsistency(s.source.text, qaSettings.targetInconsistencyOptions, targetLang)));
        }
      } else {
        results = results.filter(s => matchBuiltInFilter(s, activeFilterType, ignoreTags));
      }
    }

    if (activeFilterType === 'inconsistency' || activeFilterType === 'source_inconsistency' || activeFilterType === 'repetitions') {
      const groupMap = new Map<string, TranslationUnit[]>();
      const targetLang = get().activeLanguageSet?.tgt || 'en';
      results.forEach(tu => {
        let key: string;
        if (activeFilterType === 'source_inconsistency') {
          key = normalizeForConsistency(tu.target.text, qaSettings.sourceInconsistencyOptions, targetLang);
        } else { // 'inconsistency' and 'repetitions' are based on source text
          key = normalizeForConsistency(tu.source.text, qaSettings.targetInconsistencyOptions, targetLang);
        }

        if (!groupMap.has(key)) groupMap.set(key, []);
        groupMap.get(key)!.push(tu);
      });

      const sortedResults: TranslationUnit[] = [];
      groupMap.forEach(group => {
        sortedResults.push(...group.sort((a, b) => a.order - b.order));
      });
      results = sortedResults;
    }

    set({ filteredSegments: results });
  },

  runProjectQA: async (languagePair = 'all') => {
    set({ isLoading: true });
    try {
      const { segments, qaSettings: globalSettings, glossaries } = get();

      const segmentsToAudit = languagePair === 'all'
        ? segments
        : segments.filter(s => {
          const [src, tgt] = languagePair.split('___');
          return langMatch(s.sourceLang, src) && langMatch(s.targetLang, tgt);
        });

      if (segmentsToAudit.length === 0) {
        toast({ title: "Nothing to Audit", description: "No segments match the selected language pair." });
        return;
      }

      const segmentsByLangPair = new Map<string, TranslationUnit[]>();
      segmentsToAudit.forEach(s => {
        const key = `${s.sourceLang}___${s.targetLang}`;
        if (!segmentsByLangPair.has(key)) segmentsByLangPair.set(key, []);
        segmentsByLangPair.get(key)!.push(s);
      });

      const activeGlossaryTerms = glossaries
        .filter(g => globalSettings.activeGlossaryIds?.includes(g.id))
        .flatMap(g => g.terms);

      for (const langSegments of segmentsByLangPair.values()) {
        if (langSegments.length === 0) continue;

        const targetLang = langSegments[0].targetLang;
        const localeSettings = getSettingsForLocale(targetLang);
        const finalSettings = { ...globalSettings, ...localeSettings };

        for (const segment of langSegments) {
          segment.qaIssues = runQA(segment, finalSettings, activeGlossaryTerms, targetLang);
        }
        validateConsistency(langSegments, finalSettings, targetLang);
      }

      const updatedSegments = segments.map(originalSegment => {
        const auditedSegment = segmentsToAudit.find(s => s.id === originalSegment.id);
        return auditedSegment || originalSegment;
      });

      await db.segments.bulkPut(segmentsToAudit); // Persist changes
      set({ segments: updatedSegments });
      get().analyzeConsistency();
      get().applyFilters();

      toast({ title: "QA Complete", description: `Linguistic audit finished for ${segmentsToAudit.length} segments.` });
    } catch (e: any) {
      console.error("QA Run failed", e);
      toast({ variant: 'destructive', title: "QA Failed", description: e.message || "An unexpected error occurred during the audit." });
    } finally {
      set({ isLoading: false });
    }
  },

  analyzeConsistency: () => {
    const { segments, qaSettings, activeLanguageSet } = get();

    let segmentsToAnalyze = segments;
    // If there's an active language set, only analyze those segments
    if (activeLanguageSet) {
      segmentsToAnalyze = segments.filter(s =>
        langMatch(s.sourceLang, activeLanguageSet.src) &&
        langMatch(s.targetLang, activeLanguageSet.tgt)
      );
    } else if (get().projectLanguageSets.length > 0) {
      // If no active set but it's a multilingual project, analyze the first set by default
      const firstSet = get().projectLanguageSets[0];
      segmentsToAnalyze = segments.filter(s =>
        langMatch(s.sourceLang, firstSet.src) &&
        langMatch(s.targetLang, firstSet.tgt)
      );
    }

    const sourceMap = new Map<string, Set<string>>();
    const targetMap = new Map<string, Set<string>>();
    const repetitions = new Set<string>();
    const inconsistentTargets = new Set<string>();
    const inconsistentSources = new Set<string>();
    const targetLang = activeLanguageSet?.tgt || get().currentProject?.targetLangs[0] || 'en';

    segmentsToAnalyze.forEach(tu => {
      const normalizedSource = normalizeForConsistency(tu.source.text, qaSettings.targetInconsistencyOptions, targetLang);
      if (!sourceMap.has(normalizedSource)) {
        sourceMap.set(normalizedSource, new Set<string>());
      } else {
        repetitions.add(normalizedSource);
      }

      const targetList = sourceMap.get(normalizedSource)!;
      const normalizedTargetForList = normalizeForConsistency(tu.target.text, qaSettings.targetInconsistencyOptions, targetLang);
      if (!targetList.has(normalizedTargetForList)) {
        targetList.add(normalizedTargetForList);
      }

      const normalizedTarget = normalizeForConsistency(tu.target.text, qaSettings.sourceInconsistencyOptions, targetLang);
      if (!targetMap.has(normalizedTarget)) {
        targetMap.set(normalizedTarget, new Set<string>());
      }

      const sourceList = targetMap.get(normalizedTarget)!;
      const normalizedSourceForList = normalizeForConsistency(tu.source.text, qaSettings.sourceInconsistencyOptions, targetLang);
      if (!sourceList.has(normalizedSourceForList)) {
        sourceList.add(normalizedSourceForList);
      }
    });

    sourceMap.forEach((targets, source) => {
      if (targets.size > 1) {
        inconsistentTargets.add(source);
      }
    });

    targetMap.forEach((sources, target) => {
      if (sources.size > 1) {
        inconsistentSources.add(target);
      }
    });

    set({ consistencySets: { repetitions, inconsistentTargets, inconsistentSources } });
  },

  ignoreIssueGroup: async (code: string, ignore: boolean, languageSet: LanguageSet | null) => {
    const { segments } = get();

    const segmentsToUpdateIds = languageSet
      ? new Set(segments.filter(s => langMatch(s.sourceLang, languageSet.src) && langMatch(s.targetLang, languageSet.tgt)).map(s => s.id))
      : new Set(segments.map(s => s.id));

    const changedSegments: TranslationUnit[] = [];

    const updated = segments.map(s => {
      if (!segmentsToUpdateIds.has(s.id)) {
        return s;
      }

      if (!s.qaIssues) return s;

      const hasRelevantIssue = s.qaIssues.some(i => i.code === code);
      if (!hasRelevantIssue) return s;

      let segmentChanged = false;
      const newIssues = s.qaIssues.map(i => {
        if (i.code === code && i.isIgnored !== ignore) {
          segmentChanged = true;
          return { ...i, isIgnored: ignore, ignoredBy: ignore ? 'User' : undefined };
        }
        return i;
      });

      if (segmentChanged) {
        const updatedSegment = { ...s, qaIssues: newIssues };
        changedSegments.push(updatedSegment);
        return updatedSegment;
      }
      return s;
    });

    if (changedSegments.length > 0) {
      set({ segments: updated });
      await db.segments.bulkPut(changedSegments);
      get().applyFilters();
    }
  },

  toggleIssueIgnore: async (segmentId: string, issueId: string) => {
    const key = `${segmentId}:${issueId}`;
    await get().batchToggleIssueIgnore([key]);
  },

  copySourceToTarget: async (id: string) => {
    const ids = get().selectedSegmentIds.includes(id) ? get().selectedSegmentIds : [id];
    await get().copySourceToTargetBatch(ids);
  },

  copySourceToTargetBatch: async (ids) => {
    const { segments } = get();
    get().createSnapshot(`Copy source to target (${ids.length} segments)`);

    const updatedSegments = segments.map(s => {
      if (ids.includes(s.id) && !s.isLocked) {
        return {
          ...s,
          target: JSON.parse(JSON.stringify(s.source)),
          status: 'translated' as TUStatus,
          lastModified: new Date()
        };
      }
      return s;
    });

    const affected = updatedSegments.filter(s => ids.includes(s.id) && !s.isLocked);
    await db.segments.bulkPut(affected);
    set({ segments: updatedSegments });
    get().analyzeConsistency();
    get().applyFilters();
  },

  clearTarget: async (id: string) => {
    const ids = get().selectedSegmentIds.includes(id) ? get().selectedSegmentIds : [id];
    await get().clearTargetBatch(ids);
  },

  clearTargetBatch: async (ids) => {
    const { segments } = get();
    get().createSnapshot(`Clear target (${ids.length} segments)`);

    const updatedSegments = segments.map(s => {
      if (ids.includes(s.id) && !s.isLocked) {
        return {
          ...s,
          target: { text: '', tags: [] },
          status: 'empty' as TUStatus,
          lastModified: new Date()
        };
      }
      return s;
    });

    const affected = updatedSegments.filter(s => ids.includes(s.id) && !s.isLocked);
    await db.segments.bulkPut(affected);
    set({ segments: updatedSegments });
    get().analyzeConsistency();
    get().applyFilters();
  },

  toggleLock: async (id: string) => {
    const ids = get().selectedSegmentIds.includes(id) ? get().selectedSegmentIds : [id];
    await get().toggleLockBatch(ids);
  },

  toggleLockBatch: async (ids) => {
    const { segments } = get();
    const firstSegment = segments.find(s => s.id === ids[0]);
    if (!firstSegment) return;

    const newLockState = !firstSegment.isLocked;
    get().createSnapshot(`${newLockState ? 'Lock' : 'Unlock'} ${ids.length} segments`);

    const updatedSegments = segments.map(s => {
      if (ids.includes(s.id)) {
        return { ...s, isLocked: newLockState, lastModified: new Date() };
      }
      return s;
    });

    const affected = updatedSegments.filter(s => ids.includes(s.id));
    await db.segments.bulkPut(affected);
    set({ segments: updatedSegments });
    get().applyFilters();
  },

  approveBatch: async (ids) => {
    const { segments, currentProject } = get();
    get().createSnapshot(`Approve ${ids.length} segments`);

    const updatedSegments = segments.map(s => {
      if (ids.includes(s.id)) {
        return { ...s, status: 'approved' as TUStatus, lastModified: new Date() };
      }
      return s;
    });

    const affected = updatedSegments.filter(s => ids.includes(s.id));
    await db.segments.bulkPut(affected);

    if (currentProject) {
      const approvedCount = updatedSegments.filter(s => s.status === 'approved').length;
      const completion = Math.round((approvedCount / updatedSegments.length) * 100);
      const updatedProject = { ...currentProject, completion };
      await db.projects.update(currentProject.id, { completion });
      set({ currentProject: updatedProject });
    }

    set({ segments: updatedSegments });
    get().applyFilters();
  },

  concordanceSearch: (id) => {
    const { segments } = get();
    const segment = segments.find(s => s.id === id);
    if (!segment) return;
    set({ sourceQuery: segment.source.text.trim(), sourceSearchMode: 'normal' });
    get().applyFilters();
  },

  placeTags: async (id: string) => {
    const { segments, updateSegment } = get();
    const segment = segments.find(s => s.id === id);
    if (!segment) {
      toast({ variant: 'destructive', title: 'Error', description: 'Segment not found.' });
      return;
    }

    if (segment.source.tags.length === 0) {
      toast({ title: 'No Tags', description: 'Source segment contains no tags to place.' });
      return;
    }

    get().createSnapshot('Place Tags');

    const targetIsEmpty = !segment.target.text.trim();

    if (targetIsEmpty) {
      // If target is empty, replace it with just the source tags
      const newText = segment.source.tags.map(t => t.id).join(' ');
      const newTags = [...segment.source.tags];
      await updateSegment(id, {
        target: { text: newText, tags: newTags },
        status: 'translated',
      }, true);
      toast({ title: 'Tags Placed', description: `All source tags were placed in the empty target.` });
    } else {
      // If target has content, append only the missing tags to be safe
      const targetTagIds = new Set(segment.target.tags.map(t => t.id));
      const missingTags = segment.source.tags.filter(t => !targetTagIds.has(t.id));

      if (missingTags.length === 0) {
        toast({ title: 'Tags Already Present', description: 'All source tags are already present in the target.' });
        return;
      }

      const newText = [segment.target.text, ...missingTags.map(t => t.id)].join(' ').trim();
      const newTags = [...segment.target.tags, ...missingTags];

      await updateSegment(id, {
        target: { text: newText, tags: newTags },
        status: segment.status === 'empty' ? 'translated' : segment.status,
      }, true);
      toast({ title: 'Missing Tags Appended', description: `${missingTags.length} missing tag(s) have been appended.` });
    }
  },

  createSnapshot: (description: string) => {
    const { segments, undoStack } = get();
    const newSnapshot: HistoryItem = { id: crypto.randomUUID(), segments: JSON.parse(JSON.stringify(segments)), timestamp: new Date(), description };
    set({ undoStack: [newSnapshot, ...undoStack].slice(0, MAX_HISTORY), history: [newSnapshot, ...undoStack].slice(0, MAX_HISTORY), redoStack: [] });
  },

  undo: async () => {
    const { undoStack, redoStack, segments } = get();
    if (undoStack.length === 0) return;
    const current = { id: crypto.randomUUID(), segments: JSON.parse(JSON.stringify(segments)), timestamp: new Date(), description: 'Before undo' };
    const previous = undoStack[0];
    set({ isLoading: true });
    try {
      await db.segments.bulkPut(previous.segments);
      set({ segments: previous.segments, undoStack: undoStack.slice(1), history: undoStack.slice(1), redoStack: [current, ...redoStack].slice(0, MAX_HISTORY) });
      get().analyzeConsistency();
      get().applyFilters();
    } finally { set({ isLoading: false }); }
  },

  redo: async () => {
    const { redoStack, undoStack, segments } = get();
    if (redoStack.length === 0) return;
    const current = { id: crypto.randomUUID(), segments: JSON.parse(JSON.stringify(segments)), timestamp: new Date(), description: 'Before redo' };
    const next = redoStack[0];
    set({ isLoading: true });
    try {
      await db.segments.bulkPut(next.segments);
      set({ segments: next.segments, redoStack: redoStack.slice(1), undoStack: [current, ...undoStack].slice(0, MAX_HISTORY), history: [current, ...undoStack].slice(0, MAX_HISTORY) });
      get().analyzeConsistency();
      get().applyFilters();
    } finally { set({ isLoading: false }); }
  },

  restoreSnapshot: async (historyId?: string) => {
    const { undoStack } = get();
    if (undoStack.length === 0) return;
    const idx = historyId ? undoStack.findIndex(h => h.id === historyId) : 0;
    if (idx !== -1) {
      const snapshot = undoStack[idx];
      set({ isLoading: true });
      try {
        await db.segments.bulkPut(snapshot.segments);
        set({ segments: snapshot.segments, undoStack: undoStack.slice(idx + 1), history: undoStack.slice(idx + 1), redoStack: [] });
        get().analyzeConsistency();
        get().applyFilters();
      } finally { set({ isLoading: false }); }
    }
  },

  runBatchTransform: async (config, onProgress) => {
    const { segments, filteredSegments } = get();
    const targetSet = config.onlyFiltered ? filteredSegments : segments;
    const resultSegments: TranslationUnit[] = [...segments];
    let modifiedCount = 0;
    const modifiedSegmentsAccumulator: TranslationUnit[] = [];

    get().createSnapshot(`Batch Transformation on ${targetSet.length} segments`);
    // AS: Chunks the transformation to prevent blocking the UI thread on large projects.
    const chunkSize = 500;
    for (let i = 0; i < targetSet.length; i += chunkSize) {
      const chunk = targetSet.slice(i, i + chunkSize);
      chunk.forEach(tu => {
        const { updatedTu, changed } = processUnitBatch(tu, config);
        if (changed) {
          modifiedCount++;
          const masterIdx = resultSegments.findIndex(s => s.id === tu.id);
          if (masterIdx !== -1) {
            resultSegments[masterIdx] = updatedTu;
            modifiedSegmentsAccumulator.push(updatedTu);
          }
        }
      });
      onProgress(Math.floor((i / targetSet.length) * 100));
      await new Promise(r => setTimeout(r, 0));
    }
    if (modifiedCount > 0) {
      await db.segments.bulkPut(modifiedSegmentsAccumulator);
      set({ segments: resultSegments });
      get().analyzeConsistency();
      get().applyFilters();
    }
    onProgress(100);
    return { modified: modifiedCount };
  },

  applyLocaleDefaults: (locale: string) => {
    if (!locale || locale === "UNKNOWN") return;
    try {
      const defaults = getSettingsForLocale(locale);
      set(state => ({ qaSettings: { ...state.qaSettings, ...defaults } }));
      toast({ title: "Linguistic Presets Applied", description: `Synchronized ${getLanguageName(locale).toUpperCase()} standards.` });
    } catch (e) { console.warn("Failed to apply locale defaults:", e); }
  }
}));

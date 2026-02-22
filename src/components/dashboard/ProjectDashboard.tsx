"use client"

import React, { useState } from 'react';
import { useTmxStore } from '@/hooks/use-tmx-store';
import { List, LayoutGrid, Plus, Folder, Clock, FileText, LanguagesIcon, MoreVertical, Copy, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImportWizard } from '../modals/ImportWizard';
import { formatBytes } from '@/lib/tmx-utils';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '../layout/ThemeToggle';
import { TooltipProvider } from '../ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { BrandLogo } from '../layout/BrandLogo';

// anasoumadi: The entry point dashboard. It provides a mission-control view
// of all local IndexedDB projects with high-level stats and quick actions.
export const ProjectDashboard = () => {
  const { projects, loadProject, deleteProject, duplicateProject } = useTmxStore();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleDelete = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      deleteProject(id);
      toast({ title: "Project Deleted" });
    }
  };

  const handleDuplicate = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (duplicateProject) {
      duplicateProject(id);
    }
  };

  return (
    <TooltipProvider>
      <div className="h-screen w-screen bg-muted/30 flex flex-col">
        <header className="p-4 px-8 border-b bg-background flex justify-between items-center flex-shrink-0">
          <div>
            <BrandLogo className="h-10" />
            <p className="text-xs text-muted-foreground font-medium mt-1">We think like linguists, verify like engineers.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setWizardOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> New Project
            </Button>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Local Projects</h2>
                <p className="text-sm text-muted-foreground mt-1">Projects are stored securely in your browser. They are not uploaded to any server.</p>
              </div>
              <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="sm" className="h-7" onClick={() => setViewMode('grid')}>
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="sm" className="h-7" onClick={() => setViewMode('list')}>
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {projects.map(p => (
                  <div
                    key={p.id}
                    className="bg-card border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col"
                    onClick={() => loadProject(p.id)}
                  >
                    <div className="p-4 border-b">
                      <div className="flex items-start justify-between">
                        <Folder className="w-8 h-8 text-primary/40" />
                        <div className="flex items-center gap-1">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider",
                            p.type === 'monolingual' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300'
                          )}>{p.type}</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 -mr-2 text-muted-foreground" onClick={(e) => e.stopPropagation()}>
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuItem onClick={(e) => handleDuplicate(e, p.id)} className="gap-2 cursor-pointer">
                                <Copy className="w-3.5 h-3.5" /> Duplicate Project
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => handleDelete(e, p.id, p.name)} className="gap-2 text-destructive cursor-pointer">
                                <Trash2 className="w-3.5 h-3.5" /> Delete Project
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <h3 className="text-base font-bold mt-3 truncate">{p.name}</h3>
                    </div>
                    <div className="p-4 space-y-4 text-xs text-muted-foreground">
                      <InfoRow icon={<FileText />} label="Segments" value={p.segmentCount} />
                      <InfoRow icon={<LanguagesIcon />} label="Languages" value={p.targetLangs.join(', ')} />
                      <InfoRow icon={<Clock />} label="Last Opened" value={new Date(p.lastOpened).toLocaleDateString()} />
                      <div className="space-y-1 pt-2">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span>Completion</span>
                          <span>{p.completion || 0}%</span>
                        </div>
                        <Progress value={p.completion || 0} className="h-1.5" />
                      </div>
                    </div>
                  </div>
                ))}
                <div
                  className="border-2 border-dashed rounded-lg flex items-center justify-center text-center p-8 text-muted-foreground hover:border-primary hover:text-primary transition-all cursor-pointer min-h-[250px]"
                  onClick={() => setWizardOpen(true)}
                >
                  <div>
                    <Plus className="w-8 h-8 mx-auto mb-2" />
                    <span className="text-sm font-bold">Create New Project</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                      <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/50">
                          <tr>
                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-semibold text-foreground sm:pl-6">Project Name</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-foreground">Status</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-foreground">Languages</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-foreground">Last Opened</th>
                            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                              <span className="sr-only">Actions</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50 bg-card">
                          {projects.map(p => (
                            <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-foreground sm:pl-6 cursor-pointer" onClick={() => loadProject(p.id)}>
                                <div className="flex items-center gap-3">
                                  <Folder className="w-5 h-5 text-primary/50" />
                                  {p.name}
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-3">
                                  <Progress value={p.completion || 0} className="h-1.5 w-24" />
                                  <span className="font-mono text-xs">{p.completion || 0}%</span>
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">{p.sourceLang} → {p.targetLangs.join(', ')}</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">{new Date(p.lastOpened).toLocaleDateString()}</td>
                              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={(e) => e.stopPropagation()}>
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenuItem onClick={() => loadProject(p.id)} className="gap-2 cursor-pointer">
                                      Open Project
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => handleDuplicate(e, p.id)} className="gap-2 cursor-pointer">
                                      <Copy className="w-3.5 h-3.5" /> Duplicate
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => handleDelete(e, p.id, p.name)} className="gap-2 text-destructive cursor-pointer">
                                      <Trash2 className="w-3.5 h-3.5" /> Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          ))}
                          <tr>
                            <td colSpan={5} className="p-0">
                              <div
                                className="border-2 border-dashed rounded-lg flex items-center justify-center text-center p-4 text-muted-foreground hover:border-primary hover:text-primary transition-all cursor-pointer bg-card"
                                onClick={() => setWizardOpen(true)}
                              >
                                <div className="flex items-center gap-2">
                                  <Plus className="w-4 h-4" />
                                  <span className="text-sm font-bold">Create New Project</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
        <ImportWizard open={wizardOpen} onOpenChange={setWizardOpen} />
      </div>
    </TooltipProvider>
  );
};

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: any }) => (
  <div className="flex items-center justify-between gap-2">
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground/60">
        {icon}
      </span>
      <span>{label}</span>
    </div>
    <span className="font-bold text-foreground truncate">{value}</span>
  </div>
);



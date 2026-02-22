"use client"

import React, { useEffect } from 'react';
import { EditorLayout } from '@/components/layout/EditorLayout';
import { useTmxStore } from '@/hooks/use-tmx-store';
import { ProjectDashboard } from '@/components/dashboard/ProjectDashboard';

export default function Home() {
  const initStore = useTmxStore(state => state.initStore);
  const currentProject = useTmxStore(state => state.currentProject);
  const isInitializing = useTmxStore(state => state.isInitializing);

  useEffect(() => {
    initStore();
  }, [initStore]);
  
  if (isInitializing) {
      return (
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-[100] flex flex-col items-center justify-center p-8">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <div className="text-center">
              <p className="text-sm font-black text-primary animate-pulse tracking-tight uppercase">
                Initializing...
              </p>
              <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-widest">Loading local database</p>
            </div>
          </div>
        </div>
      )
  }

  return currentProject ? <EditorLayout /> : <ProjectDashboard />;
}

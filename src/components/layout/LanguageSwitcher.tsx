"use client"

import React from 'react';
import { useTmxStore } from '@/hooks/use-tmx-store';
import { getLanguageName } from '@/lib/locale-registry';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
import { LanguageSet } from '@/lib/types';

export const LanguageSwitcher = () => {
    const { 
      projectLanguageSets, 
      activeLanguageSet, 
      setActiveLanguageSet,
      currentProject
    } = useTmxStore();

    // Do not render if the project isn't multilingual
    if (!projectLanguageSets || projectLanguageSets.length <= 1) {
        return null;
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Active Language Pair
            </div>
            <div className="flex flex-wrap gap-2">
                {projectLanguageSets.map((set, idx) => {
                    const isActive = activeLanguageSet?.src === set.src && activeLanguageSet?.tgt === set.tgt;
                    return (
                        <button
                            key={idx}
                            onClick={() => setActiveLanguageSet(set)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-bold transition-all",
                                isActive 
                                    ? "bg-primary/10 border-primary/30 text-primary ring-1 ring-primary/20" 
                                    : "bg-background hover:bg-muted"
                            )}
                        >
                            <span className="uppercase">{getLanguageName(set.src)}</span>
                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                            <span className="uppercase">{getLanguageName(set.tgt)}</span>
                        </button>
                    )
                })}
            </div>
        </div>
    );
};

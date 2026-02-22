"use client"

import React, { useEffect, useState } from 'react';
import { Search as SearchIcon, FileUp, Save, Download, Settings, Terminal } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader,
  DialogTitle 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export const CommandPalette = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 overflow-hidden border-none shadow-2xl max-w-2xl">
        <DialogHeader className="p-4 border-b bg-muted/30">
          <div className="flex items-center gap-3">
             <Terminal className="w-4 h-4 text-primary" />
             <DialogTitle className="text-sm font-semibold uppercase tracking-wider">Command Palette</DialogTitle>
          </div>
        </DialogHeader>
        <div className="p-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search actions, segments, or settings..." 
              className="pl-10 h-12 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary text-base"
              autoFocus
            />
          </div>
          
          <div className="mt-4 space-y-1">
             <h4 className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Recent Actions</h4>
             <CommandItem icon={<FileUp className="w-4 h-4" />} label="Open TMX File" shortcut="Ctrl+O" />
             <CommandItem icon={<Save className="w-4 h-4" />} label="Save Progress" shortcut="Ctrl+S" />
             <CommandItem icon={<Download className="w-4 h-4" />} label="Export as XML" shortcut="Ctrl+E" />
             <CommandItem icon={<Settings className="w-4 h-4" />} label="Open Preferences" shortcut="Ctrl+," />
          </div>
        </div>
        <div className="p-2 px-4 bg-muted/30 border-t flex justify-between items-center">
           <div className="flex gap-4">
              <span className="text-[10px] text-muted-foreground">↑↓ Navigate</span>
              <span className="text-[10px] text-muted-foreground">↵ Select</span>
           </div>
           <span className="text-[10px] text-muted-foreground italic">Lyntr v1.0 | Trust, but Verify</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const CommandItem = ({ icon, label, shortcut }: { icon: React.ReactNode, label: string, shortcut: string }) => (
  <button className="w-full flex items-center justify-between p-2 px-3 rounded-md hover:bg-primary/10 hover:text-primary group transition-colors text-sm">
    <div className="flex items-center gap-3">
       {icon}
       <span>{label}</span>
    </div>
    <kbd className="text-[10px] font-mono bg-muted p-1 px-1.5 rounded border border-border group-hover:border-primary/30">{shortcut}</kbd>
  </button>
);

"use client"

import React, { useState, useRef } from 'react';
import { useTmxStore } from '@/hooks/use-tmx-store';
import {
  ShieldCheck,
  Save,
  Plus,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Search,
  Check,
  ChevronDown,
  Info,
  Globe,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export const ProfileManager = () => {
  const {
    profiles,
    activeProfileId,
    loadProfile,
    saveProfile,
    deleteProfile,
    importProfile,
    exportProfile,
    currentProject,
    applyLocaleDefaults,
    setActiveCustomFilterId // Using this pattern to reset if needed, but really we just need to set activeProfileId to null
  } = useTmxStore();

  // Custom function to unload profile without deleting it
  const unloadProfile = () => {
    useTmxStore.setState({ activeProfileId: null });
    if (typeof window !== 'undefined') localStorage.removeItem('last_qa_profile');
    toast({ title: "Profile Unloaded", description: "Reverted to project default settings." });
  };

  const [open, setOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeProfile = profiles.find(p => p.id === activeProfileId);

  const handleSaveNew = async () => {
    if (!profileName.trim()) return;
    await saveProfile(profileName, true);
    setSaveDialogOpen(false);
    setProfileName('');
  };

  const handleUpdate = async () => {
    if (activeProfile) {
      await saveProfile(activeProfile.profileName, false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to permanently delete the profile "${name}"? This action cannot be undone.`)) {
      await deleteProfile(id);
      toast({ title: "Profile Deleted", description: `"${name}" has been removed from the database.` });
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importProfile(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-muted/30 border-b p-2 px-6 flex items-center justify-between gap-4 select-none shrink-0 overflow-x-auto custom-scrollbar">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <Label className="text-[10px] font-black uppercase tracking-widest text-foreground whitespace-nowrap">QA Profile Control</Label>
        </div>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-[250px] justify-between h-8 text-[11px] font-bold uppercase bg-background border-primary/20"
            >
              <div className="flex items-center gap-2 truncate">
                <div className={cn("w-1.5 h-1.5 rounded-full", activeProfile ? "bg-green-500" : "bg-muted-foreground/30")} />
                {activeProfile ? activeProfile.profileName : "Project Default"}
              </div>
              <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0 shadow-2xl border-primary/20" align="start">
            <Command className="bg-background">
              <CommandInput placeholder="Search profiles..." className="h-9 text-xs" />
              <CommandList className="max-h-[300px]">
                <CommandEmpty className="py-6 text-center text-xs text-muted-foreground">No profiles found.</CommandEmpty>

                <CommandGroup heading="System">
                  <CommandItem
                    onSelect={() => {
                      unloadProfile();
                      setOpen(false);
                    }}
                    className="text-xs h-9 px-3"
                  >
                    <XCircle className={cn("mr-2 h-3.5 w-3.5 text-muted-foreground", !activeProfileId ? "opacity-100" : "opacity-40")} />
                    <span className="font-bold">Project Default (Unload Profile)</span>
                  </CommandItem>
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="User Profiles">
                  {profiles.map((profile) => (
                    <CommandItem
                      key={profile.id}
                      value={profile.profileName}
                      onSelect={() => {
                        loadProfile(profile.id);
                        setOpen(false);
                      }}
                      className="text-xs group h-9 px-3"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-3.5 w-3.5 text-primary transition-opacity",
                          activeProfileId === profile.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex-1 flex flex-col min-w-0">
                        <span className="font-bold truncate">{profile.profileName}</span>
                        <span className="text-[9px] text-muted-foreground uppercase">{profile.targetLocale} • v{profile.version}</span>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); exportProfile(profile.id); }}
                          className="p-1 hover:text-primary"
                          title="Export JSON"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(profile.id, profile.profileName); }}
                          className="p-1 hover:text-destructive"
                          title="Delete Profile"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-2 text-[10px] font-bold uppercase"
            onClick={() => setSaveDialogOpen(true)}
          >
            <Plus className="w-3.5 h-3.5" /> Save as New
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-2 text-[10px] font-bold uppercase text-primary"
            disabled={!activeProfile}
            onClick={handleUpdate}
          >
            <Save className="w-3.5 h-3.5" /> Update
          </Button>

          {activeProfile && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-2 text-[10px] font-bold uppercase text-destructive hover:bg-destructive/10"
              onClick={() => handleDelete(activeProfile.id, activeProfile.profileName)}
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Profile
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="h-4 w-px bg-border mx-2" />

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".json"
          onChange={handleImport}
        />

        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2 text-[10px] font-bold uppercase bg-background"
          onClick={() => fileInputRef.current?.click()}
          title="Import JSON Profile"
        >
          <Upload className="w-3.5 h-3.5" /> Import
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2 text-[10px] font-bold uppercase bg-background"
          disabled={!activeProfile}
          onClick={() => activeProfile && exportProfile(activeProfile.id)}
          title="Export Active Profile"
        >
          <Download className="w-3.5 h-3.5" /> Export
        </Button>

        {currentProject && (
          <Button
            variant="secondary"
            size="sm"
            className="h-8 gap-2 text-[10px] font-bold uppercase ml-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
            onClick={() => applyLocaleDefaults(currentProject.targetLangs[0])}
          >
            <Globe className="w-3.5 h-3.5" />
            Sync {currentProject.targetLangs[0]}
          </Button>
        )}
      </div>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save QA Profile</DialogTitle>
            <DialogDescription className="text-xs">
              This will create a snapshot of all 12 QA modules and user-defined checks.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Profile Name</Label>
              <Input
                placeholder="e.g., Medical_Standard_v1"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-md flex items-start gap-3">
              <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted-foreground italic leading-tight">
                Profiles are stored in your browser's local database. Use the "Export" feature to share them with team members.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveNew} disabled={!profileName.trim()}>Create Profile</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

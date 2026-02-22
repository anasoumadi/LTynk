"use client"

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { LanguageSet } from '@/lib/types';
import { getLanguageName } from '@/lib/locale-registry';
import { FileSpreadsheet } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface LqaExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  languageSets: LanguageSet[];
  onExport: (languageSet: LanguageSet) => void;
}

export const LqaExportDialog: React.FC<LqaExportDialogProps> = ({ open, onOpenChange, languageSets, onExport }) => {
  const [selectedLang, setSelectedLang] = useState<string>('');

  const handleExportClick = () => {
    if (!selectedLang) {
      toast({ variant: 'destructive', title: 'Language Not Selected', description: 'Please select a language pair to export.' });
      return;
    }
    const [src, tgt] = selectedLang.split('___');
    onExport({ src, tgt });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Language for LQA Report</DialogTitle>
          <DialogDescription>
            Your project is multilingual. Please choose which language pair you want to include in the export.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Select value={selectedLang} onValueChange={setSelectedLang}>
            <SelectTrigger>
              <SelectValue placeholder="Select a language pair..." />
            </SelectTrigger>
            <SelectContent>
              {languageSets.map((set, idx) => (
                <SelectItem key={idx} value={`${set.src}___${set.tgt}`}>
                  {getLanguageName(set.src)} → {getLanguageName(set.tgt)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleExportClick} disabled={!selectedLang}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

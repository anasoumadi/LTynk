"use client"

import React, { useState, useCallback, useMemo } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useTmxStore } from '@/hooks/use-tmx-store';
import { ProjectType, SupportedFileFormat, TranslationUnit, ProjectFile } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { parseFiles } from '@/lib/universal-parser';
import { Upload, File, X, Loader2, Folder, Languages } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface ImportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ImportWizard: React.FC<ImportWizardProps> = ({ open, onOpenChange }) => {
  const { createProject } = useTmxStore();
  const [step, setStep] = useState(1);
  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('monolingual');
  const [files, setFiles] = useState<File[]>([]);
  const [isParsing, setIsParsing] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/xml': ['.tmx', '.xliff', '.sdlxliff', '.mqxliff'],
      'application/zip': ['.mqxlz'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    }
  });

  const removeFile = (fileToRemove: File) => {
    setFiles(prev => prev.filter(f => f !== fileToRemove));
  };

  const handleCreateProject = async () => {
    if (!projectName.trim() || files.length === 0) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide a project name and at least one file.' });
      return;
    }
    
    setIsParsing(true);
    try {
      const { project, projectFiles, segments } = await parseFiles(files, projectName, projectType);
      await createProject(project, projectFiles, segments);
      toast({ title: 'Project Created', description: `Successfully imported ${project.segmentCount} segments.` });
      handleClose();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Import Failed', description: error.message });
    } finally {
      setIsParsing(false);
    }
  };
  
  const handleClose = () => {
    setStep(1);
    setProjectName('');
    setProjectType('monolingual');
    setFiles([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>A project is a container for your translation files and settings.</DialogDescription>
        </DialogHeader>

        {isParsing ? (
           <div className="p-16 flex flex-col items-center justify-center space-y-4">
             <Loader2 className="w-12 h-12 text-primary animate-spin" />
             <p className="text-sm text-muted-foreground font-medium">Parsing files and building database...</p>
           </div>
        ) : (
          <>
            <div className="p-6 space-y-6">
              {/* Step 1: Project Details */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="projectName">Project Name</Label>
                  <Input id="projectName" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g., Q3 Marketing Campaign" />
                </div>
                <div className="space-y-2">
                  <Label>Project Type</Label>
                  <RadioGroup value={projectType} onValueChange={(v: ProjectType) => setProjectType(v)} className="flex gap-4">
                    <Label className="flex items-center gap-2 p-3 border rounded-md flex-1 cursor-pointer has-[:checked]:bg-primary/5 has-[:checked]:border-primary">
                      <RadioGroupItem value="monolingual" />
                      <Folder className="w-4 h-4" /> Single Language Pair
                    </Label>
                    <Label className="flex items-center gap-2 p-3 border rounded-md flex-1 cursor-pointer has-[:checked]:bg-primary/5 has-[:checked]:border-primary">
                      <RadioGroupItem value="multilingual" />
                      <Languages className="w-4 h-4" /> Multiple Language Pairs
                    </Label>
                  </RadioGroup>
                </div>
              </div>

              {/* Step 2: File Upload */}
              <div className="space-y-2">
                <Label>Translation Files</Label>
                <div {...getRootProps()} className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}>
                  <input {...getInputProps()} />
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="font-bold text-sm">Drop files here or click to browse</p>
                  <p className="text-xs text-muted-foreground">.tmx, .xliff, .sdlxliff, .xlsx</p>
                </div>
              </div>
              
              {files.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {files.map((file, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm">
                      <div className="flex items-center gap-2">
                        <File className="w-4 h-4" />
                        <span>{file.name}</span>
                      </div>
                      <button onClick={() => removeFile(file)} className="text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="p-4 bg-muted/10 border-t">
              <Button variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleCreateProject} disabled={!projectName || files.length === 0}>
                Create Project
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

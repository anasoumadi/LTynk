
"use client"

import React, { useState, useRef, useMemo } from 'react';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Download,
  Upload,
  FileType,
  Settings2,
  Info,
  CheckCircle2,
  FileText,
  Database,
  RefreshCw,
  AlertTriangle,
  Table as TableIcon,
  Package
} from 'lucide-react';
import { useTmxStore } from '@/hooks/use-tmx-store';
import { useTmxExporter } from '@/hooks/use-tmx-exporter';
import { useTmxImporter } from '@/hooks/use-tmx-importer';
import { SUPPORTED_ENCODINGS } from '@/lib/encoding-engine';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { db } from '@/lib/db';
import { stripTags } from '@/lib/filter-engine';
import { updateTmxFromSegments, updateXliffFromSegments } from '@/lib/serializer';
import { ProjectFile } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';

interface UtilitiesDashboardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface ExportOptions {
  format: 'xlsx' | 'csv' | 'tmx';
  includeAttributes: boolean;
  stripTags: boolean;
  encoding: string;
}
export interface ImportMapping {
  sourceColumn: number;
  targetColumn: number;
  hasHeader: boolean;
  originatorId: string;
}

export const UtilitiesDashboard: React.FC<UtilitiesDashboardProps> = ({ open, onOpenChange }) => {
  const { currentProject, segments, projectFiles, setSegments, fetchProjects, setIsLoading } = useTmxStore();
  const { exportData } = useTmxExporter();
  const { parseExternalFile } = useTmxImporter();

  const [activeTab, setActiveTab] = useState('export');
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Export State
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'xlsx',
    includeAttributes: true,
    stripTags: false,
    encoding: 'UTF-8'
  });

  // Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importMapping, setImportMapping] = useState<ImportMapping>({
    sourceColumn: 0,
    targetColumn: 1,
    hasHeader: true,
    originatorId: 'batch_import'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    if (!currentProject) return;
    setIsProcessing(true);
    try {
      await exportData(currentProject, segments, exportOptions, setProgress);
      toast({ title: "Export Complete", description: "Your file is ready for download." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Export Failed", description: e.message });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleImport = async () => {
    if (!importFile || !currentProject) return;
    setIsProcessing(true);
    setProgress(10);
    try {
      const newUnits = await parseExternalFile(
        importFile,
        importMapping,
        currentProject.id,
        'imported_' + crypto.randomUUID(),
        currentProject.sourceLang,
        currentProject.targetLangs[0] || 'en-US'
      );
      setProgress(60);

      const combined = [...segments, ...newUnits];
      await db.segments.bulkPut(newUnits);

      await db.projects.update(currentProject.id, { segmentCount: combined.length });

      setSegments(combined);
      await fetchProjects();

      toast({
        title: "Import Successful",
        description: `Added ${newUnits.length} segments to ${currentProject.name}.`
      });
      setImportFile(null);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Import Failed", description: e.message });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleRebuildFile = (file: ProjectFile) => {
    if (!currentProject) {
      toast({ variant: 'destructive', title: 'Error', description: 'No active project.' });
      return;
    }

    if (!file.rawContent) {
      toast({ variant: 'destructive', title: 'Error', description: 'Original file content is not available for rebuilding.' });
      return;
    }

    const fileSegments = segments.filter(s => s.fileId === file.id);
    if (fileSegments.length === 0) {
      toast({ variant: 'destructive', title: 'No Segments Found', description: `There are no segments associated with the file "${file.name}".` });
      return;
    }

    let updatedFileContent: string;
    const mimeType = 'application/xml;charset=utf-8';

    try {
      switch (file.format) {
        case 'tmx':
          updatedFileContent = updateTmxFromSegments(file.rawContent, fileSegments);
          break;
        case 'xliff':
        case 'sdlxliff':
        case 'mqxliff':
          updatedFileContent = updateXliffFromSegments(file.rawContent, fileSegments);
          break;
        default:
          toast({ variant: 'destructive', title: 'Unsupported Format', description: `Rebuilding .${file.format} files is not yet supported.` });
          return;
      }

      const blob = new Blob([updatedFileContent], { type: mimeType });
      saveAs(blob, file.name);
      toast({ title: 'File Rebuilt', description: `"${file.name}" has been saved with the latest updates.` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Rebuild Failed", description: e.message });
    }
  };

  const handleDownloadAll = async () => {
    if (!currentProject || projectFiles.length === 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'No files to rebuild.' });
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const zip = new JSZip();
      const totalFiles = projectFiles.length;

      for (let i = 0; i < totalFiles; i++) {
        const file = projectFiles[i];
        if (!file.rawContent) continue;

        const fileSegments = segments.filter(s => s.fileId === file.id);
        if (fileSegments.length === 0) continue;

        let updatedContent: string | null = null;
        if (file.format === 'xliff' || file.format === 'sdlxliff' || file.format === 'mqxliff') {
          updatedContent = updateXliffFromSegments(file.rawContent, fileSegments, false);
        } else if (file.format === 'tmx') {
          updatedContent = updateTmxFromSegments(file.rawContent, fileSegments);
        }

        if (updatedContent) {
          zip.file(file.name, updatedContent);
        }

        setProgress(Math.round(((i + 1) / totalFiles) * 100));
      }

      if (Object.keys(zip.files).length === 0) {
        toast({ title: 'Nothing to Zip', description: 'No valid files were found to rebuild and zip.' });
        setIsProcessing(false);
        setProgress(0);
        return;
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `${currentProject.name}_rebuilt_files.zip`);
      toast({ title: 'Download Ready', description: 'All rebuildable files have been zipped.' });

    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Zip Creation Failed', description: e.message });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const previewRows = useMemo(() => {
    return segments.slice(0, 5);
  }, [segments]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] p-0 overflow-hidden bg-card flex flex-col h-[calc(100vh-8rem)] max-h-[700px]">
        <DialogHeader className="p-6 bg-muted/30 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <FileType className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Utilities Dashboard</DialogTitle>
              <DialogDescription className="text-xs uppercase font-bold tracking-tight text-muted-foreground">
                Advanced File Conversion & TM Maintenance
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isProcessing ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-6 flex-1">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <div className="w-full max-w-md space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                <span>Processing Utility Task...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        ) : (
          <>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
              <TabsList className="px-6 py-2 bg-muted/20 border-b h-auto justify-start gap-4 rounded-none shrink-0">
                <TabsTrigger value="export" className="text-xs font-bold uppercase tracking-tight gap-2 data-[state=active]:text-primary">
                  <Download className="w-3.5 h-3.5" /> Export Utility
                </TabsTrigger>
                <TabsTrigger value="rebuild" className="text-xs font-bold uppercase tracking-tight gap-2 data-[state=active]:text-primary">
                  <Package className="w-3.5 h-3.5" /> Rebuild Files
                </TabsTrigger>
                <TabsTrigger value="import" className="text-xs font-bold uppercase tracking-tight gap-2 data-[state=active]:text-primary">
                  <Upload className="w-3.5 h-3.5" /> Import Utility
                </TabsTrigger>
                <TabsTrigger value="encoding" className="text-xs font-bold uppercase tracking-tight gap-2 data-[state=active]:text-primary">
                  <Settings2 className="w-3.5 h-3.5" /> Encoding Tool
                </TabsTrigger>
              </TabsList>

              <TabsContent value="export" className="m-0 flex-1 overflow-auto">
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="shadow-none border-muted">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm font-bold uppercase">Export Configuration</CardTitle>
                        <CardDescription className="text-[10px]">Select format and structure options.</CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-2 space-y-4">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold uppercase text-muted-foreground">Target Format</Label>
                          <Select
                            value={exportOptions.format}
                            onValueChange={(v: any) => setExportOptions(prev => ({ ...prev, format: v }))}
                          >
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="xlsx">Excel Workbook (.xlsx)</SelectItem>
                              <SelectItem value="csv">Comma Separated Values (.csv)</SelectItem>
                              <SelectItem value="tmx">Valid TMX 1.4b (.tmx)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="incAttr"
                            checked={exportOptions.includeAttributes}
                            onCheckedChange={(v: any) => setExportOptions(prev => ({ ...prev, includeAttributes: v }))}
                          />
                          <Label htmlFor="incAttr" className="text-xs cursor-pointer">Include TU Attributes (Metadata)</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="stripTags"
                            checked={exportOptions.stripTags}
                            onCheckedChange={(v: any) => setExportOptions(prev => ({ ...prev, stripTags: v }))}
                          />
                          <Label htmlFor="stripTags" className="text-xs cursor-pointer">Strip XML Tags (Clean Content)</Label>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-none border-muted">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm font-bold uppercase">Zebra Preview</CardTitle>
                        <CardDescription className="text-[10px]">Sample of first {previewRows.length} rows.</CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-2">
                        <div className="border rounded overflow-hidden">
                          <table className="w-full text-[9px] border-collapse">
                            <thead className="bg-muted/50 border-b">
                              <tr>
                                <th className="p-1 px-2 text-left border-r">Src</th>
                                <th className="p-1 px-2 text-left">Tgt</th>
                              </tr>
                            </thead>
                            <tbody>
                              {previewRows.map((row, i) => (
                                <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                                  <td className="p-1 px-2 border-r truncate max-w-[100px]">{exportOptions.stripTags ? stripTags(row.source.text) : row.source.text}</td>
                                  <td className="p-1 px-2 truncate max-w-[100px]">{exportOptions.stripTags ? stripTags(row.target.text) : row.target.text}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <p className="mt-2 text-[8px] text-muted-foreground italic">Numerical alignment and headers will adjust based on settings.</p>
                      </CardContent>
                    </Card>
                  </div>
                  <Button className="w-full h-12 text-sm font-bold uppercase gap-2" onClick={handleExport}>
                    <Download className="w-4 h-4" /> Generate & Download Export
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="rebuild" className="m-0 flex flex-col flex-1 min-h-0">
                <div className="p-6 pb-4 shrink-0">
                  <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg flex gap-4">
                    <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-amber-500 uppercase tracking-widest">Important: Structural Preservation</h4>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        This utility **rebuilds** each source file from the segment data stored in the local database. While all your translation edits are preserved, complex original file structures (like nested groups in XLIFF) may not be perfectly replicated. The output will be a valid, standard TMX or XLIFF file.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-6 pb-4 flex items-center justify-between border-b shrink-0">
                  <h3 className="text-sm font-bold tracking-tight">Project Source Files</h3>
                  <Button
                    size="sm"
                    className="h-8 gap-2 uppercase text-[10px] font-bold"
                    onClick={handleDownloadAll}
                    disabled={projectFiles.length === 0}
                  >
                    <Package className="w-3.5 h-3.5" />
                    Download All as ZIP
                  </Button>
                </div>

                <ScrollArea className="flex-1 custom-scrollbar">
                  <div className="p-6 pt-4 space-y-3">
                    {projectFiles.length > 0 ? (
                      projectFiles.map(file => (
                        <Card key={file.id} className="shadow-none border-muted">
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-bold truncate">{file.name}</p>
                                <p className="text-[10px] font-mono text-muted-foreground uppercase">{file.format} - {file.segmentCount} segments</p>
                              </div>
                            </div>
                            <Button size="sm" className="h-8 gap-2 uppercase text-[10px] font-bold shrink-0 ml-4" onClick={() => handleRebuildFile(file)}>
                              <Download className="w-3.5 h-3.5" />
                              Save Updated File
                            </Button>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-16 text-muted-foreground italic text-sm">
                        No files found in this project to rebuild.
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="import" className="m-0 overflow-y-auto">
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <div
                        className={cn(
                          "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer",
                          importFile ? "border-primary bg-primary/5" : "border-muted hover:border-primary/40"
                        )}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls,.csv" onChange={(e) => setImportFile(e.target.files?.[0] || null)} />
                        {importFile ? (
                          <>
                            <CheckCircle2 className="w-10 h-10 text-primary" />
                            <span className="text-xs font-bold text-center">{importFile.name}</span>
                            <Button variant="ghost" size="sm" className="h-6 text-[9px]" onClick={(e) => { e.stopPropagation(); setImportFile(null); }}>Change File</Button>
                          </>
                        ) : (
                          <>
                            <div className="w-12 h-12 bg-muted/50 rounded-full flex items-center justify-center">
                              <Upload className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div className="text-center">
                              <p className="text-xs font-bold uppercase">Drop XLSX or CSV</p>
                              <p className="text-[10px] text-muted-foreground">External translation lists to TMX</p>
                            </div>
                          </>
                        )}
                      </div>

                      <Card className="shadow-none border-muted">
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-sm font-bold uppercase">Import Metadata</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-2 space-y-4">
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Originator Identifier</Label>
                            <Input
                              value={importMapping.originatorId}
                              onChange={(e) => setImportMapping(prev => ({ ...prev, originatorId: e.target.value }))}
                              placeholder="e.g., legacy_import_v1"
                              className="h-8 text-xs"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="shadow-none border-muted">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm font-bold uppercase">Column Mapping</CardTitle>
                        <CardDescription className="text-[10px]">Map external file columns to TMX fields.</CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-2 space-y-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Checkbox
                            id="hasHeader"
                            checked={importMapping.hasHeader}
                            onCheckedChange={(v: any) => setImportMapping(prev => ({ ...prev, hasHeader: v }))}
                          />
                          <Label htmlFor="hasHeader" className="text-xs cursor-pointer">File contains header row</Label>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Source Column</Label>
                            <Select
                              value={importMapping.sourceColumn.toString()}
                              onValueChange={(v) => setImportMapping(prev => ({ ...prev, sourceColumn: parseInt(v) }))}
                            >
                              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">Column A</SelectItem>
                                <SelectItem value="1">Column B</SelectItem>
                                <SelectItem value="2">Column C</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Target Column</Label>
                            <Select
                              value={importMapping.targetColumn.toString()}
                              onValueChange={(v) => setImportMapping(prev => ({ ...prev, targetColumn: parseInt(v) }))}
                            >
                              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">Column A</SelectItem>
                                <SelectItem value="1">Column B</SelectItem>
                                <SelectItem value="2">Column C</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg flex gap-3">
                          <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                          <p className="text-[9px] text-muted-foreground leading-relaxed">
                            Imported segments will be appended to your active project. IDs will be auto-incremented.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <Button
                    className="w-full h-12 text-sm font-bold uppercase gap-2"
                    disabled={!importFile}
                    onClick={handleImport}
                  >
                    <Database className="w-4 h-4" /> Process & Append to TM
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="encoding" className="m-0 overflow-y-auto">
                <div className="p-6 space-y-6">
                  <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg flex gap-4">
                    <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-amber-500 uppercase tracking-widest">Modernization Notice</h4>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        The Heartfelt Editor internally utilizes **UTF-8 (Unicode)** for all processing to ensure cross-platform consistency.
                        Converting to legacy encodings (like Windows-1252 or Big5) should be the **final step** before downloading for compatibility with older tools.
                      </p>
                    </div>
                  </div>

                  <Card className="shadow-none border-muted">
                    <CardHeader className="p-4">
                      <CardTitle className="text-sm font-bold uppercase">Transcoding Engine</CardTitle>
                      <CardDescription className="text-[10px]">Change the character set of your XML export.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 space-y-6">
                      <div className="space-y-2 max-w-sm">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Target Encoding</Label>
                        <Select
                          value={exportOptions.encoding}
                          onValueChange={(v) => setExportOptions(prev => ({ ...prev, encoding: v }))}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SUPPORTED_ENCODINGS.map(enc => (
                              <SelectItem key={enc.value} value={enc.value}>{enc.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3 p-4 bg-muted/30 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="w-3.5 h-3.5 text-primary" />
                          <h4 className="text-[10px] font-bold uppercase">Transformation Summary</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-[10px]">
                          <div className="text-muted-foreground">Input Encoding:</div>
                          <div className="font-mono font-bold">UTF-8</div>
                          <div className="text-muted-foreground">Output Format:</div>
                          <div className="font-mono font-bold">{exportOptions.format.toUpperCase()}</div>
                          <div className="text-muted-foreground">Target Encoding:</div>
                          <div className="font-mono font-bold text-primary">{exportOptions.encoding}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Button
                    className="w-full h-12 text-sm font-bold uppercase gap-2"
                    variant="secondary"
                    onClick={() => {
                      setExportOptions(prev => ({ ...prev, format: 'tmx' }));
                      setActiveTab('export');
                      toast({ title: "Encoding Set", description: "Switching to TMX export with new encoding." });
                    }}
                  >
                    <RefreshCw className="w-4 h-4" /> Apply Encoding Settings
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

          </>
        )}
        <DialogFooter className="p-4 bg-muted/10 border-t flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Database className="w-3 h-3" />
              <span>TM: {segments.length} segments</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TableIcon className="w-3 h-3" />
              <span>Local Cache: ACTIVE</span>
            </div>
          </div>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-xs h-8 font-bold">Close Panel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


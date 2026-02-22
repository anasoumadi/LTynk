
"use client"

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useTmxStore } from '@/hooks/use-tmx-store';
import { 
  MessageSquare, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  CheckCircle2,
  AlertCircle,
  Type,
  Trash2,
  Lock,
  Unlock,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TranslationUnit, TranslationSegment, TmxTag } from '@/lib/types';
import { TmxTagChip } from '../editor/TmxTagChip';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

export const IntegratedEditor = () => {
  const { 
    segments, 
    selectedSegmentId, 
    setSelectedSegment, 
    updateSegment,
    showHiddenFormatting,
    setShowHiddenFormatting,
    filteredSegments
  } = useTmxStore();

  const selectedTu = useMemo(() => 
    segments.find(s => s.id === selectedSegmentId), 
  [segments, selectedSegmentId]);

  const editorRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editorRef.current && selectedTu) {
      editorRef.current.innerHTML = renderSegmentToHtml(selectedTu.target, showHiddenFormatting);
    }
  }, [selectedTu, showHiddenFormatting]);

  const handleSave = async () => {
    if (!selectedTu || !editorRef.current) return;
    setIsSaving(true);
    try {
      const newSegment = htmlToSegment(editorRef.current.innerHTML, selectedTu.target.tags);
      await updateSegment(selectedTu.id, { 
        target: newSegment,
        status: newSegment.text.trim() ? 'translated' : 'empty'
      });
      toast({ title: "Segment Updated", description: "Audit re-run automatically." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    const currentIdx = filteredSegments.findIndex(s => s.id === selectedSegmentId);
    if (currentIdx === -1) return;
    
    const nextIdx = direction === 'prev' ? currentIdx - 1 : currentIdx + 1;
    if (nextIdx >= 0 && nextIdx < filteredSegments.length) {
      setSelectedSegment(filteredSegments[nextIdx].id);
    }
  };

  if (!selectedTu) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground opacity-30">
        <Info className="w-10 h-10 mb-4" />
        <p className="text-xs font-bold uppercase tracking-widest">No Segment Active</p>
        <p className="text-[10px] mt-1">Select an issue from the dashboard to start editing.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">#{selectedTu.tu_id}</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{selectedTu.status}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleNavigate('prev')}><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleNavigate('next')}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Insert Special Character">Ω</Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn("h-7 w-7", showHiddenFormatting && "text-primary bg-primary/10")}
            onClick={() => setShowHiddenFormatting(!showHiddenFormatting)}
            title="Toggle Hidden Formatting"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Add Comment"><MessageSquare className="w-4 h-4" /></Button>
          <div className="h-4 w-px bg-border mx-1" />
          <Button 
            size="sm" 
            onClick={handleSave} 
            disabled={isSaving}
            className="h-7 gap-2 px-4 font-black uppercase text-[10px] bg-primary hover:bg-primary/90"
          >
            <Save className="w-3.5 h-3.5" />
            Commit Changes
          </Button>
        </div>
      </div>

      {/* Editor Workspace */}
      <div className="flex-1 flex min-h-0 divide-x">
        <div className="flex-1 flex flex-col overflow-hidden bg-muted/5">
          <div className="px-4 py-1.5 border-b bg-muted/20 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Source segment</div>
          <ScrollArea className="flex-1 p-4">
            <div className="text-sm leading-relaxed whitespace-pre-wrap font-body selection:bg-primary/30">
              {renderSegmentWithTags(selectedTu.source, showHiddenFormatting)}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden bg-background">
          <div className="px-4 py-1.5 border-b bg-muted/20 text-[9px] font-black uppercase tracking-widest text-primary">Target segment editor</div>
          <ScrollArea className="flex-1">
            <div 
              ref={editorRef}
              contentEditable 
              className="p-4 text-sm leading-relaxed outline-none font-body selection:bg-primary/30 min-h-full whitespace-pre-wrap custom-editor-content"
            />
          </ScrollArea>
        </div>
      </div>

      {/* Issues Strip */}
      {selectedTu.qaIssues && selectedTu.qaIssues.length > 0 && (
        <div className="border-t bg-destructive/5 flex items-center p-2 px-4 gap-4 overflow-x-auto shrink-0">
          <div className="flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span className="text-[10px] font-black uppercase tracking-widest text-destructive">Outstanding Issues ({selectedTu.qaIssues.length})</span>
          </div>
          <div className="flex gap-2">
            {selectedTu.qaIssues.map((issue, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-background border border-destructive/20 px-2 py-0.5 rounded text-[9px] font-bold text-destructive/80 whitespace-nowrap">
                <div className="w-1 h-1 rounded-full bg-destructive" />
                {issue.code}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions (mirrored from EditorGrid for consistency)
const renderSegmentToHtml = (segment: TranslationSegment, showHidden: boolean) => {
  const { text, tags } = segment;

  const renderTextToHtml = (t: string) => {
    if (!showHidden) return t;
    return t.replace(/[ \u00A0\n]/g, (char) => {
      if (char === ' ') return `<span class="hidden-char-wrapper" data-symbol="·"> </span>`;
      if (char === '\u00A0') return `<span class="hidden-char-wrapper" data-symbol="°">&nbsp;</span>`;
      if (char === '\n') return `<span class="hidden-char-wrapper" data-symbol="¶">\n</span>`;
      return char;
    });
  };

  if (!tags || tags.length === 0) return renderTextToHtml(text);
  
  const parts = text.split(/(\[(?:bpt|ept|ph|it|ut|sub|x|g|bx|ex|mrk).*?_\d+\])/g);
  return parts.map(part => {
    const tag = tags.find(t => t.id === part);
    if (tag) {
      const label = tag.index ? `{${tag.index}}` : `{${tag.type.charAt(0).toUpperCase()}}`;
      return `<span contentEditable="false" data-tag-id="${tag.id}" data-tag-raw='${tag.content.replace(/'/g, "&apos;")}' class="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded text-[10px] font-mono font-bold bg-accent/20 text-accent border border-accent/30">${label}</span>`;
    }
    return renderTextToHtml(part);
  }).join('');
};

const htmlToSegment = (html: string, originalTags: TmxTag[]): TranslationSegment => {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  let text = '';
  const tags: TmxTag[] = [];
  const walk = (node: Node) => {
    if (node.nodeType === 3) text += node.textContent;
    else if (node.nodeType === 1) {
      const el = node as HTMLElement;
      if (el.dataset.tagId && el.dataset.tagRaw) {
        text += el.dataset.tagId;
        const original = originalTags.find(t => t.id === el.dataset.tagId);
        tags.push({ id: el.dataset.tagId, content: el.dataset.tagRaw, type: original?.type || 'ph', index: original?.index });
      } else if (el.nodeName === 'BR') text += '\n';
      else Array.from(el.childNodes).forEach(walk);
    }
  };
  Array.from(temp.childNodes).forEach(walk);
  return { text, tags };
};

function renderSegmentWithTags(segment: TranslationSegment, showHidden: boolean) {
  const { text, tags } = segment;
  const renderText = (t: string) => {
    if (!showHidden) return t;
    const parts = t.split(/([ \u00A0\n])/);
    return parts.map((part, i) => {
      if (part === ' ') return <span key={i} className="hidden-char-wrapper" data-symbol="·"> </span>;
      if (part === '\u00A0') return <span key={i} className="hidden-char-wrapper" data-symbol="°">&nbsp;</span>;
      if (part === '\n') return <span key={i} className="hidden-char-wrapper" data-symbol="¶">{"\n"}</span>;
      return part;
    });
  };
  if (!tags || tags.length === 0) return <>{renderText(text)}</>;
  const parts = text.split(/(\[(?:bpt|ept|ph|it|ut|sub|x|g|bx|ex|mrk).*?_\d+\])/g);
  return (<>{parts.map((part, i) => { const tag = tags.find(t => t.id === part); return tag ? <TmxTagChip key={i} tag={tag} /> : <React.Fragment key={i}>{renderText(part)}</React.Fragment>; })}</>);
}

    

    


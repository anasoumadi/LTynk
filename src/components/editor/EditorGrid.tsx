
"use client"

import React, { useRef, useState, useEffect, memo, useCallback, useMemo } from 'react';
import { useTmxStore } from '@/hooks/use-tmx-store';
import { TranslationUnit, TranslationSegment, TmxTag } from '@/lib/types';
import { TmxTagChip } from './TmxTagChip';
import { cn } from '@/lib/utils';
import {
  Check,
  Edit2,
  AlertTriangle,
  Trash2,
  ArrowRight,
  Lock,
  Unlock,
  Search,
  Tags
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

const ROW_HEIGHT = 65;
const MOBILE_ROW_HEIGHT = 85;

// AS: GridRow is memoized to prevent expensive re-renders of the entire grid 
// when only a single segment is being edited or selected.
const GridRow = memo(({
  tu,
  isSelected,
  isEditing,
  onSelect,
  onDoubleClick,
  onEditComplete,
  onRowAction,
  showHiddenFormatting,
  editingCoords,
  style,
  isMobile
}: {
  tu: TranslationUnit,
  isSelected: boolean,
  isEditing: boolean,
  onSelect: (e: React.MouseEvent, id: string) => void,
  onDoubleClick: (e: React.MouseEvent, id: string, isLocked: boolean) => void,
  onEditComplete: (id: string, field: 'source' | 'target', newSegment: TranslationSegment) => void,
  onRowAction: (e: React.MouseEvent, type: string, id: string) => void,
  showHiddenFormatting: boolean,
  editingCoords: { x: number, y: number } | null,
  style?: React.CSSProperties,
  isMobile: boolean
}) => {
  return (
    <div
      style={style}
      className={cn(
        "flex group cursor-default transition-all border-l-4 border-l-transparent min-w-full",
        isSelected && "bg-primary/10 border-l-primary shadow-sm",
        tu.isLocked && "opacity-80 bg-muted/10",
        "hover:bg-muted/30 border-b border-border/40"
      )}
      onClick={(e) => onSelect(e, tu.id)}
      onDoubleClick={(e) => onDoubleClick(e, tu.id, !!tu.isLocked)}
    >
      <div className={cn("w-10 sm:w-12 px-1 py-4 border-r flex items-start justify-center text-[9px] sm:text-[10px] text-muted-foreground font-mono leading-tight relative shrink-0")}>
        {tu.tu_id}
        {tu.qaIssues && tu.qaIssues.some(i => !i.isIgnored) && (
          <div className="absolute top-1 right-1" title={`${tu.qaIssues.filter(i => !i.isIgnored).length} QA Issues`}>
            <AlertTriangle className={cn(
              "w-2.5 h-2.5",
              tu.qaIssues.some(i => i.type === 'error' && !i.isIgnored) ? "text-destructive" : "text-amber-500"
            )} />
          </div>
        )}
        {tu.isLocked && (
          <div className="absolute bottom-1 right-1">
            <Lock className="w-2.5 h-2.5 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-[150px] px-2 sm:px-4 py-4 border-r text-xs sm:text-sm leading-relaxed overflow-hidden">
        <div className="text-foreground/90 font-body selection:bg-primary/30 whitespace-pre-wrap break-words">
          {renderSegmentWithTags(tu.source, showHiddenFormatting)}
        </div>
      </div>

      <div className="flex-1 min-w-[150px] px-2 sm:px-4 py-4 border-r text-xs sm:text-sm leading-relaxed overflow-hidden relative">
        {isEditing ? (
          <SegmentEditor
            segment={tu.target}
            coords={editingCoords}
            onComplete={(newSeg) => onEditComplete(tu.id, 'target', newSeg)}
            showHiddenFormatting={showHiddenFormatting}
          />
        ) : (
          <div className="relative group/cell min-h-[1.5em] whitespace-pre-wrap break-words">
            {tu.target.text ? (
              <div className="text-foreground selection:bg-primary/30 whitespace-pre-wrap break-words">
                {renderSegmentWithTags(tu.target, showHiddenFormatting)}
              </div>
            ) : (
              <span className="text-muted-foreground/50 italic text-[10px] sm:text-xs flex items-center gap-1">
                <Edit2 className="w-3 h-3" /> {tu.isLocked ? 'Locked' : 'Empty segment'}
              </span>
            )}
          </div>
        )}
      </div>

      {!isMobile && (
        <div className="w-16 px-2 py-4 border-r flex items-start justify-center shrink-0">
          <StatusBadge status={tu.status} />
        </div>
      )}

      <div className={cn(isMobile ? "w-10" : "w-20", "px-1 py-2 flex items-center justify-center shrink-0 bg-muted/5 group-hover:bg-transparent")}>
        <div className={cn("grid gap-x-1 gap-y-1.5", isMobile ? "grid-cols-1" : "grid-cols-2")}>
          <RowAction icon={<ArrowRight />} label="Copy Source" onClick={(e) => onRowAction(e, 'copy', tu.id)} disabled={tu.isLocked} />
          <RowAction icon={<Tags />} label="Place Tags" onClick={(e) => onRowAction(e, 'place_tags', tu.id)} disabled={tu.isLocked || tu.source.tags.length === 0} />
          {!isMobile && <RowAction icon={<Check className={cn(tu.status === 'approved' && "stroke-[3]")} />} label="Approve" onClick={(e) => onRowAction(e, 'approve', tu.id)} color={tu.status === 'approved' ? "text-green-500" : undefined} />}
          <RowAction icon={tu.isLocked ? <Lock /> : <Unlock />} label={tu.isLocked ? "Unlock" : "Lock"} onClick={(e) => onRowAction(e, 'lock', tu.id)} active={tu.isLocked} />
          {!isMobile && <RowAction icon={<Search />} label="Concordance" onClick={(e) => onRowAction(e, 'search', tu.id)} />}
          <RowAction icon={<Trash2 />} label="Delete" onClick={(e) => onRowAction(e, 'delete', tu.id)} color="text-destructive" />
        </div>
      </div>
    </div>
  );
});

GridRow.displayName = 'GridRow';

export const EditorGrid = () => {
  const isMobile = useIsMobile();
  // AS: Standard row height for virtualization. Desktop vs Mobile split.
  const activeRowHeight = isMobile ? MOBILE_ROW_HEIGHT : ROW_HEIGHT;

  const {
    filteredSegments,
    selectedSegmentId,
    selectedSegmentIds,
    toggleSegmentSelection,
    updateSegment,
    deleteSegments,
    copySourceToTarget,
    clearTarget,
    toggleLock,
    approveBatch,
    concordanceSearch,
    placeTags,
    showHiddenFormatting
  } = useTmxStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCoords, setEditingCoords] = useState<{ x: number, y: number } | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(800);

  const scrollRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) setContainerHeight(entry.contentRect.height);
    });
    if (viewportRef.current) observer.observe(viewportRef.current);
    return () => observer.disconnect();
  }, []);

  // anasoumadi: Auto-scroll into view when a segment is selected via sidebar/search
  useEffect(() => {
    if (selectedSegmentId && scrollRef.current) {
      const index = filteredSegments.findIndex(s => s.id === selectedSegmentId);
      if (index !== -1) {
        const targetScrollTop = index * activeRowHeight;
        const currentScrollTop = scrollRef.current.scrollTop;
        const viewportHeight = scrollRef.current.clientHeight;

        const isAbove = targetScrollTop < currentScrollTop;
        const isBelow = (targetScrollTop + activeRowHeight) > (currentScrollTop + viewportHeight);

        if (isAbove) {
          scrollRef.current.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
        } else if (isBelow) {
          scrollRef.current.scrollTo({ top: targetScrollTop - viewportHeight + activeRowHeight, behavior: 'smooth' });
        }
      }
    }
  }, [selectedSegmentId, filteredSegments, activeRowHeight]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => setScrollTop(e.currentTarget.scrollTop);

  // AS: Virtualization logic to handle thousands of segments without lag.
  const virtualItems = useMemo(() => {
    const startIdx = Math.max(0, Math.floor(scrollTop / activeRowHeight) - 10);
    const endIdx = Math.min(filteredSegments.length, Math.ceil((scrollTop + containerHeight) / activeRowHeight) + 10);
    return {
      items: filteredSegments.slice(startIdx, endIdx),
      offsetY: startIdx * activeRowHeight,
      totalHeight: filteredSegments.length * activeRowHeight
    };
  }, [scrollTop, containerHeight, filteredSegments, activeRowHeight]);

  const handleSelect = useCallback((e: React.MouseEvent, id: string) => {
    const isMulti = e.ctrlKey || e.metaKey;
    const isRange = e.shiftKey;
    toggleSegmentSelection(id, isMulti, isRange);
  }, [toggleSegmentSelection]);

  const handleDoubleClick = useCallback((e: React.MouseEvent, id: string, isLocked: boolean) => {
    if (isLocked) {
      toast({ variant: "destructive", title: "Segment Locked", description: "Unlock this segment to edit its content." });
      return;
    }
    setEditingCoords({ x: e.clientX, y: e.clientY });
    setEditingId(id);
  }, []);

  const handleEditComplete = useCallback(async (id: string, field: 'source' | 'target', newSegment: TranslationSegment) => {
    setEditingId(null);
    setEditingCoords(null);
    const newStatus = newSegment.text.trim() ? 'translated' : 'empty';
    await updateSegment(id, { [field]: newSegment, status: newStatus as any });
  }, [updateSegment]);

  const handleRowAction = useCallback(async (e: React.MouseEvent, type: string, id: string) => {
    e.stopPropagation();
    const ids = selectedSegmentIds.includes(id) ? selectedSegmentIds : [id];
    switch (type) {
      case 'copy': await copySourceToTarget(id); break;
      case 'place_tags': await placeTags(id); break;
      case 'clear': await clearTarget(id); break;
      case 'lock': await toggleLock(id); break;
      case 'approve': await approveBatch(ids); break;
      case 'search': concordanceSearch(id); break;
      case 'delete':
        if (confirm(`Delete ${ids.length} segment(s)?`)) {
          await deleteSegments(ids);
          toast({ title: "Segments Deleted" });
        }
        break;
    }
  }, [selectedSegmentIds, copySourceToTarget, placeTags, clearTarget, toggleLock, approveBatch, concordanceSearch, deleteSegments]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background" ref={viewportRef}>
      <div className="flex bg-muted/80 backdrop-blur-sm border-b text-[9px] sm:text-[10px] font-black uppercase tracking-widest sticky top-0 z-20 text-muted-foreground select-none overflow-x-auto min-w-full">
        <div className="w-10 sm:w-12 px-2 py-2.5 border-r text-center shrink-0">ID</div>
        <div className="flex-1 px-2 sm:px-3 py-2.5 border-r min-w-[150px]">Source Text</div>
        <div className="flex-1 px-2 sm:px-3 py-2.5 border-r min-w-[150px]">Target Text</div>
        {!isMobile && <div className="w-16 px-2 py-2.5 border-r text-center shrink-0">Status</div>}
        <div className={cn(isMobile ? "w-10" : "w-20", "px-2 py-2.5 text-center shrink-0")}>Acts</div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar relative" onScroll={handleScroll} ref={scrollRef}>
        <div style={{ height: virtualItems.totalHeight, width: '100%', position: 'relative' }}>
          <div style={{ transform: `translateY(${virtualItems.offsetY}px)`, position: 'absolute', width: '100%' }}>
            {virtualItems.items.map((tu) => (
              <GridRow
                key={tu.id} tu={tu}
                isSelected={selectedSegmentIds.includes(tu.id)}
                isEditing={editingId === tu.id}
                editingCoords={editingId === tu.id ? editingCoords : null}
                onSelect={handleSelect}
                onDoubleClick={handleDoubleClick}
                onEditComplete={handleEditComplete}
                onRowAction={handleRowAction}
                showHiddenFormatting={showHiddenFormatting}
                isMobile={isMobile}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="p-1 px-4 bg-muted/30 border-t text-[9px] sm:text-[10px] text-muted-foreground flex justify-between items-center h-7 uppercase tracking-widest font-black shrink-0">
        <div className="flex gap-4">
          <span>{filteredSegments.length} segments</span>
          <span className="text-primary">{selectedSegmentIds.length} Selected</span>
        </div>
        <div className="hidden sm:block opacity-50 italic">Double-click target to translate</div>
      </div>
    </div>
  );
};

const RowAction = ({ icon, label, onClick, disabled, active, color }: { icon: React.ReactNode, label: string, onClick: (e: any) => void, disabled?: boolean, active?: boolean, color?: string }) => (
  <button
    onClick={onClick} disabled={disabled} title={label}
    className={cn(
      "p-1 rounded transition-all opacity-30 group-hover:opacity-100 hover:bg-muted shrink-0",
      active && "opacity-100 text-primary bg-primary/10",
      color && color,
      disabled && "opacity-10 cursor-not-allowed hover:bg-transparent"
    )}
  >
    <span className="w-3 h-3 flex items-center justify-center">
      {icon}
    </span>
  </button>
);

const SegmentEditor = ({ segment, coords, onComplete, showHiddenFormatting }: { segment: TranslationSegment, coords: { x: number, y: number } | null, onComplete: (s: TranslationSegment) => void, showHiddenFormatting: boolean }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = renderSegmentToHtml(segment, showHiddenFormatting);
      editorRef.current.focus();
      if (coords && typeof document.caretRangeFromPoint === 'function') {
        const range = document.caretRangeFromPoint(coords.x, coords.y);
        if (range) {
          const selection = window.getSelection();
          if (selection) { selection.removeAllRanges(); selection.addRange(range); }
        }
      }
    }
  }, [segment, coords, showHiddenFormatting]);
  const handleBlur = () => { if (editorRef.current) onComplete(htmlToSegment(editorRef.current.innerHTML, segment.tags)); };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleBlur(); }
    if (e.key === 'Escape') handleBlur();
  };
  return (<div ref={editorRef} contentEditable onBlur={handleBlur} onKeyDown={handleKeyDown} className="w-full h-full min-h-[1.5em] outline-none font-body text-xs sm:text-sm text-foreground focus:ring-0 leading-relaxed custom-editor-content" />);
};

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

const StatusBadge = ({ status }: { status: TranslationUnit['status'] }) => {
  const styles = {
    translated: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    empty: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    approved: "bg-green-500/10 text-green-500 border-green-500/20"
  };
  const labels = { translated: "TRA", empty: "MT", approved: "APP" };
  const icons = {
    translated: <Check className="w-2.5 h-2.5 mr-1" />,
    empty: null,
    approved: <Check className="w-2.5 h-2.5 mr-1 stroke-[3]" />
  };
  return (
    <span className={cn("flex items-center px-1.5 py-0.5 rounded-[3px] text-[9px] font-black border uppercase tracking-tight", styles[status])}>
      {icons[status]} {labels[status]}
    </span>
  );
};







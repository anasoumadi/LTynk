"use client"

import React, { useMemo } from 'react';
import { TranslationSegment, TmxTag } from '@/lib/types';
import { TmxTagChip } from '../editor/TmxTagChip';
import { INTERNAL_TAG_REGEX } from '@/lib/qa-utils';
import { cn } from '@/lib/utils';

interface ReportSegmentProps {
  segment: TranslationSegment;
  highlights?: { start: number, end: number }[];
  showHidden?: boolean;
}

export const ReportSegment: React.FC<ReportSegmentProps> = ({ segment, highlights = [], showHidden = false }) => {
  const { text, tags } = segment;

  // Optimized memoized parts builder
  const parts = useMemo(() => {
    const localRegex = new RegExp(INTERNAL_TAG_REGEX.source, 'g');
    const result: { type: 'text' | 'tag', value: string, start: number, end: number, tag?: TmxTag }[] = [];
    let lastIdx = 0;
    let match;

    while ((match = localRegex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        result.push({ type: 'text', value: text.substring(lastIdx, match.index), start: lastIdx, end: match.index });
      }
      const tagId = match[0];
      const tag = tags.find(t => t.id === tagId);
      result.push({ type: 'tag', value: tagId, start: match.index, end: match.index + tagId.length, tag });
      lastIdx = match.index + tagId.length;
    }
    if (lastIdx < text.length) {
      result.push({ type: 'text', value: text.substring(lastIdx), start: lastIdx, end: text.length });
    }
    return result;
  }, [text, tags]);

  if (highlights.length === 0) {
    return (
      <div className="whitespace-pre-wrap break-words leading-relaxed">
        {parts.map((p, idx) => (
          p.type === 'tag' ? <TmxTagChip key={idx} tag={p.tag!} /> : <span key={idx}>{renderHidden(p.value, showHidden)}</span>
        ))}
      </div>
    );
  }

  const sortedHighlights = [...highlights].sort((a, b) => a.start - b.start);

  return (
    <div className="whitespace-pre-wrap break-words leading-relaxed">
      {parts.map((part, pIdx) => {
        const isTag = part.type === 'tag';
        const partHighlights = sortedHighlights.filter(h => h.start < part.end && h.end > part.start);

        if (partHighlights.length === 0) {
          return isTag ? <TmxTagChip key={pIdx} tag={part.tag!} /> : <span key={pIdx}>{renderHidden(part.value, showHidden)}</span>;
        }

        if (isTag) {
          return <TmxTagChip key={pIdx} tag={part.tag!} className="ring-2 ring-destructive/40 bg-destructive/10 shadow-sm" />;
        }

        const subParts: React.ReactNode[] = [];
        let curPos = part.start;

        partHighlights.forEach((h, hIdx) => {
          const hStart = Math.max(h.start, part.start);
          const hEnd = Math.min(h.end, part.end);
          if (hStart > curPos) {
            subParts.push(<span key={`p-${hIdx}`}>{renderHidden(text.substring(curPos, hStart), showHidden)}</span>);
          }
          subParts.push(
            <span key={`h-${hIdx}`} className="bg-destructive/25 rounded-[2px] shadow-[0_0_0_1px_rgba(239,68,68,0.15)] py-0.5 px-0.5 -mx-0.5">
              {renderHidden(text.substring(hStart, hEnd), showHidden)}
            </span>
          );
          curPos = hEnd;
        });

        if (curPos < part.end) {
          subParts.push(<span key="last">{renderHidden(text.substring(curPos, part.end), showHidden)}</span>);
        }

        return <span key={pIdx}>{subParts}</span>;
      })}
    </div>
  );
};

function renderHidden(t: string, showHidden: boolean) {
  if (!showHidden) return t;
  const parts = t.split(/([ \u00A0\n])/);
  return parts.map((part, i) => {
    if (part === ' ') return <span key={i} className="hidden-char-wrapper" data-symbol="·"> </span>;
    if (part === '\u00A0') return <span key={i} className="hidden-char-wrapper" data-symbol="°">&nbsp;</span>;
    if (part === '\n') return <span key={i} className="hidden-char-wrapper" data-symbol="¶">{"\n"}</span>;
    return part;
  });
}

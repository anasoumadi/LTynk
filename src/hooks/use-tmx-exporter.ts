
"use client"

import ExcelJS from 'exceljs';
import { TranslationUnit, Project, TranslationSegment } from '@/lib/types';
import { stripTags } from '@/lib/filter-engine';
import { transcodeTMX } from '@/lib/encoding-engine';

export interface ExportOptions {
  format: 'xlsx' | 'csv' | 'tmx';
  includeAttributes: boolean;
  stripTags: boolean;
  encoding: string;
}

/**
 * Reconstructs a segment string for TMX export, escaping text, restoring raw tags,
 * and sanitizing non-standard namespaced attributes from inline tags.
 */
const reconstructSegmentToStringForTmx = (segmentData: TranslationSegment): string => {
    const { text, tags } = segmentData;
    if (!text && (!tags || tags.length === 0)) return '';

    const tagMap = new Map(tags.map(t => [t.id, t.content]));
    const tagRegex = /(\[(?:bpt|ept|ph|it|ut|sub|x|g|bx|ex|mrk).*?_\d+\])/g;
    
    const escapeXml = (unsafe: string): string => {
        if (typeof unsafe !== 'string') return '';
        return unsafe.replace(/&/g, '&amp;')
                   .replace(/</g, '&lt;')
                   .replace(/>/g, '&gt;')
                   .replace(/"/g, '&quot;')
                   .replace(/'/g, '&apos;');
    };

    let result = '';
    let lastIndex = 0;
    let match;

    while ((match = tagRegex.exec(text)) !== null) {
        const textPart = text.substring(lastIndex, match.index);
        if (textPart) {
            result += escapeXml(textPart);
        }

        const tagId = match[0];
        const rawTag = tagMap.get(tagId) || '';

        // Sanitize the tag before adding it, removing non-standard namespaces.
        const sanitizedTag = rawTag.replace(/\s+([a-zA-Z0-9]+):([a-zA-Z0-9\-_]+)="[^"]*"/g, (fullMatch, prefix) => {
            // Allow 'xml:' namespace, remove others like 'sdl:'.
            if (prefix.toLowerCase() === 'xml') {
                return fullMatch;
            }
            return ''; // Remove the attribute
        });
        
        result += sanitizedTag;
        lastIndex = match.index + tagId.length;
    }

    const remainingText = text.substring(lastIndex);
    if (remainingText) {
        result += escapeXml(remainingText);
    }
    
    // Final sanity check
    return result.replace(/<x([^>]+)><\/x>/g, '<x$1/>');
};

export function useTmxExporter() {
  const exportData = async (
    project: Project, 
    segments: TranslationUnit[], 
    options: ExportOptions,
    onProgress: (p: number) => void
  ) => {
    onProgress(5);

    const sortedSegments = [...segments].sort((a, b) => {
      const aNum = parseInt(a.tu_id, 10);
      const bNum = parseInt(b.tu_id, 10);
      if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
      return a.tu_id.localeCompare(b.tu_id, undefined, { numeric: true, sensitivity: 'base' });
    });

    onProgress(10);

    if (options.format === 'tmx') {
      const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>\n<tmx version="1.4">\n  <header creationtool="Trust, but Verify" srclang="${project.sourceLang}" />\n  <body>\n`;
      const xmlFooter = `\n  </body>\n</tmx>`;
      
      const tuToXml = (tu: TranslationUnit) => {
        const escapeAttr = (val: any): string => {
            if (typeof val !== 'string') val = String(val);
            return val.replace(/&/g, '&amp;')
                       .replace(/</g, '&lt;')
                       .replace(/>/g, '&gt;')
                       .replace(/"/g, '&quot;')
                       .replace(/'/g, '&apos;');
        };
        
        // Filter out non-standard namespaced attributes to prevent XML errors.
        const meta = options.includeAttributes 
          ? Object.entries(tu.metadata)
              .filter(([k]) => k.toLowerCase() !== 'tuid' && (!k.includes(':') || k.startsWith('xml:')))
              .map(([k, v]) => ` ${k}="${escapeAttr(v)}"`)
              .join('') 
          : '';

        const sourceContent = reconstructSegmentToStringForTmx(tu.source);
        const targetContent = reconstructSegmentToStringForTmx(tu.target);

        return `    <tu tuid="${tu.tu_id}"${meta}>
      <tuv xml:lang="${tu.sourceLang}"><seg>${sourceContent}</seg></tuv>
      <tuv xml:lang="${tu.targetLang}"><seg>${targetContent}</seg></tuv>
    </tu>`;
      };

      const body = sortedSegments.map(tuToXml).join('\n');
      const xmlContent = xmlHeader + body + xmlFooter;
      
      const blob = await transcodeTMX(xmlContent, options.encoding);
      downloadBlob(blob, `${project.name}.${options.encoding.toLowerCase().includes('16') ? 'xml' : 'tmx'}`);
      onProgress(100);
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Export');

    const columns = [
      { header: 'ID', key: 'id', width: 15 },
      { header: `Source (${project.sourceLang})`, key: 'source', width: 60 },
      ...project.targetLangs.map(lang => ({ header: `Target (${lang})`, key: `target_${lang}`, width: 60 })),
    ];

    if (options.includeAttributes) {
      columns.push({ header: 'Status', key: 'status', width: 15 });
      columns.push({ header: 'Originator', key: 'creator', width: 20 });
    }
    worksheet.columns = columns;

    const rowsByTuId = new Map<string, any>();
    sortedSegments.forEach(seg => {
      let row = rowsByTuId.get(seg.tu_id);
      if (!row) {
        row = {
          id: seg.tu_id,
          source: options.stripTags ? stripTags(seg.source.text) : seg.source.text,
        };
        if (options.includeAttributes) {
          row.status = seg.status;
          row.creator = seg.metadata.creationid || 'N/A';
        }
        rowsByTuId.set(seg.tu_id, row);
      }
      row[`target_${seg.targetLang}`] = options.stripTags ? stripTags(seg.target.text) : seg.target.text;
    });

    Array.from(rowsByTuId.values()).forEach(row => worksheet.addRow(row));
    onProgress(90);

    if (options.format === 'xlsx') {
      const buffer = await workbook.xlsx.writeBuffer();
      downloadBlob(new Blob([buffer]), `${project.name}.xlsx`);
    } else {
      const buffer = await workbook.csv.writeBuffer();
      downloadBlob(new Blob([buffer]), `${project.name}.csv`);
    }
    
    onProgress(100);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return { exportData };
}

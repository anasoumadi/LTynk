"use client"

import * as XLSX from 'xlsx';
import { TranslationUnit, TranslationSegment } from '@/lib/types';
import { parseRawSegment } from '@/lib/tmx-utils';

export interface ImportMapping {
  sourceColumn: number;
  targetColumn: number;
  hasHeader: boolean;
  originatorId: string;
}

export function useTmxImporter() {
  const parseExternalFile = async (
    file: File,
    mapping: ImportMapping,
    projectId: string,
    fileId: string,
    sourceLang: string,
    targetLang: string
  ): Promise<TranslationUnit[]> => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    const startIndex = mapping.hasHeader ? 1 : 0;
    const units: TranslationUnit[] = [];

    for (let i = startIndex; i < rows.length; i++) {
      const row = rows[i];
      const sourceText = String(row[mapping.sourceColumn] || '');
      const targetText = String(row[mapping.targetColumn] || '');

      if (!sourceText && !targetText) continue;

      units.push({
        id: crypto.randomUUID(),
        tu_id: (units.length + 1).toString(),
        order: units.length,
        source: parseRawSegment(sourceText),
        target: parseRawSegment(targetText),
        status: targetText.trim() ? 'translated' : 'empty',
        metadata: {
          creationid: mapping.originatorId || 'imported_user',
          creationdate: new Date().toISOString().replace(/[-:T]/g, '').split('.')[0] + 'Z'
        },
        projectId,
        fileId,
        sourceLang,
        targetLang
      });
    }

    return units;
  };

  return { parseExternalFile };
}

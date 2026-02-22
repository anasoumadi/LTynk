"use client"

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { TranslationUnit, Project, ProjectFile, LanguageSet } from './types';
import { processRichText } from './rich-text-processor';

const COLORS = {
  headerBg: 'FF4F81BD',
  headerFg: 'FFFFFFFF',
  zebraBg: 'FFDCE6F1',
  clusterHeader: 'FFE2E8F0',
  labelBg: 'FFF2F2F2'
};

const COLUMN_WIDTHS = {
  errorNum: 10,
  description: 35,
  file: 20,
  text: 60,
  metadata: 15,
  comments: 25
};

export class LqaExportEngine {
  private workbook: ExcelJS.Workbook;
  private project: Project;
  private fileMap: Map<string, string>;
  private dateStr: string;
  private languageSet?: LanguageSet;

  constructor(project: Project, projectFiles: ProjectFile[], languageSet?: LanguageSet) {
    this.workbook = new ExcelJS.Workbook();
    this.project = project;
    this.fileMap = new Map(projectFiles.map(f => [f.id, f.name]));
    this.dateStr = new Date().toLocaleDateString();
    this.languageSet = languageSet;
  }

  async generate(segments: TranslationUnit[]) {
    // 1. Common Errors Sheet
    this.createCommonSheet(segments);

    // 2. Consistency Sheet
    this.createConsistencySheet(segments);

    // 3. Terminology Sheet
    this.createTerminologySheet(segments);

    // 4. User-Defined Sheet
    this.createUserDefinedSheet(segments);

    // 5. False Positives Sheet
    this.createFalsePositivesSheet(segments);

    // Finalize and Download
    const buffer = await this.workbook.xlsx.writeBuffer();
    const langSuffix = this.languageSet ? `${this.languageSet.src}_${this.languageSet.tgt}` : 'ALL';
    saveAs(new Blob([buffer]), `LQA_Report_${this.project.name.replace(/\.[^/.]+$/, "")}_${langSuffix}_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  private applyStandardHeader(sheet: ExcelJS.Worksheet) {
    sheet.mergeCells('A1:B1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'LQA Quality Report';
    titleCell.font = { size: 16, bold: true };

    const languageToDisplay = this.languageSet
      ? `${this.languageSet.src.toUpperCase()} -> ${this.languageSet.tgt.toUpperCase()}`
      : this.project.targetLangs.join(', ');

    const labels = [
      ['Project number:', this.project.id],
      ['Project name:', this.project.name],
      ['Language:', languageToDisplay],
      ['Date:', this.dateStr]
    ];

    labels.forEach((row, i) => {
      const r = i + 2;
      sheet.getCell(`A${r}`).value = row[0];
      sheet.getCell(`A${r}`).font = { bold: true };
      sheet.getCell(`B${r}`).value = row[1];
    });

    sheet.views = [{ state: 'frozen', ySplit: 7 }];
  }

  private styleDataRow(row: ExcelJS.Row, index: number) {
    row.alignment = { vertical: 'top', wrapText: true };
    if (index % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: COLORS.zebraBg }
        };
      });
    }
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD4D4D4' } },
        bottom: { style: 'thin', color: { argb: 'FFD4D4D4' } },
        left: { style: 'thin', color: { argb: 'FFD4D4D4' } },
        right: { style: 'thin', color: { argb: 'FFD4D4D4' } }
      };
    });
  }

  private styleHeaderRow(row: ExcelJS.Row) {
    row.height = 25;
    row.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.headerBg }
      };
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 10, name: 'Arial' };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFFFFFFF' } },
        bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
        left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
        right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
      };
    });
  }

  private createCommonSheet(segments: TranslationUnit[]) {
    const sheet = this.workbook.addWorksheet('Common Errors');
    this.applyStandardHeader(sheet);

    const headers = ['Error #', 'Description', 'File', 'Language', 'Source', 'Target', 'Protected', 'Match', 'Comments', "Translator's Answer"];
    const headerRow = sheet.getRow(7);
    headerRow.values = headers;
    this.styleHeaderRow(headerRow);

    sheet.columns = [
      { width: COLUMN_WIDTHS.errorNum },
      { width: COLUMN_WIDTHS.description },
      { width: COLUMN_WIDTHS.file },
      { width: COLUMN_WIDTHS.metadata },
      { width: COLUMN_WIDTHS.text },
      { width: COLUMN_WIDTHS.text },
      { width: COLUMN_WIDTHS.metadata },
      { width: COLUMN_WIDTHS.metadata },
      { width: COLUMN_WIDTHS.comments },
      { width: COLUMN_WIDTHS.comments }
    ];

    const specializedCodes = [
      'Target inconsistency', 'Source inconsistency', 
      'Terminology violation', 'Terminology count mismatch', 'Forbidden term detected',
      'User check'
    ];

    let rowIdx = 0;
    segments.forEach((tu) => {
      tu.qaIssues?.forEach((issue) => {
        if (issue.isIgnored || specializedCodes.includes(issue.code)) return;

        const row = sheet.addRow([
          tu.tu_id,
          issue.code,
          `${this.fileMap.get(tu.fileId) || 'N/A'} (${tu.tu_id})`,
          tu.targetLang.toUpperCase(),
          tu.source.text,
          processRichText(tu.target.text, issue.targetHighlights),
          tu.isLocked ? 'YES' : 'NO',
          '100%',
          '',
          ''
        ]);
        this.styleDataRow(row, rowIdx++);
        row.getCell(1).protection = { locked: true };
        row.getCell(4).protection = { locked: true };
      });
    });
  }

  private createConsistencySheet(segments: TranslationUnit[]) {
    const sheet = this.workbook.addWorksheet('Consistency Errors');
    this.applyStandardHeader(sheet);
  
    const headers = ['Error #', 'Source', 'Target', 'File (Position)', 'Language', 'Match', 'Comments', 'Penalty Score'];
    const headerRow = sheet.getRow(7);
    headerRow.values = headers;
    this.styleHeaderRow(headerRow);
  
    sheet.columns = [
      { width: COLUMN_WIDTHS.errorNum },
      { width: COLUMN_WIDTHS.text },
      { width: COLUMN_WIDTHS.text },
      { width: COLUMN_WIDTHS.description },
      { width: COLUMN_WIDTHS.metadata },
      { width: COLUMN_WIDTHS.metadata },
      { width: COLUMN_WIDTHS.comments },
      { width: COLUMN_WIDTHS.metadata }
    ];
  
    const targetClusters: Record<string, TranslationUnit[]> = {};
    const sourceClusters: Record<string, TranslationUnit[]> = {};
  
    segments.forEach(s => {
      s.qaIssues?.forEach(i => {
        if (i.isIgnored || !i.groupId) return;
  
        if (i.code === 'Target inconsistency') {
          if (!targetClusters[i.groupId]) targetClusters[i.groupId] = [];
          if (!targetClusters[i.groupId].find(tu => tu.id === s.id)) targetClusters[i.groupId].push(s);
        } else if (i.code === 'Source inconsistency') {
          if (!sourceClusters[i.groupId]) sourceClusters[i.groupId] = [];
          if (!sourceClusters[i.groupId].find(tu => tu.id === s.id)) sourceClusters[i.groupId].push(s);
        }
      });
    });
  
    let dataRowIdx = 0;
  
    // --- Render Target Inconsistency ---
    if (Object.keys(targetClusters).length > 0) {
      const sectionHeader = sheet.addRow(['Target Inconsistency (Same Source, Different Targets)']);
      sectionHeader.font = { bold: true, size: 12 };
      sheet.mergeCells(sectionHeader.number, 1, sectionHeader.number, headers.length);
      
      let clusterCount = 1;
      Object.values(targetClusters).forEach((group) => {
        const groupRow = sheet.addRow([`Conflict Cluster #${clusterCount++}`]);
        groupRow.getCell(1).font = { bold: true };
        groupRow.eachCell(c => {
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.clusterHeader } };
        });
  
        group.forEach(tu => {
          const row = sheet.addRow([
            tu.tu_id,
            tu.source.text, // Consistent
            tu.target.text, // Varies
            `${this.fileMap.get(tu.fileId) || 'N/A'} (TU ${tu.tu_id})`,
            tu.targetLang.toUpperCase(),
            '100%', '', '1.0'
          ]);
          this.styleDataRow(row, dataRowIdx++);
        });
        sheet.addRow([]);
      });
    }
  
    // --- Render Source Inconsistency ---
    if (Object.keys(sourceClusters).length > 0) {
      if (Object.keys(targetClusters).length > 0) sheet.addRow([]);
  
      const sectionHeader = sheet.addRow(['Source Inconsistency (Different Sources, Same Target)']);
      sectionHeader.font = { bold: true, size: 12 };
      sheet.mergeCells(sectionHeader.number, 1, sectionHeader.number, headers.length);
      
      let clusterCount = 1;
      Object.values(sourceClusters).forEach((group) => {
        const groupRow = sheet.addRow([`Conflict Cluster #${clusterCount++}`]);
        groupRow.getCell(1).font = { bold: true };
        groupRow.eachCell(c => {
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.clusterHeader } };
        });
  
        group.forEach(tu => {
          const row = sheet.addRow([
            tu.tu_id,
            tu.source.text, // Varies
            tu.target.text, // Consistent
            `${this.fileMap.get(tu.fileId) || 'N/A'} (TU ${tu.tu_id})`,
            tu.targetLang.toUpperCase(),
            '100%', '', '1.0'
          ]);
          this.styleDataRow(row, dataRowIdx++);
        });
        sheet.addRow([]);
      });
    }
  }

  private createTerminologySheet(segments: TranslationUnit[]) {
    const sheet = this.workbook.addWorksheet('Terminology Errors');
    this.applyStandardHeader(sheet);

    const headers = ['Description', 'File', 'Language', 'Glossary', 'Source Term', 'Target Term', 'Source', 'Target', 'Comments', 'Match'];
    const headerRow = sheet.getRow(7);
    headerRow.values = headers;
    this.styleHeaderRow(headerRow);

    sheet.columns = [
      { width: COLUMN_WIDTHS.description },
      { width: COLUMN_WIDTHS.file },
      { width: COLUMN_WIDTHS.metadata },
      { width: COLUMN_WIDTHS.metadata },
      { width: COLUMN_WIDTHS.metadata },
      { width: COLUMN_WIDTHS.metadata },
      { width: COLUMN_WIDTHS.text },
      { width: COLUMN_WIDTHS.text },
      { width: COLUMN_WIDTHS.comments },
      { width: COLUMN_WIDTHS.metadata }
    ];

    let rowIdx = 0;
    segments.forEach(tu => {
      tu.qaIssues?.forEach(issue => {
        if (!issue.isIgnored && (issue.code === 'Terminology violation' || issue.code === 'Terminology count mismatch' || issue.code === 'Forbidden term detected')) {
          
          // Improved extraction logic
          const matches = [...issue.message.matchAll(/"([^"]+)"/g)];
          let sourceTerm = matches[0] ? matches[0][1] : 'N/A';
          let targetTerm = matches[1] ? matches[1][1] : '';

          if (issue.code === 'Forbidden term detected') {
            targetTerm = sourceTerm;
            sourceTerm = 'N/A';
          }

          const row = sheet.addRow([
            issue.code,
            `${this.fileMap.get(tu.fileId) || 'N/A'} (${tu.tu_id})`,
            tu.targetLang.toUpperCase(),
            'Project Glossary',
            sourceTerm,
            targetTerm,
            tu.source.text,
            processRichText(tu.target.text, issue.targetHighlights),
            '',
            '100%'
          ]);
          this.styleDataRow(row, rowIdx++);
        }
      });
    });
  }

  private createUserDefinedSheet(segments: TranslationUnit[]) {
    const sheet = this.workbook.addWorksheet('User-Defined Errors');
    this.applyStandardHeader(sheet);

    const headers = ['Error #', 'Description', 'File', 'Language', 'Source', 'Target', 'Protected', 'Match', 'Comments', "Translator's Answer"];
    const headerRow = sheet.getRow(7);
    headerRow.values = headers;
    this.styleHeaderRow(headerRow);

    sheet.columns = [
      { width: COLUMN_WIDTHS.errorNum },
      { width: COLUMN_WIDTHS.description },
      { width: COLUMN_WIDTHS.file },
      { width: COLUMN_WIDTHS.metadata },
      { width: COLUMN_WIDTHS.text },
      { width: COLUMN_WIDTHS.text },
      { width: COLUMN_WIDTHS.metadata },
      { width: COLUMN_WIDTHS.metadata },
      { width: COLUMN_WIDTHS.comments },
      { width: COLUMN_WIDTHS.comments }
    ];

    let rowIdx = 0;
    segments.forEach(tu => {
      tu.qaIssues?.forEach(issue => {
        if (!issue.isIgnored && issue.code === 'User check') {
          const row = sheet.addRow([
            tu.tu_id,
            issue.message.replace('User Check: ', ''),
            `${this.fileMap.get(tu.fileId) || 'N/A'} (${tu.tu_id})`,
            tu.targetLang.toUpperCase(),
            tu.source.text,
            processRichText(tu.target.text, issue.targetHighlights),
            tu.isLocked ? 'YES' : 'NO',
            '100%',
            '',
            ''
          ]);
          this.styleDataRow(row, rowIdx++);
        }
      });
    });
  }

  private createFalsePositivesSheet(segments: TranslationUnit[]) {
    const sheet = this.workbook.addWorksheet('False Positives');
    this.applyStandardHeader(sheet);

    const headers = ['Category', 'Error Type', 'File', 'Language', 'Source', 'Target', 'Reason for Suppression'];
    const headerRow = sheet.getRow(7);
    headerRow.values = headers;
    this.styleHeaderRow(headerRow);

    sheet.columns = [
      { width: COLUMN_WIDTHS.metadata },
      { width: COLUMN_WIDTHS.description },
      { width: COLUMN_WIDTHS.file },
      { width: COLUMN_WIDTHS.metadata },
      { width: COLUMN_WIDTHS.text },
      { width: COLUMN_WIDTHS.text },
      { width: COLUMN_WIDTHS.comments }
    ];

    let rowIdx = 0;
    segments.forEach(tu => {
      tu.qaIssues?.forEach(issue => {
        if (issue.isIgnored) {
          const category = this.getCategoryFromCode(issue.code);
          const row = sheet.addRow([
            category,
            issue.code,
            `${this.fileMap.get(tu.fileId) || 'N/A'} (${tu.tu_id})`,
            tu.targetLang.toUpperCase(),
            tu.source.text,
            tu.target.text,
            'Marked as False Positive'
          ]);
          this.styleDataRow(row, rowIdx++);
        }
      });
    });
  }

  private getCategoryFromCode(code: string): string {
    const lower = code.toLowerCase();
    if (lower.includes('terminology') || lower.includes('forbidden term') || lower.includes('glossary')) return 'Terminology';
    if (lower.includes('inconsistency')) return 'Consistency';
    if (lower === 'user check') return 'Custom';
    if (lower.includes('tag') || lower.includes('entity')) return 'Tags';
    if (lower.includes('number') || lower.includes('range')) return 'Numbers';
    if (lower.includes('measurement') || lower.includes('unit')) return 'Measurements';
    if (lower.includes('punctuation') || lower.includes('space') || lower.includes('bracket')) return 'Punctuation';
    return 'Common';
  }
}

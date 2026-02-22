
"use client"

import { TranslationUnit, TranslationSegment, Project, ProjectFile, ProjectType, SupportedFileFormat, TUStatus } from './types';
import { parseRawSegment } from './tmx-utils';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

const generateId = () => crypto.randomUUID();
// AS: Helper to match language codes (e.g., 'en-US' matches 'en')
const langMatch = (lang1: string, lang2: string): boolean => {
  if (!lang1 || !lang2) return false;
  const l1 = lang1.split('-')[0].toLowerCase();
  const l2 = lang2.split('-')[0].toLowerCase();
  return l1 === l2;
}

/**
 * anasoumadi: Parses a TMX document into Translation Units.
 * It handles both monolingual and multilingual projects by finding appropriate TUVs.
 */
function parseTmx(xmlDoc: Document, file: ProjectFile, projectId: string, projectType: ProjectType): TranslationUnit[] {
  const units: TranslationUnit[] = [];
  const tuElements = xmlDoc.getElementsByTagNameNS("*", "tu");
  const serializer = new XMLSerializer();
  let segmentOrder = 0;

  for (let i = 0; i < tuElements.length; i++) {
    const tu = tuElements[i];
    const tu_id = tu.getAttribute("tuid") || (i + 1).toString();
    const tuvs = Array.from(tu.getElementsByTagNameNS("*", "tuv"));

    const sourceTuv = tuvs.find(tuv => langMatch(tuv.getAttribute("xml:lang") || tuv.getAttribute("lang") || '', file.sourceLang));

    if (!sourceTuv) {
      continue; // AS: Skip TU if it doesn't have the source language
    }

    let targetTuv: Element | undefined;

    // anasoumadi: Try to find the specific target language passed in the file metadata
    targetTuv = tuvs.find(tuv => langMatch(tuv.getAttribute("xml:lang") || tuv.getAttribute("lang") || '', file.targetLang));

    // If a multilingual project and specific target not found, find the first available non-source target.
    if (!targetTuv && projectType === 'multilingual') {
      targetTuv = tuvs.find(tuv => !langMatch(tuv.getAttribute("xml:lang") || tuv.getAttribute("lang") || '', file.sourceLang));
    }

    const getSegContent = (tuv: Element): string => {
      const segElements = tuv.getElementsByTagNameNS('*', 'seg');
      if (segElements.length === 0) return '';
      const segElement = segElements[0];

      return Array.from(segElement.childNodes).map(child => {
        if (child.nodeType === 3) { // TEXT_NODE
          return child.textContent || '';
        }
        if (child.nodeType === 1) { // ELEMENT_NODE
          return serializer.serializeToString(child as Element);
        }
        return '';
      }).join('');
    };

    const sourceRaw = getSegContent(sourceTuv);
    const targetRaw = targetTuv ? getSegContent(targetTuv) : ''; // AS: Fallback to empty if no target TUV found

    const source = parseRawSegment(sourceRaw);
    const target = parseRawSegment(targetRaw);

    // If both are empty, it's a structural tag, skip it.
    if (!source.text.trim() && source.tags.length === 0 && !target.text.trim() && target.tags.length === 0) {
      continue;
    }

    let status: TUStatus = target.text.trim() ? 'translated' : 'empty';

    const metadata: Record<string, any> = {};
    for (let j = 0; j < tu.attributes.length; j++) {
      const attr = tu.attributes[j];
      metadata[attr.name] = attr.value;
    }
    const propElements = Array.from(tu.getElementsByTagNameNS("*", "prop"));
    propElements.forEach(prop => {
      const type = prop.getAttribute('type') || '';
      const value = prop.textContent || '';
      metadata[type] = value;

      if (['x-confirmation-level', 'x-status', 'sts'].includes(type.toLowerCase())) {
        const lowerVal = value.toLowerCase();
        if (lowerVal.includes('approved') || lowerVal.includes('final') || lowerVal.includes('signoff')) {
          status = 'approved';
        } else if (lowerVal.includes('translated') && target.text.trim()) {
          status = 'translated';
        }
      }
    });

    const actualTargetLang = targetTuv?.getAttribute("xml:lang") || targetTuv?.getAttribute("lang") || file.targetLang;

    units.push({
      id: generateId(),
      tu_id,
      source,
      target,
      status,
      metadata,
      projectId,
      fileId: file.id,
      sourceLang: file.sourceLang,
      targetLang: actualTargetLang,
      order: segmentOrder++
    });
  }
  return units;
}

/**
 * AS: XLIFF Parser (handles v1.2 and v2.0, including SDL and MemoQ variants)
 * We normalize the structure into our internal TranslationUnit format.
 */
function parseXliff(xmlDoc: Document, file: ProjectFile, projectId: string): TranslationUnit[] {
  const units: TranslationUnit[] = [];
  const serializer = new XMLSerializer();
  let segmentOrder = 0;

  const getRawContent = (node: Element | null): string => {
    if (!node) return '';
    return Array.from(node.childNodes).map(child => {
      if (child.nodeType === 3) { // TEXT_NODE
        return child.textContent || '';
      }
      if (child.nodeType === 1) { // ELEMENT_NODE
        return serializer.serializeToString(child as Element);
      }
      return '';
    }).join('');
  };

  // anasoumadi: Special handling for SDLXLIFF with segment definitions found in header
  const isSdlXliff = xmlDoc.lookupNamespaceURI('sdl') === 'http://sdl.com/FileTypes/SdlXliff/1.0';

  if (isSdlXliff) {
    const metadataMap = new Map();
    const segDefs = xmlDoc.getElementsByTagNameNS('http://sdl.com/FileTypes/SdlXliff/1.0', 'seg-defs');

    for (const defs of Array.from(segDefs)) {
      const segs = defs.getElementsByTagNameNS('http://sdl.com/FileTypes/SdlXliff/1.0', 'seg');
      for (const seg of Array.from(segs)) {
        const conf = seg.getAttribute('conf') || 'Unspecified';
        let status: TUStatus = 'empty';
        switch (conf) {
          case 'Translated':
            status = 'translated';
            break;
          case 'Approved':
          case 'ApprovedTranslation':
          case 'SignedOff':
          case 'ApprovedSignOff':
            status = 'approved';
            break;
          default:
            status = 'empty';
        }
        metadataMap.set(seg.getAttribute('id'), {
          isLocked: seg.getAttribute('locked') === 'true',
          status: status,
          origin: seg.getAttribute('origin')
        });
      }
    }

    const transUnits = xmlDoc.getElementsByTagName('trans-unit');
    for (const unit of Array.from(transUnits)) {
      const transUnitId = unit.getAttribute('id');
      const sourceMrks = unit.querySelectorAll('seg-source mrk[mtype="seg"]');
      const targetMrks = unit.querySelectorAll('target mrk[mtype="seg"]');
      const targetMrkMap = new Map();
      targetMrks.forEach(mrk => targetMrkMap.set(mrk.getAttribute('mid'), mrk));

      for (const sourceMrk of Array.from(sourceMrks)) {
        const mid = sourceMrk.getAttribute('mid');
        if (!mid) continue;

        const targetMrk = targetMrkMap.get(mid);
        const meta = metadataMap.get(mid) || { isLocked: false, status: 'empty', origin: 'unknown' };

        const source = parseRawSegment(getRawContent(sourceMrk));
        const target = targetMrk ? parseRawSegment(getRawContent(targetMrk)) : parseRawSegment('');

        if ((!source.text.trim() && source.tags.length === 0) && (!target.text.trim() && target.tags.length === 0)) continue;

        units.push({
          id: generateId(),
          tu_id: mid,
          source,
          target,
          status: meta.status,
          isLocked: meta.isLocked,
          metadata: { resname: unit.getAttribute('resname'), origin: meta.origin, transUnitId: transUnitId },
          projectId,
          fileId: file.id,
          sourceLang: file.sourceLang,
          targetLang: file.targetLang,
          order: segmentOrder++
        });
      }
    }
    return units;
  }

  // AS: XLIFF 2.0 support
  const isV2 = xmlDoc.querySelector('xliff[version="2.0"]') !== null;
  if (isV2) {
    const unitElements = xmlDoc.getElementsByTagName("unit");
    for (let i = 0; i < unitElements.length; i++) {
      const unit = unitElements[i];
      const segments = unit.getElementsByTagName('segment');
      for (let j = 0; j < segments.length; j++) {
        const segment = segments[j];
        const tu_id = segments.length > 1 ? `${unit.getAttribute("id") || i + 1}-${j + 1}` : unit.getAttribute("id") || `${i + 1}`;
        const sourceNode = segment.querySelector("source");
        const targetNode = segment.querySelector("target");

        const source = parseRawSegment(getRawContent(sourceNode));
        const target = parseRawSegment(getRawContent(targetNode));

        if ((!source.text.trim() && source.tags.length === 0) && (!target.text.trim() && target.tags.length === 0)) continue;

        units.push({
          id: generateId(), tu_id, source, target, status: target.text.trim() ? 'translated' : 'empty',
          metadata: { resname: unit.getAttribute('resname') },
          projectId, fileId: file.id, sourceLang: file.sourceLang, targetLang: file.targetLang, order: segmentOrder++
        });
      }
    }
  } else {
    // anasoumadi: Basic XLIFF 1.2 support
    const transUnits = xmlDoc.getElementsByTagName("trans-unit");
    for (let i = 0; i < transUnits.length; i++) {
      const unit = transUnits[i];
      const id = unit.getAttribute("id") || (i + 1).toString();

      const sourceNode: Element | null = unit.querySelector("source");
      const targetNode = unit.querySelector("target");

      const source = parseRawSegment(getRawContent(sourceNode));
      const target = parseRawSegment(getRawContent(targetNode));

      if ((!source.text.trim() && source.tags.length === 0) && (!target.text.trim() && target.tags.length === 0)) continue;

      units.push({
        id: generateId(), tu_id: id, source, target, status: target.text.trim() ? 'translated' : 'empty',
        metadata: { resname: unit.getAttribute('resname') },
        projectId, fileId: file.id, sourceLang: file.sourceLang, targetLang: file.targetLang, order: segmentOrder++
      });
    }
  }
  return units;
}


// XLSX Parser
function parseXlsx(data: ArrayBuffer, file: ProjectFile, projectId: string): TranslationUnit[] {
  const workbook = XLSX.read(data, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

  const units: TranslationUnit[] = [];
  rows.slice(1).forEach((row, i) => {
    if (!row[0] && !row[1]) return;
    const source = parseRawSegment(String(row[0] || ''));
    const target = parseRawSegment(String(row[1] || ''));
    units.push({
      id: generateId(), tu_id: (i + 1).toString(), source, target, status: target.text.trim() ? 'translated' : 'empty', metadata: {},
      projectId, fileId: file.id, sourceLang: file.sourceLang, targetLang: file.targetLang, order: i
    });
  });
  return units;
}

// Main parsing orchestrator
export async function parseFiles(files: File[], projectName: string, projectType: ProjectType) {
  let allSegments: TranslationUnit[] = [];
  let projectFiles: ProjectFile[] = [];
  let sourceLang = '';
  const targetLangs = new Set<string>();
  const projectId = generateId();

  const getLangsFromXliff = (doc: Document) => {
    const xliffV2Node = doc.querySelector('xliff[version="2.0"]');
    if (xliffV2Node) {
      return {
        src: xliffV2Node.getAttribute('srcLang') || 'unknown',
        tgt: xliffV2Node.getAttribute('trgLang') || 'unknown',
      };
    }

    const fileV1Node = doc.querySelector('file');
    if (fileV1Node) {
      return {
        src: fileV1Node.getAttribute('source-language') || 'unknown',
        tgt: fileV1Node.getAttribute('target-language') || 'unknown',
      };
    }

    return { src: 'unknown', tgt: 'unknown' };
  };

  for (const file of files) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const format = (extension || 'unknown') as SupportedFileFormat;
    const fileId = generateId();
    let fileSourceLang = '';
    let fileTargetLang = '';
    let units: TranslationUnit[] = [];

    let fileContent: string;
    let mainFileName = file.name;

    if (format === 'mqxlz') {
      const zip = await JSZip.loadAsync(file);
      const mxliffFile = Object.values(zip.files).find(f => f.name.endsWith('.mqxliff'));
      if (!mxliffFile) throw new Error('No .mqxliff file found in the provided .mqxlz archive.');
      fileContent = await mxliffFile.async('string');
      mainFileName = mxliffFile.name;
    } else {
      fileContent = await file.text();
    }

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(fileContent, "text/xml");

    switch (format) {
      case 'tmx':
        const header = xmlDoc.getElementsByTagNameNS('*', 'header')[0];
        fileSourceLang = header?.getAttribute('srclang') || 'unknown';
        const tuvs = xmlDoc.getElementsByTagNameNS('*', 'tuv');
        const tuvLangs = new Set(Array.from(tuvs).map(t => (t.getAttribute('lang') || t.getAttribute('xml:lang') || '')));
        tuvLangs.delete(fileSourceLang);
        fileTargetLang = [...tuvLangs][0] || 'unknown';
        break;
      case 'xliff':
      case 'sdlxliff':
      case 'mqxliff':
        const langs = getLangsFromXliff(xmlDoc);
        fileSourceLang = langs.src;
        fileTargetLang = langs.tgt;
        break;
      case 'xlsx':
        fileSourceLang = 'unknown-xlsx';
        fileTargetLang = 'unknown-xlsx';
        break;
      default:
        // Let it fall through, rawContent will still be saved.
        break;
    }

    if (!sourceLang) sourceLang = fileSourceLang;
    targetLangs.add(fileTargetLang);

    const projectFile: ProjectFile = {
      id: fileId, projectId, name: mainFileName, format, sourceLang: fileSourceLang, targetLang: fileTargetLang, segmentCount: 0, size: file.size, createdAt: new Date(), rawContent: fileContent
    };

    switch (format) {
      case 'tmx': units = parseTmx(xmlDoc, projectFile, projectId, projectType); break;
      case 'xliff':
      case 'sdlxliff':
      case 'mqxliff': units = parseXliff(xmlDoc, projectFile, projectId); break;
      case 'xlsx': units = parseXlsx(await file.arrayBuffer(), projectFile, projectId); break;
    }

    projectFile.segmentCount = units.length;
    projectFiles.push(projectFile);
    allSegments.push(...units);
  }

  const project: Project = {
    id: projectId, name: projectName, type: projectType, sourceLang, targetLangs: Array.from(targetLangs),
    fileCount: projectFiles.length, segmentCount: allSegments.length,
    lastOpened: new Date(), createdAt: new Date(),
    completion: 0
  };

  return { project, projectFiles, segments: allSegments };
}

import { TranslationUnit, CleanupConfig, CleanupReport, TranslationSegment } from './types';

export function runCleanupBatch(
  segments: TranslationUnit[],
  config: CleanupConfig,
  onProgress: (progress: number) => void
): { updatedSegments: TranslationUnit[]; deletedIds: string[]; report: CleanupReport } {
  const deletedIds: string[] = [];
  const report: CleanupReport = {
    modified: 0,
    deleted: 0,
    duplicatesRemoved: 0,
    tagsFixed: 0,
    metadataUpdated: 0,
  };

  const seenSegments = new Map<string, TranslationUnit>();
  let resultSegments: TranslationUnit[] = [];

  const total = segments.length;

  for (let i = 0; i < segments.length; i++) {
    let tu = { ...segments[i] };
    let isDeleted = false;
    let isModified = false;

    // 1. Structural Hygiene
    if (config.removeEmpty) {
      if (!tu.target.text.trim()) {
        deletedIds.push(tu.id);
        report.deleted++;
        isDeleted = true;
      }
    }

    if (!isDeleted && config.removeUntranslated) {
      if (tu.target.text.trim() && tu.source.text === tu.target.text) {
        deletedIds.push(tu.id);
        report.deleted++;
        isDeleted = true;
      }
    }

    if (isDeleted) continue;

    // 2. Text & Whitespace Sanitation
    if (config.trimWhitespace) {
      const oldSource = tu.source.text;
      const oldTarget = tu.target.text;
      tu.source.text = tu.source.text.trim();
      tu.target.text = tu.target.text.trim();
      if (oldSource !== tu.source.text || oldTarget !== tu.target.text) isModified = true;
    }

    if (config.normalizeSpacing) {
      const normalize = (s: string) => s.replace(/\s+/g, ' ');
      const oldSource = tu.source.text;
      const oldTarget = tu.target.text;
      tu.source.text = normalize(tu.source.text);
      tu.target.text = normalize(tu.target.text);
      if (oldSource !== tu.source.text || oldTarget !== tu.target.text) isModified = true;
    }

    if (config.stripControlChars) {
      const strip = (s: string) => s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
      tu.source.text = strip(tu.source.text);
      tu.target.text = strip(tu.target.text);
    }

    // 3. Tag Repair
    if (config.stripAllTags) {
      tu.source.text = tu.source.text.replace(/\[.*?\]/g, '');
      tu.target.text = tu.target.text.replace(/\[.*?\]/g, '');
      tu.source.tags = [];
      tu.target.tags = [];
      report.tagsFixed++;
      isModified = true;
    }

    // 4. Metadata
    if (config.anonymizeUsers) {
      tu.metadata.creationid = 'tmx_editor_user';
      tu.metadata.changeid = 'tmx_editor_user';
      report.metadataUpdated++;
      isModified = true;
    }

    if (config.batchDateUpdate) {
      tu.lastModified = new Date();
      isModified = true;
    }

    // 5. Custom Regex
    if (config.customRegexEnabled && config.customRegexFind) {
      try {
        const regex = new RegExp(config.customRegexFind, 'g');
        tu.target.text = tu.target.text.replace(regex, config.customRegexReplace);
        isModified = true;
      } catch (e) {
        console.error("Invalid Regex in Cleanup:", e);
      }
    }

    // 6. Deduplication (Check against processed list)
    if (config.deleteExactDuplicates) {
      const key = `${tu.source.text}|||${tu.target.text}`;
      if (seenSegments.has(key)) {
        deletedIds.push(tu.id);
        report.duplicatesRemoved++;
        continue;
      }
      seenSegments.set(key, tu);
    }

    if (isModified) report.modified++;
    resultSegments.push(tu);

    if (i % 100 === 0) onProgress(Math.floor((i / total) * 100));
  }

  onProgress(100);
  return { updatedSegments: resultSegments, deletedIds, report };
}

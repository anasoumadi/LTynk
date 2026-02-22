import { TranslationUnit, BatchRule, BatchConfig } from './types';

/**
 * Escapes XML reserved characters to entities
 */
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

/**
 * Normalizes text for comparison by removing diacritics
 */
function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Performs tag-aware replacement on a string
 * Protected segments like [ph:1_0] are ignored during find
 */
export function applyBatchRule(text: string, rule: BatchRule): { result: string, wasModified: boolean } {
  const tagRegex = /\[(?:bpt|ept|ph|it|ut|sub|x|g|bx|ex)(?::\d+)?_\d+\]/g;
  
  // Split the text into translatable parts and protected tags
  const parts = text.split(tagRegex);
  const tags = text.match(tagRegex) || [];
  
  let wasModified = false;
  
  // Process translatable parts only
  const processedParts = parts.map(part => {
    if (!part) return part;
    
    let findStr = rule.find;
    let targetPart = part;
    
    // Handle diacritic sensitivity by normalizing find/target if needed
    // Note: Regex mode handles flags directly
    const flags = rule.caseSensitive ? 'g' : 'gi';
    let regex: RegExp;

    try {
      if (rule.isRegex) {
        regex = new RegExp(findStr, flags);
      } else {
        // Escape special chars for literal search
        let escapedFind = findStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (rule.wholeWord) {
          escapedFind = `\\b${escapedFind}\\b`;
        }
        regex = new RegExp(escapedFind, flags);
      }

      const original = targetPart;
      // We escape the replacement string if it contains XML chars to prevent breaking TMX
      const safeReplace = escapeXml(rule.replace);
      
      targetPart = targetPart.replace(regex, safeReplace);
      
      if (original !== targetPart) wasModified = true;
    } catch (e) {
      console.error("Batch Rule Error:", e);
    }
    
    return targetPart;
  });

  // Reconstruct
  let result = '';
  for (let i = 0; i < processedParts.length; i++) {
    result += processedParts[i];
    if (i < tags.length) {
      result += tags[i];
    }
  }

  return { result, wasModified };
}

/**
 * Processes a single Translation Unit based on full batch config
 */
export function processUnitBatch(tu: TranslationUnit, config: BatchConfig): { updatedTu: TranslationUnit, changed: boolean } {
  let changed = false;
  const newTu = { ...tu, source: { ...tu.source }, target: { ...tu.target }, metadata: { ...tu.metadata } };

  // 1. Text Transformations
  config.rules.forEach(rule => {
    if (config.scope === 'source' || config.scope === 'both') {
      const { result, wasModified } = applyBatchRule(newTu.source.text, rule);
      newTu.source.text = result;
      if (wasModified) changed = true;
    }
    
    if (config.scope === 'target' || config.scope === 'both') {
      const { result, wasModified } = applyBatchRule(newTu.target.text, rule);
      newTu.target.text = result;
      if (wasModified) changed = true;
    }
  });

  // 2. Metadata Updates
  if (changed) {
    if (config.metadataUpdates.updateUser) {
      newTu.metadata.changeid = config.metadataUpdates.userName;
      newTu.lastModifiedBy = config.metadataUpdates.userName;
    }
    if (config.metadataUpdates.updateDate) {
      newTu.lastModified = new Date();
      newTu.metadata.changedate = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0] + 'Z';
    }
  }

  return { updatedTu: newTu, changed };
}

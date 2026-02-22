
import { TranslationUnit, TranslationSegment } from './types';

// Gate 2: Helper to escape XML special characters for safe injection into XML content.
function escapeXml(text: string): string {
    if (typeof text !== 'string') return '';
    return text.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;')
               .replace(/"/g, '&quot;')
               .replace(/'/g, '&apos;');
}

const langMatch = (lang1: string, lang2: string): boolean => {
    if (!lang1 || !lang2) return false;
    const l1 = lang1.split('-')[0].toLowerCase();
    const l2 = lang2.split('-')[0].toLowerCase();
    return l1 === l2;
}

/**
 * Gate 1 & 2 & Sanity Check: The Content Preparer.
 * Reconstructs a segment string, escaping text and restoring raw tags from the vault.
 */
export function reconstructSegmentToString(segmentData: TranslationSegment): string {
    const { text, tags } = segmentData;
    if (!text && (!tags || tags.length === 0)) return '';

    // Gate 1: The Tag Vault
    const tagMap = new Map(tags.map(t => [t.id, t.content]));
    const tagRegex = /(\[(?:bpt|ept|ph|it|ut|sub|x|g|bx|ex|mrk).*?_\d+\])/g;
    
    let result = '';
    let lastIndex = 0;
    let match;

    while ((match = tagRegex.exec(text)) !== null) {
        const textPart = text.substring(lastIndex, match.index);
        if (textPart) {
            result += escapeXml(textPart);
        }

        const tagId = match[0];
        result += tagMap.get(tagId) || '';

        lastIndex = match.index + tagId.length;
    }

    const remainingText = text.substring(lastIndex);
    if (remainingText) {
        result += escapeXml(remainingText);
    }
    
    // Sanity Check: Self-Closing Tag Fix (safe for TMX and XLIFF)
    const sanitizedResult = result.replace(/<x([^>]+)><\/x>/g, '<x$1/>');

    return sanitizedResult;
}

interface UpdateJob {
    start: number;
    end: number;
    newContent: string;
}

function applyJobs(rawContent: string, jobs: UpdateJob[]): string {
    jobs.sort((a, b) => b.start - a.start);
    let modifiableContent = rawContent;
    for (const job of jobs) {
        if (job.start < 0 || job.end < 0 || job.end < job.start) continue;
        modifiableContent = 
            modifiableContent.substring(0, job.start) + 
            job.newContent + 
            modifiableContent.substring(job.end);
    }
    return modifiableContent;
}

export function updateXliffFromSegments(rawContent: string, segments: TranslationUnit[], addDeclaration: boolean = true): string {
    const jobs: UpdateJob[] = [];
    const isSdl = rawContent.includes('sdl:seg-defs');

    // Filter for segments that have actually been modified to improve performance
    const modifiedSegments = segments.filter(s => s.lastModified);

    if (isSdl) {
        for (const segment of modifiedSegments) {
            const transUnitId = segment.metadata.transUnitId;
            if (!transUnitId) continue;
            
            // A. Find the Translation Unit block
            const tuMarker = `id="${transUnitId}"`;
            const tuStartIdx = rawContent.indexOf(tuMarker);
            if (tuStartIdx === -1) continue;
            const tuBlockStart = rawContent.lastIndexOf('<trans-unit', tuStartIdx);
            if (tuBlockStart === -1) continue;
            const tuBlockEnd = rawContent.indexOf('</trans-unit>', tuBlockStart);
            if (tuBlockEnd === -1) continue;

            // B. Find the Target Block (Strict Boundary)
            const targetStart = rawContent.indexOf('<target>', tuBlockStart);
            if (targetStart === -1 || targetStart > tuBlockEnd) continue;
            const targetEnd = rawContent.indexOf('</target>', targetStart);
            if (targetEnd === -1 || targetEnd > tuBlockEnd) continue;

            // C. Find the Specific Segment Marker INSIDE the Target
            const mrkMarker = `mid="${segment.tu_id}"`;
            const mrkStart = rawContent.indexOf(mrkMarker, targetStart);
            if (mrkStart === -1 || mrkStart > targetEnd) continue;

            // D. Find the content boundaries
            const contentStartTagEnd = rawContent.indexOf('>', mrkStart);
            const contentStart = contentStartTagEnd + 1;
            const contentEnd = rawContent.indexOf('</mrk>', contentStart);
            if (contentStart === 0 || contentEnd === -1 || contentEnd > targetEnd) continue;
            
            // E. Reconstruct and compare
            const newContent = reconstructSegmentToString(segment.target);
            const originalContent = rawContent.substring(contentStart, contentEnd);
            
            if (newContent !== originalContent) {
                jobs.push({ start: contentStart, end: contentEnd, newContent });
            }

            // F. Update Metadata (Conf/Locked)
            const segDefRegex = new RegExp(`<sdl:seg id="${segment.tu_id}"([^>]*?)(\\/?)>`);
            const segDefMatch = segDefRegex.exec(rawContent);

            if (segDefMatch) {
                const originalAttributes = segDefMatch[1];
                let newAttributes = originalAttributes;
                
                let newConf: string;
                if (segment.status === 'approved') newConf = 'ApprovedTranslation';
                else if (segment.status === 'translated' && segment.target.text.trim() !== '') newConf = 'Translated';
                else newConf = 'Draft';

                if (/conf="[^"]*"/.test(newAttributes)) {
                    newAttributes = newAttributes.replace(/conf="[^"]*"/, `conf="${newConf}"`);
                } else {
                    newAttributes += ` conf="${newConf}"`;
                }

                const lockedStr = segment.isLocked ? 'true' : 'false';
                if (/locked="[^"]*"/.test(newAttributes)) {
                    newAttributes = newAttributes.replace(/locked="[^"]*"/, `locked="${lockedStr}"`);
                } else {
                    newAttributes += ` locked="${lockedStr}"`;
                }

                if (newAttributes !== originalAttributes) {
                    const start = segDefMatch.index + segDefMatch[0].indexOf(originalAttributes);
                    const end = start + originalAttributes.length;
                    jobs.push({ start, end, newContent: newAttributes });
                }
            }
        }
    } else { // Standard XLIFF 1.2
        for (const segment of modifiedSegments) {
            const tuIdAttr = `id="${segment.tu_id}"`;
            const tuTagIndex = rawContent.indexOf(tuIdAttr);
            if (tuTagIndex === -1) continue;
            
            const tuStart = rawContent.lastIndexOf('<trans-unit', tuTagIndex);
            if (tuStart === -1) continue;
            const tuEnd = rawContent.indexOf('</trans-unit>', tuStart);
            if (tuEnd === -1) continue;

            const targetStart = rawContent.indexOf('<target>', tuStart);
            if (targetStart === -1 || targetStart > tuEnd) continue;
            
            const contentStart = targetStart + '<target>'.length;
            const contentEnd = rawContent.indexOf('</target>', contentStart);
            if (contentEnd === -1 || contentEnd > tuEnd) continue;

            const originalContent = rawContent.substring(contentStart, contentEnd);
            const newContent = reconstructSegmentToString(segment.target);
            if (newContent !== originalContent) {
                jobs.push({ start: contentStart, end: contentEnd, newContent });
            }
        }
    }
    
    let finalXml = applyJobs(rawContent, jobs);
    if (addDeclaration && !finalXml.trim().startsWith('<?xml')) {
        finalXml = `<?xml version="1.0" encoding="utf-8"?>\n${finalXml}`;
    }
    return finalXml;
}

export function updateTmxFromSegments(rawContent: string, segments: TranslationUnit[]): string {
    const jobs: UpdateJob[] = [];
    
    for(const segment of segments) {
        const tuIdAttr = `tuid="${segment.tu_id}"`;
        const tuTagIndex = rawContent.indexOf(tuIdAttr);
        if (tuTagIndex === -1) continue;
        
        const tuStart = rawContent.lastIndexOf('<tu', tuTagIndex);
        if (tuStart === -1) continue;

        const tuEnd = rawContent.indexOf('</tu>', tuStart);
        if (tuEnd === -1) continue;
        
        let searchOffset = tuStart;
        while(searchOffset < tuEnd) {
            const tuvStart = rawContent.indexOf('<tuv', searchOffset);
            if (tuvStart === -1 || tuvStart >= tuEnd) break;

            const tuvTagEnd = rawContent.indexOf('>', tuvStart);
            if (tuvTagEnd === -1 || tuvTagEnd >= tuEnd) break;

            const tuvTag = rawContent.substring(tuvStart, tuvTagEnd + 1);
            const tuvLangMatch = tuvTag.match(/(?:xml:)?lang=["']([^"']+)["']/);
            const lang = tuvLangMatch ? tuvLangMatch[1] : '';
            
            if (lang && langMatch(lang, segment.targetLang)) {
                const searchArea = rawContent.substring(tuvStart, tuEnd);
                const segTagRegex = /<seg([^>]*)>/;
                const segMatch = segTagRegex.exec(searchArea);

                if (!segMatch) break;

                const fullSegTag = segMatch[0];
                const segTagAttributes = segMatch[1];
                const segStartInSearchArea = segMatch.index;
                const segStartAbsolute = tuvStart + segStartInSearchArea;
                const isSelfClosing = fullSegTag.endsWith('/>');

                if (isSelfClosing) {
                    const newContentString = reconstructSegmentToString(segment.target);
                    if (newContentString) {
                        const newFullTag = `<seg${segTagAttributes}>${newContentString}</seg>`;
                        jobs.push({ start: segStartAbsolute, end: segStartAbsolute + fullSegTag.length, newContent: newFullTag });
                    }
                } else {
                    const contentStart = segStartAbsolute + fullSegTag.length;
                    const contentEnd = rawContent.indexOf('</seg>', contentStart);

                    if (contentEnd === -1 || contentEnd > tuEnd) break;
                    
                    const oldContent = rawContent.substring(contentStart, contentEnd);
                    const newContent = reconstructSegmentToString(segment.target);
                    
                    if (newContent !== oldContent) {
                        jobs.push({ start: contentStart, end: contentEnd, newContent });
                    }
                }
                
                break; 
            }

            searchOffset = tuvTagEnd + 1;
        }
    }

    let finalXml = applyJobs(rawContent, jobs);
    if (!finalXml.trim().startsWith('<?xml')) {
        finalXml = `<?xml version="1.0" encoding="utf-8"?>\n${finalXml}`;
    }
    return finalXml;
}


import { QAIssue, QASettings } from './types';
import { INTERNAL_TAG_REGEX, mapStrippedToOriginal } from './qa-utils';

/**
 * Validates measurement units, values, and spacing requirements.
 */
export function validateMeasurements(
  source: string,
  target: string,
  settings: QASettings,
  issues: QAIssue[]
) {
  if (!settings.checkMeasurementUnits) return;

  const units = settings.measurementUnits.map(u => u.targetUnit);
  if (units.length === 0) return;

  const tagPlaceholder = '\uFFFC';
  const sWithTags = source.replace(INTERNAL_TAG_REGEX, tagPlaceholder);
  const tWithTags = target.replace(INTERNAL_TAG_REGEX, tagPlaceholder);

  const escapedUnits = units.map(u => u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const unitRegexStr = `(\\d+(?:[.,\\s\\u00A0]\\d+)*)([^\\d\\w\\uFFFC])?(${escapedUnits.join('|')})\\b`;
  const regex = new RegExp(unitRegexStr, 'g');

  const sMatches = Array.from(sWithTags.matchAll(regex));
  const tMatches = Array.from(tWithTags.matchAll(regex));

  // 1. Consistency Check
  const missingUnitHighlights: { start: number, end: number }[] = [];
  sMatches.forEach(sm => {
    const val = sm[1].replace(/[\s\u00A0,.]/g, ''); // Normalize number for comparison
    const unit = sm[3];
    const found = tMatches.find(tm => tm[1].replace(/[\s\u00A0,.]/g, '') === val && tm[3] === unit);
    if (!found) {
      missingUnitHighlights.push(mapStrippedToOriginal(sm.index!, sm[0].length, source, INTERNAL_TAG_REGEX));
    }
  });
  if (missingUnitHighlights.length > 0) {
      issues.push({
        id: crypto.randomUUID(),
        type: 'error',
        message: `Measurement units found in source are missing or different in target.`,
        code: 'Inconsistent measurement units',
        ruleId: 'checkMeasurementUnits',
        sourceHighlights: missingUnitHighlights,
      });
  }

  // 2. Spacing and NBSP Validation
  const spacingIssues: { message: string, code: string, highlights: { start: number, end: number }[] } = {
    message: '', code: '', highlights: []
  };

  tMatches.forEach(tm => {
    const val = tm[1];
    const separator = tm[2] || '';
    const unit = tm[3];
    const index = tm.index!;
    let isIssue = false;
    let hStart = index + val.length;
    let hLen = separator.length || 1;

    if (settings.measurementSpacing === 'space') {
      if (!separator || !/\s/.test(separator)) {
        isIssue = true;
        spacingIssues.message = `Missing space before units.`;
        spacingIssues.code = 'Invalid spacing before measurement unit';
        hLen = 1;
      } else if (settings.measurementRequireNbsp && separator !== '\u00A0') {
        isIssue = true;
        spacingIssues.message = `Non-breaking space (NBSP) required before units.`;
        spacingIssues.code = 'Non-breaking space required before measurement unit';
      }
    } else {
      if (separator && /\s/.test(separator)) {
        isIssue = true;
        spacingIssues.message = `Space not allowed before units.`;
        spacingIssues.code = 'Forbidden spacing before measurement unit';
      }
    }
    if (isIssue) {
        spacingIssues.highlights.push(mapStrippedToOriginal(hStart, hLen, target, INTERNAL_TAG_REGEX));
    }
  });

  if (spacingIssues.highlights.length > 0) {
      issues.push({
          id: crypto.randomUUID(),
          type: 'warning',
          message: spacingIssues.message,
          code: spacingIssues.code,
          ruleId: 'checkMeasurementUnits',
          targetHighlights: spacingIssues.highlights
      });
  }

  // 3. Temperature and Degree Sign Validation
  if (settings.checkTemperatureSigns) {
    const tempRegex = /(\d+(?:[.,\s\u00A0]\d+)*)([^\d\w\uFFFC])?(°[CF]?)/g;
    const sTemps = Array.from(sWithTags.matchAll(tempRegex));
    const tTemps = Array.from(tWithTags.matchAll(tempRegex));
    const missingTempHighlights: { start: number, end: number }[] = [];

    sTemps.forEach(sm => {
      const val = sm[1].replace(/[\s\u00A0,.]/g, '');
      const sign = sm[3];
      if (!tTemps.find(tm => tm[1].replace(/[\s\u00A0,.]/g, '') === val && tm[3] === sign)) {
        missingTempHighlights.push(mapStrippedToOriginal(sm.index!, sm[0].length, source, INTERNAL_TAG_REGEX));
      }
    });

    if (missingTempHighlights.length > 0) {
        issues.push({
            id: crypto.randomUUID(),
            type: 'warning',
            message: `Temperature/Degree signs missing in target.`,
            code: 'Temperature sign missing',
            ruleId: 'checkTemperatureSigns',
            sourceHighlights: missingTempHighlights,
        });
    }

    const tempSpacingIssues: { message: string, code: string, highlights: { start: number, end: number }[] } = {
        message: '', code: '', highlights: []
    };

    tTemps.forEach(tm => {
      const val = tm[1];
      const separator = tm[2] || '';
      const sign = tm[3];
      const index = tm.index!;
      let isIssue = false;
      let hStart = index + val.length;
      let hLen = separator.length || 1;

      if (settings.temperatureSpacing === 'space') {
        if (!separator || !/\s/.test(separator)) {
          isIssue = true;
          tempSpacingIssues.message = `Missing space before degree signs.`;
          tempSpacingIssues.code = 'Invalid spacing before temperature sign';
          hLen = 1;
        } else if (settings.temperatureRequireNbsp && separator !== '\u00A0') {
          isIssue = true;
          tempSpacingIssues.message = `Non-breaking space required before degree signs.`;
          tempSpacingIssues.code = 'Non-breaking space required before sign';
        }
      } else {
        if (separator && /\s/.test(separator)) {
          isIssue = true;
          tempSpacingIssues.message = `Space not allowed before degree signs.`;
          tempSpacingIssues.code = 'No space after sign';
        }
      }

      if (isIssue) {
        tempSpacingIssues.highlights.push(mapStrippedToOriginal(hStart, hLen, target, INTERNAL_TAG_REGEX));
      }
    });

    if (tempSpacingIssues.highlights.length > 0) {
        issues.push({
            id: crypto.randomUUID(),
            type: 'warning',
            message: tempSpacingIssues.message,
            code: tempSpacingIssues.code,
            ruleId: 'checkTemperatureSigns',
            targetHighlights: tempSpacingIssues.highlights
        });
    }
  }
}

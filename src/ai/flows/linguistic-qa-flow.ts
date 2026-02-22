'use server';
/**
 * @fileOverview Deep Linguistic QA agent for translation units.
 *
 * - auditTranslation - Performs advanced checks for typos, capitalization, and style.
 * - AuditInput - Schema for translation segment pairs.
 * - AuditOutput - Detailed linguistic issues.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AuditInputSchema = z.object({
  source: z.string(),
  target: z.string(),
  sourceLang: z.string(),
  targetLang: z.string(),
});
export type AuditInput = z.infer<typeof AuditInputSchema>;

const AuditOutputSchema = z.object({
  issues: z.array(z.object({
    type: z.enum(['error', 'warning', 'info']),
    message: z.string(),
    code: z.string().describe('Short code for the issue type, e.g., TYPO, CAPS, STYLE'),
    suggestedFix: z.string().optional(),
  })),
});
export type AuditOutput = z.infer<typeof AuditOutputSchema>;

export async function auditTranslation(input: AuditInput): Promise<AuditOutput> {
  return auditFlow(input);
}

const prompt = ai.definePrompt({
  name: 'auditTranslationPrompt',
  input: {schema: AuditInputSchema},
  output: {schema: AuditOutputSchema},
  prompt: `You are a professional linguist performing a Quality Assurance check on a translation.
  
Source ({{sourceLang}}): {{{source}}}
Target ({{targetLang}}): {{{target}}}

Analyze the translation for:
1. Typos or spelling mistakes in the target language.
2. Capitalization errors (e.g., Title Case vs Sentence Case mismatches if appropriate for the target language).
3. Punctuation nuances (e.g., double spaces, incorrect quote styles).
4. Untranslated words that should be translated.
5. Content omissions or additions that change the meaning.

If there are placeholders like [bpt], [ept], {1}, do not flag them as typos, but ensure they are present.

Return an array of issues. If no issues, return an empty array.`,
});

const auditFlow = ai.defineFlow(
  {
    name: 'auditFlow',
    inputSchema: AuditInputSchema,
    outputSchema: AuditOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

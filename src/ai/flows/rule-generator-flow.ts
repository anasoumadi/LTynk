'use server';
/**
 * @fileOverview AI agent for generating QA rules from natural language.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RuleGeneratorInputSchema = z.object({
  description: z.string().describe('The user\'s description of the QA rule they want to create.'),
});
export type RuleGeneratorInput = z.infer<typeof RuleGeneratorInputSchema>;

const RuleGeneratorOutputSchema = z.object({
  title: z.string().describe('A short, descriptive title for the rule.'),
  sourcePattern: z.string().describe('The regex or text pattern for the source segment.'),
  targetPattern: z.string().describe('The regex or text pattern for the target segment.'),
  condition: z.enum(['both_found', 'source_found_target_missing', 'target_found_source_missing', 'both_regex_match']),
  isRegex: z.boolean().describe('Whether the patterns should be treated as regular expressions.'),
  caseSensitive: z.boolean().describe('Whether the check should be case-sensitive.'),
  wholeWord: z.boolean().describe('Whether the check should match whole words only.'),
});
export type RuleGeneratorOutput = z.infer<typeof RuleGeneratorOutputSchema>;

export async function generateCustomRule(input: RuleGeneratorInput): Promise<RuleGeneratorOutput> {
  return ruleGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'ruleGeneratorPrompt',
  input: {schema: RuleGeneratorInputSchema},
  output: {schema: RuleGeneratorOutputSchema},
  prompt: `You are an expert localization engineer configuring a QA tool. 
A user wants to create a custom check to flag errors in a Translation Memory (TMX).

User Description: {{{description}}}

Translate this description into a structured QA rule. 
If the user mentions "missing" or "not containing", use 'source_found_target_missing'.
If they mention "forbidden" or "must not contain", use 'target_found_source_missing'.
If they mention specific IDs or complex patterns, enable 'isRegex'.

Return the structured rule configuration.`,
});

const ruleGeneratorFlow = ai.defineFlow(
  {
    name: 'ruleGeneratorFlow',
    inputSchema: RuleGeneratorInputSchema,
    outputSchema: RuleGeneratorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

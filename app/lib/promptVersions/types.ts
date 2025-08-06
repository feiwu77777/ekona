/**
 * Shared types for prompt versions
 */

export interface GenerationOptions {
  includeCoverLetter: boolean;
  includeStandardQuestions: boolean;
  customQuestions: string[];
}

export interface PromptVersion {
  version: string;
  date: string;
  description: string;
  buildPrompt: (jobOffer: string, resumeLatex: string, generationOptions: GenerationOptions) => string;
} 
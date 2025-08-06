/**
 * Prompt management system with version tracking
 * Use this to manage and track different versions of prompts for easy rollback
 */

import { GenerationOptions, PromptVersion } from './promptVersions/types';
import * as v1_0_0 from './promptVersions/v1.0.0';
import * as v1_1_0 from './promptVersions/v1.1.0';
import * as v1_2_0 from './promptVersions/v1.2.0';
import * as v1_3_0 from './promptVersions/v1.3.0';

/**
 * VERSION HISTORY:
 * v1.0.0 - Initial prompt version (2025-01-XX)
 * v1.1.0 - Added LaTeX formatting guidelines and special character rules (2025-01-XX)
 * v1.2.0 - Added requirement to create professional summary section if missing (2025-01-XX)
 * v1.3.0 - Added keyword integration requirements and missing skills acknowledgment (2025-01-XX)
 */

export const PROMPT_VERSIONS: Record<string, PromptVersion> = {
  'v1.0.0': {
    version: 'v1.0.0',
    date: '2025-01-XX',
    description: 'Initial prompt version extracted from route.ts',
    buildPrompt: v1_0_0.buildPrompt
  },
  'v1.1.0': {
    version: 'v1.1.0',
    date: '2025-01-XX',
    description: 'Added LaTeX formatting guidelines and special character rules',
    buildPrompt: v1_1_0.buildPrompt
  },
  'v1.2.0': {
    version: 'v1.2.0',
    date: '2025-01-XX',
    description: 'Added requirement to create professional summary section if missing',
    buildPrompt: v1_2_0.buildPrompt
  },
  'v1.3.0': {
    version: 'v1.3.0',
    date: '2025-01-XX',
    description: 'Added keyword integration requirements and missing skills acknowledgment',
    buildPrompt: v1_3_0.buildPrompt
  }
};

// Current active version
export const CURRENT_PROMPT_VERSION = 'v1.3.0';

/**
 * Get the current active prompt builder
 */
export function getCurrentPrompt(): PromptVersion {
  return PROMPT_VERSIONS[CURRENT_PROMPT_VERSION];
}

/**
 * Build prompt using the current version
 */
export function buildPrompt(jobOffer: string, resumeLatex: string, generationOptions: GenerationOptions): string {
  const currentPrompt = getCurrentPrompt();
  return currentPrompt.buildPrompt(jobOffer, resumeLatex, generationOptions);
}

/**
 * Get all available prompt versions for debugging/comparison
 */
export function getAvailableVersions(): string[] {
  return Object.keys(PROMPT_VERSIONS);
}

/**
 * Build prompt using a specific version (for testing/comparison)
 */
export function buildPromptWithVersion(
  version: string, 
  jobOffer: string, 
  resumeLatex: string, 
  generationOptions: GenerationOptions
): string {
  const promptVersion = PROMPT_VERSIONS[version];
  if (!promptVersion) {
    throw new Error(`Prompt version ${version} not found`);
  }
  return promptVersion.buildPrompt(jobOffer, resumeLatex, generationOptions);
}

/**
 * INSTRUCTIONS FOR ADDING NEW VERSIONS:
 * 
 * 1. Create a new file in app/lib/promptVersions/ following the naming pattern (e.g., v1.3.0.ts)
 * 
 * 2. In the new file:
 *    - Import GenerationOptions from './types'
 *    - Export a buildPrompt function with the signature:
 *      export function buildPrompt(jobOffer: string, resumeLatex: string, generationOptions: GenerationOptions): string
 *    - Add your prompt logic in the buildPrompt function
 * 
 * 3. In this file (prompts.ts):
 *    - Import your new version: import * as v1_3_0 from './promptVersions/v1.3.0';
 *    - Add a new entry to PROMPT_VERSIONS object with incremented version number
 *    - Update CURRENT_PROMPT_VERSION to point to the new version
 * 
 * 4. Test the new prompt thoroughly
 * 
 * 5. If the new prompt performs poorly, simply change CURRENT_PROMPT_VERSION
 *    back to a previous working version
 * 
 * Example new version entry:
 * 
 * 'v1.3.0': {
 *   version: 'v1.3.0',
 *   date: '2025-01-XX',
 *   description: 'Added emphasis on specific skills matching',
 *   buildPrompt: v1_3_0.buildPrompt
 * }
 */

// Re-export types for convenience
export type { GenerationOptions, PromptVersion };

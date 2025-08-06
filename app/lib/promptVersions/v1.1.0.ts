/**
 * Prompt Version 1.1.0
 * Date: 2025-01-XX
 * Description: Added LaTeX formatting guidelines and special character rules
 */

import { GenerationOptions } from './types';

export function buildPrompt(jobOffer: string, resumeLatex: string, generationOptions: GenerationOptions): string {
  let prompt = `You are an expert resume writer and LaTeX specialist. Your task is to help with job application materials based on a specific job offer.

**Job Offer Description:**
${jobOffer}

**Original LaTeX Resume:**
${resumeLatex}

**REQUIRED OUTPUT:**
Please provide your response in the following structured format with clear section markers:

===RESUME_START===
[Tailored LaTeX resume code here]
===RESUME_END===`;

  // Add cover letter section if requested
  if (generationOptions.includeCoverLetter) {
    prompt += `

===COVER_LETTER_START===
[Professional cover letter here]
===COVER_LETTER_END===`;
  }

  // Add standard questions section if requested
  if (generationOptions.includeStandardQuestions) {
    prompt += `

===STANDARD_QUESTIONS_START===
**Briefly (400 characters) explain why is this job your top choice and why would you be a good fit?**
[Answer here]
===STANDARD_QUESTIONS_END===`;
  }

  // Add custom questions section if any exist
  if (generationOptions.customQuestions && generationOptions.customQuestions.length > 0) {
    prompt += `

===CUSTOM_QUESTIONS_START===`;
    generationOptions.customQuestions.forEach((question: string, index: number) => {
      prompt += `
**Custom Question ${index + 1}: ${question}**
[Answer here]`;
    });
    prompt += `
===CUSTOM_QUESTIONS_END===`;
  }

  // Add specific instructions
  prompt += `

**Instructions:**
1. For the resume: Analyze the job offer to identify key skills, qualifications, and requirements. Modify the LaTeX resume to better align with the job requirements. Emphasize relevant skills and experiences. Reorder or rewrite sections to highlight the most relevant information. Keep the LaTeX structure and formatting intact. Ensure the resume remains professional and truthful.`;

  if (generationOptions.includeCoverLetter) {
    prompt += `
2. For the cover letter: Write a professional, compelling cover letter that specifically addresses this job opportunity. 
   - Extract the candidate's name, contact information, and relevant details ONLY from the provided resume
   - Extract the company name, position title, and other details ONLY from the provided job offer
   - DO NOT use placeholder text like [Your Name], [Company Name], or [Platform]
   - If specific information is not available in the provided documents, simply omit those references rather than using placeholders
   - Write a complete, ready-to-use cover letter that requires no additional editing
   - Focus on relevant experience and skills mentioned in the resume that match the job requirements`;
  }

  if (generationOptions.includeStandardQuestions) {
    prompt += `
3. For standard questions: Provide thoughtful, specific answers that demonstrate your enthusiasm for the role and showcase your relevant qualifications.`;
  }

  if (generationOptions.customQuestions && generationOptions.customQuestions.length > 0) {
    prompt += `
4. For custom questions: Answer each question thoroughly and professionally, relating your experience and qualifications to what the employer is asking.`;
  }

  prompt += `

**IMPORTANT LaTeX FORMATTING RULES:**
- Follow the exact format with section markers (===SECTION_START=== and ===SECTION_END===)
- Ensure all content is professional, truthful, and tailored to the specific job
- For the resume section, output ONLY the LaTeX code without additional commentary

**CRITICAL LaTeX SYNTAX GUIDELINES:**
- ALWAYS escape special characters in text content:
  • Use \\& instead of & when writing "Python & R" → "Python \\& R"
  • Use \\% instead of % for percentages: "95%" → "95\\%"
  • Use \\$ instead of $ for dollar amounts: "$50,000" → "\\$50,000"
  • Use \\# instead of # for hashtags or numbers: "#1 ranked" → "\\#1 ranked"
- DO NOT escape & in tabular environments (tables) - leave as & for column separation
- Ensure ALL brackets are properly matched: { } [ ] ( )
- Use \\textbf{} for bold text, \\textit{} for italic text, \\emph{} for emphasis
- Keep existing LaTeX commands and structure intact
- Maintain proper spacing with \\vspace{} commands as shown in the original
- Preserve all \\newcommand definitions and custom commands
- Keep consistent indentation and formatting style

**Examples of CORRECT LaTeX formatting:**
✓ "Experience with Python \\& R programming"
✓ "Achieved 95\\% accuracy improvement"
✓ "Salary expectation: \\$75,000"
✓ "\\textbf{Senior Developer} role"
✓ "\\begin{tabular}{l@{\\extracolsep{\\fill}}r} Name & Email \\\\ \\end{tabular}"

**Examples of INCORRECT LaTeX formatting:**
✗ "Experience with Python & R programming" (unescaped &)
✗ "Achieved 95% accuracy improvement" (unescaped %)
✗ "Salary expectation: $75,000" (unescaped $)
✗ "**Senior Developer** role" (markdown instead of LaTeX)
✗ Mismatched brackets like {text] or [text}`;

  return prompt;
} 
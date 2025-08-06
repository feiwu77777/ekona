/**
 * LaTeX utility functions for validation and processing
 */

/**
 * Validates and auto-fixes basic bracket issues
 * Fixes bracket type mismatches and missing closing brackets
 */
export function validateAndFixLatexBrackets(latexCode: string): {
  fixedCode: string;
  fixes: string[];
  errors: string[];
  isValid: boolean;
} {
  const fixes: string[] = [];
  let fixedCode = latexCode;
  let hasChanges = false;

  // Stack to track opening brackets
  const bracketStack: string[] = [];
  const result: string[] = [];

  for (let i = 0; i < fixedCode.length; i++) {
    const char = fixedCode[i];

    if (char === '{' || char === '[' || char === '(') {
      // Push opening bracket to stack
      bracketStack.push(char);
      result.push(char);
    } else if (char === '}' || char === ']' || char === ')') {
      // Handle closing bracket
      const expectedOpening = char === '}' ? '{' : char === ']' ? '[' : '(';
      const lastOpening = bracketStack.pop();

      if (!lastOpening) {
        // No matching opening bracket - skip this closing bracket
        fixes.push(`Removed unmatched closing ${char}`);
        hasChanges = true;
        continue;
      } else if (lastOpening !== expectedOpening) {
        // Wrong bracket type - fix it to match the opening bracket
        const correctClosing = lastOpening === '{' ? '}' : lastOpening === '[' ? ']' : ')';
        result.push(correctClosing);
        fixes.push(`Fixed bracket mismatch: ${char} -> ${correctClosing}`);
        hasChanges = true;
      } else {
        // Correct bracket type
        result.push(char);
      }
    } else {
      // Regular character
      result.push(char);
    }
  }

  // Add missing closing brackets for any remaining open brackets
  while (bracketStack.length > 0) {
    const openBracket = bracketStack.pop()!;
    const closingBracket = openBracket === '{' ? '}' : openBracket === '[' ? ']' : ')';
    result.push(closingBracket);
    fixes.push(`Added missing closing ${closingBracket}`);
    hasChanges = true;
  }

  if (hasChanges) {
    fixedCode = result.join('');
  }

  return {
    fixedCode,
    fixes,
    errors: [],
    isValid: true
  };
}

/**
 * Post-process LaTeX code to fix common formatting issues
 * - Replace **text** with \emph{text}
 * - Replace single & with \&
 */
export function cleanLatexFormatting(latexCode: string): {
  cleanedCode: string;
  fixes: string[];
} {
  const fixes: string[] = [];
  let cleanedCode = latexCode;

  // Replace **text** with \emph{text}
  const boldMatches = cleanedCode.match(/\*\*([^*]+)\*\*/g);
  if (boldMatches) {
    cleanedCode = cleanedCode.replace(/\*\*([^*]+)\*\*/g, '\\emph{$1}');
    fixes.push(`Converted ${boldMatches.length} **text** to \\emph{text}`);
  }

//   // Replace single & with \& (but not already escaped \&)
//   const ampersandMatches = cleanedCode.match(/(?<!\\)&/g);
//   if (ampersandMatches) {
//     cleanedCode = cleanedCode.replace(/(?<!\\)&/g, '\\&');
//     fixes.push(`Escaped ${ampersandMatches.length} ampersand(s) to \\&`);
//   }

  return {
    cleanedCode,
    fixes
  };
}

/**
 * Complete LaTeX processing: fix brackets and clean formatting
 */
export function processLatexCode(latexCode: string): {
  processedCode: string;
  fixes: string[];
  errors: string[];
  isValid: boolean;
} {
  // First fix brackets
  const bracketResult = validateAndFixLatexBrackets(latexCode);
  
  // Then clean formatting
  const formatResult = cleanLatexFormatting(bracketResult.fixedCode);
  
  return {
    processedCode: formatResult.cleanedCode,
    fixes: [...bracketResult.fixes, ...formatResult.fixes],
    errors: bracketResult.errors,
    isValid: bracketResult.isValid
  };
}

/**
 * Quick check if LaTeX code has basic bracket issues
 */
export function hasLatexBracketErrors(latexCode: string): boolean {
  return !validateAndFixLatexBrackets(latexCode).isValid;
} 
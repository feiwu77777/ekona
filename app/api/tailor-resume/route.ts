import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processLatexCode } from '../../lib/latexUtils';
import { buildPrompt } from '../../lib/prompts';

// Initialize AI clients
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Initialize Supabase client using service role key to bypass RLS
// API routes are already secured by authentication checks
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

interface GenerationOptions {
  includeCoverLetter: boolean;
  includeStandardQuestions: boolean;
  customQuestions: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { 
      jobOffer, 
      resumeLatex, 
      llmProvider = 'gemini', 
      model,
      generationOptions = {
        includeCoverLetter: false,
        includeStandardQuestions: false,
        customQuestions: []
      }
    } = await request.json();

    if (!jobOffer || !resumeLatex) {
      return NextResponse.json(
        { error: 'Both job offer and resume LaTeX are required' },
        { status: 400 }
      );
    }

    // Get user ID from Authorization header
    const authHeader = request.headers.get('authorization');
    let userId: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error) {
          console.error('Auth error:', error);
          return NextResponse.json(
            { error: 'Invalid authentication token. Please sign in again.' },
            { status: 401 }
          );
        }
        userId = user?.id || null;
      } catch (error) {
        console.error('Error getting user from token:', error);
        return NextResponse.json(
          { error: 'Authentication failed. Please sign in again.' },
          { status: 401 }
        );
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to use this service.' },
        { status: 401 }
      );
    }

    // Check if user has enough credits using service role client
    console.log('Checking credits for user:', userId);
    
    const { data: userCredits, error: creditsError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (creditsError || !userCredits) {
      console.error('Error fetching user credits:', creditsError);
      return NextResponse.json(
        { error: 'Unable to verify credits. Please try again.' },
        { status: 500 }
      );
    }

    if (userCredits.remaining_credits < 1) {
      return NextResponse.json(
        { error: 'Insufficient credits. Please upgrade your plan or purchase more credits.' },
        { status: 403 }
      );
    }

    // // Auto-save user's first resume if they don't have any saved resumes yet
    // try {
    //   // Check if user already has any resumes
    //   const { data: existingResumes, error: checkError } = await supabase
    //     .from('user_resumes')
    //     .select('id')
    //     .eq('user_id', userId)
    //     .limit(1);

    //   if (!checkError && (!existingResumes || existingResumes.length === 0)) {
    //     // User has no resumes, save this as their first primary resume
    //     const { error: insertError } = await supabase
    //       .from('user_resumes')
    //       .insert({
    //         user_id: userId,
    //         title: 'My Resume',
    //         latex_content: resumeLatex,
    //         is_primary: true,
    //         updated_at: new Date().toISOString()
    //       });

    //     if (insertError) {
    //       console.error('Failed to auto-save first resume:', insertError);
    //     }
    //   }
    // } catch (autoSaveError) {
    //   // Don't fail the request if auto-save fails, just log it
    //   console.error('Failed to auto-save resume:', autoSaveError);
    // }

    // Check API key availability based on selected provider
    if (llmProvider === 'gemini' && !process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    if (llmProvider === 'claude' && !process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      );
    }

    // Build prompt using the versioned prompt system
    const prompt = buildPrompt(jobOffer, resumeLatex, generationOptions);

    let response: string;

    if (llmProvider === 'claude') {
      // Use Claude API with specified model or default
      const claudeModel = model || 'claude-sonnet-4-20250514';
      const message = await anthropic.messages.create({
        model: claudeModel,
        max_tokens: 8000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      // Extract text content from Claude's response
      const textContent = message.content.find(
        (content) => content.type === 'text'
      );
      response = textContent?.text || '';
    } else {
      // Use Gemini API with specified model or default
      const geminiModel = model || 'gemini-2.5-pro';
      console.log('Using Gemini model:', geminiModel);
      const geminiGenerator = genAI.getGenerativeModel({ model: geminiModel });
      const result = await geminiGenerator.generateContent(prompt);
      const geminiResponse = await result.response;
      response = geminiResponse.text();
    }

    // Parse the structured response
    const parsedResponse = parseStructuredResponse(response, generationOptions);

    // Process LaTeX code: fix brackets and clean formatting
    if (parsedResponse.tailoredResume) {
      const result = processLatexCode(parsedResponse.tailoredResume);
      
      if (result.fixes.length > 0 || result.errors.length > 0) {
        console.log('LaTeX processing:', result);
        
        // Update the resume with processed code
        parsedResponse.tailoredResume = result.processedCode;
        
        // Add info about fixes and remaining errors to the response
        if (result.fixes.length > 0) {
          parsedResponse.latexFixes = {
            appliedFixes: result.fixes,
            remainingErrors: result.errors
          };
        }
        
        if (result.errors.length > 0) {
          parsedResponse.latexWarnings = result.errors;
        }
      }
    }

    // Deduct credit after successful generation using service role client
    const { data: deductResult, error: deductError } = await supabase.rpc('deduct_user_credit', {
      p_user_id: userId
    });

    if (deductError || !deductResult) {
      console.error('Warning: Failed to deduct credit for user:', userId, deductError);
      // Note: We don't fail the request since the service was already provided
    }

    return NextResponse.json({ 
      ...parsedResponse,
      llmProvider, 
      modelUsed: llmProvider === 'claude' ? (model || 'claude-sonnet-4-20250514') : (model || 'gemini-2.5-pro')
    });

  } catch (error) {
    console.error('Error tailoring resume:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to process resume. Please try again.';
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'Invalid or missing API key. Please check your configuration.';
      } else if (error.message.includes('quota')) {
        errorMessage = 'API quota exceeded. Please try again later or switch to a different provider.';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

function parseStructuredResponse(response: string, options: GenerationOptions) {
  const result: any = {};

  // Extract resume
  const resumeMatch = response.match(/===RESUME_START===([\s\S]*?)===RESUME_END===/);
  if (resumeMatch) {
    let resumeContent = resumeMatch[1].trim();
    // Remove markdown code block formatting if present
    resumeContent = resumeContent.replace(/^```latex\s*\n?/, '').replace(/\n?```$/, '');
    result.tailoredResume = resumeContent.trim();
  } else {
    // Fallback: if no structured format, treat entire response as resume
    let resumeContent = response.trim();
    // Remove markdown code block formatting if present
    resumeContent = resumeContent.replace(/^```latex\s*\n?/, '').replace(/\n?```$/, '');
    result.tailoredResume = resumeContent.trim();
  }

  // Extract cover letter if requested
  if (options.includeCoverLetter) {
    const coverLetterMatch = response.match(/===COVER_LETTER_START===([\s\S]*?)===COVER_LETTER_END===/);
    if (coverLetterMatch) {
      result.coverLetter = coverLetterMatch[1].trim();
    }
  }

  // Extract standard questions if requested
  if (options.includeStandardQuestions) {
    const standardQuestionsMatch = response.match(/===STANDARD_QUESTIONS_START===([\s\S]*?)===STANDARD_QUESTIONS_END===/);
    if (standardQuestionsMatch) {
      const standardSection = standardQuestionsMatch[1];
      
      // Parse the single combined question
      const combinedQuestionMatch = standardSection.match(/\*\*Briefly \(400 characters\) explain why is this job your top choice and why would you be a good fit\?\*\*([\s\S]*?)(?=\*\*Custom Question|$)/);
      
      result.standardAnswers = {
        whyThisJob: combinedQuestionMatch ? combinedQuestionMatch[1].trim().replace(/^\[Answer here\]\s*/, '') : '',
        whyYouFit: '' // Not used anymore since it's combined
      };
    }
  }

  // Extract custom questions if any
  if (options.customQuestions && options.customQuestions.length > 0) {
    const customQuestionsMatch = response.match(/===CUSTOM_QUESTIONS_START===([\s\S]*?)===CUSTOM_QUESTIONS_END===/);
    if (customQuestionsMatch) {
      const customSection = customQuestionsMatch[1];
      const customAnswers: string[] = [];
      
      // Parse each custom question
      for (let i = 0; i < options.customQuestions.length; i++) {
        const questionNumber = i + 1;
        const questionRegex = new RegExp(`\\*\\*Custom Question ${questionNumber}:.*?\\*\\*([\\s\\S]*?)(?=\\*\\*Custom Question ${questionNumber + 1}:|$)`);
        const questionMatch = customSection.match(questionRegex);
        
        if (questionMatch) {
          customAnswers.push(questionMatch[1].trim().replace(/^\[Answer here\]\s*/, ''));
        }
      }
      
      if (customAnswers.length > 0) {
        result.customAnswers = customAnswers;
      }
    }
  }

  return result;
} 
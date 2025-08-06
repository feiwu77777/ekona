'use client';

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { UserCredits } from '../lib/creditsUtils';
import { UserResume } from '../lib/resumesUtils';
import LaTeXPreviewDialog from './LaTeXPreviewDialog';

interface GenerationOptions {
  includeCoverLetter: boolean;
  includeStandardQuestions: boolean;
  customQuestions: string[];
}

interface InputSectionProps {
  jobOffer: string;
  setJobOffer: (value: string) => void;
  resumeLatex: string;
  setResumeLatex: (value: string) => void;
  generationOptions: GenerationOptions;
  setGenerationOptions: (options: GenerationOptions) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  isDev: boolean;
  llmProvider: 'gemini' | 'claude';
  providerInfo: {
    gemini: { name: string; icon: string };
    claude: { name: string; icon: string };
  };
  user: User | null;
  credits?: UserCredits | null;
  creditsLoading?: boolean;
  onResumeEditEnd: (latexContent: string) => void;
  hasSavedResume: boolean;
  primaryResume?: UserResume | null;
  copyToClipboard?: (text: string) => Promise<void>;
  downloadFile?: (content: string, filename: string, type?: string) => void;
}

export default function InputSection({
  jobOffer,
  setJobOffer,
  resumeLatex,
  setResumeLatex,
  generationOptions,
  setGenerationOptions,
  isLoading,
  onSubmit,
  isDev,
  llmProvider,
  providerInfo,
  user,
  credits,
  creditsLoading,
  onResumeEditEnd,
  hasSavedResume,
  primaryResume,
  copyToClipboard,
  downloadFile
}: InputSectionProps) {
  const [isEditingResume, setIsEditingResume] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);

  // Show card view if there's saved resume content and user is not editing
  const showResumeCard = user && resumeLatex.trim() && !isEditingResume && hasSavedResume;

  const handleResumeEdit = () => {
    setIsEditingResume(true);
  };

  const handleResumeBlur = () => {
    if (resumeLatex.trim()) {
      setIsEditingResume(false);
      onResumeEditEnd(resumeLatex);
    }
  };

  const handleResumeView = () => {
    setShowPreviewDialog(true);
  };

  const handleGenerationOptionChange = (option: keyof GenerationOptions, value: boolean) => {
    setGenerationOptions({
      ...generationOptions,
      [option]: value
    });
  };

  const handleCustomQuestionChange = (index: number, value: string) => {
    setGenerationOptions({
      ...generationOptions,
      customQuestions: generationOptions.customQuestions.map((q, i) => i === index ? value : q)
    });
  };

  const addCustomQuestion = () => {
    setGenerationOptions({
      ...generationOptions,
      customQuestions: [...generationOptions.customQuestions, '']
    });
  };

  const removeCustomQuestion = (index: number) => {
    if (index === 0) {
      // For the first question, just clear the text
      handleCustomQuestionChange(0, '');
    } else {
      // For other questions, remove them as before
      setGenerationOptions({
        ...generationOptions,
        customQuestions: generationOptions.customQuestions.filter((_, i) => i !== index)
      });
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6 bg-card p-6 rounded-lg shadow-md border border-border">
      <div>
        <label htmlFor="resumeLatex" className="block text-sm font-medium text-foreground mb-2">
          Your LaTeX Resume Code
        </label>
        
        {showResumeCard ? (
          /* Resume Card View */
          <div className="w-full p-4 border border-input rounded-md bg-background flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* PDF Icon */}
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
              </div>
              
              {/* Resume Info */}
              <div>
                <h3 className="font-medium text-foreground">{primaryResume?.title || 'My Resume'}</h3>
                <p className="text-sm text-muted-foreground">
                  {primaryResume?.updated_at 
                    ? `Last updated: ${new Date(primaryResume.updated_at).toLocaleDateString()}`
                    : 'LaTeX document saved'
                  }
                </p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleResumeView}
                className="px-3 py-1 text-xs bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
              >
                View
              </button>
              <button
                type="button"
                onClick={handleResumeEdit}
                className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Edit
              </button>
            </div>
          </div>
        ) : (
          /* Regular Textarea */
          <textarea
            id="resumeLatex"
            value={resumeLatex}
            onChange={(e) => setResumeLatex(e.target.value)}
            onBlur={handleResumeBlur}
            onFocus={() => setIsEditingResume(true)}
            className="w-full h-64 p-3 border border-input rounded-md shadow-sm focus:ring-2 focus:ring-ring focus:border-ring resize-none font-mono text-sm bg-background text-foreground placeholder:text-muted-foreground"
            placeholder={`\\documentclass[a4paper,10pt]{article}
\\usepackage{hyperref}

\\begin{document}

\\section*{Experience}
...

\\section*{Skills}
JavaScript, Python, React, Node.js, SQL, Git

\\end{document}`}
            required
          />
        )}
      </div>
      
      {/* Job Offer Description */}
      <div>
        <label htmlFor="jobOffer" className="block text-sm font-medium text-foreground mb-2">
          Job Offer Description
        </label>
        <textarea
          id="jobOffer"
          value={jobOffer}
          onChange={(e) => setJobOffer(e.target.value)}
          className="w-full h-64 p-3 border border-input rounded-md shadow-sm focus:ring-2 focus:ring-ring focus:border-ring resize-none bg-background text-foreground placeholder:text-muted-foreground"
          placeholder="Paste the job offer description here..."
          required
        />
      </div>

      {/* Generation Options */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">Additional Content</h3>
        
        {/* Cover Letter Option */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="coverLetter"
            checked={generationOptions.includeCoverLetter}
            onChange={(e) => handleGenerationOptionChange('includeCoverLetter', e.target.checked)}
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <label htmlFor="coverLetter" className="text-sm text-foreground">
            Cover Letter
          </label>
        </div>

        {/* Standard Questions Option */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="standardQuestions"
            checked={generationOptions.includeStandardQuestions}
            onChange={(e) => handleGenerationOptionChange('includeStandardQuestions', e.target.checked)}
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <label htmlFor="standardQuestions" className="text-sm text-foreground">
            Why is this job your top choice and why are you a good fit?
          </label>
        </div>

        {/* Custom Questions */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Custom Questions</label>
            <button
              type="button"
              onClick={addCustomQuestion}
              className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded hover:bg-secondary/80"
            >
              Add Question
            </button>
          </div>
          {generationOptions.customQuestions.map((question, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={question}
                onChange={(e) => handleCustomQuestionChange(index, e.target.value)}
                placeholder="Enter a custom question..."
                className="flex-1 p-2 border border-input rounded-md text-sm bg-background text-foreground"
              />
              {(generationOptions.customQuestions.length > 1 || (index === 0 && question.trim())) && (
                <button
                  type="button"
                  onClick={() => removeCustomQuestion(index)}
                  className="text-xs bg-destructive text-destructive-foreground px-2 py-1 rounded hover:bg-destructive/80"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Credits warning */}
      {user && credits && credits.remaining_credits <= 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            You have no credits remaining. Please upgrade your plan or purchase more credits to continue using Resume Tailor.
          </p>
        </div>
      )}

      {/* Low credits warning */}
      {user && credits && credits.remaining_credits > 0 && credits.remaining_credits <= 2 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            You have {credits.remaining_credits} credit{credits.remaining_credits === 1 ? '' : 's'} remaining. Consider upgrading your plan for more credits.
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !jobOffer.trim() || !resumeLatex.trim() || (user && credits ? credits.remaining_credits <= 0 : false)}
        className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-md hover:bg-primary/90 focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {isLoading ? 
          `Tailoring...`: 
          !user ? 
            `Sign In to Tailor Resume` :
            credits && credits.remaining_credits <= 0 ?
              `No Credits Remaining` :
              `Tailor Resume with AI (1 credit)`
        }
      </button>
      
      {!user && (
        <p className="text-sm text-muted-foreground text-center">
          You need to sign in to use Resume Tailor. Click the button above to continue.
        </p>
      )}

      {/* LaTeX Preview Dialog */}
      <LaTeXPreviewDialog
        isOpen={showPreviewDialog}
        onClose={() => setShowPreviewDialog(false)}
        latexContent={resumeLatex}
        title="My Resume Preview"
        copyToClipboard={copyToClipboard}
        downloadFile={downloadFile}
      />
    </form>
  );
} 
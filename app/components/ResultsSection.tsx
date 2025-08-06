'use client';

import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useCopyState } from '../lib/copyUtils';
import { useDownloadState } from '../lib/downloadUtils';
import LaTeXInstructionsModal from './LaTeXInstructionsModal';

interface ApiResponse {
  tailoredResume: string;
  coverLetter?: string;
  standardAnswers?: {
    whyThisJob: string;
    whyYouFit: string;
  };
  customAnswers?: string[];
  llmProvider: string;
  modelUsed: string;
  latexFixes?: {
    appliedFixes: string[];
    remainingErrors: string[];
  };
  latexWarnings?: string[];
}

interface ResultsSectionProps {
  result: ApiResponse | null;
  isLoading: boolean;
  usedProvider: 'gemini' | 'claude' | null;
  isDev: boolean;
  providerInfo: {
    gemini: { name: string; icon: string };
    claude: { name: string; icon: string };
  };
  copyToClipboard: (text: string) => Promise<void>;
  downloadFile: (content: string, filename: string, type?: string) => void;
  customQuestions: string[];
  onCoverLetterUpdate?: (updatedCoverLetter: string) => void;
}

export default function ResultsSection({
  result,
  isLoading,
  usedProvider,
  isDev,
  providerInfo,
  copyToClipboard,
  downloadFile,
  customQuestions,
  onCoverLetterUpdate
}: ResultsSectionProps) {
  const { copiedItems, handleCopy } = useCopyState();
  const { isCompilingPDF, handlePDFDownload } = useDownloadState();
  const [showLatexInstructions, setShowLatexInstructions] = useState(false);
  const [isEditingCoverLetter, setIsEditingCoverLetter] = useState(false);
  const [editedCoverLetter, setEditedCoverLetter] = useState("");

  // Override handlePDFDownload to show LaTeX instructions
  const handlePDFDownloadWithInstructions = async (content: string, type: 'cover-letter' | 'latex', itemId: string) => {
    if (type === 'latex') {
      // Show LaTeX instructions for LaTeX content
      setShowLatexInstructions(true);
    }
    // Use the utility function for actual PDF generation
    await handlePDFDownload(content, type, itemId);
  };

  const handleOpenOverleaf = () => {
    window.open('https://www.overleaf.com/project', '_blank');
    setShowLatexInstructions(false);
  };

  const handleStartEditCoverLetter = () => {
    setEditedCoverLetter(result?.coverLetter || "");
    setIsEditingCoverLetter(true);
  };

  const handleSaveCoverLetter = () => {
    if (onCoverLetterUpdate && editedCoverLetter.trim()) {
      onCoverLetterUpdate(editedCoverLetter.trim());
    }
    setIsEditingCoverLetter(false);
  };

  const handleCancelEditCoverLetter = () => {
    setIsEditingCoverLetter(false);
    setEditedCoverLetter("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-semibold text-foreground">
            Generated Content
          </h2>

        </div>
      </div>

      {/* LaTeX Validation Notifications - Only show in dev mode */}
      {isDev && (result?.latexFixes || result?.latexWarnings) && (
        <div className="space-y-2">
          {result.latexFixes && result.latexFixes.appliedFixes.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-green-500">✅</span>
                </div>
                <div className="ml-2">
                  <h4 className="text-sm font-medium text-green-800">LaTeX Fixes Applied</h4>
                  <p className="text-sm text-green-700 mt-1">
                    We detected and automatically fixed some bracket issues in the generated LaTeX:
                  </p>
                  <ul className="list-disc list-inside text-xs text-green-600 mt-1 space-y-1">
                    {result.latexFixes.appliedFixes.map((fix, index) => (
                      <li key={index}>{fix}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {result?.latexWarnings && result.latexWarnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-yellow-500">⚠️</span>
                </div>
                <div className="ml-2">
                  <h4 className="text-sm font-medium text-yellow-800">LaTeX Validation Warnings</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    The following bracket issues were detected and may need manual correction:
                  </p>
                  <ul className="list-disc list-inside text-xs text-yellow-600 mt-1 space-y-1">
                    {result.latexWarnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-yellow-600 mt-2">
                    Please review and fix these issues before compiling the LaTeX.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resume Section */}
      <div className="bg-card border border-border rounded-md overflow-hidden">
        <div className="flex items-center justify-between p-3 bg-muted/30 border-b border-border">
          <h3 className="font-medium text-foreground">Tailored Resume</h3>
          {result?.tailoredResume && (
            <div className="flex space-x-2">
              <button
                onClick={() => handleCopy(result.tailoredResume, 'resume')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  copiedItems.has('resume')
                    ? 'bg-green-500 text-white'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {copiedItems.has('resume') ? 'Copied!' : 'Copy'}
              </button>
              <div className="flex space-x-1">
                <button
                  onClick={() => downloadFile(result.tailoredResume, 'tailored-resume.tex')}
                  className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
                >
                  .tex
                </button>
                <button
                  onClick={() => handlePDFDownloadWithInstructions(result.tailoredResume, 'latex', 'resume-pdf')}
                  disabled={isCompilingPDF.has('resume-pdf')}
                  className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCompilingPDF.has('resume-pdf') ? 'Compiling...' : 'PDF'}
                </button>
              </div>
            </div>
          )}
        </div>
        {result?.tailoredResume ? (
          <SyntaxHighlighter
            language="latex"
            style={tomorrow}
            customStyle={{
              margin: 0,
              maxHeight: '400px',
              fontSize: '12px',
            }}
            showLineNumbers
          >
            {result.tailoredResume}
          </SyntaxHighlighter>
        ) : (
          <div className="h-32 flex items-center justify-center text-muted-foreground">
            {isLoading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p>{isDev ? `Tailoring your resume with ${usedProvider ? providerInfo[usedProvider].name : 'AI'}...` : 'Tailoring your resume...'}</p>
              </div>
            ) : (
              <p>Your tailored resume will appear here</p>
            )}
          </div>
        )}
      </div>

      {/* Cover Letter Section */}
      {result?.coverLetter && (
        <div className="bg-card border border-border rounded-md overflow-hidden">
          <div className="flex items-center justify-between p-3 bg-muted/30 border-b border-border">
            <h3 className="font-medium text-foreground">Cover Letter</h3>
            <div className="flex space-x-2">
              {!isEditingCoverLetter && (
                <button
                  onClick={handleStartEditCoverLetter}
                  className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Edit
                </button>
              )}
              <button
                onClick={() => handleCopy(isEditingCoverLetter ? editedCoverLetter : result.coverLetter!, 'coverLetter')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  copiedItems.has('coverLetter')
                    ? 'bg-green-500 text-white'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {copiedItems.has('coverLetter') ? 'Copied!' : 'Copy'}
              </button>
              <div className="flex space-x-1">
                <button
                  onClick={() => downloadFile(isEditingCoverLetter ? editedCoverLetter : result.coverLetter!, 'cover-letter.txt')}
                  className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
                >
                  .txt
                </button>
                <button
                  onClick={() => handlePDFDownloadWithInstructions(isEditingCoverLetter ? editedCoverLetter : result.coverLetter!, 'cover-letter', 'cover-letter-pdf')}
                  disabled={isCompilingPDF.has('cover-letter-pdf')}
                  className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCompilingPDF.has('cover-letter-pdf') ? 'Generating...' : 'PDF'}
                </button>
              </div>
            </div>
          </div>
          <div className="p-4 max-h-60 overflow-y-auto">
            {isEditingCoverLetter ? (
              <div className="space-y-4">
                <textarea
                  value={editedCoverLetter}
                  onChange={(e) => setEditedCoverLetter(e.target.value)}
                  className="w-full h-48 p-3 border border-border rounded-md bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Edit your cover letter..."
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveCoverLetter}
                    className="px-4 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEditCoverLetter}
                    className="px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <pre className="whitespace-pre-wrap text-sm text-foreground font-normal">
                {result.coverLetter}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* Standard Questions Section */}
      {result?.standardAnswers && (
        <div className="space-y-3">
          <div className="bg-card border border-border rounded-md overflow-hidden">
            <div className="flex items-center justify-between p-3 bg-muted/30 border-b border-border">
              <h3 className="font-medium text-foreground">Why is this job your top choice and why are you a good fit?</h3>
              <button
                onClick={() => handleCopy(result.standardAnswers!.whyThisJob, 'standardQuestion')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  copiedItems.has('standardQuestion')
                    ? 'bg-green-500 text-white'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {copiedItems.has('standardQuestion') ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-foreground">{result.standardAnswers.whyThisJob}</p>
            </div>
          </div>
        </div>
      )}

      {/* Custom Questions Section */}
      {result?.customAnswers && result.customAnswers.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-foreground">Custom Questions</h3>
          {result.customAnswers.map((answer, index) => (
            <div key={index} className="bg-card border border-border rounded-md overflow-hidden">
              <div className="flex items-center justify-between p-3 bg-muted/30 border-b border-border">
                <h4 className="font-medium text-foreground text-sm max-w-[80%]">
                  {customQuestions[index] || `Question ${index + 1}`}
                </h4>
                <button
                  onClick={() => handleCopy(answer, `customQuestion-${index}`)}
                  className={`px-3 py-1 text-xs rounded transition-colors flex-shrink-0 ${
                    copiedItems.has(`customQuestion-${index}`)
                      ? 'bg-green-500 text-white'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {copiedItems.has(`customQuestion-${index}`) ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="p-4">
                <p className="text-sm text-foreground">{answer}</p>
              </div>
            </div>
          ))}
                 </div>
       )}

       {/* LaTeX Instructions Modal */}
       <LaTeXInstructionsModal
         isOpen={showLatexInstructions}
         onClose={() => setShowLatexInstructions(false)}
         onOpenOverleaf={handleOpenOverleaf}
       />
     </div>
   );
 } 
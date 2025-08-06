'use client';

import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { generateCoverLetterPDF, compileLatexToPDF } from '../lib/pdfUtils';
import LaTeXInstructionsModal from './LaTeXInstructionsModal';

interface LaTeXPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  latexContent: string;
  title?: string;
  copyToClipboard?: (text: string) => Promise<void>;
  downloadFile?: (content: string, filename: string, type?: string) => void;
}

export default function LaTeXPreviewDialog({
  isOpen,
  onClose,
  latexContent,
  title = "LaTeX Resume Preview",
  copyToClipboard,
  downloadFile
}: LaTeXPreviewDialogProps) {
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());
  const [isCompilingPDF, setIsCompilingPDF] = useState(false);
  const [showLatexInstructions, setShowLatexInstructions] = useState(false);

  const handleCopy = async (text: string, itemId: string) => {
    if (copyToClipboard) {
      await copyToClipboard(text);
      setCopiedItems(prev => new Set(prev).add(itemId));
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }, 2000);
    }
  };

  const handlePDFDownload = async () => {
    setIsCompilingPDF(true);
    
    try {
      await compileLatexToPDF(latexContent, () => setShowLatexInstructions(true));
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsCompilingPDF(false);
    }
  };

  const handleDownloadTex = () => {
    if (downloadFile) {
      downloadFile(latexContent, 'resume.tex');
    }
  };

  const handleOpenOverleaf = () => {
    window.open('https://www.overleaf.com/project', '_blank');
    setShowLatexInstructions(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center justify-between pr-8">
              <span>{title}</span>
              <div className="flex space-x-2">
                {copyToClipboard && (
                  <button
                    onClick={() => handleCopy(latexContent, 'preview')}
                    className={`px-3 py-1 text-xs rounded transition-colors ${
                      copiedItems.has('preview')
                        ? 'bg-green-500 text-white'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {copiedItems.has('preview') ? 'Copied!' : 'Copy'}
                  </button>
                )}
                {downloadFile && (
                  <div className="flex space-x-1">
                    <button
                      onClick={handleDownloadTex}
                      className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
                    >
                      .tex
                    </button>
                    <button
                      onClick={handlePDFDownload}
                      disabled={isCompilingPDF}
                      className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCompilingPDF ? 'Compiling...' : 'PDF'}
                    </button>
                  </div>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 min-h-0 bg-card border border-border rounded-md overflow-auto">
            <SyntaxHighlighter
              language="latex"
              style={tomorrow}
              customStyle={{
                margin: 0,
                fontSize: '12px',
                backgroundColor: 'transparent',
              }}
              showLineNumbers
              wrapLines={true}
              wrapLongLines={true}
            >
              {latexContent}
            </SyntaxHighlighter>
          </div>

          <DialogFooter className="flex-shrink-0 mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors"
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* LaTeX Instructions Modal */}
      <LaTeXInstructionsModal
        isOpen={showLatexInstructions}
        onClose={() => setShowLatexInstructions(false)}
        onOpenOverleaf={handleOpenOverleaf}
      />
    </>
  );
} 
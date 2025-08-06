import { compileLatexToPDF, generateCoverLetterPDF } from './pdfUtils';
import { useState } from 'react';

export const downloadFile = (content: string, filename: string, type: string = "text/plain") => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const useDownloadState = () => {
  const [isCompilingPDF, setIsCompilingPDF] = useState<Set<string>>(new Set());

  const handlePDFDownload = async (content: string, type: 'cover-letter' | 'latex', itemId: string) => {
    setIsCompilingPDF(prev => new Set(prev).add(itemId));
    
    try {
      if (type === 'cover-letter') {
        generateCoverLetterPDF(content);
      } else if (type === 'latex') {
        await compileLatexToPDF(content);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsCompilingPDF(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  return { isCompilingPDF, handlePDFDownload, downloadFile };
}; 
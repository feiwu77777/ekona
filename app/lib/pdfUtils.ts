import jsPDF from 'jspdf';

/**
 * Generate a PDF from cover letter text
 */
export function generateCoverLetterPDF(coverLetterText: string): void {
  const doc = new jsPDF();
  
  // Set up document margins and font
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  
  // Add title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Cover Letter', margin, 30);
  
  // Add content
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  // Split text into lines that fit the page width
  const lines = doc.splitTextToSize(coverLetterText, maxWidth);
  
  let currentY = 50;
  const lineHeight = 6;
  
  for (let i = 0; i < lines.length; i++) {
    // Check if we need a new page
    if (currentY + lineHeight > pageHeight - margin) {
      doc.addPage();
      currentY = margin;
    }
    
    doc.text(lines[i], margin, currentY);
    currentY += lineHeight;
  }
  
  // Download the PDF
  doc.save('cover-letter.pdf');
}

/**
 * Compile LaTeX to PDF using multiple fallback services
 */
export async function compileLatexToPDF(
  latexCode: string, 
  onFallback?: () => void
): Promise<void> {
  // Try multiple services in order of preference
  const services = [
    {
      name: 'YtoTech LaTeX-on-HTTP',
      compile: () => compileWithYtoTech(latexCode)
    },
    {
      name: 'latexonline.cc',
      compile: () => compileWithLatexOnline(latexCode)
    },
    {
      name: 'cloudconvert',
      compile: () => compileWithCloudConvert(latexCode)
    }
  ];

  let lastError: Error | null = null;
  
  for (const service of services) {
    try {
      console.log(`Trying LaTeX compilation with ${service.name}...`);
      await service.compile();
      return; // Success! Exit early
    } catch (error) {
      console.warn(`${service.name} failed:`, error);
      lastError = error as Error;
      continue; // Try next service
    }
  }
  
  // All services failed, use fallback
  console.error('All LaTeX compilation services failed:', lastError);
  await fallbackToTexDownload(latexCode, onFallback);
}

/**
 * Try YtoTech LaTeX-on-HTTP service (Primary - Most Reliable)
 */
async function compileWithYtoTech(latexCode: string): Promise<void> {
  const response = await fetch('https://latex.ytotech.com/builds/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      compiler: 'pdflatex',
      resources: [{
        main: true,
        content: latexCode
      }]
    })
  });

  if (!response.ok) {
    // Try to get detailed error information from response
    let errorMessage = `YtoTech compilation failed: ${response.status}`;
    try {
      const errorText = await response.text();
      console.log('YtoTech error response (raw):', errorText);
      
      // Try to parse as JSON
      try {
        const errorData = JSON.parse(errorText);
        console.log('YtoTech error response (parsed):', errorData);
        
        if (errorData.message || errorData.error) {
          errorMessage += ` - ${errorData.message || errorData.error}`;
        }
        
        // If there are compilation logs, include them for debugging
        if (errorData.logs) {
          console.log('LaTeX compilation logs:', errorData.logs);
        }
        
        // If there are specific compilation errors
        if (errorData.compilationErrors) {
          console.log('LaTeX compilation errors:', errorData.compilationErrors);
        }
      } catch (jsonError) {
        // If not JSON, the response might be the error logs directly
        console.log('Non-JSON error response, treating as logs:', errorText);
        if (errorText.length > 0) {
          // Don't include full logs in user error message, just log them
          console.log('LaTeX compilation output:', errorText);
          errorMessage += ' - LaTeX compilation error (check console for details)';
        }
      }
    } catch (parseError) {
      console.error('Failed to parse YtoTech error response:', parseError);
    }
    throw new Error(errorMessage);
  }

  const pdfBlob = await response.blob();
  downloadBlob(pdfBlob, 'resume.pdf');
}

/**
 * Try LaTeX.Online service (latexonline.cc)
 */
async function compileWithLatexOnline(latexCode: string): Promise<void> {
  // Create a GitHub Gist or use direct API if available
  const response = await fetch('https://latexonline.cc/compile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      compiler: 'pdflatex',
      resources: [{
        main: true,
        file: 'main.tex',
        content: latexCode
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`LaTeX.Online API failed: ${response.status}`);
  }

  const pdfBlob = await response.blob();
  downloadBlob(pdfBlob, 'resume.pdf');
}

/**
 * Try CloudConvert service (requires API key for heavy usage)
 */
async function compileWithCloudConvert(latexCode: string): Promise<void> {
  // Note: CloudConvert has a limited free tier
  const formData = new FormData();
  formData.append('file', new Blob([latexCode], { type: 'text/plain' }), 'resume.tex');
  formData.append('outputformat', 'pdf');

  const response = await fetch('https://api.cloudconvert.com/v2/convert/tex/pdf', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error(`CloudConvert API failed: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.data?.url) {
    // Download the PDF from the provided URL
    const pdfResponse = await fetch(result.data.url);
    const pdfBlob = await pdfResponse.blob();
    downloadBlob(pdfBlob, 'resume.pdf');
  } else {
    throw new Error('CloudConvert did not return a download URL');
  }
}

/**
 * Fallback: Download .tex file with instructions
 */
async function fallbackToTexDownload(latexCode: string, onFallback?: () => void): Promise<void> {
  // Download the .tex file
  const blob = new Blob([latexCode], { type: 'text/plain' });
  downloadBlob(blob, 'resume.tex');
  
  // Show modal dialog if callback provided, otherwise fall back to browser alert
  if (onFallback) {
    onFallback();
  } else {
    // Fallback for when modal is not available
    const message = `LaTeX compilation services are currently unavailable.

Downloaded your .tex file instead. Here are 3 ways to create a PDF:

🌐 ONLINE (Recommended):
1. Go to Overleaf.com (free LaTeX editor)
2. Create new project → Upload the .tex file
3. Click "Recompile" to generate PDF
4. Download PDF from Overleaf

💻 LOCAL COMPILATION:
1. Install LaTeX distribution (TeX Live, MiKTeX, or MacTeX)
2. Run: pdflatex resume.tex

🔧 OTHER ONLINE TOOLS:
• TeXLive.net
• Papeeria.com
• LaTeX-Online.cc (manual upload)

The file has been saved to your Downloads folder.`;

    if (window.confirm(message + '\n\nClick OK to open Overleaf in a new tab, or Cancel to continue.')) {
      window.open('https://www.overleaf.com/project', '_blank');
    }
  }
}

/**
 * Helper function to download blob as file
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

 
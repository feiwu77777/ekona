'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface LaTeXInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenOverleaf: () => void;
}

export default function LaTeXInstructionsModal({
  isOpen,
  onClose,
  onOpenOverleaf
}: LaTeXInstructionsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-destructive">
            LaTeX Compilation Unavailable
          </DialogTitle>
          <DialogDescription asChild>
            <div className="text-left space-y-4">
              <p className="text-sm text-muted-foreground">
                LaTeX compilation services are currently unavailable. Your .tex file has been downloaded.
              </p>
              
              <div className="space-y-6">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-600 mb-2 flex items-center">
                    🌐 ONLINE (Recommended)
                  </h3>
                  <ol className="text-sm space-y-1 list-decimal list-inside text-foreground">
                    <li>Go to <span className="font-mono bg-muted px-1 rounded">Overleaf.com</span> (free LaTeX editor)</li>
                    <li>Create new project → Upload the .tex file</li>
                    <li>Click "Recompile" to generate PDF</li>
                    <li>Download PDF from Overleaf</li>
                  </ol>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-600 mb-2 flex items-center">
                    💻 LOCAL COMPILATION
                  </h3>
                  <ol className="text-sm space-y-1 list-decimal list-inside text-foreground">
                    <li>Install LaTeX distribution (TeX Live, MiKTeX, or MacTeX)</li>
                    <li>Run: <span className="font-mono bg-muted px-1 rounded">pdflatex resume.tex</span></li>
                  </ol>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-600 mb-2 flex items-center">
                    🔧 OTHER ONLINE TOOLS
                  </h3>
                  <ul className="text-sm space-y-1 list-disc list-inside text-foreground">
                    <li>TeXLive.net</li>
                    <li>Papeeria.com</li>
                    <li>LaTeX-Online.cc (manual upload)</li>
                  </ul>
                </div>
              </div>

              <p className="text-xs text-muted-foreground bg-muted/30 p-3 rounded">
                💡 <strong>Tip:</strong> The file has been saved to your Downloads folder. 
                Overleaf is the most popular online LaTeX editor and will compile your resume instantly.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors"
          >
            Continue
          </button>
          <button
            onClick={onOpenOverleaf}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-medium"
          >
            Open Overleaf
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
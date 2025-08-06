'use client';

import { useState } from 'react';
import { UserResume } from '../lib/resumesUtils';
import { User } from '@supabase/supabase-js';
import { useResumes } from '../hooks/useResumes';

interface ResumeManagerProps {
  user: User | null;
  onSelectResume: (latexContent: string) => void;
  currentLatexContent: string;
}

interface EditingResume {
  id: string;
  title: string;
  content: string;
}

export default function ResumeManager({ user, onSelectResume, currentLatexContent }: ResumeManagerProps) {
  const { resumes, primaryResume, isLoading, error, saveResume, deleteResume, setPrimary } = useResumes(user);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingResume, setEditingResume] = useState<EditingResume | null>(null);
  const [saveAsTitle, setSaveAsTitle] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  if (!user) {
    return null;
  }

  const handleSelectResume = (resume: UserResume) => {
    onSelectResume(resume.latex_content);
    setIsExpanded(false);
  };

  const handleEditResume = (resume: UserResume) => {
    setEditingResume({
      id: resume.id,
      title: resume.title,
      content: resume.latex_content,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingResume) return;

    const saved = await saveResume(
      editingResume.title,
      editingResume.content,
      false,
      editingResume.id
    );

    if (saved) {
      setEditingResume(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingResume(null);
  };

  const handleDelete = async (resumeId: string) => {
    if (confirm('Are you sure you want to delete this resume? This action cannot be undone.')) {
      await deleteResume(resumeId);
    }
  };

  const handleSetPrimary = async (resumeId: string) => {
    await setPrimary(resumeId);
  };

  const handleSaveAs = async () => {
    if (!saveAsTitle.trim() || !currentLatexContent.trim()) return;

    const saved = await saveResume(saveAsTitle.trim(), currentLatexContent, false);
    
    if (saved) {
      setSaveAsTitle('');
      setShowSaveDialog(false);
    }
  };

  const handleSaveAsPrimary = async () => {
    if (!saveAsTitle.trim() || !currentLatexContent.trim()) return;

    const saved = await saveResume(saveAsTitle.trim(), currentLatexContent, true);
    
    if (saved) {
      setSaveAsTitle('');
      setShowSaveDialog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-md p-4">
        <div className="text-center text-muted-foreground">Loading your saved resumes...</div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-md">
      <div 
        className="p-4 cursor-pointer hover:bg-muted/30 transition-colors border-b border-border"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="font-medium text-foreground">My Saved Resumes</h3>
            <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
              {resumes.length}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSaveDialog(true);
              }}
              className="text-xs bg-secondary text-secondary-foreground px-3 py-1 rounded hover:bg-secondary/80"
            >
              Save Current
            </button>
            <span className={`text-sm transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </div>
        </div>
        
        {primaryResume && !isExpanded && (
          <div className="mt-2 text-sm text-muted-foreground">
            Primary: {primaryResume.title}
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="p-4 space-y-3">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
              {error}
            </div>
          )}

          {resumes.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              <p>No saved resumes yet.</p>
              <p className="text-xs mt-1">Your first resume will be automatically saved when you paste LaTeX content.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {resumes.map((resume) => (
                <div
                  key={resume.id}
                  className="border border-border rounded p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-foreground">{resume.title}</span>
                      {resume.is_primary && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                          Primary
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleSelectResume(resume)}
                        className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleEditResume(resume)}
                        className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded hover:bg-secondary/80"
                      >
                        Edit
                      </button>
                      {!resume.is_primary && (
                        <button
                          onClick={() => handleSetPrimary(resume.id)}
                          className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded hover:bg-muted/80"
                        >
                          Set Primary
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(resume.id)}
                        className="text-xs bg-destructive text-destructive-foreground px-2 py-1 rounded hover:bg-destructive/90"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Updated: {new Date(resume.updated_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">Save Resume</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Resume Title
                </label>
                <input
                  type="text"
                  value={saveAsTitle}
                  onChange={(e) => setSaveAsTitle(e.target.value)}
                  placeholder="e.g., Software Engineer Resume"
                  className="w-full p-2 border border-input rounded-md bg-background text-foreground"
                />
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={handleSaveAs}
                  disabled={!saveAsTitle.trim()}
                  className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
                <button
                  onClick={handleSaveAsPrimary}
                  disabled={!saveAsTitle.trim()}
                  className="flex-1 bg-secondary text-secondary-foreground px-4 py-2 rounded hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save as Primary
                </button>
                <button
                  onClick={() => {
                    setShowSaveDialog(false);
                    setSaveAsTitle('');
                  }}
                  className="px-4 py-2 border border-border rounded hover:bg-muted/30"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {editingResume && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
            <h3 className="text-lg font-semibold text-foreground mb-4">Edit Resume</h3>
            
            <div className="space-y-4 flex-1 min-h-0">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Resume Title
                </label>
                <input
                  type="text"
                  value={editingResume.title}
                  onChange={(e) => setEditingResume({
                    ...editingResume,
                    title: e.target.value
                  })}
                  className="w-full p-2 border border-input rounded-md bg-background text-foreground"
                />
              </div>

              <div className="flex-1 min-h-0">
                <label className="block text-sm font-medium text-foreground mb-2">
                  LaTeX Content
                </label>
                <textarea
                  value={editingResume.content}
                  onChange={(e) => setEditingResume({
                    ...editingResume,
                    content: e.target.value
                  })}
                  className="w-full h-full min-h-[300px] p-3 border border-input rounded-md font-mono text-sm bg-background text-foreground resize-none"
                />
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={handleSaveEdit}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
                >
                  Save Changes
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border border-border rounded hover:bg-muted/30"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
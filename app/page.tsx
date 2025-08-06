"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "./lib/supabaseClient";
import { User } from "@supabase/supabase-js";
import NavBar from "./components/NavBar";
import SignInModal from "./components/SignInModal";
import LLMProviderSelector from "./components/LLMProviderSelector";
import InputSection from "./components/InputSection";
import ResultsSection from "./components/ResultsSection";
import ResumeManager from "./components/ResumeManager";
import { useUserData } from "./hooks/useUserData";
import { useResumes } from "./hooks/useResumes";
import { logEvent } from "./lib/eventUtils";
import { getOrCreateUserId } from "./lib/userIdUtils";

type LLMProvider = "gemini" | "claude";

interface GenerationOptions {
  includeCoverLetter: boolean;
  includeStandardQuestions: boolean;
  customQuestions: string[];
}

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

export default function Home() {
  const [jobOffer, setJobOffer] = useState("");
  const [resumeLatex, setResumeLatex] = useState("");
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [llmProvider, setLlmProvider] = useState<LLMProvider>("gemini");
  const [selectedModel, setSelectedModel] =
    useState<string>("gemini-2.5-pro");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [usedProvider, setUsedProvider] = useState<LLMProvider | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [currentTailoringHistoryId, setCurrentTailoringHistoryId] = useState<string | null>(null);

  // New generation options
  const [generationOptions, setGenerationOptions] = useState<GenerationOptions>(
    {
      includeCoverLetter: false,
      includeStandardQuestions: false,
      customQuestions: [""],
    }
  );

  // User data management (profile + credits)
  const {
    profile,
    credits,
    isProfileLoading,
    isCreditsLoading,
    refreshCredits,
  } = useUserData(user);

  // Resume management
  const { resumes, primaryResume, saveResume } = useResumes(user);

  // Check if we're in development mode
  const isDev = process.env.NODE_ENV === "development";

  // Add ref to track if we've processed saved form data
  const hasProcessedSavedData = useRef(false);

  // Authentication useEffect
  useEffect(() => {
    const initAuth = async () => {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setIsAuthLoading(false);

      const userId = getOrCreateUserId();
      await logEvent({
        name: "page_loaded",
        category: "page",
        user_id: userId,
      });
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load primary resume when user logs in or when primary resume changes
  useEffect(() => {
    const loadResume = async () => {
      if (user) {
        // If there's saved form data, restore it (only once)
        const savedFormData = localStorage.getItem("tempFormData");
        if (savedFormData && !hasProcessedSavedData.current) {
          hasProcessedSavedData.current = true;
          
          const {
            jobOffer: savedJob,
            resumeLatex: savedResume,
            generationOptions: savedOptions,
          } = JSON.parse(savedFormData);
          setJobOffer(savedJob);
          
          // Only save if there's no primary resume yet
          if (!primaryResume && savedResume.trim()) {
            setResumeLatex(savedResume);
            try {
              await saveResume(
                "My Resume",
                savedResume.trim(),
                true // Set as primary
              );
            } catch (error) {
              console.error(
                "Failed to save restored resume as primary:",
                error
              );
            }
          } else if (primaryResume) {
            // If primary resume exists, just use it
            setResumeLatex(primaryResume.latex_content);
          }
          
          setGenerationOptions(savedOptions);
          // Clear the saved data
          localStorage.removeItem("tempFormData");

          const userId = getOrCreateUserId();
          await logEvent({
            name: "resume_restored",
            category: "resume",
            user_id: userId,
          });
        } else if (primaryResume && !resumeLatex) {
          // If no saved data but there's a primary resume, use that
          setResumeLatex(primaryResume.latex_content);
        }
      }
    };

    loadResume();
  }, [user, primaryResume]);

  // Save resume when editing ends
  const handleResumeEditEnd = async (latexContent: string) => {
    if (user && latexContent.trim()) {
      // Update the primary resume directly
      try {
        if (primaryResume) {
          // Update existing primary resume
          await saveResume(
            primaryResume.title,
            latexContent.trim(),
            true, // Keep it as primary
            primaryResume.id
          );
        } else {
          // Create new primary resume if none exists
          await saveResume(
            "My Resume",
            latexContent.trim(),
            true // Set as primary
          );
        }
      } catch (error) {
        const userId = getOrCreateUserId();
        await logEvent({
          name: "resume_save_failed",
          category: "resume",
          user_id: userId,
          is_error: true,
          error_message:
            error instanceof Error ? error.message : "Failed to save resume",
        });
        console.error("Failed to save resume:", error);
      }
    }
  };

  // Reset selected model when provider changes (only in dev mode)
  useEffect(() => {
    if (isDev) {
      setSelectedModel("");
    } else {
      // In production, always use gemini-2.5-pro
      setSelectedModel("gemini-2.5-pro");
    }
  }, [llmProvider, isDev]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user is authenticated
    // Log the button click event
    const userId = getOrCreateUserId();
    if (!user) {
      // Save current form data to localStorage before redirecting to sign in
      localStorage.setItem(
        "tempFormData",
        JSON.stringify({
          jobOffer,
          resumeLatex,
          generationOptions,
        })
      );
      setIsModalOpen(true);
      await logEvent({
        name: "sign_in_button_clicked_from_input_section",
        category: "auth",
        user_id: userId,
      });
      return;
    }

    setIsLoading(true);
    setError("");
    setResult(null);
    setUsedProvider(null);

    await logEvent({
      name: "tailor_resume_clicked",
      category: "generation",
      user_id: userId,
      is_error: credits && credits.remaining_credits <= 0 ? true : false,
      error_message:
        credits && credits.remaining_credits <= 0
          ? "No credits remaining"
          : undefined,
    });

    try {

      // Get auth token for API request
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const authHeaders: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (session?.access_token) {
        authHeaders["Authorization"] = `Bearer ${session.access_token}`;
      }

      const response = await fetch("/api/tailor-resume", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          jobOffer,
          resumeLatex,
          llmProvider: isDev ? llmProvider : "gemini",
          model: isDev ? selectedModel || undefined : "gemini-2.5-pro",
          generationOptions: {
            ...generationOptions,
            customQuestions: generationOptions.customQuestions.filter(
              (q) => q.trim() !== ""
            ),
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const userId = getOrCreateUserId();
        await logEvent({
          name: "resume_tailoring_failed",
          category: "generation",
          user_id: userId,
          is_error: true,
          error_message: data.error || "Failed to tailor resume",
        });
        throw new Error(data.error || "Failed to tailor resume");
      }

      setResult(data);
      setUsedProvider(data.llmProvider);

      // Save tailoring history after successful generation
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const authHeaders: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (session?.access_token) {
          authHeaders["Authorization"] = `Bearer ${session.access_token}`;
        }

        // Extract job title and company from job offer if possible
        const jobTitleMatch = jobOffer.match(/^(.*?)(?:at|@|for)\s+(.*?)(?:\n|$)/i);
        const jobTitle = jobTitleMatch ? jobTitleMatch[1].trim() : null;
        const companyName = jobTitleMatch ? jobTitleMatch[2].trim() : null;

        const historyResponse = await fetch("/api/tailoring-history", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            job_title: jobTitle,
            company_name: companyName,
            job_description: jobOffer,
            original_resume_id: primaryResume?.id || null,
            original_resume_content: resumeLatex,
            generation_options: {
              includeCoverLetter: generationOptions.includeCoverLetter,
              includeStandardQuestions: generationOptions.includeStandardQuestions,
              customQuestions: generationOptions.customQuestions.filter((q) => q.trim() !== ""),
            },
            tailored_resume_content: data.tailoredResume,
            cover_letter_content: data.coverLetter || null,
            standard_answers: data.standardAnswers || null,
            custom_answers: data.customAnswers || null,
            llm_provider: data.llmProvider,
            model_used: data.modelUsed,
            prompt_version: "v1.3.0", // You can make this dynamic based on your prompt versioning
          }),
        });

        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setCurrentTailoringHistoryId(historyData.id);
        }
      } catch (historyError) {
        console.error("Failed to save tailoring history:", historyError);
        // Don't fail the main request if history saving fails
      }

      // Refresh credits after successful generation
      await refreshCredits();
    } catch (err) {
      const userId = getOrCreateUserId();
      await logEvent({
        name: "resume_tailoring_error",
        category: "generation",
        user_id: userId,
        is_error: true,
        error_message: err instanceof Error ? err.message : "An error occurred",
      });
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
    } catch (err) {
      const userId = getOrCreateUserId();
      await logEvent({
        name: "clipboard_copy_failed",
        category: "interaction",
        user_id: userId,
        is_error: true,
        error_message:
          err instanceof Error ? err.message : "Failed to copy to clipboard",
      });
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const downloadFile = (
    content: string,
    filename: string,
    type: string = "text/plain"
  ) => {
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

  const handleCoverLetterUpdate = async (updatedCoverLetter: string) => {
    if (!currentTailoringHistoryId || !user) {
      console.error("No tailoring history ID or user not authenticated");
      return;
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const authHeaders: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (session?.access_token) {
        authHeaders["Authorization"] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/tailoring-history/${currentTailoringHistoryId}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({
          cover_letter_content: updatedCoverLetter,
        }),
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log("Cover letter updated successfully:", responseData);
        
        // Update the local result state to reflect the change
        setResult(prev => prev ? {
          ...prev,
          coverLetter: updatedCoverLetter
        } : null);

        const userId = getOrCreateUserId();
        await logEvent({
          name: "cover_letter_updated",
          category: "generation",
          user_id: userId,
        });
      } else {
        const errorData = await response.json();
        console.error("Failed to update cover letter in history:", errorData);
      }
    } catch (error) {
      console.error("Error updating cover letter:", error);
    }
  };

  const providerInfo = {
    gemini: {
      name: "Google Gemini",
      description: "Fast and efficient, good for quick resume tailoring",
      icon: "🔮",
    },
    claude: {
      name: "Anthropic Claude",
      description: "More detailed analysis and thoughtful modifications",
      icon: "🧠",
    },
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar
        setIsModalOpen={setIsModalOpen}
        user={user}
        isAuthLoading={isAuthLoading}
        credits={credits}
        creditsLoading={isCreditsLoading}
        profile={profile}
        profileLoading={isProfileLoading}
      />

      <main>
        {/* Hero Section */}
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <header className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4 tracking-tight">
                Tailor Your Latex Resume in Seconds
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                Automatically customize your LaTeX resume to match any job offer
                using the power of generative AI.
              </p>

              {/* Disclaimer */}
              <div className="mt-6 max-w-3xl mx-auto p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Disclaimer:</strong> Resume Tailor is not a resume
                  builder - you should already have your own resume in LaTeX,
                  and we will tailor it to match any job description you
                  provide. Don&apos;t have a resume in LaTeX? See example
                  templates{" "}
                  <a
                    href="https://www.overleaf.com/gallery/tagged/cv"
                    className="underline hover:text-yellow-900"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    here
                  </a>
                  .
                </p>
              </div>

              {user && credits && credits.subscription_type === "free" && (
                <div className="mt-6 max-w-md mx-auto p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    🎉 Welcome! You have{" "}
                    <strong>{credits.remaining_credits} free credits</strong> to
                    try Resume Tailor.
                  </p>
                </div>
              )}
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Input Section */}
              <div className="space-y-6">
                {/* Resume Manager - Temporarily commented out */}
                {/* {user && (
                  <ResumeManager
                    user={user}
                    onSelectResume={setResumeLatex}
                    currentLatexContent={resumeLatex}
                  />
                )} */}

                {/* LLM Provider Selector - Only visible in dev */}
                <LLMProviderSelector
                  llmProvider={llmProvider}
                  setLlmProvider={setLlmProvider}
                  selectedModel={selectedModel}
                  setSelectedModel={setSelectedModel}
                  isDev={isDev}
                />

                {/* Input Form */}
                <InputSection
                  jobOffer={jobOffer}
                  setJobOffer={setJobOffer}
                  resumeLatex={resumeLatex}
                  setResumeLatex={setResumeLatex}
                  generationOptions={generationOptions}
                  setGenerationOptions={setGenerationOptions}
                  isLoading={isLoading}
                  onSubmit={handleSubmit}
                  isDev={isDev}
                  llmProvider={llmProvider}
                  providerInfo={providerInfo}
                  user={user}
                  credits={credits}
                  creditsLoading={isCreditsLoading}
                  onResumeEditEnd={handleResumeEditEnd}
                  hasSavedResume={!!primaryResume}
                  primaryResume={primaryResume}
                  copyToClipboard={copyToClipboard}
                  downloadFile={downloadFile}
                />

                {/* Error Display */}
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
                    <div className="flex">
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-destructive">
                          Error
                        </h3>
                        <div className="mt-2 text-sm text-destructive/80">
                          {error}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Results Section */}
              <ResultsSection
                result={result}
                isLoading={isLoading}
                usedProvider={usedProvider}
                isDev={isDev}
                providerInfo={providerInfo}
                copyToClipboard={copyToClipboard}
                downloadFile={downloadFile}
                customQuestions={generationOptions.customQuestions.filter(
                  (q) => q.trim() !== ""
                )}
                onCoverLetterUpdate={handleCoverLetterUpdate}
              />
            </div>
          </div>
        </section>

        {/* How it works section */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-extrabold text-foreground">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              A simple 3-step process to a perfectly tailored resume.
            </p>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                    1
                  </div>
                  <h3 className="ml-4 text-xl font-semibold text-foreground">
                    Paste Job Offer
                  </h3>
                </div>
                <p className="mt-4 text-muted-foreground">
                  Provide the job description you&apos;re applying for to give
                  our AI context on what skills and keywords to highlight.
                </p>
              </div>
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                    2
                  </div>
                  <h3 className="ml-4 text-xl font-semibold text-foreground">
                    Paste Your Resume
                  </h3>
                </div>
                <p className="mt-4 text-muted-foreground">
                  Provide your current resume in LaTeX format. The AI will
                  preserve your formatting while updating the content.
                </p>
              </div>
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                    3
                  </div>
                  <h3 className="ml-4 text-xl font-semibold text-foreground">
                    Get Tailored Resume
                  </h3>
                </div>
                <p className="mt-4 text-muted-foreground">
                  Our AI will rewrite your resume to highlight the best parts
                  for the job. Directly download the PDF for your resume or
                  compile it with your favorite LaTeX editor.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features section */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold text-foreground text-center">
              Why Choose Resume Tailor?
            </h2>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 bg-card rounded-lg shadow-md border border-border">
                <h3 className="text-xl font-semibold text-foreground">
                  Precision & Quality
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Advanced AI precisely analyzes job requirements and tailors
                  your resume with surgical accuracy, highlighting the most
                  relevant skills and experiences for maximum impact.
                </p>
              </div>
              <div className="p-8 bg-card rounded-lg shadow-md border border-border">
                <h3 className="text-xl font-semibold text-foreground">
                  Lightning Fast Results
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Get your perfectly tailored resume, cover letter, and
                  interview answers in seconds. No more hours spent manually
                  customizing applications for each job.
                </p>
              </div>
              <div className="p-8 bg-card rounded-lg shadow-md border border-border">
                <h3 className="text-xl font-semibold text-foreground">
                  Smart Customization
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Generates targeted interview questions, customizable
                  application responses, and adapts to current market trends to
                  give you a competitive edge.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SignInModal isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} />
    </div>
  );
}

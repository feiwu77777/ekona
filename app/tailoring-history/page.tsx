"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { User } from "@supabase/supabase-js";
import NavBar from "../components/NavBar";
import { Button } from "../components/ui/button";
import { logEvent } from "../lib/eventUtils";
import { getOrCreateUserId } from "../lib/userIdUtils";
import TailoringHistoryDialog from "../components/TailoringHistoryDialog";
import { useUserData } from "../hooks/useUserData";

interface TailoringHistory {
  id: string;
  user_id: string;
  job_title: string | null;
  company_name: string | null;
  job_description: string;
  job_url: string | null;
  tailoring_date: string;
  original_resume_id: string | null;
  original_resume_content: string | null;
  generation_options: any;
  tailored_resume_content: string;
  cover_letter_content: string | null;
  standard_answers: any;
  custom_answers: any;
  llm_provider: string;
  model_used: string;
  prompt_version: string | null;
  status: string;
  notes: string | null;
  applied_with_this_version: boolean;
  created_at: string;
  updated_at: string;
}

export default function TailoringHistoryPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [history, setHistory] = useState<TailoringHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const isDev = process.env.NODE_ENV === "development";

  // User data management
  const { profile, credits, isCreditsLoading, isProfileLoading } = useUserData(user);
    
  // Authentication useEffect
  useEffect(() => {
    const initAuth = async () => {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setIsAuthLoading(false);

      const userId = getOrCreateUserId();
      await logEvent({
        name: "tailoring_history_page_loaded",
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

  // Fetch tailoring history when user is authenticated
  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) {
        setHistory([]);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const authHeaders: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (session?.access_token) {
          authHeaders["Authorization"] = `Bearer ${session.access_token}`;
        }

        const response = await fetch("/api/tailoring-history", {
          method: "GET",
          headers: authHeaders,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch tailoring history");
        }

        setHistory(data.data || []);

        const userId = getOrCreateUserId();
        await logEvent({
          name: "tailoring_history_fetched",
          category: "history",
          user_id: userId,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An error occurred";
        setError(errorMessage);
        
        const userId = getOrCreateUserId();
        await logEvent({
          name: "tailoring_history_fetch_failed",
          category: "history",
          user_id: userId,
          is_error: true,
          error_message: errorMessage,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "created":
        return "bg-blue-100 text-blue-800";
      case "applied":
        return "bg-yellow-100 text-yellow-800";
      case "interviewed":
        return "bg-purple-100 text-purple-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "withdrawn":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar
          setIsModalOpen={() => {}}
          user={user}
          isAuthLoading={isAuthLoading}
        />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
            <p className="text-muted-foreground mb-4">
              Please sign in to view your tailoring history.
            </p>
            <Button onClick={() => window.location.href = "/"}>
              Go to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar
        setIsModalOpen={() => {}}
        profile={profile}
        credits={credits}
        creditsLoading={isCreditsLoading}
        profileLoading={isProfileLoading}
        user={user}
        isAuthLoading={isAuthLoading}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Tailoring History
          </h1>
          <p className="text-muted-foreground">
            View all your resume tailoring sessions and track your applications.
          </p>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-lg">Loading your tailoring history...</div>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-destructive">Error</h3>
                <div className="mt-2 text-sm text-destructive/80">{error}</div>
              </div>
            </div>
          </div>
        )}

        {!isLoading && !error && history.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              No tailoring history yet
            </h2>
            <p className="text-muted-foreground mb-6">
              Start tailoring your resume to see your history here.
            </p>
            <Button onClick={() => window.location.href = "/"}>
              Start Tailoring
            </Button>
          </div>
        )}

        {!isLoading && !error && history.length > 0 && (
          <div className="space-y-4">
            {history.map((item) => (
              <TailoringHistoryDialog key={item.id} item={item}>
                <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {item.job_title || "Untitled Job"}
                      </h3>
                      {item.company_name && (
                        <span className="text-muted-foreground">
                          at {item.company_name}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {formatDate(item.tailoring_date)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {truncateText(item.job_description, 150)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                    {item.applied_with_this_version && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Applied
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    {isDev ? <span>AI: {item.llm_provider}</span> : null}
                    {isDev ? <span>Model: {item.model_used}</span> : null}
                    {item.generation_options?.includeCoverLetter && (
                      <span>📄 Cover Letter</span>
                    )}
                    {item.generation_options?.includeStandardQuestions && (
                      <span>❓ Questions</span>
                    )}
                    {item.generation_options?.customQuestions?.length > 0 && (
                      <span>📝 Custom Qs</span>
                    )}
                  </div>
                </div>
              </div>
            </TailoringHistoryDialog>
          ))}
        </div>
        )}

        {!isLoading && !error && history.length > 0 && (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            Showing {history.length} tailoring session{history.length !== 1 ? "s" : ""}
          </div>
        )}
      </main>
    </div>
  );
} 
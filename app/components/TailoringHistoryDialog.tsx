"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Eye, Download, Copy } from "lucide-react";
import { useCopyState } from "../lib/copyUtils";
import { useDownloadState } from "../lib/downloadUtils";

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

interface TailoringHistoryDialogProps {
  item: TailoringHistory;
  children: React.ReactNode;
}

export default function TailoringHistoryDialog({ item, children }: TailoringHistoryDialogProps) {
  const [activeTab, setActiveTab] = useState("job");
  const [isOpen, setIsOpen] = useState(false);
  const { copiedItems, handleCopy } = useCopyState();
  const { isCompilingPDF, handlePDFDownload, downloadFile } = useDownloadState();

  const isDev = process.env.NODE_ENV === "development";
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const tabs = [
    { id: "job", label: "Job Description", icon: "💼" },
    { id: "original", label: "Original Resume", icon: "📄" },
    { id: "tailored", label: "Tailored Resume", icon: "✨" },
    ...(item.cover_letter_content ? [{ id: "cover", label: "Cover Letter", icon: "📝" }] : []),
    ...(item.standard_answers ? [{ id: "standard", label: "Standard Answers", icon: "❓" }] : []),
    ...(item.custom_answers?.length > 0 ? [{ id: "custom", label: "Custom Answers", icon: "📋" }] : []),
  ];

  const getTabContent = () => {
    switch (activeTab) {
      case "job":
        return (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-foreground mb-2">Job Details</h3>
              <div className="space-y-2 text-sm">
                {item.job_title && (
                  <p><strong>Title:</strong> {item.job_title}</p>
                )}
                {item.company_name && (
                  <p><strong>Company:</strong> {item.company_name}</p>
                )}
                {item.job_url && (
                  <p><strong>URL:</strong> <a href={item.job_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{item.job_url}</a></p>
                )}
                <p><strong>Date:</strong> {formatDate(item.tailoring_date)}</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Job Description</h3>
              <div className="bg-muted p-4 rounded-md max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm">{item.job_description}</pre>
              </div>
            </div>
          </div>
        );

      case "original":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-foreground">Original Resume</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(item.original_resume_content || "", "original-resume")}
                  className={copiedItems.has("original-resume") ? "bg-green-500 text-white" : ""}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  {copiedItems.has("original-resume") ? "Copied!" : "Copy"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadFile(item.original_resume_content || "", "original-resume.tex", "text/plain")}
                >
                  <Download className="h-4 w-4 mr-1" />
                  .tex
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePDFDownload(item.original_resume_content || "", "latex", "original-resume-pdf")}
                  disabled={isCompilingPDF.has("original-resume-pdf")}
                  className="disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="h-4 w-4 mr-1" />
                  {isCompilingPDF.has("original-resume-pdf") ? "Compiling..." : "PDF"}
                </Button>
              </div>
            </div>
            <div className="bg-muted p-4 rounded-md max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm">{item.original_resume_content}</pre>
            </div>
          </div>
        );

      case "tailored":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-foreground">Tailored Resume</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(item.tailored_resume_content, "tailored-resume")}
                  className={copiedItems.has("tailored-resume") ? "bg-green-500 text-white" : ""}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  {copiedItems.has("tailored-resume") ? "Copied!" : "Copy"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadFile(item.tailored_resume_content, "tailored-resume.tex", "text/plain")}
                >
                  <Download className="h-4 w-4 mr-1" />
                  .tex
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePDFDownload(item.tailored_resume_content, "latex", "tailored-resume-pdf")}
                  disabled={isCompilingPDF.has("tailored-resume-pdf")}
                  className="disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="h-4 w-4 mr-1" />
                  {isCompilingPDF.has("tailored-resume-pdf") ? "Compiling..." : "PDF"}
                </Button>
              </div>
            </div>
            <div className="bg-muted p-4 rounded-md max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm">{item.tailored_resume_content}</pre>
            </div>
          </div>
        );

      case "cover":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-foreground">Cover Letter</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(item.cover_letter_content || "", "cover-letter")}
                  className={copiedItems.has("cover-letter") ? "bg-green-500 text-white" : ""}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  {copiedItems.has("cover-letter") ? "Copied!" : "Copy"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadFile(item.cover_letter_content || "", "cover-letter.txt", "text/plain")}
                >
                  <Download className="h-4 w-4 mr-1" />
                  .txt
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePDFDownload(item.cover_letter_content || "", "cover-letter", "cover-letter-pdf")}
                  disabled={isCompilingPDF.has("cover-letter-pdf")}
                  className="disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="h-4 w-4 mr-1" />
                  {isCompilingPDF.has("cover-letter-pdf") ? "Generating..." : "PDF"}
                </Button>
              </div>
            </div>
            <div className="bg-muted p-4 rounded-md max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm">{item.cover_letter_content}</pre>
            </div>
          </div>
        );

      case "standard":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-foreground">Standard Interview Answers</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(JSON.stringify(item.standard_answers, null, 2), "standard-answers")}
                  className={copiedItems.has("standard-answers") ? "bg-green-500 text-white" : ""}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  {copiedItems.has("standard-answers") ? "Copied!" : "Copy"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadFile(JSON.stringify(item.standard_answers, null, 2), "standard-answers.json", "application/json")}
                >
                  <Download className="h-4 w-4 mr-1" />
                  .json
                </Button>
              </div>
            </div>
            <div className="bg-muted p-4 rounded-md max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {item.standard_answers?.whyThisJob && (
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Why This Job?</h4>
                    <p className="text-sm">{item.standard_answers.whyThisJob}</p>
                  </div>
                )}
                {item.standard_answers?.whyYouFit && (
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Why You Fit?</h4>
                    <p className="text-sm">{item.standard_answers.whyYouFit}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "custom":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-foreground">Custom Interview Answers</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(JSON.stringify(item.custom_answers, null, 2), "custom-answers")}
                  className={copiedItems.has("custom-answers") ? "bg-green-500 text-white" : ""}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  {copiedItems.has("custom-answers") ? "Copied!" : "Copy"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadFile(JSON.stringify(item.custom_answers, null, 2), "custom-answers.json", "application/json")}
                >
                  <Download className="h-4 w-4 mr-1" />
                  .json
                </Button>
              </div>
            </div>
            <div className="bg-muted p-4 rounded-md max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {item.custom_answers?.map((answer: string, index: number) => (
                  <div key={index}>
                    <h4 className="font-medium text-foreground mb-2">
                      Custom Question {index + 1}
                    </h4>
                    <p className="text-sm">{answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            {item.job_title || "Untitled Job"}
            {item.company_name && (
              <span className="text-muted-foreground font-normal">
                at {item.company_name}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full">
          {/* Tab Navigation */}
          <div className="flex border-b mb-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {getTabContent()}
          </div>

          {/* Footer with metadata */}
          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <div className="flex gap-4">
                {isDev ? <span>AI: {item.llm_provider}</span> : null}
                {isDev ? <span>Model: {item.model_used}</span> : null}
                <span>Status: {item.status}</span>
                {item.applied_with_this_version && (
                  <span className="text-green-600 font-medium">✓ Applied</span>
                )}
              </div>
              <span>{formatDate(item.created_at)}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculate word count from text content
 * Uses the same logic as BlogPreview component
 */
export function calculateWordCount(content: string): number {
  return content.split(/\s+/).filter(word => word.length > 0).length;
} 
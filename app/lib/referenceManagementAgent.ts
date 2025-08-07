interface Reference {
  title: string;
  url: string;
  source: string;
  publishedAt?: string;
}

interface ReferenceList {
  references: Reference[];
  totalCount: number;
  generatedAt: string;
}

export class ReferenceManagementAgent {
  async extractReferences(researchData: any[], blogContent: string): Promise<ReferenceList> {
    // Simply use the research data as-is, no additional filtering needed
    const references = this.formatReferences(researchData);
    
    return {
      references,
      totalCount: references.length,
      generatedAt: new Date().toISOString()
    };
  }

  private formatReferences(researchData: any[]): Reference[] {
    return researchData.map(ref => ({
      title: ref.title,
      url: ref.url,
      source: ref.source,
      publishedAt: ref.publishedAt
    }));
  }

  generateMarkdownReferences(references: Reference[]): string {
    if (references.length === 0) {
      return '\n## References\n\nNo references available.';
    }

    let markdown = '\n## References\n\n';
    
    references.forEach((ref, index) => {
      const date = ref.publishedAt ? ` (${new Date(ref.publishedAt).getFullYear()})` : '';
      markdown += `${index + 1}. [${ref.title}](${ref.url}) - ${ref.source}${date}\n`;
    });
    
    return markdown;
  }

  async embedReferencesInBlog(blogContent: string, references: Reference[]): Promise<string> {
    // Remove existing references section if present
    const contentWithoutRefs = blogContent.replace(/\n## References[\s\S]*$/, '');
    
    // Add new references section
    const referencesMarkdown = this.generateMarkdownReferences(references);
    
    return contentWithoutRefs + referencesMarkdown;
  }

  // Method to get reference summary for debugging
  async getReferenceSummary(researchData: any[]): Promise<{
    totalReferences: number;
    sources: string[];
    dateRange: { earliest?: string; latest?: string };
    generatedAt: string;
  }> {
    const sources = [...new Set(researchData.map(ref => ref.source))];
    
    const dates = researchData
      .map(ref => ref.publishedAt)
      .filter(date => date)
      .map(date => new Date(date).getTime());
    
    const dateRange = dates.length > 0 ? {
      earliest: new Date(Math.min(...dates)).toISOString(),
      latest: new Date(Math.max(...dates)).toISOString()
    } : {};
    
    return {
      totalReferences: researchData.length,
      sources,
      dateRange,
      generatedAt: new Date().toISOString()
    };
  }

  // Method to validate references
  validateReferences(references: Reference[]): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check for minimum references
    if (references.length < 3) {
      suggestions.push("Consider adding more references for better credibility");
    }

    // Check for missing URLs
    const invalidUrls = references.filter(ref => !ref.url || !ref.url.startsWith('http'));
    if (invalidUrls.length > 0) {
      issues.push(`${invalidUrls.length} references have invalid URLs`);
    }

    // Check for missing titles
    const missingTitles = references.filter(ref => !ref.title || ref.title.trim() === '');
    if (missingTitles.length > 0) {
      issues.push(`${missingTitles.length} references have missing titles`);
    }

    // Check for duplicate URLs
    const urls = references.map(ref => ref.url);
    const duplicateUrls = urls.filter((url, index) => urls.indexOf(url) !== index);
    if (duplicateUrls.length > 0) {
      issues.push(`${duplicateUrls.length} duplicate URLs found`);
    }

    // Check for recent references
    const currentYear = new Date().getFullYear();
    const oldReferences = references.filter(ref => {
      if (!ref.publishedAt) return false;
      const year = new Date(ref.publishedAt).getFullYear();
      return currentYear - year > 5;
    });
    
    if (oldReferences.length > references.length * 0.5) {
      suggestions.push("Consider including more recent references");
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }
}

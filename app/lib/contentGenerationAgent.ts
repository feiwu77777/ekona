import { traceableGemini } from './langchainClient';

interface BlogGenerationOptions {
  topic: string;
  tone: 'academic' | 'casual' | 'professional';
  maxWords: number;
  researchData: any[];
  includeImages: boolean;
}

interface GeneratedBlog {
  title: string;
  content: string;
  wordCount: number;
  sections: string[];
  keywords: string[];
  metadata: {
    tone: string;
    generatedAt: string;
    modelUsed: string;
  };
}

export class ContentGenerationAgent {
  async generateBlog(options: BlogGenerationOptions): Promise<GeneratedBlog> {
    // Step 1: Create structured prompt
    const prompt = this.buildPrompt(options);
    
    // Step 2: Generate content with LangSmith tracing
    const generatedText = await traceableGemini(prompt);
    
    // Step 3: Parse and structure the response
    const parsedBlog = this.parseGeneratedContent(generatedText, options);
    
    return parsedBlog;
  }

  private buildPrompt(options: BlogGenerationOptions): string {
    const toneInstructions = {
      academic: "Write in an academic style with formal language, citations, and scholarly tone.",
      casual: "Write in a conversational, friendly tone suitable for a general audience.",
      professional: "Write in a professional business tone, clear and authoritative."
    };

    return `
You are an expert blog writer. Create a comprehensive blog post on "${options.topic}".

**Requirements:**
- Maximum ${options.maxWords} words
- ${toneInstructions[options.tone]}
- Include proper Markdown formatting
- Use the provided research data for accuracy
- Structure with clear headings (## for main sections)
- Include an engaging introduction and conclusion
- Return 5-7 keywords that best describe this blog post

**Research Data:**
${options.researchData.map(item => `- ${item.title}: ${item.snippet}`).join('\n')}

**Output Format:**
Return the blog post in this exact format:

# [Blog Title]

[Introduction paragraph]

## [Section 1 Title]
[Section 1 content]

## [Section 2 Title]
[Section 2 content]

## [Section 3 Title]
[Section 3 content]

## Conclusion
[Conclusion paragraph]

**Keywords:** [keyword1, keyword2, keyword3, keyword4, keyword5]

**Word Count:** [exact number]

Write the blog post now:
`;
  }

  private parseGeneratedContent(content: string, options: BlogGenerationOptions): GeneratedBlog {
    // Extract title (first line starting with #)
    const titleMatch = content.match(/^# (.+)$/m);
    const title = titleMatch ? titleMatch[1] : options.topic;
    
    // Remove title from content
    const contentWithoutTitle = content.replace(/^# .+$/m, '').trim();
    
    // Extract keywords
    const keywordsMatch = content.match(/\*\*Keywords:\*\* \[(.+)\]/);
    const keywords = keywordsMatch 
      ? keywordsMatch[1].split(',').map(k => k.trim())
      : this.extractKeywordsFromContent(contentWithoutTitle);
    
    // Split into sections
    const sections = contentWithoutTitle.split(/\n## /).map(section => section.trim());
    
    // Count words
    const wordCount = contentWithoutTitle.split(/\s+/).length;
    
    return {
      title,
      content: contentWithoutTitle,
      wordCount,
      sections,
      keywords,
      metadata: {
        tone: options.tone,
        generatedAt: new Date().toISOString(),
        modelUsed: "gemini-2.5-pro"
      }
    };
  }

  private extractKeywordsFromContent(content: string): string[] {
    // Simple keyword extraction as fallback
    const words = content.toLowerCase().split(/\s+/);
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them']);
    
    const wordFreq: { [key: string]: number } = {};
    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (cleanWord.length > 3 && !commonWords.has(cleanWord)) {
        wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
      }
    });
    
    return Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
  }

  async editBlog(originalContent: string, editRequest: string): Promise<string> {
    const prompt = `
Original blog content:
${originalContent}

Edit request: ${editRequest}

Please provide the edited blog content with the requested changes. Maintain the same structure and tone.
`;

    return await traceableGemini(prompt);
  }
}

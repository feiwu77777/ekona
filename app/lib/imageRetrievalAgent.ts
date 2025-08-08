interface ImageData {
  id: string;
  url: string;
  alt: string;
  photographer: string;
  photographerUsername: string; // For proper Unsplash attribution
  downloadUrl: string;
  relevanceScore?: number;
}

const NUM_IMAGES = 3; // Reduced for testing to avoid Unsplash rate limits

export class ImageRetrievalAgent {
  private unsplashAccessKey: string;

  constructor() {
    this.unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY!;
  }

  async findRelevantImages(blogContent: string, topic: string, keywords?: string[]): Promise<ImageData[]> {
    // Step 1: Extract key concepts from blog content or use provided keywords
    const keyConcepts = keywords && keywords.length > 0 
      ? keywords 
      : await this.extractKeyConcepts(blogContent);
    console.log("Key concepts:", keyConcepts);
    // Step 2: Generate search queries
    const searchQueries = keyConcepts.slice(0, 3);
    console.log("Search queries:", searchQueries);
    // Step 3: Search for images
    const allImages = await this.searchImages(searchQueries);
    // Step 4: Score relevance using AI (or fallback to keyword matching)
    const scoredImages = await this.scoreImageRelevance(allImages, topic);
    console.log("Scored images:", scoredImages);
    // Step 5: Return all scored images (no slicing) for maximum choice
    return scoredImages.sort((a, b) => b.relevanceScore! - a.relevanceScore!);
  }

  private async extractKeyConcepts(content: string): Promise<string[]> {
    // For now, use a simple keyword extraction approach
    // This will be enhanced when Gemini is integrated
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 4)
      .filter(word => !this.isCommonWord(word));
    
    // Get unique words and take top 3-5 for testing
    const uniqueWords = [...new Set(words)];
    return uniqueWords.slice(0, 5);
  }

  private isCommonWord(word: string): boolean {
    const commonWords = [
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use',
      'this', 'that', 'with', 'they', 'have', 'from', 'word', 'what', 'said', 'each', 'which', 'their', 'time', 'will', 'way', 'about', 'many', 'then', 'them', 'these', 'so', 'some', 'her', 'would', 'make', 'like', 'into', 'him', 'time', 'has', 'look', 'two', 'more', 'go', 'no', 'way', 'could', 'my', 'than', 'first', 'been', 'call', 'who', 'oil', 'sit', 'now', 'find', 'down', 'day', 'did', 'get', 'come', 'made', 'may', 'part'
    ];
    return commonWords.includes(word);
  }

  private generateSearchQueries(concepts: string[]): string[] {
    return concepts.map(concept => [
      concept,
      `${concept} technology`,
      `${concept} illustration`,
      `${concept} concept`
    ]).flat().slice(0, 3); // Reduced to 3 queries for testing
  }

  private async searchImages(queries: string[]): Promise<ImageData[]> {
    const allImages: ImageData[] = [];
    
    for (const query of queries) {
      try {
        const response = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${NUM_IMAGES}&orientation=landscape`,
          {
            headers: {
              'Authorization': `Client-ID ${this.unsplashAccessKey}`
            }
          }
        );
        
        if (!response.ok) {
          console.error(`Unsplash API error for query "${query}":`, response.status, response.statusText);
          continue;
        }
        
        const data = await response.json();
        
        if (data.errors) {
          console.error(`Unsplash API errors for query "${query}":`, data.errors);
          continue;
        }
        
        const images = data.results.map((photo: any) => ({
          id: photo.id,
          url: photo.urls.regular,
          alt: photo.alt_description || query,
          photographer: photo.user.name,
          photographerUsername: photo.user.username,
          downloadUrl: photo.links.download
        }));
        
        allImages.push(...images);
      } catch (error) {
        console.error(`Failed to search for "${query}":`, error);
      }
    }
    
    return allImages;
  }

  private async scoreImageRelevance(images: ImageData[], topic: string): Promise<ImageData[]> {
    // For now, use keyword-based scoring
    // This will be enhanced with AI scoring when Gemini is integrated
    const scoredImages = images.map((image) => {
      const score = this.calculateKeywordRelevance(image, topic);
      return { ...image, relevanceScore: score };
    });
    
    return scoredImages;
  }

  private calculateKeywordRelevance(image: ImageData, topic: string): number {
    const topicKeywords = topic.toLowerCase().split(' ').filter(word => word.length > 3);
    const imageKeywords = image.alt.toLowerCase().split(' ');
    
    let matches = 0;
    let totalKeywords = topicKeywords.length;
    
    for (const topicKeyword of topicKeywords) {
      if (imageKeywords.some(imgKeyword => 
        imgKeyword.includes(topicKeyword) || topicKeyword.includes(imgKeyword)
      )) {
        matches++;
      }
    }
    
    // Calculate score from 1-10
    const baseScore = totalKeywords > 0 ? (matches / totalKeywords) * 10 : 5;
    
    // Add bonus for longer, more descriptive alt text
    const descriptionBonus = Math.min(image.alt.length / 20, 2);
    
    return Math.min(Math.round(baseScore + descriptionBonus), 10);
  }

  async embedImagesInMarkdown(markdown: string, images: ImageData[]): Promise<string> {
    const sections = markdown.split('\n## ');
    const embeddedSections = sections.map((section, index) => {
      if (index === 0) return section; // Skip title section
      
      // Find relevant image for this section
      const relevantImage = this.findRelevantImageForSection(section, images, index - 1);
      
      if (relevantImage) {
        // Proper Unsplash attribution as required by API Terms
        const attribution = `\n![${relevantImage.alt}](${relevantImage.url})\n\n*Photo by [${relevantImage.photographer}](https://unsplash.com/@${relevantImage.photographerUsername}) on [Unsplash](https://unsplash.com)*\n\n## ${section}`;
        
        // Track the download event for Unsplash compliance
        this.trackImageDownload(relevantImage.id);
        
        return attribution;
      }
      
      return `\n## ${section}`;
    });
    
    return embeddedSections.join('');
  }

  private async trackImageDownload(photoId: string): Promise<void> {
    try {
      // Notify Unsplash of download event as required by API Terms
      await fetch(`https://api.unsplash.com/photos/${photoId}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Client-ID ${this.unsplashAccessKey}`
        }
      });
    } catch (error) {
      console.error('Failed to track image download:', error);
      // Don't fail the main operation if tracking fails
    }
  }

  private findRelevantImageForSection(section: string, images: ImageData[], sectionIndex: number): ImageData | null {
    if (images.length === 0) return null;
    
    // Cycle through available images if we have more sections than images
    const imageIndex = sectionIndex % images.length;
    return images[imageIndex];
  }

  // Method to get image search summary for debugging
  async getImageSearchSummary(blogContent: string, topic: string): Promise<{
    topic: string;
    keyConcepts: string[];
    searchQueries: string[];
    totalImagesFound: number;
    scoredImages: number;
    finalImages: number;
  }> {
    const keyConcepts = await this.extractKeyConcepts(blogContent);
    const searchQueries = this.generateSearchQueries(keyConcepts);
    const allImages = await this.searchImages(searchQueries);
    const scoredImages = await this.scoreImageRelevance(allImages, topic);
    const finalImages = scoredImages
      .filter(img => img.relevanceScore! >= 7)
      .sort((a, b) => b.relevanceScore! - a.relevanceScore!);

    return {
      topic,
      keyConcepts,
      searchQueries,
      totalImagesFound: allImages.length,
      scoredImages: scoredImages.length,
      finalImages: finalImages.length,
    };
  }

  // Method to search for specific images (for manual image replacement)
  async searchImagesByQuery(query: string): Promise<ImageData[]> {
    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape`,
        {
          headers: {
            'Authorization': `Client-ID ${this.unsplashAccessKey}`
          }
        }
      );
      
      if (!response.ok) {
        console.error('Unsplash API error:', response.status, response.statusText);
        return [];
      }
      
      const data = await response.json();
      
      if (data.errors) {
        console.error('Unsplash API errors:', data.errors);
        return [];
      }
      
              return data.results.map((photo: any) => ({
          id: photo.id,
          url: photo.urls.regular,
          alt: photo.alt_description || query,
          photographer: photo.user.name,
          photographerUsername: photo.user.username,
          downloadUrl: photo.links.download
        }));
    } catch (error) {
      console.error('Failed to search images:', error);
      return [];
    }
  }
}

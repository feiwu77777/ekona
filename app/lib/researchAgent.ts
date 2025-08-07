interface ResearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  publishedAt?: string;
}

export class ResearchAgent {
  private newsApiKey: string;
  private googleApiKey: string;
  private searchEngineId: string;

  constructor() {
    this.newsApiKey = process.env.NEWS_API_KEY!;
    this.googleApiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY!;
    this.searchEngineId = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID!;
  }

  async researchTopic(topic: string): Promise<ResearchResult[]> {
    // Step 1: Get recent news articles
    const newsResults = await this.getNewsArticles(topic);
    
    // Step 2: Get comprehensive search results
    const searchResults = await this.getSearchResults(topic);
    
    // Step 3: Combine and deduplicate results
    const combinedResults = this.combineAndDeduplicate(newsResults, searchResults);
    
    // Step 4: Filter for relevance and quality
    const filteredResults = this.filterResults(combinedResults, topic);
    
    return filteredResults.slice(0, 10); // Return top 10 results
  }

  private async getNewsArticles(topic: string): Promise<ResearchResult[]> {
    try {
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(topic)}&sortBy=publishedAt&language=en&pageSize=20&apiKey=${this.newsApiKey}`
      );
      
      if (!response.ok) {
        console.error('News API error:', response.status, response.statusText);
        return [];
      }
      
      const data = await response.json();
      
      if (data.status === 'error') {
        console.error('News API error:', data.message);
        return [];
      }
      
      return data.articles.map((article: any) => ({
        title: article.title,
        url: article.url,
        snippet: article.description,
        source: article.source.name,
        publishedAt: article.publishedAt
      }));
    } catch (error) {
      console.error('Failed to fetch news articles:', error);
      return [];
    }
  }

  private async getSearchResults(topic: string): Promise<ResearchResult[]> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${this.googleApiKey}&cx=${this.searchEngineId}&q=${encodeURIComponent(topic)}&num=10`
      );
      
      if (!response.ok) {
        console.error('Google Custom Search API error:', response.status, response.statusText);
        return [];
      }
      
      const data = await response.json();
      
      if (data.error) {
        console.error('Google Custom Search API error:', data.error);
        return [];
      }
      
      return data.items?.map((item: any) => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet,
        source: new URL(item.link).hostname
      })) || [];
    } catch (error) {
      console.error('Failed to fetch search results:', error);
      return [];
    }
  }

  private combineAndDeduplicate(news: ResearchResult[], search: ResearchResult[]): ResearchResult[] {
    const allResults = [...news, ...search];
    const seen = new Set();
    
    return allResults.filter(result => {
      const key = result.url;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private filterResults(results: ResearchResult[], topic: string): ResearchResult[] {
    // Filter out low-quality sources, irrelevant content
    const blockedDomains = ['facebook.com', 'twitter.com', 'instagram.com', 'tiktok.com', 'youtube.com'];
    
    return results.filter(result => {
      try {
        const domain = new URL(result.url).hostname;
        
        // Block social media domains
        if (blockedDomains.some(blocked => domain.includes(blocked))) {
          return false;
        }
        
        // Filter out results with very short titles or snippets
        if (result.title.length < 10 || result.snippet.length < 20) {
          return false;
        }
        
        // Filter out results that don't contain topic keywords
        const topicKeywords = topic.toLowerCase().split(' ').filter(word => word.length > 3);
        const content = `${result.title} ${result.snippet}`.toLowerCase();
        
        const hasRelevantKeywords = topicKeywords.some(keyword => 
          content.includes(keyword)
        );
        
        return hasRelevantKeywords;
      } catch (error) {
        // If URL parsing fails, filter out the result
        return false;
      }
    });
  }

  // Method to get research summary for debugging
  async getResearchSummary(topic: string): Promise<{
    topic: string;
    newsCount: number;
    searchCount: number;
    totalResults: number;
    filteredResults: number;
    finalResults: number;
  }> {
    const newsResults = await this.getNewsArticles(topic);
    const searchResults = await this.getSearchResults(topic);
    const combinedResults = this.combineAndDeduplicate(newsResults, searchResults);
    const filteredResults = this.filterResults(combinedResults, topic);
    const finalResults = filteredResults.slice(0, 10);

    return {
      topic,
      newsCount: newsResults.length,
      searchCount: searchResults.length,
      totalResults: combinedResults.length,
      filteredResults: filteredResults.length,
      finalResults: finalResults.length,
    };
  }
}

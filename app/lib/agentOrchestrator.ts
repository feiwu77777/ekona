import { ResearchAgent } from './researchAgent';
import { ContentGenerationAgent } from './contentGenerationAgent';
import { ImageRetrievalAgent } from './imageRetrievalAgent';
import { ReferenceManagementAgent } from './referenceManagementAgent';

interface BlogGenerationRequest {
  topic: string;
  tone: 'academic' | 'casual' | 'professional';
  maxWords: number;
  includeImages: boolean;
}

interface BlogGenerationResult {
  title: string;
  content: string;
  images: any[];
  allImages: any[]; // All scored images for review
  references: any[];
  metadata: {
    generationTime: number;
    wordCount: number;
    modelUsed: string;
    generatedAt: string;
    researchSources: number;
    imagesFound: number;
    referencesCount: number;
  };
}

interface GenerationState {
  step: 'research' | 'content' | 'images' | 'references' | 'complete' | 'error';
  progress: number;
  message: string;
  data?: any;
}

export class AgentOrchestrator {
  private researchAgent: ResearchAgent;
  private contentAgent: ContentGenerationAgent;
  private imageAgent: ImageRetrievalAgent;
  private referenceAgent: ReferenceManagementAgent;

  constructor() {
    this.researchAgent = new ResearchAgent();
    this.contentAgent = new ContentGenerationAgent();
    this.imageAgent = new ImageRetrievalAgent();
    this.referenceAgent = new ReferenceManagementAgent();
  }

  async generateBlog(request: BlogGenerationRequest): Promise<BlogGenerationResult> {
    const startTime = Date.now();
    let researchData: any[] = [];
    let generatedContent = '';
    let images: any[] = [];
    let allImages: any[] = [];
    let references: any[] = [];

    try {
      console.log('Starting blog generation for topic:', request.topic);

      // Step 1: Research
      console.log('Step 1: Researching topic...');
      researchData = await this.researchAgent.researchTopic(request.topic);
      console.log(`Found ${researchData.length} research sources`);

      // Step 2: Content Generation
      console.log('Step 2: Generating content...');
      const blogResult = await this.contentAgent.generateBlog({
        topic: request.topic,
        tone: request.tone,
        maxWords: request.maxWords,
        researchData,
        includeImages: request.includeImages
      });
      generatedContent = blogResult.content;
      console.log(`Generated ${blogResult.wordCount} words`);

      // Step 3: Image Retrieval (if requested)
      if (request.includeImages) {
        console.log('Step 3: Finding relevant images...');
        console.log('Using keywords from blog:', blogResult.keywords);
        allImages = await this.imageAgent.findRelevantImages(generatedContent, request.topic, blogResult.keywords);
        console.log(`Found ${allImages.length} total images`);
        
        // Use all images for embedding - let the image agent handle distribution
        images = allImages;
        console.log(`Using all ${images.length} images for embedding`);
        
        // Embed images in content
        generatedContent = await this.imageAgent.embedImagesInMarkdown(generatedContent, images);
      }

      // Step 4: Reference Management
      console.log('Step 4: Processing references...');
      const referenceResult = await this.referenceAgent.extractReferences(researchData, generatedContent);
      references = referenceResult.references;
      console.log(`Extracted ${references.length} references`);

      // Embed references in content
      generatedContent = await this.referenceAgent.embedReferencesInBlog(generatedContent, references);

      const generationTime = Date.now() - startTime;

      return {
        title: blogResult.title,
        content: generatedContent,
        images,
        allImages,
        references,
        metadata: {
          generationTime,
          wordCount: blogResult.wordCount,
          modelUsed: blogResult.metadata.modelUsed,
          generatedAt: new Date().toISOString(),
          researchSources: researchData.length,
          imagesFound: allImages.length,
          referencesCount: references.length
        }
      };

    } catch (error) {
      console.error('Blog generation failed:', error);
      throw new Error(`Blog generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateBlogWithProgress(
    request: BlogGenerationRequest,
    onProgress: (state: GenerationState) => void
  ): Promise<BlogGenerationResult> {
    const steps = [
      { name: 'research', weight: 0.2 },
      { name: 'content', weight: 0.5 },
      { name: 'images', weight: 0.2 },
      { name: 'references', weight: 0.1 }
    ];

    let currentStep = 0;
    let accumulatedProgress = 0;

    const updateProgress = (stepName: string, message: string, data?: any) => {
      const stepIndex = steps.findIndex(s => s.name === stepName);
      if (stepIndex > currentStep) {
        accumulatedProgress += steps[currentStep].weight;
        currentStep = stepIndex;
      }
      
      onProgress({
        step: stepName as any,
        progress: Math.min(accumulatedProgress + (steps[currentStep]?.weight || 0), 1),
        message,
        data
      });
    };

    try {
      // Step 1: Research
      updateProgress('research', 'Researching your topic...');
      const researchData = await this.researchAgent.researchTopic(request.topic);
      updateProgress('research', `Found ${researchData.length} sources`, researchData);

      // Step 2: Content Generation
      updateProgress('content', 'Generating blog content...');
      const blogResult = await this.contentAgent.generateBlog({
        topic: request.topic,
        tone: request.tone,
        maxWords: request.maxWords,
        researchData,
        includeImages: request.includeImages
      });
      updateProgress('content', `Generated ${blogResult.wordCount} words`, blogResult);

      // Step 3: Images
      let images: any[] = [];
      let allImages: any[] = [];
      if (request.includeImages) {
        updateProgress('images', 'Finding relevant images...');
        updateProgress('images', `Using keywords: ${blogResult.keywords.join(', ')}`, blogResult.keywords);
        allImages = await this.imageAgent.findRelevantImages(blogResult.content, request.topic, blogResult.keywords);
        images = allImages; // Use all images for embedding
        updateProgress('images', `Found ${allImages.length} total images, using all for embedding`, { allImages, images });
        
        blogResult.content = await this.imageAgent.embedImagesInMarkdown(blogResult.content, images);
      }

      // Step 4: References
      updateProgress('references', 'Extracting references...');
      const referenceResult = await this.referenceAgent.extractReferences(researchData, blogResult.content);
      updateProgress('references', `Extracted ${referenceResult.references.length} references`, referenceResult);

      blogResult.content = await this.referenceAgent.embedReferencesInBlog(blogResult.content, referenceResult.references);

      updateProgress('complete', 'Blog generation complete!', {
        title: blogResult.title,
        content: blogResult.content,
        images,
        allImages,
        references: referenceResult.references
      });

      return {
        title: blogResult.title,
        content: blogResult.content,
        images,
        allImages,
        references: referenceResult.references,
        metadata: {
          generationTime: Date.now(),
          wordCount: blogResult.wordCount,
          modelUsed: blogResult.metadata.modelUsed,
          generatedAt: new Date().toISOString(),
          researchSources: researchData.length,
          imagesFound: allImages.length,
          referencesCount: referenceResult.references.length
        }
      };

    } catch (error) {
      updateProgress('error', `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  // Method to get generation summary for debugging
  async getGenerationSummary(request: BlogGenerationRequest): Promise<{
    estimatedTime: number;
    steps: string[];
    requirements: string[];
  }> {
    const steps = [
      'Research topic using News API and Google Custom Search',
      'Generate blog content using Gemini API',
      'Find relevant images using Unsplash API',
      'Extract and format references'
    ];

    const requirements = [
      'News API key',
      'Google Custom Search API key',
      'Gemini API key',
      'Unsplash API key'
    ];

    // Rough time estimates
    const estimatedTime = 30000 + (request.maxWords * 50); // Base 30s + 50ms per word

    return {
      estimatedTime,
      steps,
      requirements
    };
  }
}

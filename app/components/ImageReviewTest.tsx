'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ImageReviewGallery from './ImageReviewGallery';
import { useImageManagement } from '@/app/hooks/useImageManagement';
import MarkdownPreview from './MarkdownPreview';

interface ImageData {
  id: string;
  url: string;
  alt: string;
  photographer: string;
  photographerUsername: string;
  downloadUrl: string;
  relevanceScore?: number;
}

export default function ImageReviewTest() {
  // Sample images for testing
  const sampleImages: ImageData[] = [
    {
      id: '1',
      url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400',
      alt: 'Artificial Intelligence Technology',
      photographer: 'John Doe',
      photographerUsername: 'johndoe',
      downloadUrl: 'https://unsplash.com/photos/artificial-intelligence',
      relevanceScore: 8
    },
    {
      id: '2',
      url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
      alt: 'Machine Learning Concept',
      photographer: 'Jane Smith',
      photographerUsername: 'janesmith',
      downloadUrl: 'https://unsplash.com/photos/machine-learning',
      relevanceScore: 7
    },
    {
      id: '3',
      url: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=400',
      alt: 'Digital Technology',
      photographer: 'Bob Wilson',
      photographerUsername: 'bobwilson',
      downloadUrl: 'https://unsplash.com/photos/digital-technology',
      relevanceScore: 6
    }
  ];

  const {
    images,
    addImage,
    removeImage,
    replaceImage,
    reorderImages,
    clearImages
  } = useImageManagement(sampleImages);

  const [blogContent, setBlogContent] = useState(`# The Future of Artificial Intelligence

Artificial Intelligence (AI) has rapidly evolved from a theoretical concept to a transformative technology that is reshaping industries and societies worldwide.

## Current Applications

AI is already deeply integrated into our daily lives. From virtual assistants like Siri and Alexa to recommendation systems on Netflix and Amazon, AI algorithms are working behind the scenes to enhance user experiences.

## Future Prospects

Looking ahead, AI is poised to revolutionize transportation through autonomous vehicles, transform education with personalized learning systems, and enhance scientific research by processing vast amounts of data.

## Conclusion

As AI continues to advance, it will create new opportunities while also presenting challenges that society must address.`);

  const handleSearchImages = async (query: string): Promise<ImageData[]> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock search results based on query
    const mockResults: ImageData[] = [
      {
        id: `search-${Date.now()}-1`,
        url: `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}?w=400`,
        alt: `${query} concept`,
        photographer: 'Mock Photographer',
        photographerUsername: 'mockuser',
        downloadUrl: 'https://unsplash.com/photos/mock',
        relevanceScore: Math.floor(Math.random() * 10) + 1
      },
      {
        id: `search-${Date.now()}-2`,
        url: `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}?w=400`,
        alt: `${query} technology`,
        photographer: 'Another Photographer',
        photographerUsername: 'anotheruser',
        downloadUrl: 'https://unsplash.com/photos/mock2',
        relevanceScore: Math.floor(Math.random() * 10) + 1
      }
    ];
    
    return mockResults;
  };

  const handleImageReplace = (oldImageId: string, newImage: ImageData) => {
    replaceImage(oldImageId, newImage);
    
    // Update blog content to reflect the change
    setBlogContent(prev => {
      // Simple replacement - in a real app, you'd update the markdown content
      return prev + `\n\n*[Image replaced: ${newImage.alt}]*`;
    });
  };

  const handleImageRemove = (imageId: string) => {
    removeImage(imageId);
    
    // Update blog content to reflect the change
    setBlogContent(prev => {
      return prev + `\n\n*[Image removed]*`;
    });
  };

  const embedImagesInContent = (content: string, images: ImageData[]): string => {
    let embeddedContent = content;
    
    // Simple embedding - in a real app, you'd parse markdown and insert images at section breaks
    images.forEach((image, index) => {
      const imageMarkdown = `\n\n![${image.alt}](${image.url})\n\n*Photo by [${image.photographer}](https://unsplash.com/@${image.photographerUsername}) on [Unsplash](https://unsplash.com)*\n\n`;
      
      // Insert after each section heading
      const sections = embeddedContent.split('\n## ');
      if (sections.length > index + 1) {
        sections[index + 1] = imageMarkdown + sections[index + 1];
        embeddedContent = sections.join('\n## ');
      }
    });
    
    return embeddedContent;
  };

  const embeddedContent = embedImagesInContent(blogContent, images);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Image Review System Test</h1>
        <p className="text-gray-600">
          Test the image review and management functionality
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image Management */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Image Management</h2>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => addImage({
                  id: `new-${Date.now()}`,
                  url: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=400',
                  alt: 'New AI Technology',
                  photographer: 'New Photographer',
                  photographerUsername: 'newuser',
                  downloadUrl: 'https://unsplash.com/photos/new',
                  relevanceScore: 8
                })}
              >
                Add Image
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearImages}
              >
                Clear All
              </Button>
            </div>
          </div>
          
          <ImageReviewGallery
            currentImages={images}
            onImageReplace={handleImageReplace}
            onImageRemove={handleImageRemove}
            onSearchImages={handleSearchImages}
          />
          
          <div className="text-sm text-gray-500">
            <p><strong>Current Images:</strong> {images.length}</p>
            <p><strong>Total Relevance Score:</strong> {images.reduce((sum, img) => sum + (img.relevanceScore || 0), 0)}</p>
          </div>
        </div>

        {/* Blog Preview */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Blog Preview with Images</h2>
          
          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="markdown">Markdown</TabsTrigger>
            </TabsList>
            
            <TabsContent value="preview" className="border rounded-lg p-4 max-h-96 overflow-y-auto">
              <MarkdownPreview content={embeddedContent} />
            </TabsContent>
            
            <TabsContent value="markdown" className="border rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap">{embeddedContent}</pre>
            </TabsContent>
          </Tabs>
          
          <div className="text-sm text-gray-500">
            <p><strong>Word Count:</strong> {embeddedContent.split(/\s+/).filter(word => word.length > 0).length}</p>
            <p><strong>Images Embedded:</strong> {images.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

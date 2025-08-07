'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface ImageData {
  id: string;
  url: string;
  alt: string;
  photographer: string;
  photographerUsername: string;
  downloadUrl: string;
  relevanceScore?: number;
}

interface ImageReviewGalleryProps {
  currentImages: ImageData[];
  onImageReplace: (oldImageId: string, newImage: ImageData) => void;
  onImageRemove: (imageId: string) => void;
  onSearchImages: (query: string) => Promise<ImageData[]>;
}

export default function ImageReviewGallery({
  currentImages,
  onImageReplace,
  onImageRemove,
  onSearchImages
}: ImageReviewGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ImageData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await onSearchImages(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to search images:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleReplaceImage = (newImage: ImageData) => {
    if (selectedImageId) {
      onImageReplace(selectedImageId, newImage);
      setSelectedImageId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          Review Images ({currentImages.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Image Review & Management</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Images */}
          <div>
            <h3 className="font-medium mb-4">Current Images</h3>
            <div className="space-y-4">
              {currentImages.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No images in this blog post yet.
                </p>
              ) : (
                currentImages.map((image, index) => (
                  <div key={image.id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <img
                        src={image.url}
                        alt={image.alt}
                        className="w-24 h-24 object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{image.alt}</p>
                        <p className="text-xs text-gray-500">By {image.photographer}</p>
                        <p className="text-xs text-gray-400">Section {index + 1}</p>
                        {image.relevanceScore && (
                          <Badge variant="secondary" className="mt-1">
                            Score: {image.relevanceScore}/10
                          </Badge>
                        )}
                        <div className="flex gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedImageId(image.id)}
                          >
                            Replace
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => onImageRemove(image.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Search & Replace */}
          <div>
            <h3 className="font-medium mb-4">Search New Images</h3>
            
            {selectedImageId && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Select a new image to replace the current one
                </p>
              </div>
            )}

            <div className="flex gap-2 mb-4">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for images..."
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {searchResults.map((image) => (
                  <div key={image.id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <img
                        src={image.url}
                        alt={image.alt}
                        className="w-24 h-24 object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{image.alt}</p>
                        <p className="text-xs text-gray-500">By {image.photographer}</p>
                        {image.relevanceScore && (
                          <Badge variant="secondary" className="mt-1">
                            Score: {image.relevanceScore}/10
                          </Badge>
                        )}
                        {selectedImageId && (
                          <Button
                            size="sm"
                            className="mt-2"
                            onClick={() => handleReplaceImage(image)}
                          >
                            Use This Image
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searchQuery && searchResults.length === 0 && !isSearching && (
              <p className="text-gray-500 text-center py-4">
                No images found for "{searchQuery}"
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

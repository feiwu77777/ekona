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
  allAvailableImages?: ImageData[]; // All images found during generation
  onImageReplace: (oldImageId: string, newImage: ImageData) => void;
  onImageRemove: (imageId: string) => void;
  onSearchImages: (query: string) => Promise<ImageData[]>;
}

export default function ImageReviewGallery({
  currentImages,
  allAvailableImages = [],
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
      <DialogContent className="max-w-[95vw] w-[95vw] max-h-[90vh] sm:max-w-6xl lg:max-w-6xl xl:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Image Review & Management</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col h-full overflow-hidden">
          {/* Current Images Section */}
          <div className="flex-1 overflow-y-auto">
            <h3 className="font-medium mb-4 text-lg sticky top-0 bg-background z-10 py-2">Current Images</h3>
            {currentImages.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No images in this blog post yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                {currentImages.map((image, index) => (
                  <div key={image.id} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex flex-col">
                      <img
                        src={image.url}
                        alt={image.alt}
                        className="w-full h-40 object-cover rounded-lg shadow-sm mb-3"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm mb-1 line-clamp-2">{image.alt}</p>
                        <p className="text-xs text-gray-500 mb-1">By {image.photographer}</p>
                        <p className="text-xs text-gray-400 mb-3">Section {index + 1}</p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedImageId(image.id)}
                            className="flex-1"
                          >
                            Replace
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => onImageRemove(image.id)}
                            className="flex-1"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All Available Images Section */}
          {allAvailableImages.length > 0 && (
            <>
              <div className="border-t my-6"></div>
              <div className="flex-1 overflow-y-auto">
                <h3 className="font-medium mb-4 text-lg sticky top-0 bg-background z-10 py-2">All Available Images</h3>
                <p className="text-sm text-gray-600 mb-4">
                  These are all the images found during blog generation. Click to add any to your blog post.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                  {allAvailableImages.map((image, index) => (
                    <div key={`available-${image.id}`} className="border rounded-lg p-3 bg-blue-50">
                      <div className="flex flex-col">
                        <img
                          src={image.url}
                          alt={image.alt}
                          className="w-full h-40 object-cover rounded-lg shadow-sm mb-3"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm mb-1 line-clamp-2">{image.alt}</p>
                          <p className="text-xs text-gray-500 mb-3">By {image.photographer}</p>
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              // Add this image to current images
                              const newImage = { ...image, id: `added-${Date.now()}-${image.id}` };
                              onImageReplace('', newImage); // Empty string means add new
                            }}
                          >
                            Add to Blog
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Divider */}
          <div className="border-t my-6"></div>

          {/* Search & Replace Section */}
          <div className="flex-1 overflow-y-auto">
            <h3 className="font-medium mb-4 text-lg sticky top-0 bg-background z-10 py-2">Search New Images</h3>
            
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
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>

            <div className="pb-4">
              {searchResults.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {searchResults.map((image) => (
                    <div key={image.id} className="border rounded-lg p-3 bg-white">
                      <div className="flex flex-col">
                        <img
                          src={image.url}
                          alt={image.alt}
                          className="w-full h-40 object-cover rounded-lg shadow-sm mb-3"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm mb-1 line-clamp-2">{image.alt}</p>
                          <p className="text-xs text-gray-500 mb-3">By {image.photographer}</p>
                          {selectedImageId && (
                            <Button
                              size="sm"
                              onClick={() => handleReplaceImage(image)}
                              className="w-full"
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
                <p className="text-gray-500 text-center py-8">
                  No images found for "{searchQuery}"
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

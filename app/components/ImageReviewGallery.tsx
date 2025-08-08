"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface ImageData {
  id: string;
  url: string;
  alt: string;
  photographer: string;
  photographerUsername: string;
  downloadUrl: string;
  relevanceScore?: number;
}

interface PendingChange {
  type: "replace" | "remove" | "add";
  imageId: string;
  newImage?: ImageData;
  originalImage?: ImageData;
}

interface ImageReviewGalleryProps {
  currentImages: ImageData[];
  allAvailableImages?: ImageData[]; // All images found during generation
  onImageReplace: (oldImageId: string, newImage: ImageData) => void;
  onImageRemove: (imageId: string) => void;
  onSearchImages: (query: string) => Promise<ImageData[]>;
  removedImages?: string[]; // Track which images have been removed
}

export default function ImageReviewGallery({
  currentImages,
  allAvailableImages = [],
  onImageReplace,
  onImageRemove,
  onSearchImages,
  removedImages = [],
}: ImageReviewGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ImageData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  // Refs for scrolling
  const allAvailableImagesRef = useRef<HTMLDivElement>(null);
  const searchSectionRef = useRef<HTMLDivElement>(null);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      // Don't reset pendingChanges when closing - keep them for the confirmation system
      setSelectedImageId(null);
      setSearchQuery("");
      setSearchResults([]);
    }
  }, [isOpen]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await onSearchImages(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error("Failed to search images:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleReplaceImage = (newImage: ImageData) => {
    if (selectedImageId) {
      // Check if this is replacing an image in a section by index
      if (selectedImageId.startsWith("index-")) {
        const imageIndex = parseInt(selectedImageId.split("-")[1]);
        setPendingChanges((prev) => [
          ...prev,
          {
            type: "replace",
            imageId: `index-${imageIndex}`,
            newImage,
          },
        ]);
      } else {
        // Legacy: Normal replace operation by ID (fallback)
        const originalImage = currentImages.find(
          (img) => img.id === selectedImageId
        );
        if (originalImage) {
          setPendingChanges((prev) => [
            ...prev,
            {
              type: "replace",
              imageId: selectedImageId,
              newImage,
              originalImage,
            },
          ]);
        }
      }
      setSelectedImageId(null); // Reset selection after adding to pending changes
      scrollToTop(); // Scroll back to top
    }
  };

  const handleRemoveImage = (imageId: string) => {
    const originalImage = currentImages.find((img) => img.id === imageId);
    if (originalImage) {
      setPendingChanges((prev) => [
        ...prev,
        {
          type: "remove",
          imageId,
          originalImage,
        },
      ]);
    }
  };



  const applyChanges = () => {
    pendingChanges.forEach((change) => {
      switch (change.type) {
        case "replace":
          if (change.newImage) {
            // Check if this is replacing by index
            if (change.imageId.startsWith("index-")) {
              // Extract image index and pass it
              const imageIndex = parseInt(change.imageId.split("-")[1]);
              onImageReplace(imageIndex.toString(), change.newImage);
            } else {
              // Legacy: Normal replace operation - find index by ID
              const imageIndex = currentImages.findIndex(img => img.id === change.imageId);
              if (imageIndex !== -1) {
                onImageReplace(imageIndex.toString(), change.newImage);
              }
            }
          }
          break;
        case "remove":
          onImageRemove(change.imageId);
          break;

      }
    });
    setPendingChanges([]);
    setIsOpen(false);
    setShowDiscardDialog(false);
  };

  const discardChanges = () => {
    setPendingChanges([]);
    setSelectedImageId(null);
    setShowDiscardDialog(false);
    setIsOpen(false);
  };

  const getPendingChangesText = () => {
    const replaceCount = pendingChanges.filter(
      (c) => c.type === "replace"
    ).length;
    const removeCount = pendingChanges.filter(
      (c) => c.type === "remove"
    ).length;

    const parts = [];
    if (replaceCount > 0)
      parts.push(`${replaceCount} replace${replaceCount > 1 ? "s" : ""}`);
    if (removeCount > 0)
      parts.push(`${removeCount} remove${removeCount > 1 ? "s" : ""}`);

    return parts.join(", ");
  };

  const handleClose = (open: boolean) => {
    if (!open && pendingChanges.length > 0) {
      // User is trying to close the dialog with pending changes
      setShowDiscardDialog(true);
    } else {
      // Normal open/close behavior
      setIsOpen(open);
    }
  };

  const handleImageSelection = (imageId: string) => {
    setSelectedImageId(imageId);
    
    // Scroll to appropriate section after a short delay to ensure DOM is updated
    setTimeout(() => {
      if (allAvailableImagesRef.current) {
        allAvailableImagesRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);
  };

  const scrollToTop = () => {
    const dialogContent = document.querySelector('[role="dialog"]');
    if (dialogContent) {
      dialogContent.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogTrigger asChild>
          <Button variant="outline">
            Review Images ({currentImages.length})
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] max-h-[90vh] sm:max-w-6xl lg:max-w-6xl xl:max-w-6xl flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle>Image Review & Management</DialogTitle>
              {pendingChanges.length > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {getPendingChangesText()} pending
                  </Badge>
                  <Button
                    size="sm"
                    onClick={applyChanges}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Apply Changes
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPendingChanges([])}
                  >
                    Discard
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Current Images Section */}
            <div className="mb-6">
              <h3 className="font-medium mb-4 text-lg sticky top-0 bg-background z-10 py-2">
                Current Images ({currentImages.length} sections)
              </h3>
              {currentImages.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No images in this blog post yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                  {currentImages.map((image, index) => {
                    const isPendingRemove = pendingChanges.some(
                      (c) => c.type === "remove" && c.imageId === image.id
                    );
                    const isPermanentlyRemoved = removedImages.includes(
                      image.id
                    );
                    const pendingReplace = pendingChanges.find(
                      (c) => c.type === "replace" && c.imageId === image.id
                    );
                    const pendingIndexReplace = pendingChanges.find(
                      (c) => c.type === "replace" && c.imageId === `index-${index}`
                    );
                    const isRemoved = isPendingRemove || isPermanentlyRemoved;

                    return (
                      <div
                        key={`section-${index + 1}`}
                        className={`border rounded-lg p-3 ${
                          isRemoved ? "bg-red-50 border-red-200" : "bg-gray-50"
                        } ${
                          selectedImageId === image.id || selectedImageId === `index-${index}`
                            ? "border-4 border-blue-500 shadow-lg"
                            : "border"
                        }`}
                      >
                        <div className="flex flex-col">
                          {isRemoved && !pendingIndexReplace ? (
                            <div className="w-full h-40 bg-gray-200 rounded-lg flex items-center justify-center mb-3">
                              <p className="text-gray-500 text-sm">
                                {isPermanentlyRemoved
                                  ? "Image Removed"
                                  : "Pending Remove"}
                              </p>
                            </div>
                          ) : (
                            <img
                              src={pendingIndexReplace?.newImage?.url || pendingReplace?.newImage?.url || image.url}
                              alt={pendingIndexReplace?.newImage?.alt || pendingReplace?.newImage?.alt || image.alt}
                              className="w-full h-40 object-cover rounded-lg shadow-sm mb-3"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-sm mb-1 line-clamp-2">
                              {isRemoved && !pendingIndexReplace
                                ? "No Image"
                                : pendingIndexReplace?.newImage?.alt || pendingReplace?.newImage?.alt || image.alt}
                            </p>
                            <p className="text-xs text-gray-500 mb-1">
                              {isRemoved && !pendingIndexReplace
                                ? "Section placeholder"
                                : `By ${
                                    pendingIndexReplace?.newImage?.photographer ||
                                    pendingReplace?.newImage?.photographer ||
                                    image.photographer
                                  }`}
                            </p>
                            <p className="text-xs text-gray-400 mb-3">
                              Section {index + 1}
                            </p>
                            {isRemoved && !pendingIndexReplace ? (
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    handleImageSelection(`index-${index}`);
                                    setSearchQuery(""); // Clear search query for user input
                                    setSearchResults([]); // Clear previous results
                                  }}
                                  className="flex-1"
                                >
                                  Add Image
                                </Button>
                              </div>
                            ) : pendingIndexReplace ? (
                              <div className="flex flex-col gap-2">
                                <Badge
                                  variant="default"
                                  className="w-full justify-center bg-green-600"
                                >
                                  Pending Replace
                                </Badge>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    // Remove only this specific pending change
                                    setPendingChanges(prev => 
                                      prev.filter(change => change.imageId !== `index-${index}`)
                                    );
                                  }}
                                  className="text-xs"
                                >
                                  Discard
                                </Button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleImageSelection(`index-${index}`)}
                                  className="flex-1"
                                >
                                  Replace
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleRemoveImage(image.id)}
                                  className="flex-1"
                                >
                                  Remove
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* All Available Images Section */}
            {allAvailableImages.length > 0 && (
              <div ref={allAvailableImagesRef} className="mb-6">
                <div className="border-t my-6"></div>
                <h3 className="font-medium mb-4 text-lg sticky top-0 bg-background z-10 py-2">
                  All Available Images ({allAvailableImages.length})
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  These are all the images found during blog generation. Click
                  to add any to your blog post.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                  {allAvailableImages.map((image, index) => {


                    return (
                      <div
                        key={`available-${image.id}`}
                        className="border rounded-lg p-3 bg-blue-50"
                      >
                        <div className="flex flex-col">
                          <img
                            src={image.url}
                            alt={image.alt}
                            className="w-full h-40 object-cover rounded-lg shadow-sm mb-3"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm mb-1 line-clamp-2">
                              {image.alt}
                            </p>
                            <p className="text-xs text-gray-500 mb-3">
                              By {image.photographer}
                            </p>

                                                          <Button
                              size="sm"
                              className={`w-full ${selectedImageId ? "bg-green-600 hover:bg-green-700" : ""}`}
                              onClick={() => handleReplaceImage(image)}
                            >
                              {selectedImageId ? "Select" : "Replace"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Search & Replace Section */}
            <div className="mb-6">
              <div className="border-t my-6"></div>
              <h3 className="font-medium mb-4 text-lg sticky top-0 bg-background z-10 py-2">
                Search Additional Images
              </h3>

              <div className="flex gap-2 mb-4">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for images..."
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? "Searching..." : "Search"}
                </Button>
              </div>

              <div className="pb-4">
                {searchResults.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {searchResults.map((image) => (
                      <div
                        key={image.id}
                        className="border rounded-lg p-3 bg-white"
                      >
                        <div className="flex flex-col">
                          <img
                            src={image.url}
                            alt={image.alt}
                            className="w-full h-40 object-cover rounded-lg shadow-sm mb-3"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm mb-1 line-clamp-2">
                              {image.alt}
                            </p>
                            <p className="text-xs text-gray-500 mb-3">
                              By {image.photographer}
                            </p>
                            {selectedImageId && (
                              <Button
                                size="sm"
                                onClick={() => handleReplaceImage(image)}
                                className="w-full bg-blue-600 hover:bg-blue-700"
                              >
                                Select
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

      {/* Discard Changes Confirmation Dialog */}
      <Dialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              You have {getPendingChangesText()} that haven't been applied. Do
              you want to save these changes or discard them?
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={discardChanges}>
              Discard Changes
            </Button>
            <Button onClick={applyChanges}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

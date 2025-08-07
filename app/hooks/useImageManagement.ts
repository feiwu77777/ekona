import { useState } from 'react';

interface ImageData {
  id: string;
  url: string;
  alt: string;
  photographer: string;
  photographerUsername: string;
  downloadUrl: string;
  relevanceScore?: number;
}

export function useImageManagement(initialImages: ImageData[] = []) {
  const [images, setImages] = useState<ImageData[]>(initialImages);

  const addImage = (image: ImageData) => {
    setImages(prev => [...prev, image]);
  };

  const removeImage = (imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  };

  const replaceImage = (oldImageId: string, newImage: ImageData) => {
    setImages(prev => prev.map(img => 
      img.id === oldImageId ? newImage : img
    ));
  };

  const reorderImages = (fromIndex: number, toIndex: number) => {
    setImages(prev => {
      const newImages = [...prev];
      const [movedImage] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, movedImage);
      return newImages;
    });
  };

  const updateImageRelevance = (imageId: string, relevanceScore: number) => {
    setImages(prev => prev.map(img => 
      img.id === imageId ? { ...img, relevanceScore } : img
    ));
  };

  const clearImages = () => {
    setImages([]);
  };

  const getImageById = (imageId: string) => {
    return images.find(img => img.id === imageId);
  };

  const getImagesBySection = (sectionIndex: number) => {
    return images[sectionIndex] || null;
  };

  return {
    images,
    addImage,
    removeImage,
    replaceImage,
    reorderImages,
    updateImageRelevance,
    clearImages,
    getImageById,
    getImagesBySection
  };
}

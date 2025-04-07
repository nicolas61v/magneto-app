// src/hooks/useVisionAI.ts
import { useState } from 'react';
import { extractTextFromImage } from '@/services/visionAI';
import { VisionAIResponse } from '@/types/api';

export const useVisionAI = () => {
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractText = async (imageUrl: string): Promise<VisionAIResponse> => {
    try {
      setIsExtracting(true);
      setError(null);
      const response = await extractTextFromImage(imageUrl);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al extraer el texto';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsExtracting(false);
    }
  };

  return {
    extractText,
    isExtracting,
    error,
  };
};
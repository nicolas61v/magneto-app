// src/hooks/useGeminiAI.ts
import { useState } from 'react';
import { processTextWithGemini } from '@/services/geminiAI';
import { GeminiAIResponse } from '@/types/api';

export const useGeminiAI = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processText = async (text: string): Promise<GeminiAIResponse> => {
    try {
      setIsProcessing(true);
      setError(null);
      const response = await processTextWithGemini(text);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al procesar el texto';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processText,
    isProcessing,
    error,
  };
};
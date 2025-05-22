// src/hooks/useOpenAI.ts
import { useState } from 'react';
import { processTextWithOpenAI } from '@/services/openai';
import { GeminiAIResponse } from '@/types/api';

export const useOpenAI = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processText = async (text: string): Promise<GeminiAIResponse> => {
    try {
      setIsProcessing(true);
      setError(null);
      const response = await processTextWithOpenAI(text);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al procesar el texto con OpenAI';
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
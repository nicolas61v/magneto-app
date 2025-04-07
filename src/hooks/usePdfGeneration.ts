// src/hooks/usePdfGeneration.ts
import { useState } from 'react';
import { generatePdf } from '@/services/pdfService';
import { CVData } from '@/types/cv';

export const usePdfGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateCvPdf = async (cvData: CVData): Promise<string> => {
    try {
      setIsGenerating(true);
      setError(null);
      const pdfUrl = await generatePdf(cvData);
      return pdfUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al generar el PDF';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateCvPdf,
    isGenerating,
    error,
  };
};
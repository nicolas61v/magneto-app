// src/services/openai.ts
import { GeminiAIResponse } from '@/types/api';

export const processTextWithOpenAI = async (text: string): Promise<GeminiAIResponse> => {
  try {
    const response = await fetch('/api/process-cv', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.error || 'Error al procesar texto con OpenAI';
      console.error('API Error:', errorMessage);
      throw new Error(errorMessage);
    }

    return {
      processedData: data.processedData,
    };
  } catch (error) {
    console.error('Error en OpenAI:', error);
    throw error;
  }
};
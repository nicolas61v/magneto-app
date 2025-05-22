// src/services/visionAI.ts
import { VisionAIResponse } from '@/types/api';

export const extractTextFromImage = async (imageUrl: string): Promise<VisionAIResponse> => {
  try {
    const response = await fetch('/api/extract-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al extraer texto');
    }

    return {
      text: data.text || '',
      confidence: data.confidence || 0,
      debugInfo: data.debugInfo
    };
  } catch (error) {
    console.error('Error en Vision AI:', error);
    throw error;
  }
};
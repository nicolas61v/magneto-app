// src/services/visionAI.ts
import { VisionAIResponse } from '@/types/api';

// Esta función sería una llamada a la API de Vision AI de Google
export const extractTextFromImage = async (imageUrl: string): Promise<VisionAIResponse> => {
  try {
    // En un entorno real, necesitarías llamar a la API REST de Google Vision AI
    // o utilizar su SDK de cliente
    const response = await fetch('/api/extract-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl }),
    });

    if (!response.ok) {
      throw new Error('Error al extraer texto');
    }

    const data = await response.json();
    return {
      text: data.text,
      confidence: data.confidence,
    };
  } catch (error) {
    console.error('Error en Vision AI:', error);
    throw error;
  }
};
// src/services/geminiAI.ts
import { GeminiAIResponse } from '@/types/api';

// Esta función sería una llamada a la API de Google AI Studio (Gemini)
export const processTextWithGemini = async (text: string): Promise<GeminiAIResponse> => {
  try {
    // En un entorno real, necesitarías llamar a la API REST de Google AI Studio
    // o utilizar su SDK de cliente
    const response = await fetch('/api/process-cv', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error('Error al procesar texto con IA');
    }

    const data = await response.json();
    return {
      processedData: data.processedData,
    };
  } catch (error) {
    console.error('Error en Gemini AI:', error);
    throw error;
  }
};
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

    const data = await response.json();

    if (!response.ok) {
      // Extract specific error message from the response if available
      const errorMessage = data.error || 'Error al procesar texto con IA';
      console.error('API Error:', errorMessage);
      throw new Error(errorMessage);
    }

    return {
      processedData: data.processedData,
    };
  } catch (error) {
    console.error('Error en Gemini AI:', error);
    throw error;
  }
};
// src/services/visionAI.ts
import { VisionAIResponse } from '@/types/api';

export const extractTextFromImage = async (imageUrl: string): Promise<VisionAIResponse> => {
  try {
    console.log('🔍 Iniciando extracción de texto desde servicio...');
    console.log('📸 URL:', imageUrl);

    const response = await fetch('/api/extract-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl }),
    });

    console.log('📡 Respuesta del servidor:', response.status, response.statusText);

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error del servidor:', data.error);
      throw new Error(data.error || 'Error al extraer texto');
    }

    console.log('✅ Texto extraído exitosamente:');
    console.log('- Longitud:', data.text?.length || 0);
    console.log('- Método:', data.method || 'desconocido');
    console.log('- Líneas extraídas:', data.debugInfo?.linesExtracted || 0);
    console.log('- Tiempo de procesamiento:', data.processingTimeMs || 0, 'ms');

    // Mostrar muestra del texto extraído
    if (data.text && data.text.length > 0) {
      console.log('📝 Muestra del texto extraído:');
      console.log('Primeras 300 caracteres:', data.text.substring(0, 300));
      console.log('Últimas 100 caracteres:', data.text.slice(-100));
    }

    return {
      text: data.text || '',
      confidence: data.confidence || 0,
      debugInfo: data.debugInfo
    };
  } catch (error) {
    console.error('❌ Error en servicio Vision AI:', error);
    throw error;
  }
};
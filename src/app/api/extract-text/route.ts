// src/app/api/extract-text/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ImageAnnotatorClient } from '@google-cloud/vision';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Se requiere URL de imagen para procesar' },
        { status: 400 }
      );
    }

    // Verificar variables de entorno
    if (!process.env.GOOGLE_CLOUD_PROJECT_ID || 
        !process.env.GOOGLE_CLOUD_PRIVATE_KEY || 
        !process.env.GOOGLE_CLOUD_CLIENT_EMAIL) {
      return NextResponse.json(
        { error: 'Google Vision AI no está configurado correctamente' },
        { status: 500 }
      );
    }

    // Configurar cliente de Google Vision AI
    const client = new ImageAnnotatorClient({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      credentials: {
        client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
    });

    console.log('Procesando imagen con Google Vision AI:', imageUrl);

    // Usar DOCUMENT_TEXT_DETECTION en lugar de textDetection para mejor OCR
    const [result] = await client.documentTextDetection({ 
      image: { 
        source: { 
          imageUri: imageUrl 
        } 
      } 
    });

    // También hacer detección de texto normal como respaldo
    const [textResult] = await client.textDetection({ 
      image: { 
        source: { 
          imageUri: imageUrl 
        } 
      } 
    });

    let extractedText = '';

    // Priorizar documentTextDetection para CVs
    if (result.fullTextAnnotation && result.fullTextAnnotation.text) {
      extractedText = result.fullTextAnnotation.text;
      console.log('Usando DOCUMENT_TEXT_DETECTION');
    } 
    // Usar textDetection como fallback
    else if (textResult.textAnnotations && textResult.textAnnotations.length > 0) {
      extractedText = textResult.textAnnotations[0]?.description || '';
      console.log('Usando TEXT_DETECTION como fallback');
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { error: 'No se pudo extraer texto de la imagen. Verifica que la imagen tenga texto legible.' },
        { status: 404 }
      );
    }

    console.log('Texto extraído exitosamente:');
    console.log('Longitud:', extractedText.length);
    console.log('Primeras 200 caracteres:', extractedText.substring(0, 200));

    // Limpiar y formatear el texto extraído
    const cleanedText = extractedText
      .replace(/\n{3,}/g, '\n\n') // Reducir múltiples saltos de línea
      .replace(/\s{3,}/g, ' ')    // Reducir múltiples espacios
      .trim();

    return NextResponse.json({
      text: cleanedText,
      confidence: 0.95,
      method: result.fullTextAnnotation ? 'document_detection' : 'text_detection',
      originalLength: extractedText.length,
      cleanedLength: cleanedText.length
    });

  } catch (error) {
    console.error('Error en Google Vision AI:', error);
    
    // Manejo específico de errores de Google Cloud
    if (error instanceof Error) {
      if (error.message.includes('credentials')) {
        return NextResponse.json(
          { error: 'Error de autenticación con Google Cloud. Verifica las credenciales.' },
          { status: 401 }
        );
      }
      
      if (error.message.includes('permission')) {
        return NextResponse.json(
          { error: 'Sin permisos para acceder a Google Vision AI. Verifica la configuración del service account.' },
          { status: 403 }
        );
      }
      
      if (error.message.includes('quota')) {
        return NextResponse.json(
          { error: 'Límite de API excedido en Google Vision AI.' },
          { status: 429 }
        );
      }
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido en Google Vision AI' },
      { status: 500 }
    );
  }
}
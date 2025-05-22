// src/app/api/extract-text/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ImageAnnotatorClient } from '@google-cloud/vision';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Se requiere URL de imagen' },
        { status: 400 }
      );
    }

    // Verificar variables de entorno
    if (!process.env.GOOGLE_CLOUD_PROJECT_ID || 
        !process.env.GOOGLE_CLOUD_PRIVATE_KEY || 
        !process.env.GOOGLE_CLOUD_CLIENT_EMAIL) {
      return NextResponse.json(
        { error: 'Google Vision AI no está configurado' },
        { status: 500 }
      );
    }

    // Configurar cliente
    const client = new ImageAnnotatorClient({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      credentials: {
        client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
    });

    // USAR SOLO LA ESTRATEGIA MÁS EFECTIVA: DOCUMENT_TEXT_DETECTION
    const [result] = await client.documentTextDetection({
      image: {
        source: { imageUri: imageUrl }
      },
      imageContext: {
        languageHints: ['es', 'en']
      }
    });
    
    let extractedText = '';
    
    if (result.fullTextAnnotation?.text) {
      extractedText = result.fullTextAnnotation.text;
    } else if (result.textAnnotations?.[0]?.description) {
      extractedText = result.textAnnotations[0].description;
    }

    // Validación simple
    if (!extractedText || extractedText.trim().length < 50) {
      return NextResponse.json(
        { error: 'No se pudo extraer texto suficiente de la imagen' },
        { status: 404 }
      );
    }

    // Limpieza básica del texto
    const cleanedText = extractedText
      .replace(/\n{3,}/g, '\n\n')
      .replace(/ {2,}/g, ' ')
      .trim();

    return NextResponse.json({
      text: cleanedText,
      method: 'document_detection'
    });

  } catch (error) {
    console.error('Error en Vision AI:', error);
    return NextResponse.json(
      { error: 'Error procesando imagen' },
      { status: 500 }
    );
  }
}
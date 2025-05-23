// src/app/api/process-step1-extract/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { firestoreService } from '@/services/firestore';

export async function POST(request: NextRequest) {
  try {
    const { cvId, imageUrl, pageNumber, totalPages } = await request.json();
    
    console.log(`=== EXTRAYENDO TEXTO - Página ${pageNumber} de ${totalPages} ===`);
    
    if (!cvId || !imageUrl) {
      return NextResponse.json(
        { error: 'Datos inválidos' },
        { status: 400 }
      );
    }
    
    // Verificar configuración
    if (!process.env.GOOGLE_CLOUD_PROJECT_ID || 
        !process.env.GOOGLE_CLOUD_CLIENT_EMAIL || 
        !process.env.GOOGLE_CLOUD_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Vision AI no configurado' },
        { status: 500 }
      );
    }
    
    // Configurar Vision AI
    const visionClient = new ImageAnnotatorClient({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      credentials: {
        client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
    });
    
    // Extraer texto de esta imagen
    const [result] = await visionClient.documentTextDetection({
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
    
    console.log(`Texto extraído: ${extractedText.length} caracteres`);
    
    // Calcular progreso
    const progress = (pageNumber / totalPages) * 50; // 50% para extracción
    
    // Actualizar en Firestore
    await firestoreService.updateCV(cvId, {
      extractionProgress: progress,
      status: 'extracting'
    });
    
    return NextResponse.json({
      success: true,
      extractedText,
      progress
    });
    
  } catch (error) {
    console.error('Error en extracción:', error);
    return NextResponse.json(
      { error: 'Error extrayendo texto' },
      { status: 500 }
    );
  }
}
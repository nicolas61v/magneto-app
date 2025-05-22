// src/app/api/process-async/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import OpenAI from 'openai';
import { firestoreService } from '@/services/firestore';

// Cliente de OpenAI global
const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { cvId, imageUrls } = await request.json();
    
    if (!cvId || !imageUrls || !Array.isArray(imageUrls)) {
      return NextResponse.json(
        { error: 'Datos inválidos' },
        { status: 400 }
      );
    }
    
    // Iniciar procesamiento en background
    processAsync(cvId, imageUrls);
    
    // Responder inmediatamente para evitar timeout
    return NextResponse.json({
      success: true,
      message: 'Procesamiento iniciado',
      cvId
    });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error iniciando procesamiento' },
      { status: 500 }
    );
  }
}

// Función asíncrona que se ejecuta en background
async function processAsync(cvId: string, imageUrls: string[]) {
  try {
    // FASE 1: Extracción de texto con Vision AI
    let allExtractedText = '';
    const totalImages = imageUrls.length;
    
    // Configurar cliente de Vision AI
    const visionClient = new ImageAnnotatorClient({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      credentials: {
        client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
    });
    
    for (let i = 0; i < imageUrls.length; i++) {
      try {
        // Actualizar progreso
        const progress = ((i + 1) / totalImages) * 50; // 50% para extracción
        await firestoreService.updateCV(cvId, {
          extractionProgress: progress,
          status: 'extracting'
        });
        
        // Extraer texto con Vision AI
        const [result] = await visionClient.documentTextDetection({
          image: {
            source: { imageUri: imageUrls[i] }
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
        
        if (extractedText && extractedText.trim().length > 0) {
          if (allExtractedText.length > 0) {
            allExtractedText += '\n\n--- PÁGINA ' + (i + 1) + ' ---\n\n';
          }
          allExtractedText += extractedText;
        }
        
      } catch (err) {
        console.error(`Error procesando imagen ${i + 1}:`, err);
      }
    }
    
    // Validar texto extraído
    if (!allExtractedText || allExtractedText.trim().length < 50) {
      throw new Error('No se pudo extraer texto suficiente de las imágenes');
    }
    
    // Actualizar con texto extraído
    await firestoreService.updateExtractedText(cvId, allExtractedText);
    await firestoreService.updateCV(cvId, {
      extractionProgress: 50,
      status: 'processing'
    });
    
    // FASE 2: Procesamiento con OpenAI
    const systemPrompt = `Eres un experto en análisis de CVs. Tu tarea es extraer información de un CV que puede estar en múltiples páginas.

IMPORTANTE:
- El texto puede contener marcadores como "--- PÁGINA X ---" separando diferentes páginas
- Elimina información duplicada (a veces la misma info aparece en varias páginas)
- Combina información relacionada de diferentes páginas
- Si encuentras la misma experiencia laboral o educación en múltiples páginas, fusiónalas en una sola entrada

Devuelve SOLO un JSON válido con esta estructura exacta:
{
  "personalInfo": {"name": "", "email": "", "phone": "", "location": ""},
  "summary": "",
  "experience": [{"company": "", "position": "", "startDate": "", "endDate": "", "description": ""}],
  "education": [{"institution": "", "degree": "", "startDate": "", "endDate": ""}],
  "skills": [],
  "languages": [{"name": "", "level": ""}]
}`;

    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        {
          role: "system", 
          content: systemPrompt
        },
        {
          role: "user",
          content: `Analiza el siguiente CV y extrae la información estructurada. Recuerda eliminar duplicados si el mismo contenido aparece en múltiples páginas:\n\n${allExtractedText}`
        }
      ],
      temperature: 0,
      max_tokens: 2500
    });

    const responseText = completion.choices[0]?.message?.content;
    
    if (!responseText) {
      throw new Error('Sin respuesta de OpenAI');
    }

    // Parsear respuesta
    const processedData = JSON.parse(responseText.trim());
    
    // Actualizar con datos procesados
    await firestoreService.updateProcessedData(cvId, processedData);
    await firestoreService.updateCV(cvId, {
      extractionProgress: 100,
      status: 'completed'
    });
    
  } catch (error) {
    console.error('Error en procesamiento asíncrono:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error en procesamiento';
    await firestoreService.markAsError(cvId, errorMessage);
  }
}
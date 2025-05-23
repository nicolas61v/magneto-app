// src/app/api/process-step2-analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { firestoreService } from '@/services/firestore';

const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { cvId, allExtractedText } = await request.json();
    
    console.log('=== ANALIZANDO CON OPENAI ===');
    console.log('Texto total:', allExtractedText.length, 'caracteres');
    
    if (!cvId || !allExtractedText || allExtractedText.trim().length < 50) {
      return NextResponse.json(
        { error: 'Texto insuficiente para procesar' },
        { status: 400 }
      );
    }
    
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI no configurado' },
        { status: 500 }
      );
    }
    
    // Actualizar estado
    await firestoreService.updateCV(cvId, {
      extractionProgress: 75,
      status: 'processing',
      extractedText: allExtractedText
    });
    
    // Procesar con OpenAI
    const systemPrompt = `Eres un experto en análisis de CVs. Tu tarea es extraer información de un CV que puede estar en múltiples páginas.

IMPORTANTE:
- El texto puede contener marcadores como "--- PÁGINA X ---" separando diferentes páginas
- Elimina información duplicada
- Combina información relacionada de diferentes páginas

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
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analiza el siguiente CV:\n\n${allExtractedText}` }
      ],
      temperature: 0,
      max_tokens: 2500
    });

    const responseText = completion.choices[0]?.message?.content;
    
    if (!responseText) {
      throw new Error('Sin respuesta de OpenAI');
    }

    const processedData = JSON.parse(responseText.trim());
    
    // Actualizar con datos procesados
    await firestoreService.updateProcessedData(cvId, processedData);
    await firestoreService.updateCV(cvId, {
      extractionProgress: 100,
      status: 'completed'
    });
    
    console.log('=== PROCESO COMPLETADO ===');
    
    return NextResponse.json({
      success: true,
      processedData
    });
    
  } catch (error) {
    console.error('Error en análisis:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error en procesamiento';
    let cvId: string | undefined;
    
    if (request.body) {
      const body = await request.json();
      cvId = body.cvId;
    }
    
    // Marcar como error en Firestore
    if (cvId) {
      await firestoreService.markAsError(cvId, errorMessage);
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
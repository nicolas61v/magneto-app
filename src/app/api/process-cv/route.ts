// src/app/api/process-cv/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Inicializar cliente globalmente para reutilizar conexión
const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    
    if (!text || text.length < 50) {
      return NextResponse.json(
        { error: 'Texto insuficiente para procesar' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI no está configurado' },
        { status: 500 }
      );
    }

    // Prompt mejorado para manejar múltiples páginas y evitar duplicados
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
          content: `Analiza el siguiente CV y extrae la información estructurada. Recuerda eliminar duplicados si el mismo contenido aparece en múltiples páginas:\n\n${text}`
        }
      ],
      temperature: 0,
      max_tokens: 2500
    });

    const responseText = completion.choices[0]?.message?.content;
    
    if (!responseText) {
      throw new Error('Sin respuesta de OpenAI');
    }

    // Parsear directamente
    const processedData = JSON.parse(responseText.trim());
    
    // Validación básica
    if (!processedData.personalInfo) {
      throw new Error('Estructura inválida');
    }

    return NextResponse.json({ processedData });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error procesando CV' },
      { status: 500 }
    );
  }
}
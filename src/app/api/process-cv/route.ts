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
    
    if (!text || text.length < 10) {
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

    // Prompt simplificado y directo
    const systemPrompt = `Extrae información de CV y devuelve SOLO JSON válido con esta estructura exacta:
{
  "personalInfo": {"name": "", "email": "", "phone": "", "location": ""},
  "summary": "",
  "experience": [{"company": "", "position": "", "startDate": "", "endDate": "", "description": ""}],
  "education": [{"institution": "", "degree": "", "startDate": "", "endDate": ""}],
  "skills": [],
  "languages": [{"name": "", "level": ""}]
}`;

    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4.1-nano", // Modelo más rápido
      messages: [
        {
          role: "system", 
          content: systemPrompt
        },
        {
          role: "user",
          content: `CV:\n${text}`
        }
      ],
      temperature: 0,
      max_tokens: 3500 // Reducido para respuesta más rápida
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
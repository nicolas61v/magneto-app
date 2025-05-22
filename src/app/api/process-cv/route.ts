// src/app/api/process-cv/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

console.log('Cargando API process-cv...'); // Debug

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Se requiere texto para procesar' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI no está configurado. Por favor configura la variable de entorno OPENAI_API_KEY.' },
        { status: 500 }
      );
    }

    // Prompt para estructurar la información del CV
    const prompt = `
Analiza el siguiente texto extraído de un CV y organiza la información en un formato JSON estructurado.

IMPORTANTE: Responde ÚNICAMENTE con el objeto JSON válido, sin texto adicional, sin markdown, sin explicaciones.

El JSON debe tener esta estructura exacta:
{
  "personalInfo": {
    "name": "string",
    "email": "string", 
    "phone": "string o null",
    "location": "string o null"
  },
  "summary": "string - resumen profesional",
  "experience": [
    {
      "company": "string",
      "position": "string", 
      "startDate": "string o null",
      "endDate": "string o null",
      "description": "string"
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "startDate": "string o null", 
      "endDate": "string o null"
    }
  ],
  "skills": ["array de strings"],
  "languages": [
    {
      "name": "string",
      "level": "string"
    }
  ]
}

Texto del CV:
${text}

Responde únicamente con el JSON:`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system", 
          content: "Eres un experto en análisis de currículums. Extrae y estructura la información de manera precisa. Responde únicamente con JSON válido."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 2000
    });

    const responseText = completion.choices[0]?.message?.content;
    
    if (!responseText) {
      return NextResponse.json(
        { error: 'No se pudo procesar el texto con OpenAI' },
        { status: 500 }
      );
    }

    try {
      // Intentar parsear la respuesta como JSON
      const processedData = JSON.parse(responseText.trim());
      
      // Validar que tenga la estructura básica esperada
      if (!processedData.personalInfo || !processedData.experience || !processedData.education) {
        throw new Error('Estructura de datos inválida');
      }

      return NextResponse.json({ processedData });
    } catch (parseError) {
      console.error('Error parseando respuesta de OpenAI:', parseError);
      console.error('Respuesta recibida:', responseText);
      
      return NextResponse.json(
        { error: 'Error al procesar la respuesta de OpenAI. El formato no es válido.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error procesando el CV con OpenAI:', error);
    
    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { error: 'Error de autenticación con OpenAI. Verifica tu API key.' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido procesando con OpenAI' },
      { status: 500 }
    );
  }
}
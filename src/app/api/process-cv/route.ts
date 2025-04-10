//src/app/api/process-cv/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CVData } from '@/types/cv';

// Inicializar el cliente de Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_STUDIO_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Se requiere texto para procesar' },
        { status: 400 }
      );
    }

    // Modelo a utilizar (Gemini)
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Prompt para la extracción de información del CV
    const prompt = `
      Actúa como un asistente de RRHH experto en análisis de currículums.
      Analiza el siguiente texto extraído de un CV y estructúralo en formato JSON.
      Extrae la siguiente información:
      - Información personal (nombre, email, teléfono, ubicación)
      - Resumen profesional
      - Experiencia laboral (empresa, cargo, fechas, descripción)
      - Educación (institución, título, fechas)
      - Habilidades
      - Idiomas

      Devuelve solo el JSON sin explicaciones adicionales. Formato esperado:
      {
        "personalInfo": {
          "name": "",
          "email": "",
          "phone": "",
          "location": ""
        },
        "summary": "",
        "experience": [
          {
            "company": "",
            "position": "",
            "startDate": "",
            "endDate": "",
            "description": ""
          }
        ],
        "education": [
          {
            "institution": "",
            "degree": "",
            "startDate": "",
            "endDate": ""
          }
        ],
        "skills": ["", "", ""],
        "languages": [
          {
            "name": "",
            "level": ""
          }
        ]
      }

      Texto del CV:
      ${text}
    `;

    // Generar respuesta
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    // Extraer el JSON de la respuesta
    let processedData: CVData;
    try {
      // Intentar analizar la respuesta como JSON
      processedData = JSON.parse(responseText);
    } catch {
      // Si falla, intentar extraer la parte JSON de la respuesta
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        processedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No se pudo extraer la información estructurada del CV');
      }
    }

    return NextResponse.json({ processedData });
  } catch (error) {
    console.error('Error procesando el CV:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
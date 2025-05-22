// src/app/api/process-cv/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;
let clientInitialized = false;

export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString();
  console.log(`\n=== [${timestamp}] INICIANDO PROCESAMIENTO CON OPENAI ===`);

  try {
    const { text } = await request.json();
    
    console.log('📝 Texto recibido para procesar:');
    console.log('- Longitud:', text?.length || 0);
    console.log('- Primeras 200 caracteres:', text?.substring(0, 200) || 'NO HAY TEXTO');
    console.log('- Últimas 100 caracteres:', text?.slice(-100) || 'NO HAY TEXTO');

    if (!text) {
      console.log('❌ No se recibió texto para procesar');
      return NextResponse.json(
        { error: 'Se requiere texto para procesar' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      console.log('❌ No hay API key de OpenAI configurada');
      return NextResponse.json(
        { error: 'OpenAI no está configurado. Por favor configura la variable de entorno OPENAI_API_KEY.' },
        { status: 500 }
      );
    }

    // Inicializar cliente OpenAI solo una vez
    if (!clientInitialized || !openaiClient) {
      console.log('🚀 Inicializando cliente de OpenAI...');
      openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      clientInitialized = true;
      console.log('✅ Cliente OpenAI inicializado');
    } else {
      console.log('♻️ Reutilizando cliente OpenAI existente');
    }

    // Prompt mejorado
    const prompt = `
Analiza el siguiente texto extraído de un CV y organiza la información en un formato JSON estructurado.

IMPORTANTE: Responde ÚNICAMENTE con el objeto JSON válido, sin texto adicional, sin markdown, sin explicaciones.

El JSON debe tener esta estructura exacta:
{
  "personalInfo": {
    "name": "string",
    "email": "string o null", 
    "phone": "string o null",
    "location": "string o null"
  },
  "summary": "string - resumen profesional o vacío",
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

Si no encuentras información para alguna sección, usa arrays vacíos [] o strings vacíos "".

Texto del CV:
${text}

Responde únicamente con el JSON:`;

    console.log('🤖 Enviando request a OpenAI...');
    console.log('- Modelo: gpt-3.5-turbo');
    console.log('- Temperature: 0.1');
    console.log('- Max tokens: 2000');

    const startTime = Date.now();
    
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
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

    const endTime = Date.now();
    console.log(`⏱️ Request completado en ${endTime - startTime}ms`);

    const responseText = completion.choices[0]?.message?.content;
    
    console.log('📋 Respuesta de OpenAI:');
    console.log('- Respuesta existe:', !!responseText);
    console.log('- Longitud de respuesta:', responseText?.length || 0);
    console.log('- Tokens usados:', completion.usage?.total_tokens || 'N/A');
    
    if (!responseText) {
      console.log('❌ OpenAI no devolvió contenido');
      return NextResponse.json(
        { error: 'No se pudo procesar el texto con OpenAI' },
        { status: 500 }
      );
    }

    console.log('📄 RESPUESTA COMPLETA DE OPENAI:');
    console.log('----------------------------------------');
    console.log(responseText);
    console.log('----------------------------------------');

    try {
      // Limpiar respuesta y parsear JSON
      const cleanedResponse = responseText.trim();
      console.log('🧹 Parseando JSON...');
      
      const processedData = JSON.parse(cleanedResponse);
      
      console.log('✅ JSON parseado exitosamente');
      console.log('📊 Datos estructurados:');
      console.log('- Nombre:', processedData.personalInfo?.name || 'NO ENCONTRADO');
      console.log('- Email:', processedData.personalInfo?.email || 'NO ENCONTRADO');
      console.log('- Experiencias:', processedData.experience?.length || 0);
      console.log('- Educación:', processedData.education?.length || 0);
      console.log('- Habilidades:', processedData.skills?.length || 0);
      console.log('- Idiomas:', processedData.languages?.length || 0);
      console.log('- Resumen existe:', !!processedData.summary);
      
      // Validar estructura básica
      if (!processedData.personalInfo || !processedData.experience || !processedData.education) {
        console.log('❌ Estructura de datos inválida');
        console.log('- personalInfo existe:', !!processedData.personalInfo);
        console.log('- experience existe:', !!processedData.experience);
        console.log('- education existe:', !!processedData.education);
        throw new Error('Estructura de datos inválida');
      }

      console.log(`✅ [${timestamp}] PROCESAMIENTO COMPLETADO EXITOSAMENTE`);
      
      return NextResponse.json({ 
        processedData,
        debugInfo: {
          responseLength: responseText.length,
          processingTimeMs: endTime - startTime,
          tokensUsed: completion.usage?.total_tokens,
          clientWasInitialized: clientInitialized,
          timestamp
        }
      });
      
    } catch (parseError) {
      console.error('❌ Error parseando respuesta de OpenAI:', parseError);
      console.error('📄 Respuesta que causó error:');
      console.error('----------------------------------------');
      console.error(responseText);
      console.error('----------------------------------------');
      
      return NextResponse.json(
        { 
          error: 'Error al procesar la respuesta de OpenAI. El formato no es válido.',
          debugInfo: {
            originalResponse: responseText,
            parseError: parseError instanceof Error ? parseError.message : 'Error desconocido'
          }
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error(`❌ [${timestamp}] ERROR PROCESANDO CON OPENAI:`, error);
    
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
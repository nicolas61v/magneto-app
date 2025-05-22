// src/app/api/extract-text/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Se requiere URL de imagen para procesar' },
        { status: 400 }
      );
    }

    // Verificar si tenemos las variables de entorno necesarias para Google Vision AI
    if (!process.env.GOOGLE_CLOUD_PROJECT_ID || !process.env.GOOGLE_CLOUD_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Google Vision AI no está configurado. Por favor configura las variables de entorno necesarias.' },
        { status: 500 }
      );
    }

    // TODO: Implementar llamada real a Google Vision AI
    // Importar y usar @google-cloud/vision aquí
    
    // Por ahora retornamos error hasta que se implemente
    return NextResponse.json(
      { error: 'Google Vision AI aún no está implementado. Se requiere implementación real.' },
      { status: 501 }
    );

  } catch (error) {
    console.error('Error procesando la imagen:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
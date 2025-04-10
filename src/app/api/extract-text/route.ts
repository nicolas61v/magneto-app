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

    // En un entorno real, aquí llamaríamos a la API de Google Vision
    // Por ahora, devolvemos un texto de prueba para que la aplicación funcione
    // incluso sin configurar la API de Google Vision
    
    const mockText = `
    Juan Pérez
    Desarrollador Web
    jperez@email.com | +34 612345678 | Madrid, España
    
    PERFIL PROFESIONAL
    Desarrollador web con más de 5 años de experiencia creando aplicaciones web
    modernas y responsivas. Especializado en React, TypeScript y Node.js.
    
    EXPERIENCIA LABORAL
    Desarrollador Frontend Senior
    TechSolutions | Enero 2020 - Presente
    • Desarrollo de aplicaciones web con React y TypeScript
    • Implementación de interfaces de usuario siguiendo principios de diseño UX/UI
    • Trabajo en equipo utilizando metodologías ágiles
    
    Desarrollador Web
    InnovateSoft | Marzo 2018 - Diciembre 2019
    • Mantenimiento y desarrollo de aplicaciones con Angular
    • Integración de APIs REST
    • Optimización de rendimiento
    
    EDUCACIÓN
    Grado en Ingeniería Informática
    Universidad Complutense de Madrid | 2014 - 2018
    
    HABILIDADES
    React, TypeScript, JavaScript, HTML5, CSS3, Node.js, Express, MongoDB, Git
    
    IDIOMAS
    Español (nativo), Inglés (avanzado), Francés (básico)
    `;

    return NextResponse.json({
      text: mockText,
      confidence: 0.95
    });
  } catch (error) {
    console.error('Error procesando la imagen:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
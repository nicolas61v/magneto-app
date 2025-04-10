// src/app/api/process-cv/mock-route.ts
// Renombre este archivo a "route.ts" para utilizarlo como un mock si no tiene una clave de API válida

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Se requiere texto para procesar' },
        { status: 400 }
      );
    }

    // Simula el procesamiento con una respuesta predeterminada
    // En un entorno real, esto utilizaría la API de Google AI Studio

    // Espera un poco para simular el procesamiento
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock de los datos procesados
    const processedData = {
      personalInfo: {
        name: "Juan Pérez",
        email: "jperez@email.com",
        phone: "+34 612345678",
        location: "Madrid, España"
      },
      summary: "Desarrollador web con más de 5 años de experiencia creando aplicaciones web modernas y responsivas. Especializado en React, TypeScript y Node.js.",
      experience: [
        {
          company: "TechSolutions",
          position: "Desarrollador Frontend Senior",
          startDate: "Enero 2020",
          endDate: "Presente",
          description: "Desarrollo de aplicaciones web con React y TypeScript. Implementación de interfaces de usuario siguiendo principios de diseño UX/UI. Trabajo en equipo utilizando metodologías ágiles."
        },
        {
          company: "InnovateSoft",
          position: "Desarrollador Web",
          startDate: "Marzo 2018",
          endDate: "Diciembre 2019",
          description: "Mantenimiento y desarrollo de aplicaciones con Angular. Integración de APIs REST. Optimización de rendimiento."
        }
      ],
      education: [
        {
          institution: "Universidad Complutense de Madrid",
          degree: "Grado en Ingeniería Informática",
          startDate: "2014",
          endDate: "2018"
        }
      ],
      skills: ["React", "TypeScript", "JavaScript", "HTML5", "CSS3", "Node.js", "Express", "MongoDB", "Git"],
      languages: [
        {
          name: "Español",
          level: "Nativo"
        },
        {
          name: "Inglés",
          level: "Avanzado"
        },
        {
          name: "Francés",
          level: "Básico"
        }
      ]
    };

    return NextResponse.json({ processedData });
  } catch (error) {
    console.error('Error procesando el CV:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
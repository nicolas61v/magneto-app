// src/app/api/extract-text/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ImageAnnotatorClient } from '@google-cloud/vision';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log(`\n=== [${new Date().toISOString()}] INICIANDO EXTRACCIÓN DE TEXTO ===`);

  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      console.log('❌ Faltó imageUrl en la solicitud.');
      return NextResponse.json(
        { error: 'Se requiere URL de imagen para procesar' },
        { status: 400 }
      );
    }

    console.log('📸 URL de imagen recibida:', imageUrl);

    // Verificar variables de entorno
    if (
      !process.env.GOOGLE_CLOUD_PROJECT_ID ||
      !process.env.GOOGLE_CLOUD_PRIVATE_KEY ||
      !process.env.GOOGLE_CLOUD_CLIENT_EMAIL
    ) {
      console.log('❌ Variables de entorno faltantes para Google Vision AI.');
      return NextResponse.json(
        { error: 'Google Vision AI no está configurado correctamente. Faltan variables de entorno.' },
        { status: 500 }
      );
    }

    // Configurar cliente de Google Vision AI
    const client = new ImageAnnotatorClient({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      credentials: {
        client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
        // Asegurarse de que los saltos de línea en la clave privada se manejen correctamente
        private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
    });

    console.log('🔧 Cliente de Google Vision AI configurado.');

    let extractedText = '';
    let detectionMethod = '';

    // ===== ESTRATEGIA 1: DOCUMENT_TEXT_DETECTION (Método preferido para texto denso) =====
    try {
      console.log('📄 Intentando DOCUMENT_TEXT_DETECTION...');
      
      const [documentResult] = await client.documentTextDetection({
        image: {
          source: {
            imageUri: imageUrl,
          },
        },
        imageContext: {
          languageHints: ['es', 'en'], // Ayuda a la API a reconocer idiomas específicos
          textDetectionParams: {
            enableTextDetectionConfidenceScore: true,
            // advancedOcrOptions: ['LEGACY_LAYOUT'] // Considerar probar sin esto o con otras opciones si LEGACY_LAYOUT no da buenos resultados.
          },
        },
      });

      console.log('✅ DOCUMENT_TEXT_DETECTION completado.');
      
      // Debug: Analizar la respuesta de DOCUMENT_TEXT_DETECTION
      console.log('🔍 Analizando respuesta de DOCUMENT_TEXT_DETECTION:');
      console.log('  - fullTextAnnotation existe:', !!documentResult.fullTextAnnotation);
      console.log('  - fullTextAnnotation.text longitud:', documentResult.fullTextAnnotation?.text?.length || 0);
      console.log('  - textAnnotations longitud:', documentResult.textAnnotations?.length || 0);
      if (documentResult.textAnnotations && documentResult.textAnnotations.length > 0) {
        console.log('  - textAnnotations[0].description longitud:', documentResult.textAnnotations[0]?.description?.length || 0);
      }
      
      if (documentResult.fullTextAnnotation?.text) {
        extractedText = documentResult.fullTextAnnotation.text;
        detectionMethod = 'document_detection_full';
        console.log(`✅ Texto extraído con fullTextAnnotation (${detectionMethod}):`, extractedText.length, 'caracteres');
      } else if (documentResult.textAnnotations?.[0]?.description) {
        // Fallback si fullTextAnnotation está vacío pero textAnnotations[0] tiene algo
        extractedText = documentResult.textAnnotations[0].description;
        detectionMethod = 'document_detection_annotations';
        console.log(`✅ Texto extraído con textAnnotations[0] (${detectionMethod}):`, extractedText.length, 'caracteres');
      }

      // Debug: Mostrar las primeras anotaciones de texto si existen
      if (documentResult.textAnnotations && documentResult.textAnnotations.length > 0) {
        console.log('📝 Primeras 3 anotaciones de texto (DOCUMENT_TEXT_DETECTION):');
        documentResult.textAnnotations.slice(0, 3).forEach((annotation, idx) => {
          console.log(`  ${idx}: "${(annotation.description || '').substring(0,100)}..." (confianza: ${annotation.confidence || 'N/A'})`);
        });
      }

    } catch (docError) {
      console.error('❌ Error en DOCUMENT_TEXT_DETECTION:', docError);
    }

    // ===== ESTRATEGIA 2: TEXT_DETECTION (Fallback para texto más disperso o si DOCUMENT_TEXT_DETECTION falló) =====
    // Intentar si la primera estrategia no extrajo texto o muy poco (ej. menos de 50 caracteres)
    if (!extractedText || extractedText.length < 50) {
      console.log('🔤 Texto actual corto o nulo. Intentando TEXT_DETECTION tradicional...');
      try {
        const [textResult] = await client.textDetection({
          image: {
            source: {
              imageUri: imageUrl,
            },
          },
          imageContext: {
            languageHints: ['es', 'en', 'es-ES', 'en-US'], // Más hints pueden ayudar
          },
        });

        console.log('✅ TEXT_DETECTION completado.');
        console.log('🔍 Analizando respuesta de TEXT_DETECTION:');
        console.log('  - textAnnotations longitud:', textResult.textAnnotations?.length || 0);
        if (textResult.textAnnotations && textResult.textAnnotations.length > 0) {
          console.log('  - textAnnotations[0].description longitud:', textResult.textAnnotations[0]?.description?.length || 0);
        }

        if (textResult.textAnnotations?.[0]?.description) {
          const textFromTextDetection = textResult.textAnnotations[0].description;
          console.log('📏 Texto de TEXT_DETECTION:', textFromTextDetection.length, 'caracteres');
          
          // Usar el texto más largo entre el actual y este nuevo resultado
          if (textFromTextDetection.length > extractedText.length) {
            extractedText = textFromTextDetection;
            detectionMethod = 'text_detection_full';
            console.log(`✅ Usando resultado de TEXT_DETECTION (más largo): ${extractedText.length} caracteres`);
          }
        }
      } catch (textError) {
        console.error('❌ Error en TEXT_DETECTION:', textError);
      }
    }

    // ===== ESTRATEGIA 3: ANNOTATE_IMAGE con MÚLTIPLES FEATURES (Fallback más robusto) =====
    // Intentar si el texto sigue siendo corto (ej. menos de 100 caracteres)
    if (!extractedText || extractedText.length < 100) {
      console.log('🎯 Texto actual aún corto. Intentando detección con múltiples features (annotateImage)...');
      try {
        const [multiResult] = await client.annotateImage({
          image: {
            source: {
              imageUri: imageUrl,
            },
          },
          features: [
            { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1, model: 'builtin/latest' }, // Pedir explícitamente el modelo más reciente
            { type: 'TEXT_DETECTION', maxResults: 1 }, // maxResults para TEXT_DETECTION aquí se refiere al número de bloques de texto. 1 para el texto completo.
          ],
          imageContext: {
            languageHints: ['es', 'en', 'es-ES', 'en-US'],
            textDetectionParams: {
              enableTextDetectionConfidenceScore: true,
            },
          },
        });

        console.log('✅ Detección múltiple (annotateImage) completada.');
        console.log('🔍 Analizando respuesta de annotateImage:');
        console.log('  - fullTextAnnotation existe:', !!multiResult.fullTextAnnotation);
        console.log('  - fullTextAnnotation.text longitud:', multiResult.fullTextAnnotation?.text?.length || 0);
        console.log('  - textAnnotations longitud:', multiResult.textAnnotations?.length || 0);
         if (multiResult.textAnnotations && multiResult.textAnnotations.length > 0) {
          console.log('  - textAnnotations[0].description longitud:', multiResult.textAnnotations[0]?.description?.length || 0);
        }
        
        // Priorizar fullTextAnnotation si existe y es más largo
        if (multiResult.fullTextAnnotation?.text && multiResult.fullTextAnnotation.text.length > extractedText.length) {
          extractedText = multiResult.fullTextAnnotation.text;
          detectionMethod = 'multi_document_full_text';
          console.log(`✅ Usando fullTextAnnotation de annotateImage (${detectionMethod}): ${extractedText.length} caracteres`);
        } 
        // Luego probar textAnnotations[0].description si es más largo
        else if (multiResult.textAnnotations?.[0]?.description && multiResult.textAnnotations[0].description.length > extractedText.length) {
          extractedText = multiResult.textAnnotations[0].description;
          detectionMethod = 'multi_text_annotations';
          console.log(`✅ Usando textAnnotations[0] de annotateImage (${detectionMethod}): ${extractedText.length} caracteres`);
        }

      } catch (multiError) {
        console.error('❌ Error en detección múltiple (annotateImage):', multiError);
      }
    }
    
    // ===== ESTRATEGIA 4: FORZAR DESCARGA Y PROCESAMIENTO LOCAL (Si la URL es problemática) =====
    // Intentar si el texto sigue siendo muy corto (ej. menos de 50 caracteres) y podría haber problemas con la accesibilidad de la URL
    if (!extractedText || extractedText.length < 50) {
        console.log('📥 Texto aún corto. Intentando descarga directa de imagen y procesamiento como base64...');
        try {
            const imageResponse = await fetch(imageUrl);
            if (imageResponse.ok) {
                const imageBuffer = await imageResponse.arrayBuffer();
                const base64Image = Buffer.from(imageBuffer).toString('base64');
                
                console.log('📸 Imagen descargada, tamaño:', imageBuffer.byteLength, 'bytes. Procesando con documentTextDetection...');
                
                const [base64Result] = await client.documentTextDetection({
                    image: { 
                        content: base64Image // Enviar contenido como base64
                    },
                    imageContext: {
                        languageHints: ['es', 'en'],
                         textDetectionParams: {
                            enableTextDetectionConfidenceScore: true,
                        },
                    }
                });

                console.log('✅ Detección con imagen base64 completada.');
                console.log('🔍 Analizando respuesta de detección base64:');
                console.log('  - fullTextAnnotation existe:', !!base64Result.fullTextAnnotation);
                console.log('  - fullTextAnnotation.text longitud:', base64Result.fullTextAnnotation?.text?.length || 0);

                if (base64Result.fullTextAnnotation?.text) {
                    const base64Text = base64Result.fullTextAnnotation.text;
                    console.log('📏 Texto de imagen base64:', base64Text.length, 'caracteres');
                    
                    if (base64Text.length > extractedText.length) {
                        extractedText = base64Text;
                        detectionMethod = 'base64_document_detection';
                        console.log(`✅ Usando resultado de imagen base64 (${detectionMethod}): ${extractedText.length} caracteres`);
                    }
                }
            } else {
                console.warn(`⚠️ No se pudo descargar la imagen de ${imageUrl}. Estado: ${imageResponse.status}`);
            }
        } catch (base64Error) {
            console.error('❌ Error en procesamiento de imagen base64:', base64Error);
        }
    }


    // ===== VALIDACIÓN FINAL DEL TEXTO EXTRAÍDO =====
    console.log('\n🔍 VALIDACIÓN FINAL:');
    console.log('  - Texto extraído:', !!extractedText);
    console.log('  - Longitud:', extractedText.length);
    console.log('  - Método usado final:', detectionMethod || 'Ninguno efectivo');

    if (!extractedText || extractedText.trim().length === 0) {
      console.log('❌ No se pudo extraer texto de la imagen después de todos los intentos.');
      return NextResponse.json(
        { 
          error: 'No se pudo extraer texto de la imagen. Verifica que la imagen tenga texto legible y que la URL sea accesible.',
          debugInfo: {
            imageUrl: imageUrl,
            attemptsMade: ['documentTextDetection', 'textDetection', 'annotateImage_multi', 'base64_document_detection'],
            finalDetectionMethod: detectionMethod,
          }
        },
        { status: 404 }
      );
    }

    console.log('📋 TEXTO EXTRAÍDO FINAL:');
    console.log('----------------------------------------');
    console.log(extractedText.substring(0, 500) + (extractedText.length > 500 ? '...' : '')); // Mostrar solo una parte si es muy largo
    console.log('----------------------------------------');

    const lines = extractedText.split('\n').filter(line => line.trim().length > 0);
    const words = extractedText.split(/\s+/).filter(word => word.trim().length > 0);
    
    console.log('📊 Estadísticas detalladas:');
    console.log('  - Longitud total:', extractedText.length);
    console.log('  - Líneas válidas:', lines.length);
    console.log('  - Palabras:', words.length);
    
    // Limpieza suave del texto
    const cleanedText = extractedText
      .replace(/\n{3,}/g, '\n\n') // Reducir múltiples saltos de línea a máximo dos
      .replace(/ {2,}/g, ' ')     // Reducir múltiples espacios a uno solo
      .trim();

    const processingTime = Date.now() - startTime;
    console.log(`✅ EXTRACCIÓN COMPLETADA EXITOSAMENTE en ${processingTime}ms usando ${detectionMethod}`);

    return NextResponse.json({
      text: cleanedText,
      // confidence: ..., // Omitido ya que no hay un score de confianza agregado simple y fiable.
      method: detectionMethod,
      originalLength: extractedText.length,
      cleanedLength: cleanedText.length,
      processingTimeMs: processingTime,
      debugInfo: {
        linesExtracted: lines.length,
        wordsExtracted: words.length,
        firstFewLines: lines.slice(0, 5).map(line => line.trim()),
        imageUrl: imageUrl,
      }
    });

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ ERROR GENERAL EN LA RUTA DE EXTRACCIÓN DE TEXTO (${processingTime}ms):`, error);
    
    let errorMessage = 'Error desconocido procesando la imagen con Google Vision AI.';
    let errorStatus = 500;

    if (error.message) {
        if (error.message.includes('credentials') || error.message.includes('PERMISSION_DENIED')) {
            errorMessage = 'Error de autenticación o permisos con Google Cloud Vision. Verifica las credenciales y los permisos del service account.';
            errorStatus = error.message.includes('credentials') ? 401 : 403;
        } else if (error.message.includes('quota') || error.message.includes('RESOURCE_EXHAUSTED')) {
            errorMessage = 'Límite de API excedido en Google Vision AI o recurso agotado.';
            errorStatus = 429;
        } else if (error.message.includes('Could not fetch image')) {
            errorMessage = 'No se pudo acceder a la imagen desde la URL proporcionada. Verifica que la URL sea pública y correcta.';
            errorStatus = 400;
        } else if (error.message.includes('Invalid image URI')) {
            errorMessage = 'La URL de la imagen no es válida.';
            errorStatus = 400;
        } else {
            errorMessage = error.message; // Usar el mensaje de error original si no es uno de los específicos
        }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.details || (error instanceof Error ? error.stack : 'No additional details'),
        processingTimeMs: processingTime 
      },
      { status: errorStatus }
    );
  }
}

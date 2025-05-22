// src/app/api/extract-text/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ImageAnnotatorClient } from '@google-cloud/vision';

interface GoogleVisionError {
  message?: string;
  details?: string;
  code?: number;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Se requiere URL de imagen para procesar' },
        { status: 400 }
      );
    }

    // Verificar variables de entorno
    if (
      !process.env.GOOGLE_CLOUD_PROJECT_ID ||
      !process.env.GOOGLE_CLOUD_PRIVATE_KEY ||
      !process.env.GOOGLE_CLOUD_CLIENT_EMAIL
    ) {
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
        private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
    });

    let extractedText = '';
    let detectionMethod = '';

    // ESTRATEGIA 1: DOCUMENT_TEXT_DETECTION
    try {
      const [documentResult] = await client.documentTextDetection({
        image: {
          source: {
            imageUri: imageUrl,
          },
        },
        imageContext: {
          languageHints: ['es', 'en'],
          textDetectionParams: {
            enableTextDetectionConfidenceScore: true,
          },
        },
      });
      
      if (documentResult.fullTextAnnotation?.text) {
        extractedText = documentResult.fullTextAnnotation.text;
        detectionMethod = 'document_detection_full';
      } else if (documentResult.textAnnotations?.[0]?.description) {
        extractedText = documentResult.textAnnotations[0].description;
        detectionMethod = 'document_detection_annotations';
      }
    } catch (docError) {
      console.error('Error en DOCUMENT_TEXT_DETECTION:', docError);
    }

    // ESTRATEGIA 2: TEXT_DETECTION (Fallback)
    if (!extractedText || extractedText.length < 50) {
      try {
        const [textResult] = await client.textDetection({
          image: {
            source: {
              imageUri: imageUrl,
            },
          },
          imageContext: {
            languageHints: ['es', 'en', 'es-ES', 'en-US'],
          },
        });

        if (textResult.textAnnotations?.[0]?.description) {
          const textFromTextDetection = textResult.textAnnotations[0].description;
          
          if (textFromTextDetection.length > extractedText.length) {
            extractedText = textFromTextDetection;
            detectionMethod = 'text_detection_full';
          }
        }
      } catch (textError) {
        console.error('Error en TEXT_DETECTION:', textError);
      }
    }

    // ESTRATEGIA 3: ANNOTATE_IMAGE con múltiples features
    if (!extractedText || extractedText.length < 100) {
      try {
        const [multiResult] = await client.annotateImage({
          image: {
            source: {
              imageUri: imageUrl,
            },
          },
          features: [
            { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1, model: 'builtin/latest' },
            { type: 'TEXT_DETECTION', maxResults: 1 },
          ],
          imageContext: {
            languageHints: ['es', 'en', 'es-ES', 'en-US'],
            textDetectionParams: {
              enableTextDetectionConfidenceScore: true,
            },
          },
        });
        
        if (multiResult.fullTextAnnotation?.text && multiResult.fullTextAnnotation.text.length > extractedText.length) {
          extractedText = multiResult.fullTextAnnotation.text;
          detectionMethod = 'multi_document_full_text';
        } else if (multiResult.textAnnotations?.[0]?.description && multiResult.textAnnotations[0].description.length > extractedText.length) {
          extractedText = multiResult.textAnnotations[0].description;
          detectionMethod = 'multi_text_annotations';
        }
      } catch (multiError) {
        console.error('Error en detección múltiple:', multiError);
      }
    }
    
    // ESTRATEGIA 4: Procesamiento como base64
    if (!extractedText || extractedText.length < 50) {
        try {
            const imageResponse = await fetch(imageUrl);
            if (imageResponse.ok) {
                const imageBuffer = await imageResponse.arrayBuffer();
                const base64Image = Buffer.from(imageBuffer).toString('base64');
                
                const [base64Result] = await client.documentTextDetection({
                    image: { 
                        content: base64Image
                    },
                    imageContext: {
                        languageHints: ['es', 'en'],
                         textDetectionParams: {
                            enableTextDetectionConfidenceScore: true,
                        },
                    }
                });

                if (base64Result.fullTextAnnotation?.text) {
                    const base64Text = base64Result.fullTextAnnotation.text;
                    
                    if (base64Text.length > extractedText.length) {
                        extractedText = base64Text;
                        detectionMethod = 'base64_document_detection';
                    }
                }
            }
        } catch (base64Error) {
            console.error('Error en procesamiento base64:', base64Error);
        }
    }

    // Validación final
    if (!extractedText || extractedText.trim().length === 0) {
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

    const lines = extractedText.split('\n').filter(line => line.trim().length > 0);
    const words = extractedText.split(/\s+/).filter(word => word.trim().length > 0);
    
    // Limpieza del texto
    const cleanedText = extractedText
      .replace(/\n{3,}/g, '\n\n')
      .replace(/ {2,}/g, ' ')
      .trim();

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      text: cleanedText,
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

  } catch (error: unknown) {
    const processingTime = Date.now() - startTime;
    console.error('Error en extracción de texto:', error);
    
    let errorMessage = 'Error desconocido procesando la imagen con Google Vision AI.';
    let errorStatus = 500;

    if (error && typeof error === 'object' && 'message' in error) {
        const visionError = error as GoogleVisionError;
        if (visionError.message) {
            if (visionError.message.includes('credentials') || visionError.message.includes('PERMISSION_DENIED')) {
                errorMessage = 'Error de autenticación o permisos con Google Cloud Vision. Verifica las credenciales y los permisos del service account.';
                errorStatus = visionError.message.includes('credentials') ? 401 : 403;
            } else if (visionError.message.includes('quota') || visionError.message.includes('RESOURCE_EXHAUSTED')) {
                errorMessage = 'Límite de API excedido en Google Vision AI o recurso agotado.';
                errorStatus = 429;
            } else if (visionError.message.includes('Could not fetch image')) {
                errorMessage = 'No se pudo acceder a la imagen desde la URL proporcionada. Verifica que la URL sea pública y correcta.';
                errorStatus = 400;
            } else if (visionError.message.includes('Invalid image URI')) {
                errorMessage = 'La URL de la imagen no es válida.';
                errorStatus = 400;
            } else {
                errorMessage = visionError.message;
            }
        }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error && typeof error === 'object' && 'details' in error ? 
          (error as GoogleVisionError).details : 
          (error instanceof Error ? error.stack : 'No additional details'),
        processingTimeMs: processingTime 
      },
      { status: errorStatus }
    );
  }
}
// src/services/pdfToImages.ts
import * as pdfjsLib from 'pdfjs-dist';

// Configurar el worker de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const convertPdfToImages = async (file: File): Promise<File[]> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    const images: File[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 }); // Escala para mejor calidad
      
      // Crear canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Renderizar página PDF en canvas
      await page.render({
        canvasContext: context!,
        viewport: viewport
      }).promise;

      // Convertir canvas a blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob!);
        }, 'image/jpeg', 0.95);
      });

      // Crear File desde blob
      const imageFile = new File(
        [blob], 
        `${file.name.replace('.pdf', '')}_page_${pageNum}.jpg`,
        { type: 'image/jpeg' }
      );
      
      images.push(imageFile);
    }

    return images;
  } catch (error) {
    console.error('Error convirtiendo PDF a imágenes:', error);
    throw new Error('Error al procesar el PDF');
  }
};
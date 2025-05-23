// src/services/pdfToImagesClient.ts - COPIAR COMPLETO
import * as pdfjsLib from 'pdfjs-dist';

// Solo configurar en el navegador
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 
    `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export const convertPdfToImagesClient = async (file: File): Promise<File[]> => {
  if (typeof window === 'undefined') {
    throw new Error('PDF processing solo funciona en el navegador');
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    const images: File[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context!,
        viewport: viewport
      }).promise;

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.95);
      });

      const imageFile = new File(
        [blob], 
        `${file.name.replace('.pdf', '')}_page_${pageNum}.jpg`,
        { type: 'image/jpeg' }
      );
      
      images.push(imageFile);
    }

    return images;
  } catch (error) {
    console.error('Error convirtiendo PDF:', error);
    throw new Error('Error al procesar el PDF');
  }
};
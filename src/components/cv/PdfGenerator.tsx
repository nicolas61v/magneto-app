// src/components/cv/PdfGenerator.tsx
import React from 'react';
import { usePdfGeneration } from '@/hooks/usePdfGeneration';
import { Button } from '@/components/ui/Button';
import { PdfGeneratorProps } from '@/types/components';

export const PdfGenerator: React.FC<PdfGeneratorProps> = ({ 
  cvData, 
  onGenerate 
}) => {
  const { generateCvPdf, isGenerating, error } = usePdfGeneration();

  const handleGeneratePdf = async () => {
    try {
      const pdfUrl = await generateCvPdf(cvData);
      onGenerate(pdfUrl);
    } catch (err) {
      console.error('Error generando PDF:', err);
    }
  };

  return (
    <div>
      <Button
        label={isGenerating ? 'Generando PDF...' : 'Generar PDF'}
        onClick={handleGeneratePdf}
        disabled={isGenerating}
        variant="primary"
      />
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
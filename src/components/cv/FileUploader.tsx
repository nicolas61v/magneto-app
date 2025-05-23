// src/components/cv/FileUploader.tsx
import { useState, useRef } from 'react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { Button } from '@/components/ui/Button';
import { FileUploaderProps } from '@/types/components';
import { convertPdfToImagesClient } from '@/services/pdfToImagesClient';

export const FileUploader: React.FC<FileUploaderProps> = ({ 
  onUploadComplete, 
  onError 
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const { uploadFile, isUploading } = useFileUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      await processFiles(selectedFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      await processFiles(droppedFiles);
    }
  };

  const processFiles = async (newFiles: File[]) => {
    setIsProcessingPdf(true);
    try {
      const processedFiles: File[] = [];
      
      for (const file of newFiles) {
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          // Convertir PDF a imágenes
          const images = await convertPdfToImagesClient(file);
          processedFiles.push(...images);
        } else {
          // Archivo de imagen normal
          processedFiles.push(file);
        }
      }
      
      setFiles(prevFiles => [...prevFiles, ...processedFiles]);
    } catch (err) {
      console.error('Error procesando archivos:', err);
      onError('Error procesando archivos PDF');
    } finally {
      setIsProcessingPdf(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      onError('No se han seleccionado archivos');
      return;
    }

    try {
      setUploadProgress(0);
      const urls: string[] = [];
      
      // Subir cada archivo (ya convertido a imagen si era PDF)
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = await uploadFile(file, 'cvs');
        urls.push(url);
        
        // Actualizar progreso
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }
      
      // Enviar todas las URLs
      onUploadComplete(urls);
      
      // Resetear
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setFiles([]);
      setUploadProgress(0);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Error al subir los archivos');
      setUploadProgress(0);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-6 border rounded-lg bg-white shadow-sm transform transition-all duration-300 hover:shadow-lg">
      <h2 className="text-xl font-semibold mb-6 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        Subir CV ({files.length} {files.length === 1 ? 'archivo' : 'archivos'})
      </h2>
      
      <div className="flex flex-col gap-4">
        <div 
          className={`border-2 border-dashed rounded-lg p-8 cursor-pointer flex flex-col items-center justify-center transition-colors ${
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleBrowseClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            className="hidden"
            multiple
          />
          
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          
          <p className="text-center mb-2 font-medium">
            {isDragging ? 'Suelta los archivos aquí' : 'Arrastra y suelta tu CV aquí'}
          </p>
          <p className="text-center text-sm text-gray-600">
            o <span className="text-blue-600 font-medium">haz clic para buscar</span>
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Puedes subir PDFs o imágenes (JPG, PNG)
          </p>
          <p className="text-xs text-gray-500">
            Los PDFs se convertirán automáticamente a imágenes
          </p>
        </div>
        
        {/* Indicador de procesamiento de PDF */}
        {isProcessingPdf && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex items-center">
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
            <span className="text-sm text-blue-700">Convirtiendo PDF a imágenes...</span>
          </div>
        )}
        
        {/* Lista de archivos seleccionados */}
        {files.length > 0 && (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {files.map((file, index) => (
              <div key={index} className="bg-gray-100 rounded-md p-3 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-xs font-medium text-gray-500 mr-2">
                    {index + 1}.
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium truncate max-w-xs">{file.name}</p>
                    <p className="text-xs text-gray-600">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="text-gray-600 hover:text-gray-900"
                  type="button"
                  title="Eliminar archivo"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Barra de progreso */}
        {isUploading && uploadProgress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
        
        <div className="mt-2 flex gap-2">
          <Button
            label={isUploading ? `Procesando... ${uploadProgress}%` : `Analizar ${files.length} archivo${files.length !== 1 ? 's' : ''} con IA`}
            onClick={handleUpload}
            disabled={files.length === 0 || isUploading || isProcessingPdf}
            variant="primary"
          />
          
          {files.length > 0 && !isUploading && (
            <Button
              label="Limpiar"
              onClick={() => {
                setFiles([]);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              variant="outline"
            />
          )}
        </div>
      </div>
    </div>
  );
};
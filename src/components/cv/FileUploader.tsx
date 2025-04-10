// src/components/cv/FileUploader.tsx
import { useState, useRef } from 'react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { Button } from '@/components/ui/Button';
import { FileUploaderProps } from '@/types/components';

export const FileUploader: React.FC<FileUploaderProps> = ({ 
  onUploadComplete, 
  onError 
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { uploadFile, isUploading } = useFileUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      onError('No se ha seleccionado ningún archivo');
      return;
    }

    try {
      const url = await uploadFile(file, 'cvs');
      onUploadComplete(url);
      // Opcional: resetear el input de archivo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setFile(null);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Error al subir el archivo');
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
        Subir CV
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
          />
          
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          
          <p className="text-center mb-2 font-medium">
            {isDragging ? 'Suelta el archivo aquí' : 'Arrastra y suelta tu CV aquí'}
          </p>
          <p className="text-center text-sm text-gray-600">
            o <span className="text-blue-600 font-medium">haz clic para buscar</span>
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Formatos aceptados: PDF, JPG, PNG
          </p>
        </div>
        
        {file && (
          <div className="bg-gray-100 rounded-md p-3 flex items-center justify-between">
            <div className="flex items-center">
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
                setFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
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
        )}
        
        {/* Usando el componente Button de manera compatible */}
        <div className="mt-2">
          <Button
            label={isUploading ? 'Procesando...' : 'Analizar CV con IA'}
            onClick={handleUpload}
            disabled={!file || isUploading}
            variant="primary"
          />
        </div>
      </div>
    </div>
  );
};
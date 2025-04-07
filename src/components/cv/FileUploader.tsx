// src/components/cv/FileUploader.tsx
import { useState } from 'react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { Button } from '@/components/ui/Button';
import { FileUploaderProps } from '@/types/components';

export const FileUploader: React.FC<FileUploaderProps> = ({ 
  onUploadComplete, 
  onError 
}) => {
  const [file, setFile] = useState<File | null>(null);
  const { uploadFile, isUploading } = useFileUpload();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
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
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Error al subir el archivo');
    }
  };

  return (
    <div className="p-6 border rounded-lg bg-white shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Subir CV</h2>
      <div className="flex flex-col gap-4">
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
        <Button
          label={isUploading ? 'Subiendo...' : 'Procesar CV'}
          onClick={handleUpload}
          disabled={!file || isUploading}
          variant="primary"
        />
      </div>
    </div>
  );
};
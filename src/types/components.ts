// src/types/components.ts
export interface ButtonProps {
    label: string;
    onClick: () => void;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    icon?: React.ReactNode;
  }
  
  export interface FileUploaderProps {
    onUploadComplete: (url: string) => void;
    onError: (error: string) => void;
  }
  
  export interface ResultViewerProps {
    cv: CV;
    isLoading: boolean;
  }
  
  export interface PdfGeneratorProps {
    cvData: CVData;
    onGenerate: (pdfUrl: string) => void;
  }
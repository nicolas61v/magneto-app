// src/types/cv.ts
export interface CV {
    id: string;
    originalImageUrl: string;
    additionalImageUrls?: string[]; // Nueva propiedad para imágenes adicionales
    extractedText: string;
    processedData: CVData | null;
    createdAt: Date;
    status: 'uploading' | 'extracting' | 'processing' | 'completed' | 'error';
    errorMessage?: string;
}

export interface CVData {
    personalInfo: PersonalInfo;
    education: Education[];
    experience: Experience[];
    skills: string[];
    languages: Language[];
    summary: string;
}

export interface PersonalInfo {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    linkedIn?: string;
    website?: string;
}

export interface Education {
    institution: string;
    degree: string;
    field?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
}

export interface Experience {
    company: string;
    position: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    highlights?: string[];
}

export interface Language {
    name: string;
    level?: string;
}


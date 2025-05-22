// src/types/api.ts
import { CVData } from '@/types/cv';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface VisionAIResponse {
  text: string;
  confidence: number;
  debugInfo?: {
    method?: string;
    linesExtracted?: number;
    wordsExtracted?: number;
    processingTimeMs?: number;
    firstFewLines?: string[];
    imageUrl?: string;
  };
}

export interface GeminiAIResponse {
  processedData: CVData;
}
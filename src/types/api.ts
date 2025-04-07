// src/types/api.ts
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
  }
  
  export interface VisionAIResponse {
    text: string;
    confidence: number;
  }
  
  export interface GeminiAIResponse {
    processedData: CVData;
  }
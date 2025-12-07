import { useState } from 'react';
import { SymptomData, MedicalImageData } from '@/lib/gemini';

export type DiagnosisResult = {
  result: string;
  structured: {
    fullText: string;
    sections: string[];
    primaryDiagnosis: string;
    confidenceLevel: string;
    recommendations: string[];
  };
};

export function useGeminiDiagnosis() {
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Analyze symptoms using Gemini AI
  const analyzeSymptoms = async (symptomData: SymptomData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'symptoms',
          data: symptomData,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      setResult(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze symptoms';
      setError(errorMessage);
      console.error('Error analyzing symptoms:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Analyze medical image using Gemini AI
  const analyzeMedicalImage = async (imageData: MedicalImageData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'image',
          data: imageData,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      setResult(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze medical image';
      setError(errorMessage);
      console.error('Error analyzing medical image:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Get follow-up recommendations
  const getFollowUpRecommendations = async (diagnosis: string, patientQuestion?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'followup',
          data: { diagnosis },
          patientQuestion,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get recommendations';
      setError(errorMessage);
      console.error('Error getting recommendations:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to convert a file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  return {
    result,
    isLoading,
    error,
    analyzeSymptoms,
    analyzeMedicalImage,
    getFollowUpRecommendations,
    fileToBase64,
  };
} 
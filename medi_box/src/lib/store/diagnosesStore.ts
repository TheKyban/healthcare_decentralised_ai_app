// This is a simple in-memory store for diagnoses
// In a real application, this would be replaced with a database

// Type definition for diagnosis data
export interface DiagnosisData {
  id: string;
  diagnosisDate: string;
  type: string;
  aiDiagnosis: string;
  confidence: number;
  status: string;
  symptoms: string;
  doctorName: string;
  doctorFeedback: string;
  imageSrc: string;
  aiModelData: {
    modelVersion: string;
    analysisTimestamp: string;
    processingTime: string;
    featuresAnalyzed: string;
  };
  treatmentRecommendations: string[];
  riskFactors: string[];
  aiResponse?: {
    fullText: string;
    sections: string[];
  };
  reviewDate?: string;
}

// Create an in-memory store with sample data
const diagnoses: Record<string, DiagnosisData> = {
  "1": {
    id: "1",
    diagnosisDate: "2023-05-10",
    type: "X-Ray Analysis",
    aiDiagnosis: "Pneumonia",
    confidence: 87,
    status: "approved",
    symptoms: "Persistent cough for 10 days, fever, chest pain, difficulty breathing",
    doctorName: "Dr. Sarah Williams",
    doctorFeedback: "I concur with the AI diagnosis. The X-ray shows clear signs of pneumonia in the right lower lobe. I recommend a course of antibiotics (amoxicillin) and rest for at least 5 days. Please schedule a follow-up in one week.",
    imageSrc: "/xray-sample.jpg",
    aiModelData: {
      modelVersion: "MedicalVisionV2.3",
      analysisTimestamp: "2023-05-11T09:43:18Z",
      processingTime: "3.2 seconds",
      featuresAnalyzed: "217 anatomical landmarks detected"
    },
    treatmentRecommendations: [
      "Antibiotics (amoxicillin) for 7 days",
      "Rest for at least 5 days",
      "Increased fluid intake",
      "Follow-up appointment in one week",
      "Monitor symptoms closely, seek immediate care if condition worsens"
    ],
    riskFactors: [
      "History of respiratory conditions",
      "Compromised immune system",
      "Recent exposure to respiratory infections"
    ]
  },
  "2": {
    id: "2",
    diagnosisDate: "2023-06-22",
    type: "Medical Image Analysis",
    aiDiagnosis: "Migraine with Aura",
    confidence: 78,
    status: "pending",
    symptoms: "Recurring headaches with visual disturbances, nausea, sensitivity to light and sound",
    doctorName: "Pending Review",
    doctorFeedback: "",
    imageSrc: "/brain-scan.jpg",
    aiModelData: {
      modelVersion: "NeurologyVisionV1.5",
      analysisTimestamp: "2023-06-22T14:20:33Z",
      processingTime: "4.1 seconds",
      featuresAnalyzed: "189 neurological patterns detected"
    },
    treatmentRecommendations: [
      "Prescription migraine medication",
      "Avoid known triggers",
      "Keep a headache journal",
      "Regular sleep schedule",
      "Stress management techniques"
    ],
    riskFactors: [
      "Family history of migraines",
      "Hormonal fluctuations",
      "Stress and anxiety",
      "Sleep disruptions"
    ]
  },
  "3": {
    id: "3",
    diagnosisDate: new Date().toISOString().split('T')[0],
    type: "Symptom Analysis",
    aiDiagnosis: "Seasonal Allergic Rhinitis",
    confidence: 92,
    status: "pending",
    symptoms: "Sneezing, runny nose, itchy eyes, congestion, worse outdoors",
    doctorName: "Pending Review",
    doctorFeedback: "",
    imageSrc: "",
    aiModelData: {
      modelVersion: "GeminiMedical-2.0",
      analysisTimestamp: new Date().toISOString(),
      processingTime: "1.4 seconds",
      featuresAnalyzed: "46 symptom patterns analyzed"
    },
    treatmentRecommendations: [
      "Over-the-counter antihistamines",
      "Nasal corticosteroids",
      "Avoid known allergens",
      "Keep windows closed during high pollen counts",
      "Consider allergy testing for specific triggers"
    ],
    riskFactors: [
      "History of allergies",
      "Spring/summer season",
      "Outdoor activities",
      "Poor air quality"
    ]
  }
};

// Keep track of the current ID counter for new diagnoses
let diagnosesCounter = 3;

// Export utility functions to work with the store
export const getDiagnosis = (id: string): DiagnosisData | undefined => {
  return diagnoses[id];
};

export const addDiagnosis = (diagnosis: Omit<DiagnosisData, 'id'>): DiagnosisData => {
  diagnosesCounter++;
  const id = String(diagnosesCounter);
  const newDiagnosis = { ...diagnosis, id };
  diagnoses[id] = newDiagnosis;
  return newDiagnosis;
};

export const updateDiagnosis = (id: string, updates: Partial<DiagnosisData>): DiagnosisData | undefined => {
  if (!diagnoses[id]) return undefined;
  
  diagnoses[id] = {
    ...diagnoses[id],
    ...updates
  };
  
  return diagnoses[id];
};

export const getAllDiagnoses = (): DiagnosisData[] => {
  return Object.values(diagnoses);
};

// Also export the store itself for direct access
export default diagnoses; 
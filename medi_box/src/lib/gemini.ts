import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API with your API key
// In production, use environment variables for API keys
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "AIzaSyDhZvlcpoRmcYlwGMNvoPlIV8oR47wQZ50";
const genAI = new GoogleGenerativeAI(API_KEY);

export type SymptomData = {
  description: string;
  duration: string;
  severity: string;
  medicalHistory?: string;
};

export type MedicalImageData = {
  imageData: string; // Base64 encoded image
  imageType: string; // e.g., "X-ray", "MRI", "CT scan"
  bodyPart: string;
};

export async function analyzeSymptomsWithGemini(symptomData: SymptomData) {
  try {
    // For text-only generation, use the gemini-pro model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Create a structured prompt for symptom analysis
    const prompt = `
      You are a medical AI assistant. Analyze the following symptoms and provide a preliminary diagnosis.
      Please structure your response with the following sections:
      1. Potential Diagnoses (with confidence levels)
      2. Analysis Explanation
      3. Recommended Next Steps
      4. Risk Factors to Consider
      5. Treatment Suggestions (noting these are preliminary and subject to doctor confirmation)

      Patient Symptoms:
      Description: ${symptomData.description}
      Duration: ${symptomData.duration}
      Severity: ${symptomData.severity}
      ${symptomData.medicalHistory ? `Medical History: ${symptomData.medicalHistory}` : ''}
      
      Important: Always clarify that this is an AI-generated preliminary assessment and not a replacement for professional medical advice.
    `;

    // Generate content
    const result = await model.generateContent(prompt);
    const response =  result.response;
    return response.text();
  } catch (error) {
    console.error("Error analyzing symptoms with Gemini:", error);
    throw error;
  }
}

export async function analyzeMedicalImageWithGemini(imageData: MedicalImageData) {
  try {
    // For multimodal generation (text + images), use the gemini-pro-vision model
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

    // Decode the base64 image and create a part for the model
    const imagePart = {
      inlineData: {
        data: imageData.imageData.replace(/^data:image\/(png|jpeg|jpg);base64,/, ""),
        mimeType: imageData.imageData.includes("data:image/png") 
          ? "image/png" 
          : "image/jpeg",
      },
    };

    // Create a structured prompt for image analysis
    const prompt = `
      You are a medical imaging specialist AI. Analyze this ${imageData.imageType} of the ${imageData.bodyPart} 
      and provide a detailed assessment. Structure your response with:
      1. Key Findings
      2. Potential Diagnoses (with confidence levels)
      3. Notable Anomalies or Areas of Concern
      4. Comparison to Typical Results
      5. Recommendations for Further Analysis (if needed)
      
      Be specific about what you can see in the image and note any limitations in your analysis.
      Important: Clarify that this is an AI-generated preliminary assessment and not a replacement for professional medical diagnosis.
    `;

    // Generate content with the image
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error analyzing medical image with Gemini:", error);
    throw error;
  }
}

export async function getFollowUpRecommendations(diagnosis: string, patientQuestion?: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `
      You are a medical AI assistant helping with follow-up recommendations for a diagnosis.
      
      Diagnosis: ${diagnosis}
      ${patientQuestion ? `Patient Question: ${patientQuestion}` : ''}
      
      Please provide:
      1. Key follow-up actions the patient should take
      2. Warning signs that would require immediate medical attention
      3. Lifestyle recommendations related to this condition
      4. Questions the patient should ask their doctor
      
      Keep your response concise, informative, and focused on practical advice.
      Always clarify that this information is supplementary to professional medical advice.
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error getting follow-up recommendations with Gemini:", error);
    throw error;
  }
}

// Function to safely parse Gemini API responses into structured format
export function parseGeminiResponse(responseText: string) {
  try {
    // Split by sections (numbered lists or headings)
    const sections = responseText.split(/\n\d+\.|(?:\n|^)#+\s/).filter(Boolean);
    
    // Create structured response object 
    return {
      fullText: responseText,
      sections: sections.map((section) => section.trim()),
      primaryDiagnosis: extractDiagnosis(responseText),
      confidenceLevel: extractConfidence(responseText),
      recommendations: extractRecommendations(responseText),
    };
  } catch (error) {
    console.error("Error parsing Gemini response:", error);
    return { fullText: responseText, sections: [], primaryDiagnosis: "", confidenceLevel: "", recommendations: [] };
  }
}

// Helper functions to extract specific data from the response
function extractDiagnosis(text: string): string {
  // Look for primary diagnosis information
  const diagnosisMatch = text.match(/(?:primary diagnosis|most likely|diagnosis):?\s*([^\n\.]+)/i);
  return diagnosisMatch?.[1]?.trim() || "";
}

function extractConfidence(text: string): string {
  // Look for confidence levels
  const confidenceMatch = text.match(/(\d+(?:\.\d+)?\s*%)/);
  return confidenceMatch?.[1] || "";
}

function extractRecommendations(text: string): string[] {
  // Look for recommendation section and extract bullet points
  const recommendationsSection = text.match(/recommendations?[:\s]+([\s\S]+?)(?:\n\n|\n#|$)/i);
  if (!recommendationsSection) return [];
  
  return recommendationsSection[1]
    .split(/\n-|\n\*|\n•|\n\d+\./)
    .map(item => item.trim())
    .filter(Boolean);
} 
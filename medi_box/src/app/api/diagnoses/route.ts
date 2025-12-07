import { NextRequest, NextResponse } from 'next/server';
import { 
  analyzeSymptomsWithGemini, 
  analyzeMedicalImageWithGemini,
  parseGeminiResponse,
  SymptomData,
  MedicalImageData
} from '@/lib/gemini';
import { 
  addDiagnosis, 
  getAllDiagnoses, 
  DiagnosisData 
} from '@/lib/store/diagnosesStore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let aiResult;
    let structured;

    // Process based on diagnosis type
    if (type === 'symptoms') {
      const symptomData = data as SymptomData;
      aiResult = await analyzeSymptomsWithGemini(symptomData);
      structured = parseGeminiResponse(aiResult);
    } 
    else if (type === 'image') {
      const imageData = data as MedicalImageData;
      aiResult = await analyzeMedicalImageWithGemini(imageData);
      structured = parseGeminiResponse(aiResult);
    }
    else {
      return NextResponse.json(
        { error: "Invalid diagnosis type" },
        { status: 400 }
      );
    }
    
    // Create new diagnosis object
    const newDiagnosisData: Omit<DiagnosisData, 'id'> = {
      diagnosisDate: new Date().toISOString().split('T')[0],
      type: type === 'symptoms' ? 'Symptom Analysis' : `${data.imageType} Analysis`,
      aiDiagnosis: structured.primaryDiagnosis || "Pending AI diagnosis",
      confidence: parseInt(structured.confidenceLevel) || 0,
      status: "pending",
      symptoms: type === 'symptoms' ? data.description : "",
      doctorName: "Pending Review",
      doctorFeedback: "",
      imageSrc: type === 'image' ? `/sample-${Date.now()}.jpg` : "", // In a real app, we'd store the image
      aiModelData: {
        modelVersion: type === 'symptoms' ? "GeminiMedical-2.0" : "GeminiVision-1.5",
        analysisTimestamp: new Date().toISOString(),
        processingTime: "2.1 seconds",
        featuresAnalyzed: type === 'symptoms' ? "46 symptom patterns analyzed" : "217 anatomical landmarks detected"
      },
      treatmentRecommendations: structured.recommendations || [],
      riskFactors: [
        "To be determined by doctor review"
      ],
      aiResponse: {
        fullText: structured.fullText,
        sections: structured.sections
      }
    };
    
    // Add the diagnosis to the store
    const newDiagnosis = addDiagnosis(newDiagnosisData);
    
    return NextResponse.json({ 
      success: true,
      diagnosisId: newDiagnosis.id,
      diagnosis: newDiagnosis
    });
  } catch (error) {
    console.error("Diagnosis creation error:", error);
    return NextResponse.json(
      { error: "Failed to create diagnosis" },
      { status: 500 }
    );
  }
}

// Get all diagnoses (paginated)
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    
    // Get all diagnoses
    let diagnosisArray = getAllDiagnoses();
    
    // Apply filters
    if (status) {
      diagnosisArray = diagnosisArray.filter(d => d.status === status);
    }
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedDiagnoses = diagnosisArray.slice(startIndex, endIndex);
    
    return NextResponse.json({
      diagnoses: paginatedDiagnoses,
      total: diagnosisArray.length,
      page,
      limit,
      totalPages: Math.ceil(diagnosisArray.length / limit)
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch diagnoses" },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { getDiagnosis } from '@/lib/store/diagnosesStore';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Check if diagnosis exists
    const diagnosis = getDiagnosis(id);
    if (!diagnosis) {
      return NextResponse.json(
        { error: "Diagnosis not found" },
        { status: 404 }
      );
    }
    
    // Return the diagnosis data
    return NextResponse.json(diagnosis);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch diagnosis" },
      { status: 500 }
    );
  }
} 
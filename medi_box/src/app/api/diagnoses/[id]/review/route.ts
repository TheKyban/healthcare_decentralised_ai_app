import { NextRequest, NextResponse } from 'next/server';

// In a real app, this would be connected to the database that stores diagnoses
// For this demo, we'll access a shared diagnoses store
import diagnoses from '@/lib/store/diagnosesStore';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, feedback, doctorName } = body;

    // Validate the request data
    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    if (!feedback || feedback.trim() === '') {
      return NextResponse.json(
        { error: "Doctor feedback is required" },
        { status: 400 }
      );
    }

    if (!doctorName || doctorName.trim() === '') {
      return NextResponse.json(
        { error: "Doctor name is required" },
        { status: 400 }
      );
    }

    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 800));

    // Check if diagnosis exists in sample data
    if (diagnoses[id]) {
      // Update the diagnosis with doctor's review
      diagnoses[id] = {
        ...diagnoses[id],
        status: action === 'approve' ? 'approved' : 'rejected',
        doctorName: doctorName,
        doctorFeedback: feedback,
        reviewDate: new Date().toISOString()
      };

      return NextResponse.json({
        success: true,
        message: `Diagnosis ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
        diagnosisId: id
      });
    } else {
      // For static demo, we'll pretend the update was successful even if we don't have the ID
      // In a real app, you would return a 404 here if the diagnosis doesn't exist
      return NextResponse.json({
        success: true,
        message: `Diagnosis ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
        diagnosisId: id
      });
    }
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to process doctor review" },
      { status: 500 }
    );
  }
} 
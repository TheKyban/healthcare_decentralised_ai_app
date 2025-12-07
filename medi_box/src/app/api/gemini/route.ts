import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

if (!process.env.GOOGLE_AI_API_KEY) {
  console.error("GOOGLE_AI_API_KEY is not configured");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

// Enhanced safety settings for medical content
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Enhanced generation config
const generationConfig = {
  temperature: 0.7,
  topP: 0.9,
  topK: 40,
  maxOutputTokens: 2048,
};

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite",
  safetySettings,
  generationConfig,
});

export async function POST(request: Request) {
  try {
    const { message, category, conversationHistory } = await request.json();

    // Validate input
    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Valid message is required" },
        { status: 400 }
      );
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { error: "Message is too long (max 5000 characters)" },
        { status: 400 }
      );
    }

    // Build conversation context if history exists
    let conversationContext = "";
    if (
      conversationHistory &&
      Array.isArray(conversationHistory) &&
      conversationHistory.length > 0
    ) {
      conversationContext =
        "\n\nPrevious conversation context:\n" +
        conversationHistory
          .slice(-6)
          .map(
            (msg: { role: string; content: string }) =>
              `${msg.role === "user" ? "Patient" : "MedAssist"}: ${msg.content}`
          )
          .join("\n");
    }

    const contextPrompt = `You are MedAssist, a compassionate and knowledgeable AI medical assistant integrated into a healthcare platform. Your purpose is to provide helpful, evidence-based health information while maintaining appropriate boundaries.

Key Principles:
- Provide clear, accurate, and empathetic responses
- Use medical knowledge responsibly and cite general medical consensus when applicable
- Always acknowledge uncertainty and recommend professional consultation when appropriate
- Format responses for readability with markdown (headings, bullet points, bold for emphasis)
- Be conversational yet professional
- Never diagnose or prescribe medication
- Prioritize patient safety and well-being

Current Context:
- Health Category: ${category || "General Health"}
- Patient Query: ${message}${conversationContext}

Response Guidelines:
1. Address the query directly and comprehensively
2. Structure information clearly (use headings, lists, or numbered points when appropriate)
3. Highlight important information using **bold** text
4. Include relevant context or explanations
5. Add appropriate disclaimers (e.g., "This is general information, not medical advice")
6. If emergency symptoms are mentioned, emphasize seeking immediate medical attention
7. End with 3-4 relevant follow-up questions the patient might ask

Format your follow-up questions section as:

**Follow-up Questions:**
- Question 1
- Question 2  
- Question 3
- Question 4

Remember: You're here to educate and guide, not to replace healthcare professionals.`;

    // Use real streaming from Gemini
    const result = await model.generateContentStream(contextPrompt);

    // Create a new ReadableStream for streaming the response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          let fullText = '';
          let chunkCount = 0;
          const startTime = Date.now();

          console.log('🚀 Starting streaming at:', new Date().toISOString());

          // Stream chunks as Gemini generates them
          for await (const chunk of result.stream) {
            chunkCount++;
            const chunkText = chunk.text();
            fullText += chunkText;
            
            const elapsed = Date.now() - startTime;
            console.log(`📤 Chunk ${chunkCount} at ${elapsed}ms:`, chunkText.substring(0, 50).replace(/\n/g, '↵'));
            
            // Send each chunk immediately as it arrives from Gemini
            controller.enqueue(encoder.encode(chunkText));
          }

          console.log(`✅ Loop finished at ${Date.now() - startTime}ms. Total chunks: ${chunkCount}`);

          // Extract suggestions from the complete response
          const suggestionPattern =
            /\*\*Follow-up Questions?:\*\*([\s\S]*?)(?=\n\n##|$)/i;
          const match = fullText.match(suggestionPattern);

          let suggestions: string[] = [];
          if (match && match[1]) {
            suggestions = match[1]
              .split("\n")
              .map((line) => line.trim().replace(/^[•\-\*]\s*/, ""))
              .filter((line) => line.length > 10 && line.length < 150);
          }

          // Send suggestions and metadata as the final chunk
          const metadata = {
            suggestions,
            done: true,
            timestamp: new Date().toISOString(),
            category: category || "general",
          };

          controller.enqueue(
            encoder.encode("\n___METADATA___\n" + JSON.stringify(metadata))
          );

          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error: unknown) {
    console.error("Error in chat API:", error);

    // Handle specific error types
    if (error instanceof Error && error.message?.includes("API key")) {
      return NextResponse.json(
        { error: "API configuration error. Please contact support." },
        { status: 500 }
      );
    }

    if (error instanceof Error && error.message?.includes("quota")) {
      return NextResponse.json(
        { error: "Service temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process your request. Please try again." },
      { status: 500 }
    );
  }
}

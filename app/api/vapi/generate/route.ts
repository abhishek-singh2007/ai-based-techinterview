import { z } from "zod";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";

import { db, auth } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";
import { classifyAiError, getFallbackInterviewQuestions } from "@/lib/fallback";

const requestSchema = z.object({
    type: z.enum(["behavioral", "technical", "mixed"]),
    role: z.string().min(1, "Role is required"),
    level: z.string().min(1, "Level is required"),
    techstack: z.string().min(1, "Tech stack is required"),
    amount: z.coerce.number().int().positive("Amount must be positive"),
});

const questionsSchema = z.array(z.string().min(1)).min(1);

export async function POST(request: Request) {
    try {
        // Parse request body
        let body;
        try {
            body = requestSchema.parse(await request.json());
        } catch (parseError) {
            if (parseError instanceof z.ZodError) {
                return Response.json(
                    {
                        success: false,
                        error: "Invalid request format.",
                        details: parseError.flatten().fieldErrors,
                    },
                    { status: 400 }
                );
            }
            return Response.json(
                { success: false, error: "Invalid JSON payload." },
                { status: 400 }
            );
        }

        // Get authenticated user from session
        let userId: string;
        try {
            // Extract session cookie from request
            const cookieHeader = request.headers.get("cookie") || "";
            const sessionMatch = cookieHeader.match(/session=([^;]+)/);

            if (!sessionMatch) {
                return Response.json(
                    { success: false, error: "User not authenticated." },
                    { status: 401 }
                );
            }

            const sessionCookie = sessionMatch[1];
            const decodedClaims = await auth.verifySessionCookie(
                sessionCookie,
                true
            );

            if (!decodedClaims || !decodedClaims.uid) {
                return Response.json(
                    { success: false, error: "Invalid session." },
                    { status: 401 }
                );
            }

            userId = decodedClaims.uid;
        } catch (authError) {
            console.error("Auth verification error:", authError);
            return Response.json(
                { success: false, error: "Authentication failed." },
                { status: 401 }
            );
        }

        let questions: string[];
        let generationMode: "ai" | "fallback" = "ai";
        let responseMessage = "Interview generated successfully.";
        try {
            const { object: generatedQuestions } = await generateObject({
                model: google("gemini-2.0-flash-001"),
                schema: questionsSchema,
                prompt: `Prepare ${body.amount} interview questions for a job interview.
The job role is ${body.role}.
The job experience level is ${body.level}.
The tech stack used in the job is: ${body.techstack}.
The focus between behavioural and technical questions should lean towards: ${body.type}.
Please return ONLY the questions as a JSON array of strings, without any additional text.
The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.

Example format: ["Question 1?", "Question 2?", ...]
`,
            });

            questions = generatedQuestions;

            if (!Array.isArray(questions) || questions.length === 0) {
                throw new Error("No questions generated from AI");
            }
        } catch (aiError) {
            console.error("AI generation error:", aiError);
            questions = getFallbackInterviewQuestions({
                role: body.role,
                type: body.type,
                level: body.level,
                amount: body.amount,
            });
            generationMode = "fallback";
            responseMessage = classifyAiError(aiError).message;
        }

        // Create interview document
        let interviewRef;
        try {
            const interview = {
                role: body.role,
                type: body.type,
                level: body.level,
                techstack: body.techstack
                    .split(",")
                    .map((item: string) => item.trim())
                    .filter((item: string) => item.length > 0),
                questions,
                userId,
                finalized: true,
                coverImage: getRandomInterviewCover(),
                createdAt: new Date().toISOString(),
                generationMode,
            };

            interviewRef = await db.collection("interviews").add(interview);

            if (!interviewRef.id) {
                throw new Error("No document ID returned");
            }
        } catch (dbError) {
            console.error("Database write error:", dbError);
            const message =
                dbError instanceof Error && dbError.message
                    ? dbError.message
                    : "Database operation failed";
            return Response.json(
                { success: false, error: `Failed to save interview: ${message}` },
                { status: 500 }
            );
        }

        // Return success response
        return Response.json(
            {
                success: true,
                interviewId: interviewRef.id,
                questions,
                mode: generationMode,
                message: responseMessage,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Unexpected error in generation route:", error);
        const message =
            error instanceof Error && error.message
                ? error.message
                : "An unexpected error occurred";
        return Response.json(
            { success: false, error: `Server error: ${message}` },
            { status: 500 }
        );
    }
}

export async function GET() {
    return Response.json({ success: true, data: "Thank you!" }, { status: 200 });
}
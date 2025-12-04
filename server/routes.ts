import type { Express } from "express";
import { createServer, type Server } from "http";
import OpenAI from "openai";
import { sentimentAnalysisRequestSchema } from "@shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,
  maxRetries: 2,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Sentiment Analysis API endpoint
  app.post("/api/analyze", async (req, res) => {
    try {
      // Validate request body
      const parseResult = sentimentAnalysisRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Invalid request", 
          details: parseResult.error.errors 
        });
      }

      const { feedback } = parseResult.data;

      // Call OpenAI for sentiment analysis
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: `You are an expert sentiment analysis AI. Analyze the given customer feedback and provide a comprehensive analysis. You must respond with valid JSON only.

Your analysis should include:
1. Overall sentiment (positive, negative, or neutral)
2. A sentiment score from 0-100 (0 being most negative, 100 being most positive)
3. Confidence level of your analysis (0-100)
4. Detected emotions with their intensity (0-100). Common emotions include: joy, satisfaction, gratitude, trust, anticipation, frustration, anger, disappointment, confusion, sadness
5. Key actionable insights based on the feedback with priority levels (high, medium, low)
6. A brief summary of the feedback

Respond with JSON in this exact format:
{
  "sentiment": "positive" | "negative" | "neutral",
  "sentimentScore": number,
  "confidence": number,
  "emotions": [{"name": string, "intensity": number}],
  "insights": [{"text": string, "priority": "high" | "medium" | "low"}],
  "summary": string
}`
          },
          {
            role: "user",
            content: `Analyze this customer feedback:\n\n${feedback}`
          }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 1024,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        console.error("Empty response from OpenAI");
        return res.status(500).json({ 
          error: "Failed to analyze sentiment",
          message: "AI returned an empty response. Please try again."
        });
      }

      try {
        const analysisResult = JSON.parse(content);
        
        // Ensure all required fields have defaults
        const result = {
          sentiment: analysisResult.sentiment || "neutral",
          sentimentScore: typeof analysisResult.sentimentScore === 'number' ? analysisResult.sentimentScore : 50,
          confidence: typeof analysisResult.confidence === 'number' ? analysisResult.confidence : 0,
          emotions: Array.isArray(analysisResult.emotions) ? analysisResult.emotions : [],
          insights: Array.isArray(analysisResult.insights) ? analysisResult.insights : [],
          summary: analysisResult.summary || "",
        };
        
        return res.json(result);
      } catch (parseError) {
        console.error("Failed to parse OpenAI response:", content);
        return res.status(500).json({ 
          error: "Failed to parse AI response",
          message: "The AI response was not in the expected format. Please try again."
        });
      }
    } catch (error: any) {
      console.error("Sentiment analysis error:", error);
      
      if (error.code === "invalid_api_key") {
        return res.status(401).json({ error: "Invalid OpenAI API key" });
      }
      
      if (error.code === "ECONNRESET" || error.code === "ETIMEDOUT" || error.message?.includes("timeout")) {
        return res.status(503).json({ 
          error: "Service temporarily unavailable",
          message: "The AI service is taking too long. Please try again in a moment."
        });
      }
      
      return res.status(500).json({ 
        error: "Failed to analyze sentiment", 
        message: error.message || "An unexpected error occurred. Please try again."
      });
    }
  });

  return httpServer;
}

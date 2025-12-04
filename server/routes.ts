import type { Express } from "express";
import { createServer, type Server } from "http";
import OpenAI from "openai";
import { sentimentAnalysisRequestSchema } from "@shared/schema";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 60000,
  maxRetries: 3,
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

      console.log("Starting sentiment analysis for feedback of length:", feedback.length);

      // Call OpenAI for sentiment analysis using gpt-4o for reliability
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert sentiment analysis AI. Analyze the given customer feedback and provide a comprehensive analysis.

Your analysis should include:
1. Overall sentiment (positive, negative, or neutral)
2. A sentiment score from 0-100 (0 being most negative, 100 being most positive)
3. Confidence level of your analysis (0-100)
4. Detected emotions with their intensity (0-100). Common emotions include: joy, satisfaction, gratitude, trust, anticipation, frustration, anger, disappointment, confusion, sadness
5. Key actionable insights based on the feedback with priority levels (high, medium, low)
6. A brief summary of the feedback

You must respond with valid JSON only in this exact format:
{
  "sentiment": "positive",
  "sentimentScore": 85,
  "confidence": 90,
  "emotions": [{"name": "joy", "intensity": 80}],
  "insights": [{"text": "Customer is satisfied with delivery speed", "priority": "medium"}],
  "summary": "Brief summary here"
}`
          },
          {
            role: "user",
            content: `Analyze this customer feedback:\n\n${feedback}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1024,
      });

      console.log("OpenAI response received, choices:", response.choices?.length);

      const content = response.choices[0]?.message?.content;
      if (!content) {
        console.error("Empty response from OpenAI. Full response:", JSON.stringify(response, null, 2));
        return res.status(500).json({ 
          error: "Failed to analyze sentiment",
          message: "AI returned an empty response. Please try again."
        });
      }

      console.log("Parsing response content...");

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
        
        console.log("Analysis complete. Sentiment:", result.sentiment, "Score:", result.sentimentScore);
        return res.json(result);
      } catch (parseError) {
        console.error("Failed to parse OpenAI response:", content);
        return res.status(500).json({ 
          error: "Failed to parse AI response",
          message: "The AI response was not in the expected format. Please try again."
        });
      }
    } catch (error: any) {
      console.error("Sentiment analysis error:", error.message);
      console.error("Error details:", error);
      
      if (error.code === "invalid_api_key" || error.status === 401) {
        return res.status(401).json({ 
          error: "Invalid API key",
          message: "The OpenAI API key is invalid. Please check your configuration."
        });
      }
      
      if (error.status === 429) {
        return res.status(429).json({ 
          error: "Rate limit exceeded",
          message: "Too many requests. Please wait a moment and try again."
        });
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

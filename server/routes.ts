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

      // Call OpenAI for sentiment analysis using gpt-5 (latest model released August 7, 2025)
      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: `You are an expert sentiment analysis AI specializing in customer feedback analysis. Analyze the given customer feedback and provide a comprehensive, detailed analysis.

Your analysis must include:

1. **Overall Sentiment**: positive, negative, or neutral
2. **Sentiment Score**: 0-100 (0 = most negative, 100 = most positive)
3. **Confidence Level**: 0-100 (how confident you are in your analysis)
4. **Urgency Level**: critical, high, medium, or low (based on customer need)
5. **Customer Intent**: What the customer is trying to achieve or communicate

6. **Detected Emotions** (array with name and intensity 0-100):
   - Common emotions: joy, satisfaction, gratitude, trust, anticipation, frustration, anger, disappointment, confusion, sadness, anxiety, relief, surprise

7. **Key Phrases** (array with phrase and sentiment):
   - Extract 3-5 key phrases that capture the essence of the feedback

8. **Key Insights** (array with text and priority high/medium/low):
   - Identify 3-5 actionable insights from the feedback

9. **Recommendations** (array of detailed action items):
   Each recommendation must have:
   - title: Short action title
   - description: Detailed explanation of what to do
   - category: customer_service, product, process, communication, or technical
   - impact: high, medium, or low
   - timeframe: immediate (within 24h), short_term (1-2 weeks), long_term (1+ months)
   
   Provide 3-5 specific, actionable recommendations based on the feedback.

10. **Summary**: Brief 1-2 sentence summary of the feedback

11. **Detailed Analysis**: 2-3 paragraph thorough analysis of the customer's sentiment, underlying concerns, and the business implications of this feedback.

Respond with valid JSON only in this exact format:
{
  "sentiment": "positive",
  "sentimentScore": 85,
  "confidence": 92,
  "urgencyLevel": "medium",
  "customerIntent": "Customer is seeking acknowledgment of their positive experience",
  "emotions": [{"name": "satisfaction", "intensity": 85}],
  "keyPhrases": [{"phrase": "great service", "sentiment": "positive"}],
  "insights": [{"text": "Customer values quick response times", "priority": "high"}],
  "recommendations": [{
    "title": "Send Thank You Follow-up",
    "description": "Send a personalized thank you email acknowledging the positive feedback and offering a loyalty discount",
    "category": "customer_service",
    "impact": "medium",
    "timeframe": "immediate"
  }],
  "summary": "Customer expresses satisfaction with service quality",
  "detailedAnalysis": "The customer's feedback reveals a positive experience..."
}`
          },
          {
            role: "user",
            content: `Analyze this customer feedback in detail:\n\n${feedback}`
          }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 2048,
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
          urgencyLevel: analysisResult.urgencyLevel || "medium",
          customerIntent: analysisResult.customerIntent || "",
          emotions: Array.isArray(analysisResult.emotions) ? analysisResult.emotions : [],
          keyPhrases: Array.isArray(analysisResult.keyPhrases) ? analysisResult.keyPhrases : [],
          insights: Array.isArray(analysisResult.insights) ? analysisResult.insights : [],
          recommendations: Array.isArray(analysisResult.recommendations) ? analysisResult.recommendations : [],
          summary: analysisResult.summary || "",
          detailedAnalysis: analysisResult.detailedAnalysis || "",
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

import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import {
  sentimentAnalysisRequestSchema,
  batchAnalysisRequestSchema,
  type SentimentAnalysisResult,
  type BatchFeedbackItem,
  type BatchAnalysisSummary,
} from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  timeout: 300000, // 5 minutes
  maxRetries: 2,
});

export function setupRoutes(app: Express) {
  // Health check
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Sentiment Analysis endpoint
  app.post("/api/analyze", async (req: Request, res: Response) => {
    try {
      const parseResult = sentimentAnalysisRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: "Invalid request",
          details: parseResult.error.issues,
        });
      }

      const { feedback } = parseResult.data;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Sentiment analysis AI. Return JSON: {sentiment:"positive|negative|neutral",sentimentScore:0-100,confidence:0-100,urgencyLevel:"critical|high|medium|low",customerIntent:"string",emotions:[{name,intensity:0-100}],keyPhrases:[{phrase,sentiment}],insights:[{text,priority:"high|medium|low"}],recommendations:[{title,description,category:"customer_service|product|process|communication|technical",impact:"high|medium|low",timeframe:"immediate|short_term|long_term"}],summary:"1-2 sentences",detailedAnalysis:"2-3 paragraphs"}`,
          },
          {
            role: "user",
            content: feedback,
          },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return res.status(500).json({
          error: "Empty response from AI",
          message: "Please try again.",
        });
      }

      const result = JSON.parse(content);
      return res.json({
        sentiment: result.sentiment || "neutral",
        sentimentScore: result.sentimentScore ?? 50,
        confidence: result.confidence ?? 0,
        urgencyLevel: result.urgencyLevel || "medium",
        customerIntent: result.customerIntent || "",
        emotions: result.emotions || [],
        keyPhrases: result.keyPhrases || [],
        insights: result.insights || [],
        recommendations: result.recommendations || [],
        summary: result.summary || "",
        detailedAnalysis: result.detailedAnalysis || "",
      });
    } catch (error: any) {
      console.error("Analysis error:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));

      if (error.status === 401) {
        return res.status(401).json({
          error: "Invalid API key",
          message: "Check your OpenAI API key configuration.",
        });
      }

      if (error.status === 429) {
        return res.status(429).json({
          error: "Rate limit exceeded",
          message: "Please wait and try again.",
        });
      }

      return res.status(500).json({
        error: "Analysis failed",
        message: error.message || "An unexpected error occurred.",
      });
    }
  });

  // Batch Analysis endpoint
  app.post("/api/analyze/batch", async (req: Request, res: Response) => {
    try {
      const parseResult = batchAnalysisRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: "Invalid request",
          details: parseResult.error.issues,
        });
      }

      const { feedbacks } = parseResult.data;
      const items: BatchFeedbackItem[] = feedbacks.map((feedback, index) => ({
        id: `feedback-${index + 1}`,
        feedback,
        status: "pending" as const,
      }));

      const results: SentimentAnalysisResult[] = [];

      // Process feedbacks in parallel chunks of 5 for speed
      const chunkSize = 5;
      for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize);
        
        const chunkPromises = chunk.map(async (item, chunkIndex) => {
          const itemIndex = i + chunkIndex;
          items[itemIndex].status = "processing";

          const analysisResult = await analyzeSingleFeedback(item.feedback);
          
          if (analysisResult) {
            items[itemIndex].result = analysisResult;
            items[itemIndex].status = "completed";
            return analysisResult;
          } else {
            items[itemIndex].status = "error";
            items[itemIndex].error = "Analysis failed after retries";
            return null;
          }
        });

        const chunkResults = await Promise.all(chunkPromises);
        results.push(...chunkResults.filter((r): r is SentimentAnalysisResult => r !== null));

        // Small delay between chunks to avoid rate limiting
        if (i + chunkSize < items.length) {
          await delay(300);
        }
      }

      // Generate summary
      const summary = generateBatchSummary(items, results);

      return res.json({ items, summary });
    } catch (error: any) {
      console.error("Batch analysis error:", error);
      return res.status(500).json({
        error: "Batch analysis failed",
        message: error.message || "An unexpected error occurred.",
      });
    }
  });
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const BATCH_SYSTEM_PROMPT = `Analyze customer feedback. Return compact JSON:
{"sentiment":"positive|negative|neutral","sentimentScore":0-100,"confidence":0-100,"urgencyLevel":"critical|high|medium|low","customerIntent":"brief intent","emotions":[{"name":"emotion","intensity":0-100}],"keyPhrases":[{"phrase":"text","sentiment":"positive|negative|neutral"}],"insights":[{"text":"insight","priority":"high|medium|low"}],"recommendations":[{"title":"title","description":"desc","category":"customer_service|product|process|communication|technical","impact":"high|medium|low","timeframe":"immediate|short_term|long_term"}],"summary":"1 sentence","detailedAnalysis":"1 paragraph"}`;

async function analyzeSingleFeedback(feedback: string, retries = 2): Promise<SentimentAnalysisResult | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: BATCH_SYSTEM_PROMPT },
          { role: "user", content: feedback },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 1024,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        console.log(`Empty response for feedback, attempt ${attempt}/${retries}`);
        if (attempt < retries) {
          await delay(500 * attempt);
          continue;
        }
        return null;
      }

      const result = JSON.parse(content);
      return {
        sentiment: result.sentiment || "neutral",
        sentimentScore: result.sentimentScore ?? 50,
        confidence: result.confidence ?? 0,
        urgencyLevel: result.urgencyLevel || "medium",
        customerIntent: result.customerIntent || "",
        emotions: result.emotions || [],
        keyPhrases: result.keyPhrases || [],
        insights: result.insights || [],
        recommendations: result.recommendations || [],
        summary: result.summary || "",
        detailedAnalysis: result.detailedAnalysis || "",
      };
    } catch (error: any) {
      console.error(`Attempt ${attempt} failed:`, error.message);
      if (attempt < retries) {
        await delay(500 * attempt);
        continue;
      }
      return null;
    }
  }
  return null;
}

function generateBatchSummary(
  items: BatchFeedbackItem[],
  results: SentimentAnalysisResult[]
): BatchAnalysisSummary {
  const completedResults = results.filter(Boolean);
  const totalCount = items.length;

  const positiveCount = completedResults.filter((r) => r.sentiment === "positive").length;
  const negativeCount = completedResults.filter((r) => r.sentiment === "negative").length;
  const neutralCount = completedResults.filter((r) => r.sentiment === "neutral").length;

  const averageSentimentScore =
    completedResults.length > 0
      ? Math.round(completedResults.reduce((sum, r) => sum + r.sentimentScore, 0) / completedResults.length)
      : 0;

  const averageConfidence =
    completedResults.length > 0
      ? Math.round(completedResults.reduce((sum, r) => sum + r.confidence, 0) / completedResults.length)
      : 0;

  // Count emotions
  const emotionCounts: Record<string, number> = {};
  completedResults.forEach((r) => {
    r.emotions.forEach((e) => {
      emotionCounts[e.name] = (emotionCounts[e.name] || 0) + 1;
    });
  });
  const topEmotions = Object.entries(emotionCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Urgency breakdown
  const urgencyBreakdown = {
    critical: completedResults.filter((r) => r.urgencyLevel === "critical").length,
    high: completedResults.filter((r) => r.urgencyLevel === "high").length,
    medium: completedResults.filter((r) => r.urgencyLevel === "medium").length,
    low: completedResults.filter((r) => r.urgencyLevel === "low").length,
  };

  // Extract common themes from key phrases
  const phraseCounts: Record<string, number> = {};
  completedResults.forEach((r) => {
    r.keyPhrases.forEach((kp) => {
      const normalized = kp.phrase.toLowerCase();
      phraseCounts[normalized] = (phraseCounts[normalized] || 0) + 1;
    });
  });
  const commonThemes = Object.entries(phraseCounts)
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([phrase]) => phrase);

  // Aggregate recommendations by frequency
  const recCounts: Record<string, { rec: any; count: number }> = {};
  completedResults.forEach((r) => {
    r.recommendations.forEach((rec) => {
      const key = rec.title.toLowerCase();
      if (!recCounts[key]) {
        recCounts[key] = { rec, count: 1 };
      } else {
        recCounts[key].count++;
      }
    });
  });
  const overallRecommendations = Object.values(recCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((r) => r.rec);

  return {
    totalCount,
    positiveCount,
    negativeCount,
    neutralCount,
    averageSentimentScore,
    averageConfidence,
    topEmotions,
    urgencyBreakdown,
    commonThemes,
    overallRecommendations,
  };
}

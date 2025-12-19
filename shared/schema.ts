import { z } from "zod";

// Sentiment analysis request schema
export const sentimentAnalysisRequestSchema = z.object({
  feedback: z.string().min(1, "Feedback is required").max(5000, "Feedback must be less than 5000 characters"),
});

export type SentimentAnalysisRequest = z.infer<typeof sentimentAnalysisRequestSchema>;

// Emotion with intensity
export const emotionSchema = z.object({
  name: z.string(),
  intensity: z.number().min(0).max(100),
});

export type Emotion = z.infer<typeof emotionSchema>;

// Key insight
export const insightSchema = z.object({
  text: z.string(),
  priority: z.enum(["high", "medium", "low"]),
});

export type Insight = z.infer<typeof insightSchema>;

// Recommendation with category and action
export const recommendationSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.enum(["customer_service", "product", "process", "communication", "technical"]),
  impact: z.enum(["high", "medium", "low"]),
  timeframe: z.enum(["immediate", "short_term", "long_term"]),
});

export type Recommendation = z.infer<typeof recommendationSchema>;

// Key phrase extraction
export const keyPhraseSchema = z.object({
  phrase: z.string(),
  sentiment: z.enum(["positive", "negative", "neutral"]),
});

export type KeyPhrase = z.infer<typeof keyPhraseSchema>;

// Sentiment analysis result
export const sentimentAnalysisResultSchema = z.object({
  sentiment: z.enum(["positive", "negative", "neutral"]),
  sentimentScore: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  emotions: z.array(emotionSchema),
  insights: z.array(insightSchema),
  recommendations: z.array(recommendationSchema),
  keyPhrases: z.array(keyPhraseSchema),
  summary: z.string(),
  detailedAnalysis: z.string(),
  customerIntent: z.string(),
  urgencyLevel: z.enum(["critical", "high", "medium", "low"]),
});

export type SentimentAnalysisResult = z.infer<typeof sentimentAnalysisResultSchema>;

// Batch analysis schemas
export const batchFeedbackItemSchema = z.object({
  id: z.string(),
  feedback: z.string(),
  result: sentimentAnalysisResultSchema.optional(),
  status: z.enum(["pending", "processing", "completed", "error"]),
  error: z.string().optional(),
});

export type BatchFeedbackItem = z.infer<typeof batchFeedbackItemSchema>;

export const batchAnalysisRequestSchema = z.object({
  feedbacks: z.array(z.string().min(1).max(5000)).min(1).max(100),
});

export type BatchAnalysisRequest = z.infer<typeof batchAnalysisRequestSchema>;

export const batchAnalysisSummarySchema = z.object({
  totalCount: z.number(),
  positiveCount: z.number(),
  negativeCount: z.number(),
  neutralCount: z.number(),
  averageSentimentScore: z.number(),
  averageConfidence: z.number(),
  topEmotions: z.array(z.object({ name: z.string(), count: z.number() })),
  urgencyBreakdown: z.object({
    critical: z.number(),
    high: z.number(),
    medium: z.number(),
    low: z.number(),
  }),
  commonThemes: z.array(z.string()),
  overallRecommendations: z.array(recommendationSchema),
});

export type BatchAnalysisSummary = z.infer<typeof batchAnalysisSummarySchema>;

export const batchAnalysisResultSchema = z.object({
  items: z.array(batchFeedbackItemSchema),
  summary: batchAnalysisSummarySchema,
});

export type BatchAnalysisResult = z.infer<typeof batchAnalysisResultSchema>;

// Sample feedback for quick testing
export const sampleFeedbacks = [
  "The product arrived quickly and exceeded my expectations. Great quality and the customer service team was very helpful when I had questions.",
  "I've been waiting 3 weeks for my order. No tracking updates, no response from support. This is completely unacceptable.",
  "The quality is okay for the price, but shipping took longer than expected. Would consider buying again if delivery improves.",
];

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
  icon: z.string().optional(),
});

export type Emotion = z.infer<typeof emotionSchema>;

// Key insight
export const insightSchema = z.object({
  text: z.string(),
  priority: z.enum(["high", "medium", "low"]),
});

export type Insight = z.infer<typeof insightSchema>;

// Sentiment analysis result
export const sentimentAnalysisResultSchema = z.object({
  sentiment: z.enum(["positive", "negative", "neutral"]),
  sentimentScore: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  emotions: z.array(emotionSchema),
  insights: z.array(insightSchema),
  summary: z.string(),
});

export type SentimentAnalysisResult = z.infer<typeof sentimentAnalysisResultSchema>;

// Sample feedback for quick testing
export const sampleFeedbacks = [
  "The product arrived quickly and exceeded my expectations. Great quality and the customer service team was very helpful when I had questions.",
  "I've been waiting 3 weeks for my order. No tracking updates, no response from support. This is completely unacceptable.",
  "The quality is okay for the price, but shipping took longer than expected. Would consider buying again if delivery improves.",
];

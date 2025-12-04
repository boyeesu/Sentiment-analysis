import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, MessageSquareText, TrendingUp, Lightbulb, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { sampleFeedbacks, type SentimentAnalysisResult } from "@shared/schema";

export default function Home() {
  const [feedback, setFeedback] = useState("");
  const [result, setResult] = useState<SentimentAnalysisResult | null>(null);
  const { toast } = useToast();

  const analyzeMutation = useMutation({
    mutationFn: async (feedbackText: string) => {
      const response = await apiRequest("POST", "/api/analyze", { feedback: feedbackText });
      const data = await response.json();
      return {
        sentiment: data.sentiment || "neutral",
        sentimentScore: data.sentimentScore || 50,
        confidence: data.confidence || 0,
        emotions: data.emotions || [],
        insights: data.insights || [],
        summary: data.summary || "",
      } as SentimentAnalysisResult;
    },
    onSuccess: (data) => {
      setResult(data);
      toast({
        title: "Analysis Complete",
        description: "Your feedback has been analyzed successfully.",
      });
    },
    onError: (error: Error) => {
      let errorMessage = "Failed to analyze feedback. Please try again.";
      try {
        const parsed = JSON.parse(error.message.split(": ").slice(1).join(": "));
        if (parsed.message) errorMessage = parsed.message;
        else if (parsed.error) errorMessage = parsed.error;
      } catch {
        if (error.message) errorMessage = error.message;
      }
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleAnalyze = () => {
    if (!feedback.trim()) {
      toast({
        title: "Empty Feedback",
        description: "Please enter some customer feedback to analyze.",
        variant: "destructive",
      });
      return;
    }
    analyzeMutation.mutate(feedback);
  };

  const handleSampleClick = (sample: string) => {
    setFeedback(sample);
    setResult(null);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "text-emerald-600 dark:text-emerald-400";
      case "negative":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-amber-600 dark:text-amber-400";
    }
  };

  const getSentimentBg = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-emerald-50 dark:bg-emerald-950/30";
      case "negative":
        return "bg-red-50 dark:bg-red-950/30";
      default:
        return "bg-amber-50 dark:bg-amber-950/30";
    }
  };

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      joy: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
      satisfaction: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
      gratitude: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
      frustration: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      anger: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
      disappointment: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
      confusion: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
      neutral: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
      anticipation: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      trust: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
    };
    return colors[emotion.toLowerCase()] || "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-red-500";
      case "medium":
        return "border-l-amber-500";
      default:
        return "border-l-emerald-500";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/50 to-background dark:from-teal-950/20 dark:to-background">
      {/* Hero Section */}
      <section className="py-12 md:py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-primary uppercase tracking-wide">
              AI-Powered Analysis
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            Understand Your Customer Feedback
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Paste customer feedback below and get instant AI analysis of sentiment, emotions, and actionable insights.
          </p>
        </div>
      </section>

      {/* Input Section */}
      <section className="px-6 pb-12">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-md">
            <CardContent className="p-6 md:p-8">
              <label
                htmlFor="feedback-input"
                className="block text-sm font-medium uppercase tracking-wide text-foreground mb-3"
              >
                Customer Feedback
              </label>
              <Textarea
                id="feedback-input"
                data-testid="input-feedback"
                placeholder="Paste your customer feedback here to analyze sentiment, emotions, and get actionable insights..."
                className="min-h-64 resize-none text-base focus:border-primary focus:ring-primary"
                value={feedback}
                onChange={(e) => {
                  setFeedback(e.target.value);
                  if (result) setResult(null);
                }}
                maxLength={5000}
              />

              {/* Quick Samples */}
              <div className="mt-6">
                <p className="text-sm font-medium text-muted-foreground mb-3">
                  Quick samples to try:
                </p>
                <div className="flex flex-wrap gap-2">
                  {sampleFeedbacks.map((sample, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      data-testid={`button-sample-${index}`}
                      className="text-left truncate max-w-xs"
                      onClick={() => handleSampleClick(sample)}
                    >
                      "{sample.substring(0, 40)}..."
                    </Button>
                  ))}
                </div>
              </div>

              {/* Character Count & Analyze Button */}
              <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
                <span className="text-sm text-muted-foreground" data-testid="text-character-count">
                  {feedback.length} characters
                </span>
                <Button
                  data-testid="button-analyze"
                  onClick={handleAnalyze}
                  disabled={analyzeMutation.isPending || !feedback.trim()}
                  className="gap-2"
                >
                  {analyzeMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Analyze Sentiment
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Results Section */}
      {result && (
        <section className="px-6 pb-20 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <Check className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Analysis Results</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Sentiment Score Card */}
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                    Sentiment Score
                  </CardTitle>
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="pt-4">
                  <div className={`inline-flex items-center gap-3 px-4 py-3 rounded-lg ${getSentimentBg(result.sentiment)}`}>
                    <span
                      className={`text-5xl font-bold ${getSentimentColor(result.sentiment)}`}
                      data-testid="text-sentiment-score"
                    >
                      {result.sentimentScore}%
                    </span>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Sentiment</span>
                      <Badge
                        variant="secondary"
                        className={`capitalize ${getSentimentColor(result.sentiment)}`}
                        data-testid="badge-sentiment"
                      >
                        {result.sentiment}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Confidence</span>
                      <span className="text-sm font-medium" data-testid="text-confidence">
                        {result.confidence}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Emotions Card */}
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                    Detected Emotions
                  </CardTitle>
                  <MessageSquareText className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex flex-wrap gap-2" data-testid="container-emotions">
                    {(result.emotions ?? []).map((emotion, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className={`${getEmotionColor(emotion.name)} capitalize`}
                        data-testid={`badge-emotion-${index}`}
                      >
                        {emotion.name} ({emotion.intensity}%)
                      </Badge>
                    ))}
                  </div>
                  {(!result.emotions || result.emotions.length === 0) && (
                    <p className="text-sm text-muted-foreground">No specific emotions detected.</p>
                  )}
                </CardContent>
              </Card>

              {/* Key Insights Card */}
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                    Key Insights
                  </CardTitle>
                  <Lightbulb className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3" data-testid="container-insights">
                    {(result.insights ?? []).map((insight, index) => (
                      <div
                        key={index}
                        className={`pl-3 border-l-2 ${getPriorityColor(insight.priority)}`}
                        data-testid={`insight-${index}`}
                      >
                        <p className="text-sm text-foreground">{insight.text}</p>
                      </div>
                    ))}
                  </div>
                  {(!result.insights || result.insights.length === 0) && (
                    <p className="text-sm text-muted-foreground">No specific insights available.</p>
                  )}
                  {result.summary && (
                    <p className="mt-4 text-sm text-muted-foreground italic" data-testid="text-summary">
                      {result.summary}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Empty State */}
      {!result && !analyzeMutation.isPending && (
        <section className="px-6 pb-20">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/30 rounded-lg border border-dashed">
              <MessageSquareText className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                Paste customer feedback above to analyze sentiment
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Loading State */}
      {analyzeMutation.isPending && (
        <section className="px-6 pb-20">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/30 rounded-lg border">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">
                Analyzing your feedback with AI...
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

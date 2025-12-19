import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Upload,
  FileText,
  Loader2,
  Check,
  AlertTriangle,
  TrendingUp,
  PieChart,
  BarChart3,
  Zap,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { BatchAnalysisResult, BatchFeedbackItem } from "@shared/schema";

// Common field names that likely contain customer feedback
const FEEDBACK_FIELD_CANDIDATES = [
  "feedback", "comment", "comments", "review", "reviews", "text", "message",
  "content", "description", "query", "question", "complaint", "note", "notes",
  "customer_feedback", "customerFeedback", "user_feedback", "userFeedback",
  "customer_comment", "customerComment", "response", "input", "body",
];

function findFeedbackField(obj: Record<string, unknown>): string | null {
  const keys = Object.keys(obj);
  // First, check exact matches (case-insensitive)
  for (const candidate of FEEDBACK_FIELD_CANDIDATES) {
    const match = keys.find((k) => k.toLowerCase() === candidate.toLowerCase());
    if (match && typeof obj[match] === "string" && obj[match]) return match;
  }
  // Then check partial matches
  for (const candidate of FEEDBACK_FIELD_CANDIDATES) {
    const match = keys.find((k) => k.toLowerCase().includes(candidate.toLowerCase()));
    if (match && typeof obj[match] === "string" && obj[match]) return match;
  }
  // Fallback: find the longest string field (likely the feedback)
  let longestField: string | null = null;
  let maxLength = 0;
  for (const key of keys) {
    const val = obj[key];
    if (typeof val === "string" && val.length > maxLength && val.length > 10) {
      maxLength = val.length;
      longestField = key;
    }
  }
  return longestField;
}

function extractFeedbacksFromCsv(text: string): string[] {
  const lines = text.split("\n").filter((line) => line.trim());
  if (lines.length === 0) return [];

  // Parse header to find feedback column
  const header = lines[0].split(",").map((h) => h.trim().replace(/^["']|["']$/g, ""));
  let feedbackColIndex = -1;

  // Find the feedback column by matching candidates
  for (const candidate of FEEDBACK_FIELD_CANDIDATES) {
    const idx = header.findIndex((h) => h.toLowerCase() === candidate.toLowerCase());
    if (idx !== -1) {
      feedbackColIndex = idx;
      break;
    }
  }
  // Partial match fallback
  if (feedbackColIndex === -1) {
    for (const candidate of FEEDBACK_FIELD_CANDIDATES) {
      const idx = header.findIndex((h) => h.toLowerCase().includes(candidate.toLowerCase()));
      if (idx !== -1) {
        feedbackColIndex = idx;
        break;
      }
    }
  }

  // If no header match, check if first row looks like a header
  const hasHeader = header.some((h) => /^[a-zA-Z_]+$/.test(h) && h.length < 30);

  if (feedbackColIndex !== -1 && hasHeader) {
    // Extract from specific column
    return lines.slice(1).map((line) => {
      const cols = parseCSVLine(line);
      return cols[feedbackColIndex]?.trim() || "";
    }).filter(Boolean);
  }

  // Single column or no header detected - treat each line as feedback
  const startIndex = hasHeader ? 1 : 0;
  return lines.slice(startIndex).map((line) => {
    const cols = parseCSVLine(line);
    // If multiple columns, find the longest one (likely feedback)
    if (cols.length > 1) {
      return cols.reduce((a, b) => (a.length > b.length ? a : b), "").trim();
    }
    return cols[0]?.trim() || "";
  }).filter(Boolean);
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && (i === 0 || line[i - 1] !== "\\")) {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.replace(/^["']|["']$/g, ""));
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.replace(/^["']|["']$/g, ""));
  return result;
}

function extractFeedbacksFromJson(json: unknown): string[] {
  // Handle array of strings
  if (Array.isArray(json)) {
    if (json.length === 0) return [];
    if (typeof json[0] === "string") {
      return json.filter((item) => typeof item === "string" && item.trim());
    }
    // Array of objects - detect the feedback field from first item
    if (typeof json[0] === "object" && json[0] !== null) {
      const feedbackField = findFeedbackField(json[0] as Record<string, unknown>);
      if (feedbackField) {
        return json
          .map((item) => (item as Record<string, unknown>)[feedbackField])
          .filter((val): val is string => typeof val === "string" && val.trim().length > 0);
      }
    }
    return [];
  }
  // Handle object with array property
  if (typeof json === "object" && json !== null) {
    const obj = json as Record<string, unknown>;
    // Look for array properties
    for (const key of Object.keys(obj)) {
      if (Array.isArray(obj[key])) {
        const result = extractFeedbacksFromJson(obj[key]);
        if (result.length > 0) return result;
      }
    }
  }
  return [];
}

export default function BatchAnalysis() {
  const [file, setFile] = useState<File | null>(null);
  const [feedbacks, setFeedbacks] = useState<string[]>([]);
  const [result, setResult] = useState<BatchAnalysisResult | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const analyzeMutation = useMutation({
    mutationFn: async (feedbackList: string[]) => {
      const response = await apiRequest("POST", "/api/analyze/batch", { feedbacks: feedbackList });
      return (await response.json()) as BatchAnalysisResult;
    },
    onSuccess: (data) => {
      setResult(data);
      toast({
        title: "Batch Analysis Complete",
        description: `Analyzed ${data.items.length} feedback items.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze feedback batch.",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setResult(null);

    try {
      const text = await selectedFile.text();
      let parsed: string[] = [];

      if (selectedFile.name.endsWith(".json")) {
        const json = JSON.parse(text);
        parsed = extractFeedbacksFromJson(json);
      } else if (selectedFile.name.endsWith(".csv")) {
        parsed = extractFeedbacksFromCsv(text);
      } else {
        // Plain text - split by double newlines or treat each line as feedback
        parsed = text.split(/\n\n+/).map((s) => s.trim()).filter(Boolean);
        if (parsed.length === 1) {
          parsed = text.split("\n").map((s) => s.trim()).filter(Boolean);
        }
      }

      if (parsed.length === 0) {
        toast({
          title: "No Feedback Found",
          description: "Could not extract feedback from the file.",
          variant: "destructive",
        });
        return;
      }

      if (parsed.length > 100) {
        parsed = parsed.slice(0, 100);
        toast({
          title: "Limit Applied",
          description: "Only the first 100 feedback items will be processed.",
        });
      }

      setFeedbacks(parsed);
      toast({
        title: "File Loaded",
        description: `Found ${parsed.length} feedback items.`,
      });
    } catch {
      toast({
        title: "Parse Error",
        description: "Failed to parse the file. Please check the format.",
        variant: "destructive",
      });
    }
  };


  const handleAnalyze = () => {
    if (feedbacks.length === 0) {
      toast({
        title: "No Feedback",
        description: "Please upload a file with feedback first.",
        variant: "destructive",
      });
      return;
    }
    analyzeMutation.mutate(feedbacks);
  };

  const handleClear = () => {
    setFile(null);
    setFeedbacks([]);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return "text-emerald-600 dark:text-emerald-400";
      case "negative": return "text-red-600 dark:text-red-400";
      default: return "text-amber-600 dark:text-amber-400";
    }
  };

  const getSentimentBg = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return "bg-emerald-100 dark:bg-emerald-900/30";
      case "negative": return "bg-red-100 dark:bg-red-900/30";
      default: return "bg-amber-100 dark:bg-amber-900/30";
    }
  };

  const getStatusIcon = (status: BatchFeedbackItem["status"]) => {
    switch (status) {
      case "completed": return <Check className="w-4 h-4 text-emerald-500" />;
      case "error": return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "processing": return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default: return <div className="w-4 h-4 rounded-full bg-gray-300" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/50 to-background dark:from-sky-950/20 dark:to-background">
      {/* Header */}
      <section className="py-12 md:py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-primary uppercase tracking-wide">
              Batch Processing
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
            Analyze Multiple Feedbacks
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Upload a file containing customer feedbacks to analyze them all at once and get aggregated insights.
          </p>
        </div>
      </section>

      {/* Upload Section */}
      <section className="px-6 pb-8">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-md">
            <CardContent className="p-6 md:p-8">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.csv,.txt"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />

              {!file ? (
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary hover:bg-muted/30 transition-colors"
                >
                  <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-foreground font-medium mb-1">Click to upload a file</p>
                  <p className="text-sm text-muted-foreground">
                    Supports JSON, CSV, or TXT files (max 100 feedbacks)
                  </p>
                </label>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {feedbacks.length} feedback items found
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleClear}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {feedbacks.length > 0 && (
                    <div className="max-h-48 overflow-y-auto space-y-2 p-3 bg-muted/20 rounded-lg">
                      {feedbacks.slice(0, 5).map((fb, i) => (
                        <p key={i} className="text-sm text-muted-foreground truncate">
                          {i + 1}. {fb}
                        </p>
                      ))}
                      {feedbacks.length > 5 && (
                        <p className="text-sm text-muted-foreground italic">
                          ...and {feedbacks.length - 5} more
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={handleClear}>
                      Clear
                    </Button>
                    <Button
                      onClick={handleAnalyze}
                      disabled={analyzeMutation.isPending || feedbacks.length === 0}
                      className="gap-2"
                    >
                      {analyzeMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Analyzing {feedbacks.length} items...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          Analyze All
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>


      {/* Results Section */}
      {result && (
        <section className="px-6 pb-20 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          <div className="max-w-6xl mx-auto">
            {/* Summary Cards */}
            <div className="flex items-center gap-2 mb-6">
              <PieChart className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Batch Summary</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="shadow-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-foreground">{result.summary.totalCount}</p>
                  <p className="text-sm text-muted-foreground">Total Analyzed</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-emerald-600">{result.summary.positiveCount}</p>
                  <p className="text-sm text-muted-foreground">Positive</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-red-600">{result.summary.negativeCount}</p>
                  <p className="text-sm text-muted-foreground">Negative</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-amber-600">{result.summary.neutralCount}</p>
                  <p className="text-sm text-muted-foreground">Neutral</p>
                </CardContent>
              </Card>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Average Sentiment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-foreground">{result.summary.averageSentimentScore}%</p>
                  <p className="text-sm text-muted-foreground">Confidence: {result.summary.averageConfidence}%</p>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Urgency Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-red-600">Critical</span>
                      <span className="font-medium">{result.summary.urgencyBreakdown.critical}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-orange-600">High</span>
                      <span className="font-medium">{result.summary.urgencyBreakdown.high}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-amber-600">Medium</span>
                      <span className="font-medium">{result.summary.urgencyBreakdown.medium}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-600">Low</span>
                      <span className="font-medium">{result.summary.urgencyBreakdown.low}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                    Top Emotions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {result.summary.topEmotions.map((emotion, i) => (
                      <Badge key={i} variant="secondary" className="capitalize">
                        {emotion.name} ({emotion.count})
                      </Badge>
                    ))}
                    {result.summary.topEmotions.length === 0 && (
                      <p className="text-sm text-muted-foreground">No emotions detected</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Common Themes */}
            {result.summary.commonThemes.length > 0 && (
              <Card className="shadow-sm mb-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                    Common Themes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {result.summary.commonThemes.map((theme, i) => (
                      <Badge key={i} variant="outline">"{theme}"</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Overall Recommendations */}
            {result.summary.overallRecommendations.length > 0 && (
              <Card className="shadow-sm mb-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Top Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.summary.overallRecommendations.map((rec, i) => (
                      <div key={i} className="p-4 rounded-lg border bg-muted/20">
                        <h4 className="font-medium text-foreground mb-1">{rec.title}</h4>
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Individual Results */}
            <div className="flex items-center gap-2 mb-4 mt-8">
              <FileText className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Individual Results</h2>
            </div>

            <div className="space-y-3">
              {result.items.map((item) => (
                <Card key={item.id} className="shadow-sm">
                  <CardContent className="p-4">
                    <div
                      className="flex items-start justify-between gap-4 cursor-pointer"
                      onClick={() => toggleExpand(item.id)}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {getStatusIcon(item.status)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground line-clamp-2">{item.feedback}</p>
                          {item.result && (
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className={`${getSentimentBg(item.result.sentiment)} ${getSentimentColor(item.result.sentiment)} capitalize`}>
                                {item.result.sentiment}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                Score: {item.result.sentimentScore}%
                              </span>
                            </div>
                          )}
                          {item.error && (
                            <p className="text-sm text-red-500 mt-1">{item.error}</p>
                          )}
                        </div>
                      </div>
                      {item.result && (
                        expandedItems.has(item.id) ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        )
                      )}
                    </div>

                    {expandedItems.has(item.id) && item.result && (
                      <div className="mt-4 pt-4 border-t space-y-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Summary</p>
                          <p className="text-sm text-foreground">{item.result.summary}</p>
                        </div>
                        {item.result.emotions.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Emotions</p>
                            <div className="flex flex-wrap gap-1">
                              {item.result.emotions.map((e, i) => (
                                <Badge key={i} variant="secondary" className="text-xs capitalize">
                                  {e.name} ({e.intensity}%)
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {item.result.insights.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Insights</p>
                            <ul className="text-sm text-foreground space-y-1">
                              {item.result.insights.map((ins, i) => (
                                <li key={i}>• {ins.text}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
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
                Processing {feedbacks.length} feedback items...
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                This may take a few minutes
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export type AnalysisSignal = {
  name: string;
  score?: number;
  details?: string;
};

export type StockAnalysis = {
  symbol: string;
  summary?: string;
  overallScore?: number;
  signals?: AnalysisSignal[];
  riskLevel?: "low" | "medium" | "high" | string;
  timestamp?: number;
  raw?: Record<string, unknown>;
};

export default {} as StockAnalysis;


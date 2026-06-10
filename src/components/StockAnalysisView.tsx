import React, { useEffect, useState } from "react";
import type { StockAnalysis } from "../types/StockAnalysis";
import type { StockDetails } from "../types/StockDetails";
import { ScoringBreakdown } from "./ScoringBreakdown";
import { mapScoreSnapshot } from "../utils/mapScoreSnapshot";

type StockAnalysisViewProps = {
  analysis: StockAnalysis | null;
  selectedSymbol: string | null;
  apiBase: string;
  details: StockDetails | null;
  loading?: boolean;
  onSymbolSelect?: (symbol: string) => void;
};

export const StockAnalysisView: React.FC<StockAnalysisViewProps> = ({
  analysis,
  selectedSymbol,
  apiBase,
  details,
  loading: parentLoading = false,
  onSymbolSelect,
}) => {
  const [scoreDetails, setScoreDetails] = useState<StockDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  useEffect(() => {
    if (!selectedSymbol) {
      setScoreDetails(null);
      setLoading(false);
      setError(null);
      return;
    }

    const symbol = selectedSymbol.trim().toUpperCase();

    // Reuse details from parent if symbol matches
    if (details && details.symbol && details.symbol.toUpperCase() === symbol) {
      const hasCandles = (details.candles?.length ?? 0) > 0;
      const hasScore = (details.total_score ?? details.totalScore) != null;
      if (hasCandles && hasScore) {
        setScoreDetails(details);
        setLoading(false);
        setError(null);
        return;
      }
    }

    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const fetchScoreSnapshot = async () => {
      setLoading(true);
      setError(null);

      try {
        const url = apiBase
          ? `${apiBase.replace(/\/$/, "")}/scores/snapshot/${encodeURIComponent(
              symbol
            )}`
          : `/scores/snapshot/${encodeURIComponent(symbol)}`;

        const res = await fetch(url, {
          headers: {
            "ngrok-skip-browser-warning": "true",
          },
          signal: abortControllerRef.current?.signal,
        });
        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status}`);
        }

        const json = await res.json();
        const mapped = mapScoreSnapshot(json);
        setScoreDetails(mapped);
      } catch (err) {
        // Don't log abort errors
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error("Score snapshot fetch error:", err);
          setError("Failed to load scoring data");
        }
        setScoreDetails(null);
      } finally {
        setLoading(false);
      }
    };

    // Debounce the fetch by 200ms to handle rapid selections
    const timeoutId = setTimeout(fetchScoreSnapshot, 200);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [selectedSymbol, apiBase, details]);

  if (!analysis && !scoreDetails) {
    return <div className="text-slate-400">No analysis available.</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      <ScoringBreakdown
        details={scoreDetails}
        loading={loading || parentLoading}
        error={error}
        selectedSymbol={selectedSymbol}
        onSymbolSelect={onSymbolSelect}
      />
    </div>
  );
};

export default StockAnalysisView;

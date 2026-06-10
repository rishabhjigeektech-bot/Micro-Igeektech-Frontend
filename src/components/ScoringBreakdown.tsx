import React, { useEffect, useState, useMemo } from "react";
import type { StockDetails } from "../types/StockDetails";
import type { NewsItem } from "../types/NewsItem";
import type { EventLogItem } from "../types/EventLogItem";
import { truncate } from "../utils/formatters";
import { CandlestickPatterns } from "./CandlestickPatterns";
import { ScrollableTableContainer } from "../hooks/ScrollableTableContainer";
import { useMarketStore } from "../store/marketStore";

type ScoringBreakdownProps = {
  details: StockDetails | null;
  loading?: boolean;
  error?: string | null;
  selectedSymbol?: string | null;
  onSymbolSelect?: (symbol: string) => void;
};

const Spinner = () => <div className="text-xs text-slate-400">Loading…</div>;

export const ScoringBreakdown: React.FC<ScoringBreakdownProps> = ({
  details,
  loading = false,
  error = null,
  selectedSymbol,
  onSymbolSelect,
}) => {
  const [stock_news, setStockNews] = useState<NewsItem[]>([]);
  const [impact_news, setImpactNews] = useState<NewsItem[]>([]);
  const [events, setEvents] = useState<EventLogItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);

  // Get wheelhouse symbols from market store (stable memoized value)
  const universe = useMarketStore((state) => state.universe);
  const wheelhouseSymbols = useMemo(() => {
    try {
      return Object.values(universe || {})
        .filter((row) => row.inWheelhouse)
        .map((row) => row.symbol);
    } catch {
      return [] as string[];
    }
  }, [universe]);

  useEffect(() => {
    if (!details?.symbol) return;

    let newsController: AbortController | null = new AbortController();
    let eventsController: AbortController | null = new AbortController();
    let timeoutId: number | null = null;

    const fetchExtras = async () => {
      setNewsLoading(true);
      setEventsLoading(true);

      try {
        

        timeoutId = window.setTimeout(() => {
          newsController?.abort();
          eventsController?.abort();
        }, 4000);

        const [newsRes, eventsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_BASE}/news?symbol=${details.symbol}`, {
            signal: newsController!.signal,
            headers: { "ngrok-skip-browser-warning": "true" }
          }),
          fetch(`${import.meta.env.VITE_API_BASE}/events?symbol=${details.symbol}`, {
            signal: eventsController!.signal,
            headers: { "ngrok-skip-browser-warning": "true" }
          }),
        ]);

        // Handle news response
        if (newsRes.ok) {
          const n = await newsRes.json();
          setStockNews(Array.isArray(n?.stock_news) ? n.stock_news : []);
          setImpactNews(Array.isArray(n?.impact_news) ? n.impact_news : []);
        } else {
          setStockNews([]);
          setImpactNews([]);
        }

        // Handle events response
        if (eventsRes.ok) {
          const e = await eventsRes.json();
          setEvents(Array.isArray(e) ? e : []);
        } else {
          setEvents([]);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`✗ Error fetching news/events for ${details.symbol}:`, errorMsg);
        setStockNews([]);
        setImpactNews([]);
        setEvents([]);
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        setNewsLoading(false);
        setEventsLoading(false);
      }
    };

    fetchExtras();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      try {
        newsController?.abort();
        eventsController?.abort();
      } catch (err) {
        void err;
      }
      newsController = null;
      eventsController = null;
    };
  }, [details?.symbol, universe]);

  if (!details) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-slate-600 border-t-cyan-500 rounded-full animate-spin"></div>
          <div className="text-slate-400 text-sm">Loading scoring data…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 text-center text-xs">
        Error loading scoring data: {error}
      </div>
    );
  }

  const { components: c } = details;
  const totalScore = details.totalScore ?? null;
  const displayMaxScore = 12;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
      <CandlestickPatterns 
        wheelhouseSymbols={wheelhouseSymbols}
        selectedSymbol={selectedSymbol || details?.symbol}
        onSymbolSelect={onSymbolSelect}
      />

      <div className="grid grid-cols-2 gap-3 h-full">
        <div className={`border border-slate-800 bg-slate-900/40 rounded-md overflow-hidden flex flex-col ${loading ? 'opacity-75' : ''}`}>
          <div className="px-3 py-2 border-b border-slate-800 bg-slate-900/60 text-xs font-semibold flex items-center justify-between">
            <span>SCORING BREAKDOWN</span>
            {loading && <span className="inline-block w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>}
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-xs border-collapse">
              <tbody>
                <ScoreRow label="Premarket Move" value={c?.premarket_move} loading={loading} />

                <ScoreRow label="RVOL" value={c?.rvol} loading={loading} />

                <ScoreRow label="Float Quality" value={c?.float_quality} loading={loading} />

                <ScoreRow label="Liquidity / Avg Volume" value={c?.liquidity} loading={loading} />

                <ScoreRow
                  label="Technical Alignment"
                  value={c?.technical_alignment}
                  loading={loading}
                />

                <ScoreRow
                  label="Candlestick Pattern Quality"
                  value={c?.candlestick_pattern_quality}
                  loading={loading}
                />

                <ScoreRow label="Market Bias" value={c?.market_bias} loading={loading} />

                <ScoreRow
                  label="Spread / Tape Quality"
                  value={c?.spread_tape_quality}
                  loading={loading}
                />

                <ScoreRow label="High Velocity" value={c?.high_velocity} loading={loading} />

                <ScoreRow label="News Sector" value={c?.news_sector} loading={loading} />

                <ScoreRow label="News Sentiment" value={c?.news_sentiment} loading={loading} />

                <ScoreRow
                  label=" Session Quality / Cleanliness"
                  value={c?.session_quality}
                  loading={loading}
                />

                <tr className="bg-slate-900/60 border-t-2 border-slate-700">
                  <td className="px-3 py-2.5 font-semibold text-slate-200">
                    Total
                  </td>
                  <td className={`px-3 py-2.5 font-semibold text-emerald-300 text-right ${loading ? 'text-slate-500' : ''}`}>
                    {loading ? 'N/A' : `${totalScore?.toFixed(2) ?? "0.00"} / ${displayMaxScore.toFixed(2)}`}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Box title="Stock News" height="flex-1" useScroller={true}>
            {newsLoading ? (
              <div className="flex items-center justify-center h-full">
                <Spinner />
              </div>
            ) : stock_news.length ? (
              stock_news.slice(0, 3).map((n, index) => (
                <a
                  key={n.id}
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block hover:text-amber-400 transition-colors text-xs"
                >
                  <span className="text-cyan-400">{index + 1}.</span> {truncate(n.headline, 100)}
                </a>
              ))
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                No stock news
              </div>
            )}
          </Box>

          <Box title="Global Impact News" height="flex-1" useScroller={true}>
            {newsLoading ? (
              <div className="flex items-center justify-center h-full">
                <Spinner />
              </div>
            ) : impact_news.length ? (
              impact_news.slice(0, 3).map((n, index) => (
                <a
                  key={n.id}
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block hover:text-amber-400 transition-colors text-xs"
                >
                  <span className="text-cyan-400">{index + 1}.</span> {truncate(n.headline, 100)}
                </a>
              ))
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                No impact news
              </div>
            )}
          </Box>

          <Box title="Events" height="flex-1" useScroller={true}>
            {eventsLoading ? (
              <div className="flex items-center justify-center h-full">
                <Spinner />
              </div>
            ) : events.length ? (
              events.slice(0, 6).map((e, index) => (
                <div key={e.id} className="text-slate-300 text-xs">
                  <span className="text-cyan-400">{index + 1}.</span> {e.message}
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                No events
              </div>
            )}
          </Box>
        </div>
      </div>
    </div>
  );
};

const ScoreRow = ({
  label,
  value,
  loading = false,
}: {
  label: string;
  value?: number | null | undefined;
  loading?: boolean;
}) => (
  <tr className="border-b border-slate-800/50">
    <td className="px-3 py-2 text-slate-300">{label}:</td>
    <td className={`px-3 py-2 text-right font-semibold ${loading ? 'text-slate-500' : 'text-slate-100'}`}>
      {loading ? 'N/A' : (value != null ? value.toFixed(2) : 'N/A')}
    </td>
  </tr>
);

const Box: React.FC<{ 
  title: string; 
  children: React.ReactNode; 
  height?: string; 
  useScroller?: boolean;
  style?: React.CSSProperties;
}> = ({
  title,
  children,
  height = "flex-1",
  useScroller = false,
  style,
}) => {
  if (useScroller) {
    return (
      <div className={`bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-lg overflow-hidden ${height}`} style={style}>
        <div className="px-3 py-2 border-b border-slate-800 bg-slate-900/60 text-xs font-semibold flex items-center justify-between">
          <span>{title}</span>
        </div>
        <ScrollableTableContainer className="p-3">{children}</ScrollableTableContainer>
      </div>
    );
  }

  return (
    <div className={`bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-lg overflow-hidden ${height}`} style={style}>
      <div className="px-3 py-2 border-b border-slate-800 bg-slate-900/60 text-xs font-semibold flex items-center justify-between">
        <span>{title}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3">{children}</div>
    </div>
  );
};

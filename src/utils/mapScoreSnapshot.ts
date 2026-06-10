import type { StockDetails } from "../types/StockDetails";
import type { NewsItem } from "../types/NewsItem";
import type { EventLogItem } from "../types/EventLogItem";

type ApiScoreSnapshot = {
  symbol: string;
  total_score?: number;
  max_score?: number;
  totalScore?: number;
  maxScore?: number;
  components?: {
    premarket_move?: number;
    rvol?: number;
    news_sentiment?: number;
    float_quality?: number;
    session_quality?: number;
    liquidity?: number;
    technical_alignment?: number;
    candlestick_quality?: number;
    candlestick_pattern_quality?: number;
    market_bias?: number;
    spread_tape_quality?: number;
    high_velocity?: number;
    news_sector?: number;
    news_stock?: number;
  };
  candles?: Array<{
    time: string | number;
    open: number;
    high: number;
    low: number;
    close: number;
    pattern?: string | null;
  }>;
  patterns?: { current: string; previous: string[] };
  news?: NewsItem[];
  events?: EventLogItem[];
  signed_sentiment?: number;
};

export const mapScoreSnapshot = (api: ApiScoreSnapshot): StockDetails => {
  const c = api.components ?? {};
  const totalScore = api.total_score ?? api.totalScore;
  const maxScore = api.max_score ?? api.maxScore ?? 12;

  const result = {
    symbol: api.symbol,
    totalScore,
    total_score: totalScore,
    maxScore,
    signed_sentiment: api.signed_sentiment,

    components: {
      premarket_move: c.premarket_move ?? 0,
      rvol: c.rvol ?? 0,
      news_sentiment: c.news_sentiment ?? 0,
      float_quality: c.float_quality ?? 0,
      session_quality: c.session_quality ?? 0,
      liquidity: c.liquidity ?? 0,
      technical_alignment: c.technical_alignment ?? 0,
      candlestick_pattern_quality:
        c.candlestick_quality ?? c.candlestick_pattern_quality ?? 0,
      market_bias: c.market_bias ?? 0,
      spread_tape_quality: c.spread_tape_quality ?? 0,
      high_velocity: c.high_velocity ?? 0,

      //  BACKEND SENDS BOTH → FE HANDLES BOTH
      news_sector: c.news_sector ?? c.news_stock ?? 0,
    },

    news: api.news ?? [],
    events: api.events ?? [],
    candles: api.candles ?? [],
    patterns: api.patterns ?? undefined,
  };

  return result;
};
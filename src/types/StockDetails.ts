// types/StockDetails.ts
export type StockDetails = {
  symbol: string;
  company_name?: string;
  totalScore?: number | null;
  total_score?: number | null;
  maxScore?: number | null;
  components?: {
    premarket_move?: number | null;
    rvol?: number | null;
    news_sentiment?: number | null;
    float_quality: number | null;
    session_quality?: number | null;
    liquidity?: number | null;
    technical_alignment?: number | null;
    candlestick_pattern_quality?: number | null;
    market_bias?: number | null;
    spread_tape_quality?: number | null;
    high_velocity?: number | null;
    news_sector?: number | null;
  };

  // Wheelhouse & Gates
  wheelhouse?: boolean;
  inWheelhouse?: boolean;
  passedHardGates?: boolean;
  hardGates?: {
    price?: boolean;
    volume?: boolean;
    float?: boolean;
    liquidity?: boolean;
    catalyst?: boolean;
    technicals?: boolean;
  };

  // Price & Volume
  premarketOpen?: number | null;
  premarketChange?: number | null;
  premarketChangePct?: number | null;
  premarketVolume?: number | null;
  market_open_price?: number | null;
  currentPrice?: number | null;
  floatShares?: number | null;
  vwap?: number | null;
  relVolume1w?: number | null;

  // Technical Indicators
  avg_vol_30d?: number | null;
  ema9?: number | null;
  ema20?: number | null;
  orh5min?: number | null;
  orl5min?: number | null;

  // Individual Score Components
  candlestickPatternQuality?: number | null;
  marketBias?: number | null;
  spreadTapeQuality?: number | null;
  highVelocity?: number | null;
  newsStocks?: number | null;
  newsSector?: number | null;
  sessionQuality?: number | null;

  // Analysis & News
  analysis?: unknown;
  signed_sentiment?: number | null;
  news?: {
    id: string;
    time: string;
    source: string;
    headline: string;
    url: string;
  }[];

  events?: {
    id: string;
    time: string;
    message: string;
  }[];

  // Candlestick Data
  candles?: Array<{
    time: string | number;
    open: number;
    high: number;
    low: number;
    close: number;
    pattern?: string | null;
  }>;
  
  patterns?: { 
    current: string; 
    previous: string[] 
  };

  // Additional fields from backend
  status?: string | null;
};
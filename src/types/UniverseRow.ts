export type UniverseRow = {
  symbol: string;

  premarketOpen: number | null;
  premarketChange: number | null;
  premarketChangePct: number | null;
  premarketVolume: number | null;

  marketOpenPrice: number | null;
  currentPrice: number | null;
  floatShares: number | null;
  avg_vol_30d: number | null;

  vwap: number | null;
  ema9: number | null;
  ema20: number | null;
  orh5min: number | null;
  orl5min: number | null;
  relVolume1w: number | null;

  candlestickPatternQuality: number | null;
  marketBias: number | null;
  spreadTapeQuality: number | null;
  highVelocity: number | null;
  newsStocks: number | null;
  newsSector: number | null;
  sessionQuality: number | null;

  totalScore: number | null;
  inWheelhouse: boolean;
  passedHardGates: boolean;

  hardGates: {
    price: boolean;
    volume: boolean;
    float: boolean;
    liquidity: boolean;
    catalyst: boolean;
    technicals: boolean;
  } | null;

  gate_result: {
    price: boolean;
    premarket_pct: boolean;
    premarket_volume: boolean;
    avg_vol_30d: boolean;
    rvol: boolean;
    float: boolean;
  } | null;

  wheelhouse_gates: {
    price: string;
    rvol: string;
    float: string;
    avg_vol_30d: string;
    premarket_pct: string;
    premarket_volume: string;
  } | null;

  failed_gates: string[] | null;
};

import React, { useEffect, useState, useCallback } from "react";

type PatternDetails = {
  name: string;
  category: string;
  strength: number;
  score: number;
  description: string;
};

type CandleBar = {
  time: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
  pattern?: string | null;
  pattern_details?: PatternDetails | null;
  timestamp?: number;
};

type CandlestickData = {
  candles?: CandleBar[];
  total_score?: number | null;
  patterns?: {
    current: string;
    previous: string[];
  };
  symbol: string;
  company_name?: string;
  signed_sentiment?: number;
};

type CandlestickPatternsProps = {
  wheelhouseSymbols: string[];
  selectedSymbol?: string | null;
  onSymbolSelect?: (symbol: string) => void;
};

const Spinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      <span className="ml-3 text-slate-400 text-xs">Loading data...</span>
    </div>
  );
};

const scoreColor = (score: number | null) => {
  if (score === null) return "text-slate-400";
  return "text-emerald-300";
};

// Helper function to get latest 20 candles (like real trading platforms)
const getLatestCandles = (candles: CandleBar[], count: number = 20): CandleBar[] => {
  if (!candles || candles.length === 0) {
    return [];
  }
  const latestCandles = candles.slice(-count);
  return latestCandles;
};

const MiniCloseChart: React.FC<{ candles: CandleBar[] }> = ({ candles }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);


  if (!candles || candles.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 text-xs">
        No chart data available
      </div>
    );
  }

  const displayCandles = getLatestCandles(candles, 20);

  const width = 800;
  const height = 400;
  const padding = 40;
  const bottomPadding = 40;
  const topPadding = 100; // Increased for wider tooltip that needs more clearance

  const allPrices = displayCandles.flatMap((c) => [c.high, c.low]);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const baseRange = maxPrice - minPrice || 0.01;
  const paddedMin = minPrice - baseRange * 0.2;
  const paddedMax = maxPrice + baseRange * 0.2;
  const paddedRange = paddedMax - paddedMin;

  const chartWidth = width - padding * 2;
  const chartHeight = height - bottomPadding - topPadding;

  // Improved candle sizing - make candles more visible and consistent
  const spacing = chartWidth / displayCandles.length;
  const candleWidth = Math.min(Math.max(14, spacing * 0.65), 26); // Min 14px, max 26px

  const priceToY = (price: number) => {
    return topPadding + chartHeight - ((price - paddedMin) / paddedRange) * chartHeight;
  };

  const shouldShowLabel = (index: number) => {
    const total = displayCandles.length;
    if (total <= 6) return true;
    if (index === 0 || index === total - 1) return true;
    if (total <= 12) return index % 2 === 0;
    return index % 4 === 0;
  };

  

  return (
    <div className="relative w-full overflow-visible" style={{ zIndex: 10 }}>
      <svg
        width={width}
        height={height}
        className="w-full h-auto"
        style={{ overflow: "visible" }}
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = topPadding + chartHeight * (1 - ratio);
          const price = paddedMin + paddedRange * ratio;
          return (
            <g key={ratio}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#334155"
                strokeWidth="1"
                strokeDasharray="4,4"
                opacity="0.4"
              />
              <text
                x={padding - 5}
                y={y + 4}
                textAnchor="end"
                className="text-xs fill-slate-400"
                style={{ fontSize: "11px" }}
              >
                {price.toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* Candles - render base elements first */}
        {displayCandles.map((candle, i) => {
          const x = padding + i * spacing + spacing / 2;
          const isGreen = candle.close >= candle.open;
          const color = isGreen ? "#10b981" : "#ef4444";
          const hasPattern = candle.pattern && candle.pattern !== "null" && candle.pattern !== null;
          const isHovered = hoveredIndex === i;

          const highY = priceToY(candle.high);
          const lowY = priceToY(candle.low);
          const openY = priceToY(candle.open);
          const closeY = priceToY(candle.close);
          const bodyTop = Math.min(openY, closeY);
          const rawBodyHeight = Math.abs(openY - closeY);
          const bodyHeight = Math.max(4, rawBodyHeight);

          return (
            <g key={i}>
              {/* Pattern indicator dot - enhanced with glow effect */}
              {hasPattern && (
                <g>
                  {/* Glow ring */}
                  <circle
                    cx={x}
                    cy={highY - 25}
                    r="8"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    opacity={isHovered ? "0.6" : "0.3"}
                    className={isHovered ? "" : "animate-pulse"}
                  />
                  {/* Outer ring */}
                  <circle
                    cx={x}
                    cy={highY - 25}
                    r="6"
                    fill="#1e293b"
                    stroke="#3b82f6"
                    strokeWidth="2"
                  />
                  {/* Inner dot */}
                  <circle
                    cx={x}
                    cy={highY - 25}
                    r="3"
                    fill="#3b82f6"
                    className={isHovered ? "" : "animate-pulse"}
                  />
                </g>
              )}

              {/* Interactive hover area - larger for easier hovering */}
              <rect
                x={x - spacing / 2}
                y={topPadding}
                width={spacing}
                height={chartHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />

              {/* Normal candlestick with enhanced hover effect */}
              <g opacity={isHovered ? 1 : 0.9}>
                {/* Wick shadow for depth */}
                {isHovered && (
                  <line
                    x1={x + 1}
                    y1={highY + 1}
                    x2={x + 1}
                    y2={lowY + 1}
                    stroke="#000"
                    strokeWidth="3"
                    opacity="0.2"
                  />
                )}
                {/* Main wick */}
                <line
                  x1={x}
                  y1={highY}
                  x2={x}
                  y2={lowY}
                  stroke={color}
                  strokeWidth={isHovered ? "3" : "2"}
                  strokeLinecap="round"
                />
                {/* Body shadow for depth */}
                {isHovered && (
                  <rect
                    x={x - candleWidth / 2 + 1}
                    y={bodyTop + 1}
                    width={candleWidth}
                    height={bodyHeight}
                    fill="#000"
                    opacity="0.2"
                  />
                )}
                {/* Main body */}
                <rect
                  x={x - candleWidth / 2}
                  y={bodyTop}
                  width={candleWidth}
                  height={bodyHeight}
                  fill={color}
                  stroke={color}
                  strokeWidth={isHovered ? "2" : "1"}
                  rx="1"
                />
                {/* Highlight on hover */}
                {isHovered && (
                  <rect
                    x={x - candleWidth / 2}
                    y={bodyTop}
                    width={candleWidth}
                    height={bodyHeight}
                    fill="white"
                    opacity="0.15"
                    rx="1"
                  />
                )}
              </g>

              {/* Time labels */}
              {shouldShowLabel(i) && (
                <text
                  x={x}
                  y={height - bottomPadding + 20}
                  textAnchor="middle"
                  className="fill-slate-400"
                  style={{ fontSize: "10px" }}
                >
                  {candle.time}
                </text>
              )}
            </g>
          );
        })}

        {/* Tooltips - render last so they appear on top */}
        {displayCandles.map((candle, i) => {
          const x = padding + i * spacing + spacing / 2;
          const hasPattern = candle.pattern && candle.pattern !== "null" && candle.pattern !== null;
          const isHovered = hoveredIndex === i;

          const highY = priceToY(candle.high);

          // Enhanced tooltip dimensions and positioning
          const tooltipWidth = 420;
          const tooltipHeight = 130;
          const tooltipGap = 35;

          // Always position above candle
          const tooltipY = highY - tooltipHeight - tooltipGap;
          let tooltipX = x - tooltipWidth / 2;

          // Boundary checking - ensure tooltip stays within chart area
          const chartLeft = padding;
          const chartRight = width - padding;

          // Adjust horizontal position if tooltip goes outside chart bounds
          if (tooltipX < chartLeft) {
            tooltipX = chartLeft + 10;
          } else if (tooltipX + tooltipWidth > chartRight) {
            tooltipX = chartRight - tooltipWidth - 10;
          }

          // Arrow pointing down to candle
          const arrowX = Math.max(tooltipX + 20, Math.min(x, tooltipX + tooltipWidth - 20));
          const arrowPath = `M ${arrowX - 10} ${tooltipY + tooltipHeight} L ${arrowX} ${tooltipY + tooltipHeight + 10} L ${arrowX + 10} ${tooltipY + tooltipHeight}`;

          // Get pattern details from the candle data
          const patternDetails = candle.pattern_details as PatternDetails | undefined;
          const strength = patternDetails?.strength || 0;
          const description = patternDetails?.description || '';

          return (
            hasPattern && isHovered && (
              <g key={`tooltip-${i}`} className="pointer-events-none" style={{ zIndex: 1000 }}>
                {/* Outer glow effect */}
                <rect
                  x={tooltipX - 2}
                  y={tooltipY - 2}
                  width={tooltipWidth + 4}
                  height={tooltipHeight + 4}
                  rx="10"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="1"
                  opacity="0.3"
                  filter="url(#tooltipGlow)"
                />
                
                {/* Tooltip background with gradient */}
                <rect
                  x={tooltipX}
                  y={tooltipY}
                  width={tooltipWidth}
                  height={tooltipHeight}
                  rx="8"
                  fill="url(#tooltipGradient)"
                  stroke="#475569"
                  strokeWidth="1.5"
                  filter="url(#tooltipShadow)"
                />
                
                {/* Inner border for depth */}
                <rect
                  x={tooltipX + 1}
                  y={tooltipY + 1}
                  width={tooltipWidth - 2}
                  height={tooltipHeight - 2}
                  rx="7"
                  fill="none"
                  stroke="#64748b"
                  strokeWidth="0.5"
                  opacity="0.3"
                />
                
                {/* Pattern name - larger and bold with shadow */}
                <text
                  x={tooltipX + 18}
                  y={tooltipY + 30}
                  className="fill-white font-bold"
                  style={{ fontSize: "15px", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}
                >
                  {candle.pattern}
                </text>
                
                {/* Strength label */}
                <text
                  x={tooltipX + 18}
                  y={tooltipY + 52}
                  className="fill-slate-300 font-medium"
                  style={{ fontSize: "11px" }}
                >
                  Signal Strength
                </text>
                
                {/* Strength bar container with subtle inner shadow */}
                <rect
                  x={tooltipX + 18}
                  y={tooltipY + 58}
                  width={tooltipWidth - 36}
                  height="24"
                  rx="5"
                  fill="#1e293b"
                  stroke="#334155"
                  strokeWidth="1"
                />
                
                {/* Strength bar fill with gradient */}
                <defs>
                  <linearGradient id={`strengthGradient${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={strength > 0.7 ? "#10b981" : strength > 0.4 ? "#f59e0b" : "#ef4444"} />
                    <stop offset="100%" stopColor={strength > 0.7 ? "#059669" : strength > 0.4 ? "#d97706" : "#dc2626"} />
                  </linearGradient>
                </defs>
                
                <rect
                  x={tooltipX + 18}
                  y={tooltipY + 58}
                  width={(tooltipWidth - 36) * strength}
                  height="24"
                  rx="5"
                  fill={`url(#strengthGradient${i})`}
                />
                
                {/* Strength percentage text with better positioning */}
                <text
                  x={tooltipX + tooltipWidth / 2}
                  y={tooltipY + 74}
                  textAnchor="middle"
                  className="fill-white font-bold"
                  style={{ fontSize: "13px", textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
                >
                  {(strength * 100).toFixed(0)}%
                </text>
                
                {/* Description with better text wrapping */}
                <foreignObject
                  x={tooltipX + 18}
                  y={tooltipY + 92}
                  width={tooltipWidth - 36}
                  height="35"
                >
                  <div 
                    className="text-slate-300 leading-snug"
                    style={{ 
                      fontSize: "11px",
                      lineHeight: "1.4",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden"
                    }}
                  >
                    {description}
                  </div>
                </foreignObject>
                
                {/* Arrow pointing to candle with gradient */}
                <path
                  d={arrowPath}
                  fill="#475569"
                  stroke="none"
                  filter="url(#arrowShadow)"
                />
              </g>
            )
          );
        })}

        {/* SVG Filters and Gradients */}
        <defs>
          {/* Enhanced shadow filter for tooltip */}
          <filter id="tooltipShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="6" />
            <feOffset dx="0" dy="4" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.6" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Glow effect for tooltip */}
          <filter id="tooltipGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Arrow shadow */}
          <filter id="arrowShadow">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
            <feOffset dx="0" dy="2" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Tooltip background gradient */}
          <linearGradient id="tooltipGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" stopOpacity="0.98" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.98" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export const CandlestickPatterns: React.FC<CandlestickPatternsProps> = ({ 
  wheelhouseSymbols, 
  selectedSymbol: propSelectedSymbol, 
  // onSymbolSelect 
}) => {
  const [data, setData] = useState<CandlestickData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [internalSelectedSymbol, setInternalSelectedSymbol] = useState<string | null>(null);

  // Use either external selected symbol or internal state, default to first wheelhouse symbol
  const selectedSymbol = propSelectedSymbol || internalSelectedSymbol || (wheelhouseSymbols.length > 0 ? wheelhouseSymbols[0] : null);

  // Update internal selection when wheelhouse symbols change
  useEffect(() => {
    if (wheelhouseSymbols.length > 0 && !propSelectedSymbol && !internalSelectedSymbol) {
      setInternalSelectedSymbol(wheelhouseSymbols[0]);
    }
  }, [wheelhouseSymbols, propSelectedSymbol, internalSelectedSymbol]);

  // Fallback API fetch function
  const fetchCandlestickDataFromAPI = useCallback(async () => {
    
    try {
      
      setLoading(true);
      setError(null);

      const apiBase = import.meta.env.VITE_API_BASE;
      const url = `${apiBase}/api/candlestick/${selectedSymbol}`;
      

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
      });


      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();

      setData(responseData);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`✗ Fallback API error:`, errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [selectedSymbol]);

  useEffect(() => {
    if (!selectedSymbol) {
      setData(null);
      setLoading(false);
      return;
    }

    // Start with fallback API immediately
    const initialTimeout = setTimeout(() => {
      
      fetchCandlestickDataFromAPI();
    }, 500);

    // Set up fallback API polling every 60 seconds
    const intervalId = setInterval(() => {
      fetchCandlestickDataFromAPI();
    }, 60000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
    };
  }, [selectedSymbol, fetchCandlestickDataFromAPI]);

  const displayCandles = data?.candles || [];
  const totalScore = data?.total_score ?? null;
  const company_name = data?.company_name || "";
  // const displaySymbol = selectedSymbol || data?.symbol || "N/A";

  // Always show latest 20 candles (like real trading platforms)
  const candlesToShow = getLatestCandles(displayCandles, 20);
  const timeRange =
    candlesToShow.length > 0
      ? `${candlesToShow[0].time} - ${candlesToShow[candlesToShow.length - 1].time}`
      : null;

  return (
    <div className="border border-slate-800 bg-slate-900/40 rounded-md overflow-hidden flex flex-col">
      {/* Header with symbol selector */}
      <div className="px-3 py-2 border-b border-slate-800 bg-slate-900/60 text-xs font-semibold flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          {company_name && <span className="text-slate-400">{company_name}</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${scoreColor(totalScore)}`}>
            {totalScore !== null ? `${totalScore.toFixed(2)} / 12.00` : "N/A"}
          </span>
        </div>
      </div>

      {/* Subheader for time range */}
      {timeRange && !loading && (
        <div className="px-3 py-1.5 bg-slate-900/30 border-b border-slate-800/50">
          <p className="text-xs text-slate-400">
            {timeRange} • {candlesToShow.length} candles
          </p>
        </div>
      )}

      {/* Chart content */}
      <div className="flex-1 overflow-hidden p-4">
        {loading ? (
          <Spinner />
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-red-400 font-semibold mb-2 text-xs">Unable to load chart</p>
            <p className="text-slate-500 text-xs">{error}</p>
          </div>
        ) : candlesToShow.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500 text-xs">
            No candlestick data available
          </div>
        ) : (
          <MiniCloseChart candles={candlesToShow} />
        )}
      </div>
    </div>
  );
};

export default CandlestickPatterns;
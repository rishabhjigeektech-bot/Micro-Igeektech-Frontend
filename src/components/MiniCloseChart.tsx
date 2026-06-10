import React, { useEffect, useRef } from "react";
// import Chart from "react-apexcharts";
type CandleBar = {
  time: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
};

type MiniCloseChartProps = {
  candles: CandleBar[];
};

// Simple SVG-based candlestick chart (no ApexCharts dependency)
export const MiniCloseChart: React.FC<MiniCloseChartProps> = ({ candles }) => {
  if (!candles || candles.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-xs text-slate-500">
        No data available
      </div>
    );
  }

  // Calculate chart dimensions
  const width = 100; // percentage-based
  const height = 100;
  const padding = 5;

  // Get price range
  const allPrices = candles.flatMap((c) => [c.high, c.low]);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const priceRange = maxPrice - minPrice || 1;

  const candleWidth = ((width - padding * 2) / candles.length) * 0.6;
  const spacing = (width - padding * 2) / candles.length;

  // Map price to Y coordinate
  const priceToY = (price: number) => {
    return (
      height -
      padding -
      ((price - minPrice) / priceRange) * (height - padding * 2)
    );
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-full"
      style={{ background: "transparent" }}
    >
      {/* Grid lines */}
      {[0, 25, 50, 75, 100].map((y) => (
        <line
          key={y}
          x1={padding}
          y1={y}
          x2={width - padding}
          y2={y}
          stroke="#1e293b"
          strokeWidth="0.2"
          strokeDasharray="1,1"
        />
      ))}

      {/* Candlesticks */}
      {candles.map((candle, i) => {
        const x = padding + i * spacing + spacing / 2;
        const isGreen = candle.close >= candle.open;
        const color = isGreen ? "#10b981" : "#ef4444";

        const highY = priceToY(candle.high);
        const lowY = priceToY(candle.low);
        const openY = priceToY(candle.open);
        const closeY = priceToY(candle.close);

        const bodyTop = Math.min(openY, closeY);
        const bodyHeight = Math.abs(openY - closeY) || 0.5;

        return (
          <g key={i}>
            {/* Wick */}
            <line
              x1={x}
              y1={highY}
              x2={x}
              y2={lowY}
              stroke={color}
              strokeWidth="0.3"
            />
            {/* Body */}
            <rect
              x={x - candleWidth / 2}
              y={bodyTop}
              width={candleWidth}
              height={bodyHeight}
              fill={color}
              stroke={color}
              strokeWidth="0.2"
            />
          </g>
        );
      })}
    </svg>
  );
};

// Alternative using Chart.js if ApexCharts isn't working
const MiniCloseChartChartJS: React.FC<MiniCloseChartProps> = ({ candles }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !candles.length) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = rect.width;
    const height = rect.height;
    const padding = 10;

    // Clear
    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, width, height);

    // Get price range
    const allPrices = candles.flatMap((c) => [c.high, c.low]);
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const priceRange = maxPrice - minPrice || 1;

    const candleWidth = ((width - padding * 2) / candles.length) * 0.6;
    const spacing = (width - padding * 2) / candles.length;

    const priceToY = (price: number) => {
      return (
        height -
        padding -
        ((price - minPrice) / priceRange) * (height - padding * 2)
      );
    };

    // Draw grid
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding + (i * (height - padding * 2)) / 4;
      ctx.beginPath();
      ctx.setLineDash([3, 3]);
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw candles
    candles.forEach((candle, i) => {
      const x = padding + i * spacing + spacing / 2;
      const isGreen = candle.close >= candle.open;
      const color = isGreen ? "#10b981" : "#ef4444";

      const highY = priceToY(candle.high);
      const lowY = priceToY(candle.low);
      const openY = priceToY(candle.open);
      const closeY = priceToY(candle.close);

      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.abs(openY - closeY) || 1;

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Body
      ctx.fillStyle = color;
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
    });
  }, [candles]);

  if (!candles || candles.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-xs text-slate-500">
        No data available
      </div>
    );
  }

  return <canvas ref={canvasRef} className="w-full h-full" />;
};

// Demo
const Demo = () => {
  const sampleCandles: CandleBar[] = [
    { time: "2024-01-01", open: 100, high: 110, low: 95, close: 105 },
    { time: "2024-01-02", open: 105, high: 115, low: 103, close: 112 },
    { time: "2024-01-03", open: 112, high: 120, low: 110, close: 108 },
    { time: "2024-01-04", open: 108, high: 112, low: 102, close: 106 },
    { time: "2024-01-05", open: 106, high: 118, low: 104, close: 115 },
    { time: "2024-01-06", open: 115, high: 125, low: 113, close: 122 },
    { time: "2024-01-07", open: 122, high: 128, low: 120, close: 125 },
    { time: "2024-01-08", open: 125, high: 130, low: 118, close: 120 },
  ];

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-white mb-6">
          Candlestick Chart Solutions
        </h1>

        {/* SVG Version */}
        <div className="bg-slate-900/80 border border-slate-800">
          <div className="px-4 py-2 border-b border-slate-800 text-xs">
            <span className="font-semibold text-white">
              SVG CANDLESTICK CHART
            </span>
          </div>
          <div className="p-4">
            <div className="h-44 rounded-lg border border-slate-800 bg-slate-950 overflow-hidden">
              <MiniCloseChart candles={sampleCandles} />
            </div>
          </div>
        </div>

        {/* Canvas Version */}
        <div className="bg-slate-900/80 border border-slate-800">
          <div className="px-4 py-2 border-b border-slate-800 text-xs">
            <span className="font-semibold text-white">
              CANVAS CANDLESTICK CHART
            </span>
          </div>
          <div className="p-4">
            <div className="h-44 rounded-lg border border-slate-800 bg-slate-950 overflow-hidden">
              <MiniCloseChartChartJS candles={sampleCandles} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Demo;

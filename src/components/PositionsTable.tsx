import React from "react";

type Position = {
  symbol: string;
  qty: number;
  entry_price: number;
  current_price: number;
  pnl: number;
  pnl_pct: number;
  side: "buy" | "sell" | "hold";
  tranche: string;
};

type PositionsResponse = {
  positions: Position[];
  count: number;
};

type PositionsTableProps = {
  tradingDay?: number;
};

// Utility function to get logo URL
const getLogoUrl = (symbol: string) => {
  // Use individual stock logo files
  return `/logos/${symbol.toLowerCase()}.png`;
};

const PositionsTableComponent: React.FC<PositionsTableProps> = ({ tradingDay }) => {
  const [positions, setPositions] = React.useState<Position[]>([]);
  const [debouncedPositions, setDebouncedPositions] = React.useState<
    Position[]
  >([]);

  // Fetch positions data
  React.useEffect(() => {
    if (!tradingDay) return;
    
    const fetchPositions = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_BASE ?? "";
        const res = await fetch(`${apiBase}/api/positions?day=${tradingDay}`, {
          headers: {
            "ngrok-skip-browser-warning": "true",
          },
        });
        if (res.ok) {
          const data: PositionsResponse = await res.json();
          setPositions(data.positions || []);
        }
      } catch (e) {
        console.error("Failed to fetch positions:", e);
      }
    };

    fetchPositions();
    const interval = setInterval(fetchPositions, 15000);
    return () => clearInterval(interval);
  }, [tradingDay]);

  // Debounce positions updates by 500ms
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPositions(positions);
    }, 500);
    return () => clearTimeout(timer);
  }, [positions]);

  // Formatting helpers
  const fmt = (v: number | null | undefined, d = 2) =>
    v == null || Number.isNaN(v) ? (
      <span className="text-slate-500">–</span>
    ) : (
      v.toFixed(d)
    );

  const fmtCurrency = (v: number | null | undefined) =>
    v == null || Number.isNaN(v) ? (
      <span className="text-slate-500">–</span>
    ) : (
      `$${v.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    );

  // Color helper for P/L
  const getPnLClass = (pnl: number) => {
    if (pnl > 0) return "text-emerald-400 font-medium";
    if (pnl < 0) return "text-rose-400 font-medium";
    return "text-slate-200";
  };

  // Color helper for side
  const getSideClass = (side: string) => {
    if (side === "buy") return "text-emerald-400 font-medium";
    if (side === "sell") return "text-rose-400 font-medium";
    return "text-slate-200";
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 overflow-hidden">
      <div className="px-4 py-2 border-b border-slate-800 text-xs font-semibold">
        POSITIONS
      </div>

      <div className="overflow-auto max-h-110">
        <table className="w-full text-[11px] table-auto">
          <thead className="bg-slate-900 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2 text-center">SYMBOL</th>
              <th className="px-3 py-2 text-center">QUANTITY</th>
              <th className="px-3 py-2 text-center">ENTRY PRICE</th>
              <th className="px-3 py-2 text-center">CURRENT PRICE</th>
              <th className="px-3 py-2 text-center">P/L</th>
              <th className="px-3 py-2 text-center">P/L%</th>
              <th className="px-3 py-2 text-center">BUY / SELL / HOLD</th>
            </tr>
          </thead>

          <tbody>
            {debouncedPositions.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-6 text-center text-slate-500">
                  NO POSITIONS AVAILABLE
                </td>
              </tr>
            ) : (
              debouncedPositions.map((position) => (
                <tr
                  key={`${position.symbol}-${position.tranche}`}
                  className="border-t border-slate-800/60"
                >
                  <td className="px-3 py-1.5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <img
                        src={getLogoUrl(position.symbol)}
                        alt={position.symbol}
                        className="w-6 h-6 object-contain"
                        onError={(e) =>
                          ((e.target as HTMLImageElement).style.display =
                            "none")
                        }
                      />
                      <span className="font-medium">{position.symbol}</span>
                    </div>
                  </td>
                  <td className="px-3 py-1.5 text-center">{position.qty}</td>
                  <td className="px-3 py-1.5 text-center">
                    {fmtCurrency(position.entry_price)}
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    {fmtCurrency(position.current_price)}
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    <span className={getPnLClass(position.pnl)}>
                      {fmtCurrency(position.pnl)}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    <span className={getPnLClass(position.pnl)}>
                      {fmt(position.pnl_pct, 1)}%
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    <span className={getSideClass(position.side)}>
                      {position.side.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const PositionsTable = React.memo(PositionsTableComponent);

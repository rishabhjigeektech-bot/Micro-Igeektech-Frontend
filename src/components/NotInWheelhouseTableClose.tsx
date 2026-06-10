import React from "react";
import { ScrollableTableContainer } from "../hooks/ScrollableTableContainer";

type GateStatus = {
  price?: string;
  float?: string;
  premarket_pct?: string;
  premarket_volume?: string;
  rvol?: string;
  avg_vol_30d?: string;
};

type NearMissStock = {
  symbol: string;
  price: number;
  float_m: number | null;
  premarket_pct: number | null;
  premarket_volume: number | null;
  rvol: number;
  avg_vol_30d: number;
  gate_status: GateStatus;
  close_flag?: string;
};

type NotInWheelhouseTableCloseProps = {
  loading: boolean;
};

// Utility function to get logo URL
const getLogoUrl = (symbol: string) => {
  // Use individual stock logo files
  return `/logos/${symbol.toLowerCase()}.png`;
};

const NotInWheelhouseTableCloseComponent: React.FC<
  NotInWheelhouseTableCloseProps
> = ({ loading }) => {
  const [nearMisses, setNearMisses] = React.useState<NearMissStock[]>([]);
  const [hardGateFailures, setHardGateFailures] = React.useState<
    NearMissStock[]
  >([]);
  const [debouncedNearMisses, setDebouncedNearMisses] = React.useState<
    NearMissStock[]
  >([]);
  const [debouncedHardGateFailures, setDebouncedHardGateFailures] =
    React.useState<NearMissStock[]>([]);

  // Fetch near misses data
  React.useEffect(() => {
    const fetchNearMisses = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_BASE ?? "";
        const res = await fetch(`${apiBase}/api/not-in-wheelhouse`, {
          headers: {
            "ngrok-skip-browser-warning": "true",
          },
        });
        if (res.ok) {
          const data = await res.json();
          setNearMisses(data.near_misses || []);
          setHardGateFailures(data.hard_gate_failures || []);
        }
      } catch (e) {
        console.error("Failed to fetch near misses:", e);
      }
    };

    fetchNearMisses();
    const interval = setInterval(fetchNearMisses, 15000);
    return () => clearInterval(interval);
  }, []);

  // Debounce near misses updates by 500ms
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedNearMisses(nearMisses);
    }, 500);
    return () => clearTimeout(timer);
  }, [nearMisses]);

  // Debounce hard gate failures updates by 500ms
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedHardGateFailures(hardGateFailures);
    }, 500);

    return () => clearTimeout(timer);
  }, [hardGateFailures]);

  // Formatting helpers
  const fmt = (v: number | null | undefined, d = 2) =>
    v == null || Number.isNaN(v) ? (
      <span className="text-slate-500">–</span>
    ) : (
      v.toFixed(d)
    );

  const fmtVol = (v: number | null | undefined) =>
    v == null || Number.isNaN(v) ? (
      <span className="text-slate-500">–</span>
    ) : (
      v.toLocaleString()
    );

  // Value-only color helper
  const getValueClass = (status: boolean | string | undefined) => {
    if (status === true || status === "pass")
      return "text-emerald-400 font-medium";
    if (status === false || status === "fail")
      return "text-rose-400 font-medium";
    return "text-slate-200";
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 overflow-hidden">
      <div className="px-4 py-2 border-b border-slate-800 text-xs font-semibold">
        STOCKS JUST OUTSIDE OUR WHEELHOUSE
      </div>

      {loading ? (
        <div className="h-32 flex items-center justify-center text-xs text-slate-400">
          Loading universe…
        </div>
      ) : (
        <ScrollableTableContainer>
          <table className="w-full text-[11px] table-auto">
            <thead className="bg-slate-900 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2 text-center">SYMBOL</th>
                <th className="px-3 py-2 text-center">PRICE $2–$30</th>
                <th className="px-3 py-2 text-center">1M ≤ FLOAT ≤ 15M</th>
                <th className="px-3 py-2 text-center">
                  PRE-MARKET CHANGE ≥ +2%
                </th>
                <th className="px-3 py-2 text-center">
                  PRE-MARKET VOLUME ≥ 200K
                </th>
                <th className="px-3 py-2 text-center">RELATIVE VOLUME ≥ 2×</th>
                <th className="px-3 py-2 text-center">
                  AVG 30-DAY VOLUME ≥ 500K
                </th>
                <th className="px-3 py-2 text-center">CLOSE FLAG</th>
              </tr>
            </thead>

            <tbody>
              {debouncedNearMisses.length === 0 &&
              debouncedHardGateFailures.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-500">
                    NO STOCKS AVAILABLE
                  </td>
                </tr>
              ) : (
                <>
                  {debouncedNearMisses.map((stock) => {
                    const gate = stock.gate_status || {};

                    return (
                      <tr
                        key={stock.symbol}
                        className="border-t border-slate-800/60"
                      >
                        <td className="px-3 py-1.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <img
                              src={getLogoUrl(stock.symbol)}
                              alt={stock.symbol}
                              className="w-5 h-5 object-contain"
                              onError={(e) =>
                                ((e.target as HTMLImageElement).style.display =
                                  "none")
                              }
                            />
                            <span className="font-medium">{stock.symbol}</span>
                          </div>
                        </td>

                        <td className="px-3 py-1.5 text-center">
                          <span className={getValueClass(gate.price)}>
                            ${fmt(stock.price)}
                          </span>
                        </td>

                        <td className="px-3 py-1.5 text-center">
                          <span className={getValueClass(gate.float)}>
                            {fmt(stock.float_m)}M
                          </span>
                        </td>

                        <td className="px-3 py-1.5 text-center">
                          <span className={getValueClass(gate.premarket_pct)}>
                            {fmt(stock.premarket_pct)}%
                          </span>
                        </td>

                        <td className="px-3 py-1.5 text-center">
                          <span
                            className={getValueClass(gate.premarket_volume)}
                          >
                            {fmtVol(stock.premarket_volume)}
                          </span>
                        </td>

                        <td className="px-3 py-1.5 text-center">
                          <span className={getValueClass(gate.rvol)}>
                            {fmt(stock.rvol)}×
                          </span>
                        </td>

                        <td className="px-3 py-1.5 text-center">
                          <span className={getValueClass(gate.avg_vol_30d)}>
                            {fmtVol(stock.avg_vol_30d)}
                          </span>
                        </td>

                        <td className="px-3 py-1.5 text-center">
                          {stock.close_flag || "–"}
                        </td>
                      </tr>
                    );
                  })}

                  {debouncedHardGateFailures.map((stock) => {
                    const gate = stock.gate_status || {};

                    return (
                      <tr
                        key={stock.symbol}
                        className="border-t border-slate-800/60 opacity-60"
                      >
                        <td className="px-3 py-1.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <img
                              src={getLogoUrl(stock.symbol)}
                              alt={stock.symbol}
                              className="w-5 h-5 object-contain"
                              onError={(e) =>
                                ((e.target as HTMLImageElement).style.display =
                                  "none")
                              }
                            />
                            <span className="font-medium">{stock.symbol}</span>
                          </div>
                        </td>

                        <td className="px-3 py-1.5 text-center">
                          <span className={getValueClass(gate.price)}>
                            ${fmt(stock.price)}
                          </span>
                        </td>

                        <td className="px-3 py-1.5 text-center">
                          <span className={getValueClass(gate.float)}>
                            {fmt(stock.float_m)}M
                          </span>
                        </td>

                        <td className="px-3 py-1.5 text-center">
                          <span className={getValueClass(gate.premarket_pct)}>
                            {fmt(stock.premarket_pct)}%
                          </span>
                        </td>

                        <td className="px-3 py-1.5 text-center">
                          <span
                            className={getValueClass(gate.premarket_volume)}
                          >
                            {fmtVol(stock.premarket_volume)}
                          </span>
                        </td>

                        <td className="px-3 py-1.5 text-center">
                          <span className={getValueClass(gate.rvol)}>
                            {fmt(stock.rvol)}×
                          </span>
                        </td>

                        <td className="px-3 py-1.5 text-center">
                          <span className={getValueClass(gate.avg_vol_30d)}>
                            {fmtVol(stock.avg_vol_30d)}
                          </span>
                        </td>

                        <td className="px-3 py-1.5 text-center">
                          {stock.close_flag || "–"}
                        </td>
                      </tr>
                    );
                  })}
                </>
              )}
            </tbody>
          </table>
        </ScrollableTableContainer>
      )}
    </div>
  );
};

export const NotInWheelhouseTableClose = React.memo(
  NotInWheelhouseTableCloseComponent
);

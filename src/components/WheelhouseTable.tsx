import React from "react";
import { useMarketStore } from "../store/marketStore";
import { ScrollableTableContainer } from "../hooks/ScrollableTableContainer";

type WheelhouseTableProps = {
  symbols: string[];
  selectedSymbol: string | null;
  onSelectSymbol: (symbol: string) => void;
  loading: boolean;
};

const getLogoUrl = (symbol: string) => {
  // Use individual stock logo files
  return `/logos/${symbol.toLowerCase()}.png`;
};

const WheelhouseTableRow: React.FC<{
  symbol: string;
  selectedSymbol: string | null;
  onSelectSymbol: (symbol: string) => void;
}> = React.memo(({ symbol, selectedSymbol, onSelectSymbol }) => {
  const row = useMarketStore((state) => state.universe[symbol]);

  if (!row) return null;

  const active = row.symbol === selectedSymbol;

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

  const fmtFloat = (v: number | null | undefined) =>
    v == null || Number.isNaN(v) ? (
      <span className="text-slate-500">–</span>
    ) : (
      `${(v / 1_000_000).toFixed(2)} M`
    );

  const fmtScore = (v: number | null | undefined) =>
    v == null || Number.isNaN(v) || typeof v !== "number" ? (
      <span className="text-slate-500">–</span>
    ) : (
      v.toFixed(2)
    );

  // Technical Alignment Coloring Logic
  const getVWAPColor = () => {
    if (
      row.currentPrice == null ||
      row.vwap == null ||
      Number.isNaN(row.currentPrice) ||
      Number.isNaN(row.vwap)
    ) {
      return { color: "text-slate-500", diff: null };
    }

    const diff =
      ((row.currentPrice - row.vwap) / row.vwap) * 100;

    if (diff >= 0.5) {
      return { color: "text-emerald-400", diff };
    } else if (diff >= 0) {
      return { color: "text-yellow-400", diff };
    } else if (diff >= -0.1) {
      return { color: "text-slate-400", diff };
    } else {
      return { color: "text-red-400", diff };
    }
  };

  const getEMAColor = () => {
    if (
      row.ema9 == null ||
      row.ema20 == null ||
      Number.isNaN(row.ema9) ||
      Number.isNaN(row.ema20)
    ) {
      return { color: "text-slate-500", diff: null };
    }

    const diff = ((row.ema9 - row.ema20) / row.ema20) * 100;

    if (diff >= 0.3) {
      return { color: "text-emerald-400", diff };
    } else if (diff >= 0) {
      return { color: "text-yellow-400", diff };
    } else if (diff >= -0.1) {
      return { color: "text-slate-400", diff };
    } else {
      return { color: "text-red-400", diff };
    }
  };

  const getORHColor = () => {
    if (
      row.currentPrice == null ||
      row.orh5min == null ||
      Number.isNaN(row.currentPrice) ||
      Number.isNaN(row.orh5min)
    ) {
      return { color: "text-slate-500", diff: null };
    }

    const diff =
      ((row.currentPrice - row.orh5min) / row.orh5min) * 100;

    if (diff >= 0) {
      return { color: "text-emerald-400", diff };
    } else if (diff >= -0.1) {
      return { color: "text-yellow-400", diff };
    } else {
      return { color: "text-red-400", diff };
    }
  };

  const vwapColor = getVWAPColor();
  const emaColor = getEMAColor();
  const orhColor = getORHColor();

  return (
    <tr
      onClick={() => onSelectSymbol(row.symbol)}
      className={`cursor-pointer border-t border-slate-800/60 ${
        active ? "bg-slate-800/40" : ""
      }`}
    >
      <td className="px-2 py-1.5 text-center text-[10px]">
        <div className="flex items-center justify-center gap-2">
          <img
            src={getLogoUrl(row.symbol)}
            alt={row.symbol}
            className="w-5 h-5 object-contain"
            onError={(e) =>
              ((e.target as HTMLImageElement).style.display = "none")
            }
          />
          <span className="font-medium">{row.symbol}</span>
        </div>
      </td>

      <td className="px-2 py-1.5 text-center text-[10px]">
        {fmt(row.premarketOpen)}
      </td>
      <td className="px-2 py-1.5 text-center text-[10px]">
        {fmt(row.premarketChange)}
      </td>
      <td className="px-2 py-1.5 text-center text-[10px]">
        <span
          className={
            row.gate_result?.premarket_pct === false
              ? "text-red-400 bg-red-900/20"
              : "text-emerald-400"
          }
        >
          {fmt(row.premarketChangePct)} %
        </span>
      </td>
      <td className="px-2 py-1.5 text-center text-[10px]">
        <span
          className={
            row.gate_result?.premarket_volume === false
              ? "text-red-400 bg-red-900/20"
              : "text-emerald-400"
          }
        >
          {fmtVol(row.premarketVolume)}
        </span>
      </td>
      <td className="px-2 py-1.5 text-center text-[10px]">
        {fmt(row.marketOpenPrice)}
      </td>
      <td className="px-2 py-1.5 text-center text-[10px]">
        <span
          className={
            row.gate_result?.price === false
              ? "text-red-400 bg-red-900/20"
              : "text-emerald-400"
          }
        >
          {fmt(row.currentPrice)}
        </span>
      </td>
      <td className="px-2 py-1.5 text-center text-[10px]">
        <span
          className={
            row.gate_result?.rvol === false
              ? "text-red-400 bg-red-900/20"
              : "text-emerald-400"
          }
        >
          {row.relVolume1w == null || Number.isNaN(row.relVolume1w)
            ? "–"
            : `${row.relVolume1w.toFixed(2)} ×`}
        </span>
      </td>
      <td className="px-2 py-1.5 text-center text-[10px]">
        <span
          className={
            row.gate_result?.float === false
              ? "text-red-400 bg-red-900/20"
              : "text-emerald-400"
          }
        >
          {fmtFloat(row.floatShares)}
        </span>
      </td>
      <td className="px-2 py-1.5 text-center text-[10px]">
        <span
          className={
            row.gate_result?.avg_vol_30d === false
              ? "text-red-400 bg-red-900/20"
              : "text-emerald-400"
          }
        >
          {fmtVol(row.avg_vol_30d)}
        </span>
      </td>

      <td className="px-2 py-1.5 text-center text-[10px] border-l border-cyan-500/30">
        <span className={vwapColor.color}>
          {fmt(row.vwap)}
        </span>
      </td>
      <td className="px-2 py-1.5 text-center text-[10px] border-l border-r border-cyan-500/30">
        <span className={emaColor.color}>
          {row.ema9 != null && row.ema20 != null
            ? `${fmt(row.ema9)} / ${fmt(row.ema20)}`
            : "–"}
        </span>
      </td>
      <td className="px-2 py-1.5 text-center text-[10px] border-r border-cyan-500/30">
        <span className={orhColor.color}>
          {row.orh5min != null && row.orl5min != null
            ? `${fmt(row.orh5min)} / ${fmt(row.orl5min)}`
            : "–"}
        </span>
      </td>

      <td className="px-2 py-1.5 text-center text-[10px]">
        {row.candlestickPatternQuality == null ? (
          <span className="text-slate-500">–</span>
        ) : (
          <span
            className={
              row.candlestickPatternQuality > 0.5
                ? "text-emerald-400"
                : "text-red-400"
            }
          >
            {fmtScore(row.candlestickPatternQuality)}
          </span>
        )}
      </td>
      <td className="px-2 py-1.5 text-center text-[10px]">
        {row.marketBias == null ? (
          <span className="text-slate-500">–</span>
        ) : (
          <span
            className={
              row.marketBias > 0.5 ? "text-emerald-400" : "text-red-400"
            }
          >
            {fmtScore(row.marketBias)}
          </span>
        )}
      </td>
      <td className="px-2 py-1.5 text-center text-[10px]">
        {row.spreadTapeQuality == null ? (
          <span className="text-slate-500">–</span>
        ) : (
          <span
            className={
              row.spreadTapeQuality > 0.5 ? "text-emerald-400" : "text-red-400"
            }
          >
            {fmtScore(row.spreadTapeQuality)}
          </span>
        )}
      </td>
      <td className="px-2 py-1.5 text-center text-[10px]">
        {row.highVelocity == null ? (
          <span className="text-slate-500">–</span>
        ) : (
          <span
            className={
              row.highVelocity > 0.5 ? "text-emerald-400" : "text-red-400"
            }
          >
            {fmtScore(row.highVelocity)}
          </span>
        )}
      </td>
      <td className="px-2 py-1.5 text-center text-[10px]">
        {row.newsStocks == null ? (
          <span className="text-slate-500">–</span>
        ) : (
          <span
            className={
              row.newsStocks > 0.5 ? "text-emerald-400" : "text-red-400"
            }
          >
            {fmtScore(row.newsStocks)}
          </span>
        )}
      </td>
      <td className="px-2 py-1.5 text-center text-[10px]">
        {row.newsSector == null ? (
          <span className="text-slate-500">–</span>
        ) : (
          <span
            className={
              row.newsSector > 0.5 ? "text-emerald-400" : "text-red-400"
            }
          >
            {fmtScore(row.newsSector)}
          </span>
        )}
      </td>
      <td className="px-2 py-1.5 text-center text-[10px]">
        {row.sessionQuality == null ? (
          <span className="text-slate-500">–</span>
        ) : (
          <span
            className={
              row.sessionQuality > 0.5 ? "text-emerald-400" : "text-red-400"
            }
          >
            {fmtScore(row.sessionQuality)}
          </span>
        )}
      </td>
      <td className="px-2 py-1.5 text-center text-[10px]">-</td>
      <td className="px-2 py-1.5 text-center text-[10px]">
        {row.totalScore != null ? (
          <div className="flex flex-col items-center gap-0.5">
            <span
              className={`inline-flex rounded-full px-2 py-0.5 font-semibold ${
                row.totalScore >= 8
                  ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-red-600/20 text-red-400 border border-red-500/30"
              }`}
            >
              {row.totalScore.toFixed(2)}/12.00
            </span>
          </div>
        ) : (
          <span className="text-slate-500">–</span>
        )}
      </td>
    </tr>
  );
});

WheelhouseTableRow.displayName = "WheelhouseTableRow";
const WheelhouseTableComponent: React.FC<WheelhouseTableProps> = ({
  symbols,
  selectedSymbol,
  onSelectSymbol,
  loading,
}) => {
  return (
    <div className="bg-slate-900/80 border border-slate-800 overflow-hidden">
      <div className="px-4 py-2 border-b border-slate-800 text-xs font-semibold">
        STOCKS IN WHEELHOUSE
      </div>

      {loading ? (
        <div className="h-32 flex items-center justify-center text-xs text-slate-400">
          Loading universe…
        </div>
      ) : (
        <ScrollableTableContainer>
          <table className="w-full text-[11px] table-fixed">
            <thead className="bg-slate-900 sticky top-0 z-10">
              <tr>
                <th
                  rowSpan={2}
                  className="px-2 py-2 text-center text-[10px] font-semibold"
                >
                  SYMBOL
                </th>
                <th
                  rowSpan={2}
                  className="px-2 py-2 text-center text-[10px] font-semibold"
                >
                  PRE-MARKET OPEN
                </th>
                <th
                  rowSpan={2}
                  className="px-2 py-2 text-center text-[10px] font-semibold"
                >
                  PRE-MARKET CHANGE
                </th>
                <th
                  rowSpan={2}
                  className="px-2 py-2 text-center text-[10px] font-semibold text-cyan-300"
                >
                  -1-
                  <br />
                  PRE-MARKET CHANGE %
                </th>
                <th
                  rowSpan={2}
                  className="px-2 py-2 text-center text-[10px] font-semibold text-cyan-300"
                >
                  PRE-MARKET VOLUME
                </th>
                <th
                  rowSpan={2}
                  className="px-2 py-2 text-center text-[10px] font-semibold"
                >
                  OPEN PRICE
                </th>
                <th
                  rowSpan={2}
                  className="px-2 py-2 text-center text-[10px] font-semibold text-cyan-300"
                >
                  CURRENT PRICE
                </th>
                <th
                  rowSpan={2}
                  className="px-2 py-2 text-center text-[10px] font-semibold text-cyan-300"
                >
                  -2-
                  <br />
                  RELATIVE VOLUME
                </th>
                <th
                  rowSpan={2}
                  className="px-2 py-2 text-center text-[10px] font-semibold text-cyan-300"
                >
                  -3-
                  <br />
                  FLOAT
                </th>
                <th
                  rowSpan={2}
                  className="px-2 py-2 text-center text-[10px] font-semibold text-cyan-300"
                >
                  -4-
                  <br />
                  LIQUDITY/
                  <br />
                  AVERAGE VOLUME
                </th>
                <th
                  colSpan={3}
                  className="px-2 py-2 text-center text-[10px] font-semibold"
                >
                  -5-
                  <br />
                  TECHNICAL ALIGNMENTS
                </th>
                <th
                  rowSpan={2}
                  className="px-2 py-2 text-center text-[10px] font-semibold"
                >
                  -6-
                  <br />
                  CANDLESTICK PATTERN QUALITY
                </th>
                <th
                  rowSpan={2}
                  className="px-2 py-2 text-center text-[10px] font-semibold"
                >
                  -7-
                  <br />
                  MARKET BIAS
                </th>
                <th
                  rowSpan={2}
                  className="px-2 py-2 text-center text-[10px] font-semibold"
                >
                  -8-
                  <br />
                  SPREAD / TAPE QUALITY
                </th>
                <th
                  rowSpan={2}
                  className="px-2 py-2 text-center text-[10px] font-semibold"
                >
                  -9-
                  <br />
                  HIGH VELOCITY
                </th>
                <th
                  rowSpan={2}
                  className="px-2 py-2 text-center text-[10px] font-semibold"
                >
                  -10-
                  <br />
                  NEWS (STOCK)
                </th>
                <th
                  rowSpan={2}
                  className="px-2 py-2 text-center text-[10px] font-semibold"
                >
                  -11-
                  <br />
                  NEWS (SECTOR)
                </th>
                <th
                  rowSpan={2}
                  className="px-2 py-2 text-center text-[10px] font-semibold"
                >
                  -12-
                  <br />
                  SESSION QUALITY
                </th>
                <th
                  rowSpan={2}
                  className="px-2 py-2 text-center text-[10px] font-semibold"
                >
                  LEVEL 2 <br /> (FUTURE)
                </th>
                <th
                  rowSpan={2}
                  className="px-2 py-2 text-center text-[10px] font-semibold leading-tight"
                >
                  FINAL SCORE
                  <br />
                  <span className="text-[9px] font-normal text-red-400">
                    0–7 = NO-GO
                  </span>
                  <br />
                  <span className="text-[9px] font-normal text-emerald-400">
                    8–12 = GO
                  </span>
                </th>
              </tr>
              <tr>
                <th className="px-2 py-1 text-center text-[9px] font-normal">
                  VWAP
                </th>
                <th className="px-2 py-1 text-center text-[9px] font-normal">
                  EMA9/EMA20
                </th>
                <th className="px-2 py-1 text-center text-[9px] font-normal">
                  ORH/ORL 5min
                </th>
              </tr>
            </thead>

            <tbody>
              {symbols.length === 0 ? (
                <tr>
                  <td colSpan={21} className="py-6 text-center text-slate-500">
                    NO WHEELHOUSE STOCKS
                  </td>
                </tr>
              ) : (
                symbols.map((symbol) => (
                  <WheelhouseTableRow
                    key={symbol}
                    symbol={symbol}
                    selectedSymbol={selectedSymbol}
                    onSelectSymbol={onSelectSymbol}
                  />
                ))
              )}
            </tbody>
          </table>
        </ScrollableTableContainer>
      )}
    </div>
  );
};

export const WheelhouseTable = React.memo(WheelhouseTableComponent);

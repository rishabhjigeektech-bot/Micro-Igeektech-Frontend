import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import type { BotStatus } from "../types/BotStatus";
import type { StockDetails } from "../types/StockDetails";
import type { UniverseRow } from "../types/UniverseRow";
import type { StockAnalysis } from "../types/StockAnalysis";
import { useMarketStore } from "../store/marketStore";
import { Header } from "./Header";
import { ParametersBar } from "./ParametersBar";
import { WheelhouseTable } from "./WheelhouseTable";
import { NotInWheelhouseTableClose } from "./NotInWheelhouseTableClose";
import { PositionsTable } from "./PositionsTable";
import { StockAnalysisView } from "./StockAnalysisView";
import { X } from "lucide-react";
import AIChat from './AIChat';
import IPODashboard from "./IPODashboard";

type BackendRow = {
  symbol: string;
  company_name?: string;
  marketOpenPrice?: number | null;
  market_open_price?: number | null;
  pre_market?: {
    open?: number | null;
    change_pct?: number | null;
    volume?: number | null;
  };
  premarket?: {
    open?: number | null;
    change_pct?: number | null;
    volume?: number | null;
  };
  current_price?: number | null;
  currentPrice?: number | null;
  decision?: {
    current_price?: number | null;
  };
  premarketOpen?: number | null;
  premarketChangePct?: number | null;
  premarketVolume?: number | null;
  premarketChange?: number | null;
  float?: number | null;
  floatShares?: number | null;
  rel_volume_1w?: number | null;
  relVolume1w?: number | null;
  score?: number | null;
  totalScore?: number | null;
  total_score?: number | null;
  max_score?: number | null;
  maxScore?: number | null;
  wheelhouse?: boolean;
  inWheelhouse?: boolean;
  in_wheelhouse?: boolean;
  vwap?: number | null;
  passedHardGates?: boolean;
  hardGates?: unknown;
  avg_vol_30d?: number | null;
  average_volume?: number | null;
  ema9?: number | null;
  ema20?: number | null;
  orh5min?: number | null;
  orl5min?: number | null;
  candlestickPatternQuality?: number | null;
  marketBias?: number | null;
  spreadTapeQuality?: number | null;
  highVelocity?: number | null;
  newsStocks?: number | null;
  newsSector?: number | null;
  sessionQuality?: number | null;
  gate_result?: {
    price: boolean;
    premarket_pct: boolean;
    premarket_volume: boolean;
    avg_vol_30d: boolean;
    rvol: boolean;
    float: boolean;
  } | null;
  wheelhouse_gates?: {
    price: string;
    rvol: string;
    float: string;
    avg_vol_30d: string;
    premarket_pct: string;
    premarket_volume: string;
  } | null;
  failed_gates?: string[] | null;
};

type BackendDetails = BackendRow & {
  analysis?: unknown;
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
  patterns?: {
    current: string;
    previous: string[];
  };
  candles?: Array<{
    time: string | number;
    open: number;
    high: number;
    low: number;
    close: number;
    pattern?: string | null;
  }>;
  market_open_price?: number | null;
  signed_sentiment?: number | null;
};

type WsMessage = { type?: string; payload?: unknown; [key: string]: unknown };

export const ChuckBotViewPro = () => {
  const [status, setStatus] = useState<BotStatus | null>(null);
  const universeMap = useMarketStore((s) => s.universe);
  const universe = useMemo(
    () => Object.values(universeMap),
    [universeMap]
  );
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [details, setDetails] = useState<StockDetails | null>(null);
  const [analysis, setAnalysis] = useState<StockAnalysis | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [lastWsDataTime, setLastWsDataTime] = useState<number>(0);
  const [usingFallbackApi, setUsingFallbackApi] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [tradingDay, setTradingDay] = useState<number>();
  const [wsConnectionAttempts, setWsConnectionAttempts] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<number | null>(null);
  const isConnectingRef = useRef(false);
  const fallbackIntervalRef = useRef<number | null>(null);
  const selectedSymbolRef = useRef<string | null>(null);
  const updateIntervalRef = useRef<number | null>(null);
  const socketBufferRef = useRef<WsMessage[]>([]);
  const batchIntervalRef = useRef<number | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    selectedSymbolRef.current = selectedSymbol;
  }, [selectedSymbol]);

  useEffect(() => {
    if (drawerOpen || aiOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [drawerOpen, aiOpen]);

  const apiBase = import.meta.env.VITE_API_BASE ?? "";
  const wsPath = "/ws/bot";

  const getWsUrl = () => {
    const loc = window.location;
    const protocol = loc.protocol === "https:" ? "wss:" : "ws:";
    const host = import.meta.env.VITE_WS_HOST ?? loc.host;
    return `${protocol}//${host}${wsPath}`;
  };

  const formatIsoWithMicro = (d = new Date()) => {
    const iso = d.toISOString().replace(/Z$/, "");
    return iso.replace(/\.(\d{3})$/, (_m, ms) => `.${ms}000`);
  };

  const parseJsonSafe = useCallback(async (res: Response) => {
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) return res.json();
    const text = await res.text();
    throw new Error(
      `Expected JSON but got ${ct || "unknown"}: ${text.slice(0, 200)}`
    );
  }, []);

  const mapBackendRow = useCallback((r: BackendRow): UniverseRow => {
    const pre = r.pre_market ?? r.premarket ?? {};
    const current =
      r.currentPrice ??
      (r.decision && r.decision.current_price) ??
      null;

    const preOpen = pre.open ?? r.premarketOpen ?? null;
    const marketOpenPrice =
      r.marketOpenPrice ?? r.market_open_price ?? pre.open ?? r.premarketOpen ?? null;
    const preChangePct = pre.change_pct ?? r.premarketChangePct ?? null;
    const preVol = pre.volume ?? r.premarketVolume ?? null;
    const floatShares = r.float ?? r.floatShares ?? null;
    const relVol = r.rel_volume_1w ?? r.relVolume1w ?? null;
    const score = r.total_score ?? r.score ?? r.totalScore ?? null;
    return {
      symbol: r.symbol,
      premarketOpen: preOpen ?? null,
      marketOpenPrice: marketOpenPrice ?? null,
      premarketChange:
        current != null && preOpen != null
          ? current - preOpen
          : (r.premarketChange ?? null),
      premarketChangePct: preChangePct ?? null,
      premarketVolume: preVol ?? null,
      currentPrice: current ?? null,
      floatShares: floatShares ?? null,
      vwap: r.vwap ?? null,
      relVolume1w: relVol ?? null,
      totalScore: score ?? null,
      inWheelhouse: r.wheelhouse ?? r.inWheelhouse ?? r.in_wheelhouse ?? false,
      passedHardGates: r.passedHardGates ?? false,
      hardGates: (r.hardGates ?? null) as UniverseRow['hardGates'] | null,
      avg_vol_30d: r.avg_vol_30d ?? r.average_volume ?? null,
      ema9: r.ema9 ?? null,
      ema20: r.ema20 ?? null,
      orh5min: r.orh5min ?? null,
      orl5min: r.orl5min ?? null,
      candlestickPatternQuality: r.candlestickPatternQuality ?? null,
      marketBias: r.marketBias ?? null,
      spreadTapeQuality: r.spreadTapeQuality ?? null,
      highVelocity: r.highVelocity ?? null,
      newsStocks: r.newsStocks ?? null,
      newsSector: r.newsSector ?? null,
      sessionQuality: r.sessionQuality ?? null,
      gate_result: r.gate_result ?? null,
      wheelhouse_gates: r.wheelhouse_gates ?? null,
      failed_gates: r.failed_gates ?? null,
    };
  }, []);

  const mapBackendDetails = useCallback((d: BackendDetails): StockDetails => {
    const pre = d.pre_market ?? d.premarket ?? {};
    const current =
      d.current_price ??
      d.currentPrice ??
      (d.decision && d.decision.current_price) ??
      null;

    const preOpen = pre.open ?? d.premarketOpen ?? null;
    const marketOpenPrice =
      (d.market_open_price as number | null | undefined) ?? pre.open ?? d.premarketOpen ?? null;
    const result = {
      ...d,
      symbol: d.symbol,
      company_name: d.company_name ,
      wheelhouse: d.wheelhouse ?? d.inWheelhouse ?? false,
      premarketOpen: preOpen,
      marketOpenPrice: marketOpenPrice,
      premarketChange:
        current != null && preOpen != null
          ? current - preOpen
          : (d.premarketChange ?? null),
      premarketChangePct: pre.change_pct ?? d.premarketChangePct ?? null,
      premarketVolume: pre.volume ?? d.premarketVolume ?? null,
      currentPrice: current,
      floatShares: d.float ?? d.floatShares ?? null,
      vwap: d.vwap ?? null,
      relVolume1w: d.rel_volume_1w ?? d.relVolume1w ?? null,
      totalScore: d.total_score ?? d.score ?? d.totalScore ?? null,
      total_score: d.total_score ?? d.score ?? d.totalScore ?? null,
      maxScore: d.max_score ?? d.maxScore ?? 8,
      analysis: d.analysis ?? d.analysis ?? null,
      candles: d.candles ?? [],
      patterns: d.patterns ?? undefined,
      signed_sentiment: (d.signed_sentiment as number | null | undefined) ?? null,
    } as StockDetails;
    return result;
  }, []);

  const fetchFromFallbackApi = useCallback(async () => {
    try {
      const apiBaseLocal = import.meta.env.VITE_API_BASE ?? "";
      const url = apiBaseLocal.replace(/\/$/, "") + "/latest";
        
      const res = await fetch(url, {
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      });

      if (!res.ok) {
        throw new Error(`Fallback API error ${res.status}`);
      }

      const data = await res.json();

      if (data && typeof data === "object") {
        const rows: UniverseRow[] = [];
        const stocksArray = data.wheelhouse || data.stocks || (Array.isArray(data) ? data : []);

        for (const stock of stocksArray) {
          try {
            const mapped = mapBackendRow(stock);
            rows.push(mapped as UniverseRow);
          } catch (e) {
            console.error("Failed to map stock from fallback API:", e, stock);
          }
        }

        if (rows.length > 0) {
          useMarketStore.getState().updateBatch(rows);
          setUsingFallbackApi(true);

          if (!selectedSymbol) {
            const firstWheelhouse = rows.find((r) => r.inWheelhouse) ?? rows[0];
            if (firstWheelhouse) {
              setSelectedSymbol(firstWheelhouse.symbol);
            }
          }
        }
      }
    } catch (e: unknown) {
      console.error("Fallback API fetch error:", e);
    }
  }, [selectedSymbol, mapBackendRow]);

  const connectWebSocket = useCallback(() => {
    if (isConnectingRef.current || (wsRef.current && wsRef.current.readyState === WebSocket.OPEN)) {
      return;
    }

    isConnectingRef.current = true;
    setWsConnectionAttempts(prev => prev + 1);

    const ws = new WebSocket(getWsUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      setUsingFallbackApi(false);
      isConnectingRef.current = false;

      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }

      pingIntervalRef.current = window.setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "ping",
              ts: formatIsoWithMicro(),
            })
          );
        }
      }, 5000);

      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "REQUEST_UNIVERSE",
              ts: formatIsoWithMicro(),
            })
          );

          ws.send(
            JSON.stringify({
              type: "REQUEST_STATUS",
              ts: formatIsoWithMicro(),
            })
          );
        }
      }, 1000);
    };

    ws.onmessage = (event) => {
      try {
        const raw = typeof event.data === "string" ? event.data : JSON.stringify(event.data);
        const data = JSON.parse(raw);
        socketBufferRef.current.push(data as WsMessage);
      } catch (err) {
        console.error("WebSocket onmessage parse error:", err, event.data);
      }
    };

    batchIntervalRef.current = window.setInterval(() => {
      try {
        if (socketBufferRef.current.length === 0) return;

        const updates = [...socketBufferRef.current] as WsMessage[];
        socketBufferRef.current = [];

        const now = Date.now();
        setLastWsDataTime(now);
        setUsingFallbackApi(false);

        for (const data of updates) {
          try {
            const item: WsMessage = data as WsMessage;
            if (item?.type === "pong") {
              continue;
            }

            switch (item?.type) {
              case "STATUS": {
                try {
                  const payload = item.payload as BotStatus | null;
                  setStatus(payload ?? null);
                } catch (e) {
                  console.error("Failed to apply STATUS payload", e);
                }
                break;
              }

              case "UNIVERSE": {
                try {
                  if (Array.isArray(item.payload)) {
                    const rows = item.payload.map((p) => mapBackendRow(p as BackendRow));
                    useMarketStore.getState().updateBatch(rows);

                    if (!selectedSymbolRef.current && rows.length > 0) {
                      const firstWheelhouse = rows.find((r) => r.inWheelhouse) ?? rows[0];
                      if (firstWheelhouse) setSelectedSymbol(firstWheelhouse.symbol);
                    }
                  }
                } catch (e) {
                  console.error("Failed to map universe payload", e);
                  if (Array.isArray(item.payload)) {
                    useMarketStore.getState().updateBatch(item.payload as unknown as UniverseRow[]);
                  }
                }
                break;
              }

              case "UNIVERSE_UPDATE": {
                try {
                  const mapped = mapBackendRow(item.payload as BackendRow);
                  useMarketStore.getState().updateOne(mapped);
                } catch (e) {
                  console.error("Failed to map universe_update", e);
                  useMarketStore.getState().updateOne(item.payload as unknown as UniverseRow);
                }
                break;
              }

              case "DETAILS": {
                try {
                  setDetails(mapBackendDetails(item.payload as BackendDetails));
                } catch (e) {
                  console.error("Failed to map DETAILS payload", e);
                }
                break;
              }

              case "stock_analysis": {
                try {
                  const analysisPayload = item.payload as StockAnalysis | null;
                  setAnalysis(analysisPayload ?? null);

                  if (analysisPayload) {
                    try {
                      const mapped = mapBackendRow(analysisPayload as unknown as BackendRow);
                      useMarketStore.getState().updateOne(mapped);

                      if (
                        analysisPayload.symbol &&
                        selectedSymbolRef.current === analysisPayload.symbol
                      ) {
                        try {
                          setDetails(mapBackendDetails(analysisPayload as unknown as BackendDetails));
                        } catch (e) {
                          console.error("Failed to map details from stock_analysis", e);
                        }
                      }
                    } catch (e) {
                      console.error("Failed to map stock_analysis payload", e);
                    }
                  }
                } catch (e) {
                  console.error("Error handling stock_analysis message", e);
                }
                break;
              }

              default:
                break;
            }
          } catch (innerErr) {
            console.error("Error processing websocket update item:", innerErr, data);
          }
        }
      } catch (err) {
        console.error("WebSocket batch processing error:", err);
      }
    }, 100);

    ws.onclose = () => {
      setWsConnected(false);
      isConnectingRef.current = false;

      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }

      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }

      if (batchIntervalRef.current) {
        clearInterval(batchIntervalRef.current);
        batchIntervalRef.current = null;
      }

      socketBufferRef.current = [];

      // Try to reconnect every 6-8 seconds
      reconnectTimeoutRef.current = window.setTimeout(() => {
        connectWebSocket();
      }, 6000 + Math.random() * 2000); // Random delay between 6-8 seconds
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      setWsConnected(false);
      isConnectingRef.current = false;

      // After error, try fallback API and schedule reconnection
      if (!usingFallbackApi) {
        fetchFromFallbackApi();
      }

      // Schedule reconnection attempt
      reconnectTimeoutRef.current = window.setTimeout(() => {
        connectWebSocket();
      }, 6000 + Math.random() * 2000);
    };
  }, [mapBackendRow, mapBackendDetails, fetchFromFallbackApi, usingFallbackApi]);

  useEffect(() => {
    // Initial connection attempt
    connectWebSocket();

    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
      if (batchIntervalRef.current) {
        clearInterval(batchIntervalRef.current);
        batchIntervalRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      socketBufferRef.current = [];
      isConnectingRef.current = false;
    };
  }, [connectWebSocket]);

  useEffect(() => {
    const updateSelectedDetails = () => {
      if (!selectedSymbolRef.current) return;

      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: "REQUEST_DETAILS",
            symbol: selectedSymbolRef.current,
          })
        );
      }
    };

    updateIntervalRef.current = window.setInterval(updateSelectedDetails, 5000);
    updateSelectedDetails();

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    };
  }, [selectedSymbol]);

  useEffect(() => {
    const checkAndUseFallback = () => {
      const timeSinceLastWsData = Date.now() - lastWsDataTime;
      const shouldUseFallback = !wsConnected || timeSinceLastWsData > 10000; // Increased to 10 seconds

      if (shouldUseFallback && !usingFallbackApi && wsConnectionAttempts > 0) {
        // Only use fallback after at least one connection attempt
        fetchFromFallbackApi();
      } else if (
        wsConnected &&
        timeSinceLastWsData <= 15000 &&
        usingFallbackApi
      ) {
        setUsingFallbackApi(false);
      }
    };

    fallbackIntervalRef.current = window.setInterval(() => {
      checkAndUseFallback();
    }, 15000);

    return () => {
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
        fallbackIntervalRef.current = null;
      }
    };
  }, [wsConnected, lastWsDataTime, usingFallbackApi, fetchFromFallbackApi, wsConnectionAttempts]);

  useEffect(() => {
    if (!selectedSymbol) {
      setDetails(null);
      setAnalysis(null);
      return;
    }

    const hasCurrentDetails = details?.symbol === selectedSymbol;
    if (hasCurrentDetails) {
      return;
    }

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 3000);

    fetchDetailsFromAPI();

    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "REQUEST_DETAILS",
          symbol: selectedSymbol,
        })
      );
    }

    async function fetchDetailsFromAPI() {
      try {
        setDetailsLoading(true);
        const res = await fetch(
          `${apiBase}/scores/snapshot/${encodeURIComponent(selectedSymbol || "")}`,
          {
            headers: {
              "ngrok-skip-browser-warning": "true",
            },
            signal: abortController.signal,
          }
        );
        if (!res.ok) throw new Error(`Details error ${res.status}`);
        const data: StockDetails = await parseJsonSafe(res);
        setDetails(data);
      } catch (e: unknown) {
        if (e instanceof Error && e.name !== 'AbortError') {
          console.error("Details fetch error:", e);
        }
      } finally {
        setDetailsLoading(false);
      }
    }

    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [selectedSymbol, apiBase, parseJsonSafe, details]);

  const wheelhouseSymbols = useMemo(
    () => universe.filter((r) => r.inWheelhouse).map(r => r.symbol),
    [universe]
  );

  const aiContextSnapshot = useMemo(() => {
    try {
      return JSON.stringify({ selectedSymbol, details, analysis, universe: universe.slice(0, 10) });
    } catch {
      return '';
    }
  }, [selectedSymbol, details, analysis, universe]);

  const handleSelectSymbol = useCallback((symbol: string) => {
    setSelectedSymbol(symbol);
    setDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-50">
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-[1920px] min-w-[1400px] px-4 py-3 flex flex-col gap-3">
          <Header 
            status={status} 
            wsConnected={wsConnected} 
            usingFallbackApi={usingFallbackApi}
            onTradingDayChange={setTradingDay}
            onAiOpen={() => setAiOpen(true)}
          />
          <PositionsTable tradingDay={tradingDay} />
          <ParametersBar />

          <div className="mt-1 relative">
            <div className="flex flex-col gap-3">
              <WheelhouseTable
                symbols={wheelhouseSymbols}
                selectedSymbol={selectedSymbol}
                onSelectSymbol={handleSelectSymbol}
                loading={false}
              />
              <NotInWheelhouseTableClose loading={false} />
              <IPODashboard />
            </div>

            <div
              className={`fixed inset-x-0 bottom-0 h-[85vh] transform transition-all duration-500 ease-in-out z-50 ${
                drawerOpen ? "translate-y-0" : "translate-y-full"
              }`}
            >
              <div className="h-full flex flex-col bg-slate-900/95 backdrop-blur-md border-l border-slate-800 shadow-2xl overflow-y-auto">
                <div className="px-6 py-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/50 sticky top-0 z-10">
                  <div>
                    <h2 className="text-2xl font-bold text-cyan-400">
                      {selectedSymbol?.toUpperCase()}{details?.company_name ? ` - ${details.company_name}` : ""}
                    </h2>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 p-2 transition-colors duration-200"
                    onClick={handleCloseDrawer}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 p-6 space-y-4">
                  <StockAnalysisView
                    analysis={analysis}
                    selectedSymbol={selectedSymbol}
                    apiBase={apiBase}
                    details={details}
                    loading={detailsLoading}
                    onSymbolSelect={handleSelectSymbol}
                  />
                </div>
              </div>
            </div>

            {drawerOpen && (
              <div
                className="fixed inset-0 bg-black/20 backdrop-blur-[2px] transition-opacity duration-500 z-40"
                onClick={handleCloseDrawer}
              />
            )}

            {aiOpen && (
              <div
                className="fixed inset-0 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300 z-50"
                onClick={() => setAiOpen(false)}
              />
            )}

            <div className={`fixed top-0 right-0 h-full w-[600px] max-w-full transform transition-transform duration-300 z-60 ${aiOpen ? 'translate-x-0' : 'translate-x-full'}`}>
              <div className="h-full flex flex-col bg-white border-l border-slate-200 shadow-2xl overflow-y-auto text-slate-900">
                <div className="px-4 py-3 flex items-center justify-between border-b border-slate-200 sticky top-0 z-10">
                  <div>
                    <h2 className="text-lg font-semibold">Assistant</h2>
                    <p className="text-xs text-slate-600 mt-0.5">Ask about the selected symbol or snapshot</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAiOpen(false)}
                    className="rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 p-2 transition-colors duration-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 p-4">
                  <AIChat context_snapshot={aiContextSnapshot} theme="light" className="h-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
import { useState, useEffect, useCallback } from "react";
import { ScrollableTableContainer } from "../hooks/ScrollableTableContainer";
import { ChevronLeft, ChevronRight, Bot } from "lucide-react";
import GoalReachedBanner from "../components/GoalReachedBanner";
import type { BotStatus as ImportedBotStatus } from "../types/BotStatus";

interface BotStatus {
  tradingDay: number; // ✅ Current/latest day (e.g., 24)
  tradingDayMax: number; // ✅ Max possible day (e.g., 60)
  isLatestDay: boolean; // ✅ Whether this is the latest available day
  tranche: string; // ✅ Active tranche ("A" | "B")
  equity: string; // ✅ Total equity
  availableCash: string; // ✅ Available cash
  trancheData: {
    A: {
      status: string; // ✅ "ACTIVE" | "INACTIVE"
      settled: string; // ✅ "SETTLED" | "SETTLING"
      equity: string;
      available: string;
      available_cash_a: string;
      available_cash_b: string;
      locked: string;
      cash_reserve: string;
      holds: string; // ✅ "YES" | "NO"
      holds_details: string;
      goal_reached: string; // ✅ "YES" | "NO"
      goal_day: string;
      goal_day_a: string;
      goal_day_b: string;
      profit_amount: number;
      profit_percentage: number;
    };
    B: {
      status: string;
      settled: string;
      equity: string;
      available: string;
      available_cash_a: string;
      available_cash_b: string;
      locked: string;
      cash_reserve: string;
      holds: string;
      holds_details: string;
      goal_reached: string;
      goal_day: string;
      goal_day_a: string;
      goal_day_b: string;
      profit_amount: number;
      profit_percentage: number;
    };
  };
}

interface HeaderProps {
  status?: BotStatus | ImportedBotStatus | null;
  wsConnected?: boolean;
  usingFallbackApi?: boolean;
  onTradingDayChange?: (day: number) => void;
  onAiOpen?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status: propStatus = null,
  wsConnected = false,
  usingFallbackApi = false,
  onTradingDayChange,
  onAiOpen,
}) => {
  const [selectedAccount, setSelectedAccount] = useState<
    "PAPER_1A" | "PAPER_2A" | "PAPER_3A"
  >("PAPER_1A");
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [, setError] = useState<string | null>(null);
  const [tradingDay, setTradingDay] = useState<number>(1);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // ✅ HELPER: Determine account from trading day
  const getAccountFromDay = (
    day: number,
  ): "PAPER_1A" | "PAPER_2A" | "PAPER_3A" => {
    if (day >= 1 && day <= 20) return "PAPER_1A";
    if (day >= 21 && day <= 40) return "PAPER_2A";
    if (day >= 41 && day <= 60) return "PAPER_3A";
    return "PAPER_1A";
  };

  // ✅ HELPER: Get first day of a trading tranche
  const getFirstDayOfAccount = (account: string): number => {
    if (account === "PAPER_2A") return 21;
    if (account === "PAPER_3A") return 41;
    return 1;
  };

  // ✅ UPDATED: Fetch bot status with both account and day as parameters
  const fetchBotStatus = useCallback(
    async (account: string, day: number) => {
      try {
        setLoading(true);
        setError(null);

        const API_BASE_URL = (import.meta.env.VITE_API_BASE as string) || '';
        const base = API_BASE_URL.replace(/\/$/, '');
        const url = base
          ? `${base}/api/bot/status?account=${account}&day=${day}`
          : `/api/bot/status?account=${account}&day=${day}`;

        const response = await fetch(url,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(API_BASE_URL.includes("ngrok") && {
                "ngrok-skip-browser-warning": "true",
              }),
            },
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: BotStatus = await response.json();

        // Simply update bot status
        setBotStatus(data);

        console.log(`✅ Fetched status for account ${account}, day ${day}`);
      } catch (err: unknown) {
        console.error("Error fetching bot status:", err);
        setError(err instanceof Error ? err.message : String(err));
        setBotStatus(null);
      } finally {
        setLoading(false);
      }
    },
    [], // Empty dependency array since we pass parameters directly
  );

  // ✅ Initialize on first load
  useEffect(() => {
    if (propStatus) {
      setBotStatus(propStatus as BotStatus);
    }
  }, [propStatus]);

  // ✅ NEW: Single effect for API polling every 5 seconds
  useEffect(() => {
    // Initial fetch
    fetchBotStatus(selectedAccount, tradingDay);

    // Set up 15-second interval
    const interval = setInterval(() => {
      console.log(
        `⏰ 15-second poll: Fetching ${selectedAccount}, day ${tradingDay}`,
      );
      fetchBotStatus(selectedAccount, tradingDay);
    }, 15000); // 15 seconds

    // Cleanup on unmount or when dependencies change
    return () => clearInterval(interval);
  }, [selectedAccount, tradingDay, fetchBotStatus]);

  // ✅ Notify parent component of trading day changes
  useEffect(() => {
    if (onTradingDayChange) {
      onTradingDayChange(tradingDay);
    }
  }, [tradingDay, onTradingDayChange]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // Check if click is outside the dropdown container
      if (dropdownOpen && !target.closest(".trading-day-dropdown")) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleAccountChange = (
    account: "PAPER_1A" | "PAPER_2A" | "PAPER_3A",
  ) => {
    const targetDay = getFirstDayOfAccount(account);
    const latestDay = latestTradingDay; // Backend's latest enabled day

    // ✅ If target day is available, go there. Otherwise, go to latest day and update account
    if (targetDay <= latestDay) {
      // Target day is available - navigate to it
      setSelectedAccount(account);
      setTradingDay(targetDay);
      console.log(
        `📊 Account changed to ${account}, navigating to day ${targetDay}`,
      );
    } else {
      // Target day is disabled (in future) - go to latest day and update account to match
      const accountForLatestDay = getAccountFromDay(latestDay);
      setSelectedAccount(accountForLatestDay);
      setTradingDay(latestDay);
      console.log(
        `📊 Account changed to ${account}, but day ${targetDay} is not available. Navigating to latest day ${latestDay} with account ${accountForLatestDay}`,
      );
    }
  };

  const handleTradingDayChange = (day: number) => {
    // ✅ Update day and determine corresponding account in one action
    setTradingDay(day);

    const newAccount = getAccountFromDay(day);
    console.log(`📅 Day changed to ${day}, account: ${newAccount}`);

    // Update account if it doesn't match the day's range
    if (newAccount !== selectedAccount) {
      setSelectedAccount(newAccount);
    }
  };

  // Single source of truth for the latest enabled trading day
  const latestTradingDay = botStatus?.tradingDay ?? 1; // Backend's latest trading day

  const trancheData = botStatus?.trancheData ?? {
    A: {
      status: "N/A",
      settled: "N/A",
      equity: "$0",
      available: "$0",
      available_cash_a: "$0",
      available_cash_b: "$0",
      locked: "$0",
      cash_reserve: "$0",
      holds: "N/A",
      holds_details: "N/A",
      goal_reached: "N/A",
      goal_day: "$0",
      goal_day_a: "$0",
      goal_day_b: "$0",
      profit_amount: 0,
      profit_percentage: 0,
    },
    B: {
      status: "N/A",
      settled: "N/A",
      equity: "$0",
      available: "$0",
      available_cash_a: "$0",
      available_cash_b: "$0",
      locked: "$0",
      cash_reserve: "$0",
      holds: "N/A",
      holds_details: "N/A",
      goal_reached: "N/A",
      goal_day: "$0",
      goal_day_a: "$0",
      goal_day_b: "$0",
      profit_amount: 0,
      profit_percentage: 0,
    },
  };

  // ✅ Get active tranche from backend data
  const activeTrancheFromBackend = botStatus?.tranche || "A";

  // ✅ Determine active tranche display based on backend data
  const getActiveTrancheDisplay = () => {
    if (!botStatus) return "NONE";

    // Use the tranche field from backend (most authoritative)
    // Also check status fields for backup logic
    const backendActive = botStatus.tranche;
    const aStatus = trancheData.A.status;
    const bStatus = trancheData.B.status;

    // Primary: Use backend's tranche field
    if (backendActive === "A" || backendActive === "B") {
      return backendActive;
    }

    // Fallback: Check status fields
    const activeA = aStatus === "ACTIVE";
    const activeB = bStatus === "ACTIVE";
    if (activeA && activeB) return "A & B";
    if (activeA) return "A";
    if (activeB) return "B";

    return "NONE";
  };

  // ✅ Determine which tranche data to display based on active tranche
  const getDisplayedTrancheData = () => {
    const activeTrancheStr = getActiveTrancheDisplay();
    if (activeTrancheStr === "A") return trancheData.A;
    if (activeTrancheStr === "B") return trancheData.B;
    // If both or none, default to A
    return trancheData.A;
  };

  const displayedTrancheData = getDisplayedTrancheData();

  const connectionStatus = usingFallbackApi
    ? "FALLBACK API"
    : wsConnected
      ? "LIVE"
      : "CONNECTING";
  const connectionColor = usingFallbackApi
    ? "text-yellow-400"
    : wsConnected
      ? "text-emerald-400"
      : "text-blue-400";

  const gridLayout =
    "grid grid-cols-4 text-[11px] text-slate-200 border-x border-slate-800";
  const cellStyle = "px-2 py-1 border-r border-slate-800 last:border-r-0";
  const labelStyle =
    "text-[10px] font-semibold text-slate-400 uppercase tracking-wider";
  const valueStyle = "text-slate-100 font-medium";

  return (
    <div className="w-full px-3 py-1.5 bg-slate-950">
      {/* TITLE ROW */}
      <div className="grid grid-cols-3 items-center mb-2">
        <div className="flex items-center gap-4 text-[10px] uppercase tracking-wider text-slate-500">
          <div className="flex items-center gap-2">
            <span>CONNECTION:</span>
            <span className={`font-bold ${connectionColor}`}>
              {connectionStatus}
            </span>
          </div>
        </div>
        <h1 className="text-base font-semibold tracking-tight text-center text-slate-200">
          Chuck BotView Pro
        </h1>
        <div className="flex justify-end items-center">
          {/* This space is intentionally left empty for balance */}
        </div>
      </div>

      {/* Fixed AI Chat Bot Button - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <button
          type="button"
          onClick={onAiOpen}
          aria-label="Open assistant"
          title="Open assistant"
          className="group inline-flex items-center justify-center h-10 w-10 rounded-full bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all duration-200"
        >
          <Bot className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
        </button>
      </div>
      <div className="border-t border-slate-800">
        {/* ROW 1: MAIN METRICS HEADERS */}
        <div
          className={`${gridLayout} bg-slate-900/50 border-b border-slate-800`}
        >
          <div className={cellStyle}>
            <div className="flex items-center gap-2">
              <span className={labelStyle}>TRADING DAY</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    const prevDay = Math.max(1, tradingDay - 1);
                    handleTradingDayChange(prevDay);
                  }}
                  disabled={tradingDay <= 1}
                  className="bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-white focus:ring-2 focus:ring-emerald-500 outline-none hover:bg-slate-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center shadow-sm"
                  title="Previous Day"
                >
                  <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
                </button>
                <div className="relative trading-day-dropdown">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDropdownOpen(!dropdownOpen);
                    }}
                    className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs font-semibold text-white focus:ring-2 focus:ring-emerald-500 outline-none hover:bg-slate-700 transition-colors min-w-14 text-center leading-none shadow-sm"
                  >
                    Day {tradingDay}
                  </button>
                  {dropdownOpen && (
                    <div
                      className="absolute top-full mt-1 left-0 bg-slate-800 border border-slate-700 rounded shadow-xl z-50 min-w-24"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ScrollableTableContainer maxHeight="max-h-100">
                        {Array.from({ length: 60 }, (_, i) => i + 1).map(
                          (day) => {
                            const isDisabled = day > latestTradingDay;
                            const isSelected = day === tradingDay;
                            return (
                              <button
                                key={day}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isDisabled) {
                                    handleTradingDayChange(day);
                                    setDropdownOpen(false);
                                  }
                                }}
                                disabled={isDisabled}
                                className={`w-full px-2.5 py-1 text-[10px] font-medium text-left transition-colors first:rounded-t last:rounded-b ${
                                  isDisabled
                                    ? "text-slate-600 cursor-not-allowed bg-slate-900/50"
                                    : isSelected
                                      ? "bg-emerald-600 text-white"
                                      : "text-slate-200 hover:bg-slate-700"
                                }`}
                              >
                                Day {day}
                                {day === latestTradingDay && " (Latest)"}
                                {isDisabled && " - Future"}
                              </button>
                            );
                          },
                        )}
                      </ScrollableTableContainer>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    const nextDay = Math.min(latestTradingDay, tradingDay + 1);
                    handleTradingDayChange(nextDay);
                  }}
                  disabled={tradingDay >= latestTradingDay}
                  className="bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-white focus:ring-2 focus:ring-emerald-500 outline-none hover:bg-slate-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center shadow-sm"
                  title="Next Day"
                >
                  <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
          <div className={cellStyle}>
            <span className={labelStyle}>ACTIVE TRANCHE:</span>{" "}
            <span className={`${valueStyle} font-bold text-emerald-400`}>
              {getActiveTrancheDisplay()}
            </span>
          </div>
          <div className={cellStyle}>
            <span className={labelStyle}>GOAL DAY {tradingDay}:</span>{" "}
            <span className={valueStyle}>{displayedTrancheData.goal_day}</span>
          </div>
          <div className={cellStyle}>
            {botStatus && botStatus.trancheData ? (
              <GoalReachedBanner
                goalReached={displayedTrancheData.goal_reached === "YES"}
                amount={displayedTrancheData.profit_amount || 0}
                percent={displayedTrancheData.profit_percentage || 0}
                mode={
                  displayedTrancheData.goal_reached === "NO" &&
                  (displayedTrancheData.profit_amount || 0) > 0
                    ? "GAIN"
                    : displayedTrancheData.goal_reached === "NO" &&
                        (displayedTrancheData.profit_amount || 0) < 0
                      ? "LOSS"
                      : undefined
                }
              />
            ) : (
              <div className="text-slate-500">N/A</div>
            )}
          </div>
        </div>

        {/* ROW 2: MAIN METRICS VALUES */}
        <div className={`${gridLayout} border-b border-slate-800`}>
          <div className={`${cellStyle} flex items-center gap-2`}>
            <span className={labelStyle}>ACCOUNT</span>
            <select
              value={selectedAccount}
              onChange={(e) =>
                handleAccountChange(
                  e.target.value as "PAPER_1A" | "PAPER_2A" | "PAPER_3A",
                )
              }
              disabled={loading}
              className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-[10px] font-medium text-white focus:ring-2 focus:ring-emerald-500 outline-none hover:bg-slate-700 transition-colors disabled:opacity-50 shadow-sm"
            >
              <option value="PAPER_1A">PAPER 1A</option>
              <option value="PAPER_2A">PAPER 2A</option>
              <option value="PAPER_3A">PAPER 3A</option>
            </select>
          </div>
          <div className={cellStyle}>
            <span className={labelStyle}>EQUITY:</span>{" "}
            <span className={valueStyle}>
              {botStatus ? botStatus.equity : "$0.00"}
            </span>
          </div>
          <div className={cellStyle}>
            <span className={labelStyle}>CASH RESERVE:</span>{" "}
            <span className={valueStyle}>
              {displayedTrancheData.cash_reserve}
            </span>
          </div>
          <div className={cellStyle}>
            <span className={labelStyle}>AVAILABLE:</span>{" "}
            <span className={valueStyle}>
              {botStatus ? botStatus.availableCash : "$0.00"}
            </span>
          </div>
        </div>

        {/* ROW 3: TRANCHE A HEADERS */}
        <div
          className={`${gridLayout} bg-slate-900/50 border-b border-slate-800`}
        >
          <div className={`${cellStyle} flex items-center gap-2`}>
            <span
              className={`text-[11px] font-bold ${activeTrancheFromBackend === "A" ? "text-emerald-400" : "text-slate-200"}`}
            >
              TRANCHE A
            </span>
            {activeTrancheFromBackend === "A" && (
              <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-400/20 px-2 py-0.5 rounded">
                ACTIVE
              </span>
            )}
          </div>
          <div className={cellStyle}>
            <span className={labelStyle}>STATUS:</span>{" "}
            <span className={valueStyle}>{trancheData.A.status}</span>
            <span className="text-slate-500 mx-2">|</span>
            <span className={valueStyle}>{trancheData.A.settled}</span>
          </div>
          <div className={cellStyle}>
            <span className={labelStyle}>CASH AVAILABLE:</span>{" "}
            <span className={valueStyle}>{trancheData.A.available}</span>
          </div>
          <div className={cellStyle}>
            <span className={labelStyle}>HOLDS/OVERNIGHT/WEEKEND:</span>{" "}
            <span className={valueStyle}>{trancheData.A.holds}</span>
          </div>
        </div>

        {/* ROW 4: TRANCHE B HEADERS */}
        <div className={`${gridLayout} bg-slate-900/50`}>
          <div className={`${cellStyle} flex items-center gap-2`}>
            <span
              className={`text-[11px] font-bold ${activeTrancheFromBackend === "B" ? "text-emerald-400" : "text-slate-200"}`}
            >
              TRANCHE B
            </span>
            {activeTrancheFromBackend === "B" && (
              <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-400/20 px-2 py-0.5 rounded">
                ACTIVE
              </span>
            )}
          </div>
          <div className={cellStyle}>
            <span className={labelStyle}>STATUS:</span>{" "}
            <span className={valueStyle}>{trancheData.B.status}</span>
            <span className="text-slate-500 mx-2">|</span>
            <span className={valueStyle}>{trancheData.B.settled}</span>
          </div>
          <div className={cellStyle}>
            <span className={labelStyle}>CASH AVAILABLE:</span>{" "}
            <span className={valueStyle}>{trancheData.B.available}</span>
          </div>
          <div className={cellStyle}>
            <span className={labelStyle}>HOLDS/OVERNIGHT/WEEKEND:</span>{" "}
            <span className={valueStyle}>{trancheData.B.holds}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
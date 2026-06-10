import React, { useEffect, useState } from "react";
import { ScrollableTableContainer } from "../hooks/ScrollableTableContainer";

interface IPOData {
  symbol: string;
  company: string;
  ipo_date: string;
  price: string;
  sector: string | null;
  image: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface APIResponse {
  status: string;
  count: number;
  data: IPOData[];
}

export const UpcomingIPOPage: React.FC = () => {
  const [upcomingIPOs, setUpcomingIPOs] = useState<IPOData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  useEffect(() => {
    const fetchIPOs = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use environment variable or fallback to ngrok URL
        const API_BASE_URL =
          import.meta.env.VITE_API_BASE;

        const response = await fetch(`${API_BASE_URL}/ipos/save`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            // Add ngrok header if using ngrok URL
            ...(API_BASE_URL.includes("ngrok") && {
              "ngrok-skip-browser-warning": "true",
            }),
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const apiResponse: APIResponse = await response.json();

        // Extract data array from response
        if (apiResponse.status === "success" && apiResponse.data) {
          setUpcomingIPOs(apiResponse.data);
        } else {
          setUpcomingIPOs([]);
        }
      } catch (err: unknown) {
        console.error("Error fetching IPOs:", err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchIPOs();
    const interval = setInterval(fetchIPOs, 1000*60*60);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-900/80 border border-slate-800 overflow-hidden">
      <div className="px-4 py-2 border-b border-slate-800 text-xs font-semibold">
        UPCOMING IPO'S
      </div>

      {loading ? (
        <div className="h-32 flex items-center justify-center text-xs text-slate-400">
          LOADING UPCOMING IPOs…
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
                  COMPANY
                </th>
                <th
                  rowSpan={2}
                  className="px-2 py-2 text-center text-[10px] font-semibold"
                >
                  IPO DATE
                </th>
                <th
                  rowSpan={2}
                  className="px-2 py-2 text-center text-[10px] font-semibold"
                >
                  PRICE
                </th>
                <th
                  rowSpan={2}
                  className="px-2 py-2 text-center text-[10px] font-semibold"
                >
                  SECTOR
                </th>
              </tr>
            </thead>

            <tbody>
              {error ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-red-400">
                    ERROR LOADING IPOs: {error}
                  </td>
                </tr>
              ) : upcomingIPOs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    NO UPCOMING IPOs FOUND
                  </td>
                </tr>
              ) : (
                upcomingIPOs.map((ipo) => (
                  <tr
                    key={ipo.symbol}
                    className="border-t border-slate-800/60"
                  >
                    <td className="px-2 py-1.5 text-center text-[10px]">
                      <div className="flex items-center justify-center gap-2">
                        {ipo.image ? (
                          <img
                            src={ipo.image}
                            alt={ipo.company}
                            className="w-5 h-5 object-contain"
                            onError={(e) =>
                              ((e.target as HTMLImageElement).style.display =
                                "none")
                            }
                          />
                        ) : (
                          <div className="w-5 h-5 bg-slate-800 rounded flex items-center justify-center text-[8px] font-semibold">
                            {ipo.symbol.substring(0, 2)}
                          </div>
                        )}
                        <span className="font-medium text-blue-400">{ipo.symbol}</span>
                      </div>
                    </td>

                    <td className="px-2 py-1.5 text-center text-[10px]">
                      {ipo.company}
                    </td>

                    <td className="px-2 py-1.5 text-center text-[10px]">
                      {formatDate(ipo.ipo_date)}
                    </td>

                    <td className="px-2 py-1.5 text-center text-[10px]">
                      ${ipo.price}
                    </td>

                    <td className="px-2 py-1.5 text-center text-[10px]">
                      {ipo.sector || (
                        <span className="text-slate-500">–</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </ScrollableTableContainer>
      )}
    </div>
  );
};

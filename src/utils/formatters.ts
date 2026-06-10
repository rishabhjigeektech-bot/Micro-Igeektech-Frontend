export const formatCurrency = (v: number | null | undefined) =>
  v == null ? "-" : `$${v.toFixed(2)}`;

export const formatPercent = (v: number | null | undefined) =>
  v == null ? "-" : `${v.toFixed(2)} %`;

export const scoreColor = (score: number | null) => {
  if (score == null) return "bg-slate-700 text-slate-100";
  if (score >= 5) return "bg-emerald-600 text-white";
  if (score >= 4) return "bg-amber-600 text-white";
  return "bg-rose-600 text-white";
};

export const truncate = (text: string, max: number) =>
  text.length > max ? text.slice(0, max - 1) + "…" : text;
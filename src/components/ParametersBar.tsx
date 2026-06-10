import React from "react";

export const ParametersBar: React.FC = () => {
  return (
    <div className="bg-slate-900/80 border border-slate-800  px-4 py-2 text-[11px] flex flex-wrap gap-x-6 gap-y-1">
      <span className="font-semibold text-slate-200">PARAMETERS <br /> (HARD GATES)</span>
      <span>PRICE $2–$30</span>
      <span>1M ≤ FLOAT ≤ 15M</span>
      <span>PRE-MARKET CHANGE ≥ +2%</span>
      <span>PRE-MARKET VOLUME ≥ 200K</span>
      <span>RELATIVE VOLUME ≥ 2×</span>
      <span>AVG 30-DAY VOLUME ≥ 500K</span>
    </div>
  );
};

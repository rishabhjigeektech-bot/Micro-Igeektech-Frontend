import React from "react";

export const Spinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-6 h-6 border-2 border-slate-700 border-t-cyan-500 rounded-full animate-spin" />
      <span className="text-slate-400 text-xs">Loading data...</span>
    </div>
  );
};

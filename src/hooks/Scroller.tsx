import React from "react";

type ScrollerProps = {
  children: React.ReactNode;
  className?: string;
};

export const Scroller: React.FC<ScrollerProps> = ({ 
  children, 
  className = "" 
}) => {
  return (
    <div 
      className={`overflow-y-auto scrollbar-thin scrollbar-track-slate-700 scrollbar-thumb-cyan-500 hover:scrollbar-thumb-cyan-600 min-h-0 ${className}`}
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#06b6d4 #334155',
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
};

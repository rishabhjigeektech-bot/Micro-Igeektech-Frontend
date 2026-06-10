import React from "react";

type ScrollableTableContainerProps = {
  children: React.ReactNode;
  maxHeight?: string;
  className?: string;
};

export const ScrollableTableContainer: React.FC<
  ScrollableTableContainerProps
> = ({ children, maxHeight = "max-h-67", className = "" }) => {
  return (
    <div
      className={`${maxHeight} overflow-y-auto wheelhouse-scroll ${className}`}
    >
      {children}
    </div>
  );
};

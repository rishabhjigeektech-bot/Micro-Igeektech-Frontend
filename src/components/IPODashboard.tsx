import React from "react";
import { UpcomingIPOPage } from "./UpcomingIPOPage";

const IPODashboard: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <UpcomingIPOPage />
    </div>
  );
};

export default IPODashboard;

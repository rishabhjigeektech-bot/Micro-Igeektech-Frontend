import React from "react";

interface GoalReachedBannerProps {
  goalReached: boolean;
  amount: number;
  percent: number;
  mode?: "GAIN" | "LOSS";
}

export const GoalReachedBanner: React.FC<GoalReachedBannerProps> = ({
  goalReached,
  amount,
  percent,
  mode,
}) => {
  const formatAmount = (amt: number) => {
    if (amt < 0) {
      return `($${Math.abs(amt).toFixed(2)})`;
    }
    return `$${amt.toFixed(2)}`;
  };

  const getDisplayText = () => {
    if (goalReached) {
      return `YES! ${formatAmount(amount)} | ${percent.toFixed(2)}%`;
    }

    if (mode === "GAIN") {
      return `NO GAIN: ${formatAmount(amount)} | ${percent.toFixed(2)}%`;
    }

    if (mode === "LOSS") {
      return `NO LOSS: ${formatAmount(amount)} | ${percent.toFixed(2)}%`;
    }

    return `NO CHANGE: $0.00 | 0.00%`;
  };

  const getValueColor = () => {
    if (goalReached) return "green";
    return "red";
  };

  return (
    <>
      <style>
        {`
          .goal-box {
            width: 100%;
            border: none;
            padding: 0;
            background: transparent;
          }

          .goal-row {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }

          .goal-label {
            font-size: 11px;
            font-weight: 400;
            letter-spacing: 0.5px;
            color: rgba(255, 255, 255, 0.75);
          }

          .goal-value {
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.5px;
          }

          .green {
            color: #19d36a;
          }

          .red {
            color: #ff2b2b;
          }
        `}
      </style>
      <div className="goal-box">
        <div className="goal-row">
          <div className="goal-label">GOAL REACHED:</div>
          <div className={`goal-value ${getValueColor()}`}>
            {getDisplayText()}
          </div>
        </div>
      </div>
    </>
  );
};

export default GoalReachedBanner;
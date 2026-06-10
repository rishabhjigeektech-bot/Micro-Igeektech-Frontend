import type {BotMode} from "./BotMode";
import type {TrancheInfo} from "./TrancheInfo";

export type TrancheData = {
  settled: string;
  cash: string;
  holds: string;
};

export type BotStatus = {
  mode: BotMode;
  equity: number;
  availableCash: number;
  tradingDay: number;
  tradingDayMax: number;
  activeTranche: "A" | "B";
  trancheA: TrancheInfo;
  trancheB: TrancheInfo;
  isLatestDay: boolean;
  trancheData: {
    A: TrancheData;
    B: TrancheData;
  };
}


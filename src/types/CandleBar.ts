export type CandleBar = {
  time: number | string;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type ApexCandlestickPoint = {
  x: number | string | Date;
  y: [number, number, number, number];
};

export type ApexCandlestickSeries = {
  name: string;
  data: ApexCandlestickPoint[];
};

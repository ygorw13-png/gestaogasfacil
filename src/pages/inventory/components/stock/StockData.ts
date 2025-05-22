
// Stock data types and interfaces
export interface StockData {
  p13: number;
  p20: number;
  p45: number;
  water: number;
}

export interface MinStockLevels {
  p13: number;
  p20: number;
  p45: number;
  water: number;
}

export const defaultStockData: StockData = {
  p13: 0,
  p20: 0,
  p45: 0,
  water: 0
};

export const defaultMinStockLevels: MinStockLevels = {
  p13: 20,
  p20: 5,
  p45: 5,
  water: 20
};

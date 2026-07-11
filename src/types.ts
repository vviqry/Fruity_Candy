export interface SupplyItem {
  id: string;
  productName: string;
  category: '🔴' | '🟡' | '🟢';
  price: number;
  entryDate: string;
}

export interface DistributionItem {
  id: string;
  locationName: string;
  jarQuantity: number;
  jarType: string;
  mapEmbedCode: string;
  historyDates: string[]; // List of date strings for history dropdown
}

export interface SyncData {
  supply: SupplyItem[];
  distribution: DistributionItem[];
}

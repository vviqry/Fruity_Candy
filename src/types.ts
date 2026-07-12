export interface SupplyItem {
  id: string;
  productName: string;
  category: '🔴' | '🟡' | '🟢';
  price: number;
  entryDate: string;
}

export interface DeliveryHistory {
  date: string;
  jarQuantity: number;
  jarType: string;
}

export interface DistributionItem {
  id: string;
  locationName: string;
  mapEmbedCode: string;
  deliveries: DeliveryHistory[];
}

export interface SyncData {
  supply: SupplyItem[];
  distribution: DistributionItem[];
}

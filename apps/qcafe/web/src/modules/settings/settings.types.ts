export type CafePreferences = {
  kotPrinterTarget: string;
  restaurantName: string;
  branchName: string;
  contactNumber: string;
  address: string;
  fssai: string;
  gstin: string;
  receiptHeader: string;
  receiptFooter: string;
  receiptLegalNote: string;
  currency: "INR";
  defaultServiceType: "POS" | "TAKE AWAY";
  gstRate: 0 | 5 | 12 | 18;
  autoPrintBill: boolean;
  showOrderTabs: boolean;
  showItemImages: boolean;
  showItemCodes: boolean;
  showSpecialLabels: boolean;
  imageWriteProtection: boolean;
  receiptWidth: "58mm" | "80mm";
  showReceiptContact: boolean;
};
export type CafeSettings = CafePreferences & { revision: number };
export const defaultCafeSettings: CafeSettings = {
  revision: 0,
  kotPrinterTarget: "system-default",
  restaurantName: "",
  branchName: "",
  contactNumber: "",
  address: "",
  fssai: "",
  gstin: "",
  receiptHeader: "",
  receiptFooter: "Thank you. Please visit again!",
  receiptLegalNote: "",
  currency: "INR",
  defaultServiceType: "TAKE AWAY",
  gstRate: 0,
  autoPrintBill: false,
  showOrderTabs: true,
  showItemImages: true,
  showItemCodes: true,
  showSpecialLabels: true,
  imageWriteProtection: false,
  receiptWidth: "80mm",
  showReceiptContact: true
};

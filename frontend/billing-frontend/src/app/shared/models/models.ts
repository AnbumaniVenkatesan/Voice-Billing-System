export interface User {
  userId: number;
  username: string;
  role: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  role: string;
  companyId: number | null;
  expiresAt: string;
}

export interface AuthStatus {
  hasUsers: boolean;
  hasSuperAdmin: boolean;
  hasCompanies: boolean;
}

export interface Product {
  productId: number;
  productName: string;
  tamilName: string;
  price: number;
  gstPercentage: number;
  status: string;
  createdAt: string;
  aliases: string[];
}

export interface ProductRequest {
  productId?: number;
  productName: string;
  tamilName: string;
  price: number;
  gstPercentage: number;
  status: string;
  aliases: string[];
}

export interface InvoiceItem {
  invoiceItemId: number;
  productName: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
  gstPercentage: number;
}

export interface TaxSlab {
  gstRate: number;
  sgstRate: number;
  cgstRate: number;
  sgstAmount: number;
  cgstAmount: number;
  gstAmount: number;
}

export interface Invoice {
  invoiceId: number;
  invoiceNumber: string;
  items: InvoiceItem[];
  subtotal: number;
  gstAmount: number;
  sgstAmount: number;
  cgstAmount: number;
  totalAmount: number;
  paymentStatus: string;
  invoiceDate: string;
  taxSlabs: TaxSlab[];
}

export interface InvoiceRequest {
  items: InvoiceItemRequest[];
  paymentMethod?: string;
}

export interface InvoiceItemRequest {
  productId: number;
  quantity: number;
}

export interface VoiceRequest {
  text: string;
}

export interface VoiceItem {
  productId: number;
  productName: string;
  tamilName: string;
  quantity: number;
  unit: string;
  price: number;
  gstPercentage: number;
}

export interface SuggestedProduct {
  productId: number;
  productName: string;
  tamilName: string;
  price: number;
  gstPercentage: number;
}

export interface UnmatchedItem {
  spokenText: string;
  quantity: number;
  unit: string;
  suggestions: SuggestedProduct[];
}

export interface VoiceResponse {
  recognizedText: string;
  matchedItems: VoiceItem[];
  unmatchedItems: UnmatchedItem[];
}

export interface VoiceAliasRequest {
  spokenText: string;
  productId: number;
}

export interface DashboardData {
  totalProducts: number;
  todaySales: number;
  monthlySales: number;
  todayBills: number;
  totalRevenue: number;
  totalProductsSold: number;
}

export interface ExcelImportResponse {
  totalRows: number;
  successCount: number;
  errorCount: number;
  aliasesImported: number;
  duplicatesSkipped: number;
  errors: string[];
  importedProducts: string[];
}

export interface ProductUpdateResponse {
  totalRows: number;
  updatedCount: number;
  skippedCount: number;
  notFoundCount: number;
  updated: string[];
  skipped: string[];
  notFound: string[];
  errors: string[];
}

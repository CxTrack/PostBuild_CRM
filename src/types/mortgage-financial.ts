export interface FinancialData {
  grossCommission: number;
  netCommission: number;
  averageCommission: number;
  totalDeals: number;
  monthlyData: MonthlyCommissionData[];
  recentDeals: Deal[];
}

export interface Deal {
  id: string;
  opportunityId: string;
  clientName: string;
  closeDate: string;
  loanAmount: number;
  grossCommission: number;
  splitPercent: number;
  takeHome: number;
  status: string;
  stage: string;
}

export interface MonthlyCommissionData {
  month: string;
  gross: number;
  net: number;
}

export interface Opportunity {
  id: string;
  name: string;
  stage: string;
  value: number;
  status: string;
  expectedClose: string;
  activeStatus: 'Active' | 'Inactive';
  bps?: number;
  loanAmount?: number;
  closeDate?: string;
  splitPercent?: number;
}

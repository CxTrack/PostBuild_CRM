import { Deal, FinancialData, MonthlyCommissionData, Opportunity } from "../types/mortgage-financial";

export class FinancialService {
  private static instance: FinancialService;
  private opportunities: Opportunity[] = [];
  private deals: Deal[] = [];

  static getInstance(): FinancialService {
    if (!FinancialService.instance) {
      FinancialService.instance = new FinancialService();
    }
    return FinancialService.instance;
  }

  // Update opportunities data
  updateOpportunities(opportunities: Opportunity[]): void {
    this.opportunities = opportunities;
    this.updateDealsFromOpportunities();
  }

  // Convert qualified opportunities to deals
  private updateDealsFromOpportunities(): void {
    const qualifiedStatuses = ['Clear to Close', 'Compliance Completed'];
    
    this.deals = this.opportunities
      .filter(opp => qualifiedStatuses.includes(opp.status))
      .map(opp => this.convertOpportunityToDeal(opp));
  }

  private convertOpportunityToDeal(opportunity: Opportunity): Deal {
    const bps = opportunity.bps || 50; // Default 50 BPS if not specified
    const loanAmount = opportunity.loanAmount || opportunity.value;
    const grossCommission = (loanAmount * bps) / 10000;
    const splitPercent = opportunity.splitPercent || 85; // Default 85% split
    const takeHome = grossCommission * (splitPercent / 100);

    return {
      id: `deal-${opportunity.id}`,
      opportunityId: opportunity.id,
      clientName: opportunity.name,
      closeDate: opportunity.closeDate || opportunity.expectedClose,
      loanAmount,
      grossCommission,
      splitPercent,
      takeHome,
      status: opportunity.status,
      stage: opportunity.stage
    };
  }

  // Calculate financial data
  calculateFinancialData(): FinancialData {
    const totalGrossCommission = this.deals.reduce((sum, deal) => sum + deal.grossCommission, 0);
    const totalNetCommission = this.deals.reduce((sum, deal) => sum + deal.takeHome, 0);
    const averageCommission = this.deals.length > 0 ? totalGrossCommission / this.deals.length : 0;

    return {
      grossCommission: totalGrossCommission,
      netCommission: totalNetCommission,
      averageCommission,
      totalDeals: this.deals.length,
      monthlyData: this.calculateMonthlyData(),
      recentDeals: this.deals.slice(-10) // Last 10 deals
    };
  }

  private calculateMonthlyData(): MonthlyCommissionData[] {
    const monthlyTotals: { [key: string]: { gross: number; net: number } } = {};
    
    // Initialize all months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    months.forEach(month => {
      monthlyTotals[month] = { gross: 0, net: 0 };
    });

    // Aggregate deals by month
    this.deals.forEach(deal => {
      const closeDate = new Date(deal.closeDate);
      const monthIndex = closeDate.getMonth();
      const monthName = months[monthIndex];
      
      monthlyTotals[monthName].gross += deal.grossCommission;
      monthlyTotals[monthName].net += deal.takeHome;
    });

    // If no real data, use mock data for demonstration
    if (this.deals.length === 0) {
      return [
        { month: 'Jan', gross: 45000, net: 38000 },
        { month: 'Feb', gross: 62000, net: 52000 },
        { month: 'Mar', gross: 51000, net: 43000 },
        { month: 'Apr', gross: 78000, net: 66000 },
        { month: 'May', gross: 55000, net: 47000 },
        { month: 'Jun', gross: 68000, net: 58000 },
        { month: 'Jul', gross: 42000, net: 36000 },
        { month: 'Aug', gross: 71000, net: 60000 },
        { month: 'Sep', gross: 59000, net: 50000 },
        { month: 'Oct', gross: 64000, net: 54000 },
        { month: 'Nov', gross: 48000, net: 41000 },
        { month: 'Dec', gross: 73000, net: 62000 }
      ];
    }

    return months.map(month => ({
      month,
      gross: monthlyTotals[month].gross,
      net: monthlyTotals[month].net
    }));
  }

  // Get deal by opportunity ID
  getDealByOpportunityId(opportunityId: string): Deal | undefined {
    return this.deals.find(deal => deal.opportunityId === opportunityId);
  }

  // Get all deals
  getDeals(): Deal[] {
    return this.deals;
  }
}

export const financialService = FinancialService.getInstance();
export interface TaxQuery {
  street?: string;
  city?: string;
  zip?: string;
  country: string;
}

export interface TaxRate {
  state?: string;
  zip?: string;
  city?: string;
  country: string;
  county?: string;
  country_rate?: string;
  state_rate?: string;
  county_rate?: string;
  combined_district_rate?: string;
  combined_rate: string;
  freight_taxable?: boolean;
  city_rate?: string;
}

export interface TaxResponse {
  rate: TaxRate;
}

export interface QueryLog {
  timestamp: string;
  apiKey: string; // "test" | "prod"
  query: TaxQuery;
  response: TaxResponse | { error: string };
  statusCode: number;
}

export interface MonthlyQueryLog {
  month: string; // YYYY-MM
  queries: QueryLog[];
}

export interface CostLog {
  timestamp: string;
  cost: number;
}

export interface MonthlyCostLog {
  month: string; // YYYY-MM
  totalInvocations: number;
  totalCost: number;
  invocations: CostLog[];
}

export interface SlackMessage {
  text: string;
  blocks?: Array<{
    type: string;
    text?: {
      type: string;
      text: string;
    };
    fields?: Array<{
      type: string;
      text: string;
    }>;
    elements?: Array<{
      type: string;
      text?: string;
    }>;
  }>;
}

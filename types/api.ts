export interface MoneyAmount {
  amount: number;
  currency_code: string;
  raw: string;
  symbol: string;
}

export interface CompanyDTO {
  id: string;
  unique_hash: string;
  name: string;
  company_name: string;
  company_logo_url: string;
  description: string;
  deadline: number;
  eligibility_requirements: string[];
  payout_amount: string;
  amounts: {
    max: MoneyAmount;
    items: MoneyAmount[];
  };
  is_proof_required: boolean;
  representing_lawfirm_details: string;
  claim_url: string;
}

export interface CompaniesResponse {
  hash: string;
  items: CompanyDTO[];
}
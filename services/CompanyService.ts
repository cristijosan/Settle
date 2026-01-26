import { api } from '@/api/NetworkManager';
import { CompaniesResponse, CompanyDTO } from '@/types/api';

export type CategoryType = 'All' | 'No Proof' | 'Due Soon';

export const CompanyService = {
  async getLawsuits(category: CategoryType = 'All'): Promise<CompanyDTO[]> {
    const params = new URLSearchParams({
      sort: 'asc',
    });
    
    if (category === 'No Proof') {
      params.append('proof_required', 'false');
    } else if (category === 'Due Soon') {
      params.append('with_expired', 'true');
    }

    const response = await api.sendRequest<CompaniesResponse>(
      'get', 
      `/lawsuits?${params.toString()}`
    );

    return response.items;
  }
};
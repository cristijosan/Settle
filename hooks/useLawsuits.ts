import { CategoryType, CompanyService } from '@/services/CompanyService';
import { useQuery } from '@tanstack/react-query';

export const useLawsuits = (category: CategoryType = 'All') => {
  return useQuery({
    queryKey: ['lawsuits', category],
    queryFn: () => CompanyService.getLawsuits(category),
    staleTime: 1000 * 60 * 5,
  });
};

export const useLawsuitDetails = (id: string) => {
  const { data, isLoading } = useLawsuits();
  return data?.find(item => 
    item.id.toString() === id.toString()
  );
};
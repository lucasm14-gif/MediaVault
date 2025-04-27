
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from './supabase';
import { useToast } from '@/hooks/use-toast';

export function useSupabaseQuery<T>(table: string) {
  const { toast } = useToast();
  
  return useQuery<T[]>({
    queryKey: [table],
    queryFn: async () => {
      const { data, error } = await supabase.from(table).select('*');
      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      }
      return data;
    },
  });
}

export function useSupabaseInsert<T>(table: string) {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (newData: Partial<T>) => {
      const { data, error } = await supabase.from(table).insert(newData).select();
      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      }
      return data[0];
    },
  });
}

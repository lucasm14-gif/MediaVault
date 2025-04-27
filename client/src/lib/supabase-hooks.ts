
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from './supabase';

export function useSupabaseQuery<T>(table: string) {
  return useQuery<T[]>({
    queryKey: [table],
    queryFn: async () => {
      const { data, error } = await supabase.from(table).select('*');
      if (error) throw error;
      return data;
    },
  });
}

export function useSupabaseInsert<T>(table: string) {
  return useMutation({
    mutationFn: async (newData: Partial<T>) => {
      const { data, error } = await supabase.from(table).insert(newData).select();
      if (error) throw error;
      return data[0];
    },
  });
}

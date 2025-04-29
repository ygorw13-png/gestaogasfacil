
import { supabase } from "../client";

// Organizations table operations
export const organizationsTable = {
  select: async () => {
    // Using raw query to avoid TypeScript issues with tables not in the types file
    const response = await supabase
      .from('organizations')
      .select('*');
    return response;
  },
  
  getById: async (id: string) => {
    // Using raw query to avoid TypeScript issues with tables not in the types file
    const response = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();
    return response;
  }
};

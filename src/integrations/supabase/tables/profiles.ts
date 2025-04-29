
import { supabase } from "../client";
import { DbProfile } from "@/types/supabaseTypes";

// Profiles table operations
export const profilesTable = {
  select: async () => {
    const response = await supabase
      .from('profiles')
      .select('*');
    return response;
  },
  
  // Method to select users by organization
  selectByOrganization: async (organizationId: string) => {
    const response = await supabase
      .from('profiles')
      .select('*')
      .eq('organization_id', organizationId);
    return response;
  },
  
  update: async (data: Partial<DbProfile> & { id: string }) => {
    const { id, ...updateData } = data;
    
    const response = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id);
    return response;
  },
};

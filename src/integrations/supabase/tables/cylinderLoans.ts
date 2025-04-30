
import { supabase } from "../client";
import { CylinderLoan } from "@/types/supabaseTypes";
import { createTableOperations } from "./tableUtils";

// Cylinder loans table operations
export const cylinderLoansTable = createTableOperations<CylinderLoan>('cascos_emprestados');

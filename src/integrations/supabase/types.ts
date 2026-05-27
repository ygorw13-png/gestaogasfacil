export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cascos_emprestados: {
        Row: {
          cliente_id: string
          data_devolucao: string | null
          data_emprestimo: string
          id: string
          observacoes: string | null
          organization_id: string
          quantidade: number
          registrado_por: string
          status: string
          tipo_cliente: string
          tipo_vasilhame: string
        }
        Insert: {
          cliente_id: string
          data_devolucao?: string | null
          data_emprestimo?: string
          id?: string
          observacoes?: string | null
          organization_id: string
          quantidade?: number
          registrado_por: string
          status?: string
          tipo_cliente: string
          tipo_vasilhame: string
        }
        Update: {
          cliente_id?: string
          data_devolucao?: string | null
          data_emprestimo?: string
          id?: string
          observacoes?: string | null
          organization_id?: string
          quantidade?: number
          registrado_por?: string
          status?: string
          tipo_cliente?: string
          tipo_vasilhame?: string
        }
        Relationships: []
      }
      colaboradores: {
        Row: {
          atualizado_em: string
          cargo: string
          cpf: string | null
          criado_em: string
          data_admissao: string
          id: string
          nome: string
          observacoes: string | null
          organization_id: string
          situacao: string
          telefone: string | null
        }
        Insert: {
          atualizado_em?: string
          cargo: string
          cpf?: string | null
          criado_em?: string
          data_admissao: string
          id?: string
          nome: string
          observacoes?: string | null
          organization_id: string
          situacao?: string
          telefone?: string | null
        }
        Update: {
          atualizado_em?: string
          cargo?: string
          cpf?: string | null
          criado_em?: string
          data_admissao?: string
          id?: string
          nome?: string
          observacoes?: string | null
          organization_id?: string
          situacao?: string
          telefone?: string | null
        }
        Relationships: []
      }
      configuracoes_entrega: {
        Row: {
          data: Json
          id: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          data?: Json
          id?: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          data?: Json
          id?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      configuracoes_estoque: {
        Row: {
          alerta_ativo: boolean
          atualizado_em: string
          atualizado_por: string | null
          destinatarios_alerta: Json | null
          estoque_minimo: number
          id: string
          organization_id: string | null
          produto: string
        }
        Insert: {
          alerta_ativo?: boolean
          atualizado_em?: string
          atualizado_por?: string | null
          destinatarios_alerta?: Json | null
          estoque_minimo?: number
          id?: string
          organization_id?: string | null
          produto: string
        }
        Update: {
          alerta_ativo?: boolean
          atualizado_em?: string
          atualizado_por?: string | null
          destinatarios_alerta?: Json | null
          estoque_minimo?: number
          id?: string
          organization_id?: string | null
          produto?: string
        }
        Relationships: []
      }
      configuracoes_financeiras: {
        Row: {
          data: Json
          id: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          data?: Json
          id?: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          data?: Json
          id?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      configuracoes_notificacoes: {
        Row: {
          data: Json
          id: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          data?: Json
          id?: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          data?: Json
          id?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      configuracoes_seguranca: {
        Row: {
          data: Json
          id: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          data?: Json
          id?: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          data?: Json
          id?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      configuracoes_sistema: {
        Row: {
          data: Json
          id: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          data?: Json
          id?: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          data?: Json
          id?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      dashboard_data: {
        Row: {
          data: Json
          id: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          data?: Json
          id?: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          data?: Json
          id?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          cliente: string | null
          created_at: string
          endereco: string | null
          id: string
          metodo_pagamento: string | null
          observacoes: string | null
          organization_id: string
          produto: string | null
          quantidade: number | null
          status: string | null
          telefone: string | null
          updated_at: string
          valor: number | null
        }
        Insert: {
          cliente?: string | null
          created_at?: string
          endereco?: string | null
          id?: string
          metodo_pagamento?: string | null
          observacoes?: string | null
          organization_id: string
          produto?: string | null
          quantidade?: number | null
          status?: string | null
          telefone?: string | null
          updated_at?: string
          valor?: number | null
        }
        Update: {
          cliente?: string | null
          created_at?: string
          endereco?: string | null
          id?: string
          metodo_pagamento?: string | null
          observacoes?: string | null
          organization_id?: string
          produto?: string | null
          quantidade?: number | null
          status?: string | null
          telefone?: string | null
          updated_at?: string
          valor?: number | null
        }
        Relationships: []
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          name: string
          organization_id: string | null
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          name: string
          organization_id?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          organization_id?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      requisicoes_estoque: {
        Row: {
          data_processamento: string | null
          data_solicitacao: string
          destino: string
          id: string
          itens: Json
          observacoes: string | null
          organization_id: string
          origem: string
          processado_por: string | null
          solicitante_id: string
          status: string
        }
        Insert: {
          data_processamento?: string | null
          data_solicitacao?: string
          destino: string
          id?: string
          itens?: Json
          observacoes?: string | null
          organization_id: string
          origem: string
          processado_por?: string | null
          solicitante_id: string
          status?: string
        }
        Update: {
          data_processamento?: string | null
          data_solicitacao?: string
          destino?: string
          id?: string
          itens?: Json
          observacoes?: string | null
          organization_id?: string
          origem?: string
          processado_por?: string | null
          solicitante_id?: string
          status?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_org: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      cascos_emprestados: {
        Row: {
          cliente_id: string
          data_devolucao: string | null
          data_emprestimo: string
          id: string
          observacoes: string | null
          quantidade: number
          registrado_por: string
          status: string
          tipo_cliente: string
          tipo_vasilhame: string
        }
        Insert: {
          cliente_id: string
          data_devolucao?: string | null
          data_emprestimo: string
          id?: string
          observacoes?: string | null
          quantidade: number
          registrado_por: string
          status: string
          tipo_cliente: string
          tipo_vasilhame: string
        }
        Update: {
          cliente_id?: string
          data_devolucao?: string | null
          data_emprestimo?: string
          id?: string
          observacoes?: string | null
          quantidade?: number
          registrado_por?: string
          status?: string
          tipo_cliente?: string
          tipo_vasilhame?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          created_at: string | null
          cylinder_count: number | null
          cylinder_types: Json | null
          id: string
          loan_date: string | null
          name: string
          notes: string | null
          phone: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          cylinder_count?: number | null
          cylinder_types?: Json | null
          id?: string
          loan_date?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string | null
          cylinder_count?: number | null
          cylinder_types?: Json | null
          id?: string
          loan_date?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          user_id?: string
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
        Relationships: [
          {
            foreignKeyName: "colaboradores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_entrega: {
        Row: {
          atualizado_em: string | null
          atualizado_por: string | null
          criado_em: string | null
          id: string
          organization_id: string | null
          raio_maximo_km: number | null
          rastreamento_ativo: boolean | null
          taxa_entrega: number | null
          valor_min_entrega_gratis: number | null
        }
        Insert: {
          atualizado_em?: string | null
          atualizado_por?: string | null
          criado_em?: string | null
          id?: string
          organization_id?: string | null
          raio_maximo_km?: number | null
          rastreamento_ativo?: boolean | null
          taxa_entrega?: number | null
          valor_min_entrega_gratis?: number | null
        }
        Update: {
          atualizado_em?: string | null
          atualizado_por?: string | null
          criado_em?: string | null
          id?: string
          organization_id?: string | null
          raio_maximo_km?: number | null
          rastreamento_ativo?: boolean | null
          taxa_entrega?: number | null
          valor_min_entrega_gratis?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "configuracoes_entrega_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_estoque: {
        Row: {
          alerta_ativo: boolean
          atualizado_em: string
          atualizado_por: string
          destinatarios_alerta: Json | null
          estoque_minimo: number
          id: string
          produto: string
        }
        Insert: {
          alerta_ativo?: boolean
          atualizado_em: string
          atualizado_por: string
          destinatarios_alerta?: Json | null
          estoque_minimo?: number
          id: string
          produto: string
        }
        Update: {
          alerta_ativo?: boolean
          atualizado_em?: string
          atualizado_por?: string
          destinatarios_alerta?: Json | null
          estoque_minimo?: number
          id?: string
          produto?: string
        }
        Relationships: []
      }
      configuracoes_financeiras: {
        Row: {
          atualizado_em: string | null
          atualizado_por: string | null
          criado_em: string | null
          id: string
          metodos_pagamento: string[] | null
          moeda: string
          organization_id: string | null
          taxa_imposto: number | null
        }
        Insert: {
          atualizado_em?: string | null
          atualizado_por?: string | null
          criado_em?: string | null
          id?: string
          metodos_pagamento?: string[] | null
          moeda?: string
          organization_id?: string | null
          taxa_imposto?: number | null
        }
        Update: {
          atualizado_em?: string | null
          atualizado_por?: string | null
          criado_em?: string | null
          id?: string
          metodos_pagamento?: string[] | null
          moeda?: string
          organization_id?: string | null
          taxa_imposto?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "configuracoes_financeiras_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_notificacoes: {
        Row: {
          atualizado_em: string | null
          atualizado_por: string | null
          criado_em: string | null
          email_ativo: boolean | null
          id: string
          notificacao_estoque: boolean | null
          notificacao_pedidos: boolean | null
          organization_id: string | null
          sms_ativo: boolean | null
        }
        Insert: {
          atualizado_em?: string | null
          atualizado_por?: string | null
          criado_em?: string | null
          email_ativo?: boolean | null
          id?: string
          notificacao_estoque?: boolean | null
          notificacao_pedidos?: boolean | null
          organization_id?: string | null
          sms_ativo?: boolean | null
        }
        Update: {
          atualizado_em?: string | null
          atualizado_por?: string | null
          criado_em?: string | null
          email_ativo?: boolean | null
          id?: string
          notificacao_estoque?: boolean | null
          notificacao_pedidos?: boolean | null
          organization_id?: string | null
          sms_ativo?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "configuracoes_notificacoes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_seguranca: {
        Row: {
          atualizado_em: string | null
          atualizado_por: string | null
          criado_em: string | null
          dois_fatores_ativo: boolean | null
          expiracao_senha_dias: number | null
          id: string
          nivel_log: string | null
          organization_id: string | null
          tempo_sessao_minutos: number | null
        }
        Insert: {
          atualizado_em?: string | null
          atualizado_por?: string | null
          criado_em?: string | null
          dois_fatores_ativo?: boolean | null
          expiracao_senha_dias?: number | null
          id?: string
          nivel_log?: string | null
          organization_id?: string | null
          tempo_sessao_minutos?: number | null
        }
        Update: {
          atualizado_em?: string | null
          atualizado_por?: string | null
          criado_em?: string | null
          dois_fatores_ativo?: boolean | null
          expiracao_senha_dias?: number | null
          id?: string
          nivel_log?: string | null
          organization_id?: string | null
          tempo_sessao_minutos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "configuracoes_seguranca_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_sistema: {
        Row: {
          atualizado_em: string | null
          atualizado_por: string | null
          criado_em: string | null
          email: string | null
          endereco: string | null
          id: string
          nome_empresa: string
          organization_id: string | null
          telefone: string | null
        }
        Insert: {
          atualizado_em?: string | null
          atualizado_por?: string | null
          criado_em?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome_empresa: string
          organization_id?: string | null
          telefone?: string | null
        }
        Update: {
          atualizado_em?: string | null
          atualizado_por?: string | null
          criado_em?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome_empresa?: string
          organization_id?: string | null
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "configuracoes_sistema_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_data: {
        Row: {
          created_at: string | null
          id: string
          sales_data: Json | null
          stock_data: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          sales_data?: Json | null
          stock_data?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          sales_data?: Json | null
          stock_data?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          address: Json | null
          assigned_at: string | null
          client_name: string
          client_phone: string | null
          created_at: string | null
          delivered_at: string | null
          delivery_person: string | null
          has_empty_cylinder: boolean | null
          id: string
          is_complete_package: boolean | null
          notes: string | null
          payment_method: string | null
          price: number | null
          product: string | null
          quantity: number | null
          status: string | null
          user_id: string
        }
        Insert: {
          address?: Json | null
          assigned_at?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_person?: string | null
          has_empty_cylinder?: boolean | null
          id?: string
          is_complete_package?: boolean | null
          notes?: string | null
          payment_method?: string | null
          price?: number | null
          product?: string | null
          quantity?: number | null
          status?: string | null
          user_id: string
        }
        Update: {
          address?: Json | null
          assigned_at?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_person?: string | null
          has_empty_cylinder?: boolean | null
          id?: string
          is_complete_package?: boolean | null
          notes?: string | null
          payment_method?: string | null
          price?: number | null
          product?: string | null
          quantity?: number | null
          status?: string | null
          user_id?: string
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
          id: string
          name: string
          organization_id: string | null
          role: string
        }
        Insert: {
          id: string
          name: string
          organization_id?: string | null
          role: string
        }
        Update: {
          id?: string
          name?: string
          organization_id?: string | null
          role?: string
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
          origem: string
          processado_por: string | null
          solicitante_id: string
          status: string
        }
        Insert: {
          data_processamento?: string | null
          data_solicitacao: string
          destino: string
          id?: string
          itens: Json
          observacoes?: string | null
          origem: string
          processado_por?: string | null
          solicitante_id: string
          status: string
        }
        Update: {
          data_processamento?: string | null
          data_solicitacao?: string
          destino?: string
          id?: string
          itens?: Json
          observacoes?: string | null
          origem?: string
          processado_por?: string | null
          solicitante_id?: string
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clear_test_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      user_belongs_to_organization: {
        Args: { user_id: string; org_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

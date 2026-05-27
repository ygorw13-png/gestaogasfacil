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
      acertos_entregador: {
        Row: {
          conferido_em: string | null
          conferido_por: string | null
          criado_em: string
          data: string
          entregador_id: string
          entregador_nome: string | null
          id: string
          observacoes: string | null
          organization_id: string
          qtd_entregas: number
          qtd_vendas_rua: number
          status: string
          total_cartao: number
          total_dinheiro: number
          total_geral: number
          total_pix: number
        }
        Insert: {
          conferido_em?: string | null
          conferido_por?: string | null
          criado_em?: string
          data?: string
          entregador_id: string
          entregador_nome?: string | null
          id?: string
          observacoes?: string | null
          organization_id?: string
          qtd_entregas?: number
          qtd_vendas_rua?: number
          status?: string
          total_cartao?: number
          total_dinheiro?: number
          total_geral?: number
          total_pix?: number
        }
        Update: {
          conferido_em?: string | null
          conferido_por?: string | null
          criado_em?: string
          data?: string
          entregador_id?: string
          entregador_nome?: string | null
          id?: string
          observacoes?: string | null
          organization_id?: string
          qtd_entregas?: number
          qtd_vendas_rua?: number
          status?: string
          total_cartao?: number
          total_dinheiro?: number
          total_geral?: number
          total_pix?: number
        }
        Relationships: []
      }
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
      clients: {
        Row: {
          address: Json | null
          created_at: string
          id: string
          name: string
          notes: string | null
          organization_id: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: Json | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: Json | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          updated_at?: string
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
          atualizado_em: string
          atualizado_por: string | null
          id: string
          organization_id: string | null
          raio_maximo_km: number | null
          rastreamento_ativo: boolean | null
          taxa_entrega: number | null
          valor_min_entrega_gratis: number | null
        }
        Insert: {
          atualizado_em?: string
          atualizado_por?: string | null
          id?: string
          organization_id?: string | null
          raio_maximo_km?: number | null
          rastreamento_ativo?: boolean | null
          taxa_entrega?: number | null
          valor_min_entrega_gratis?: number | null
        }
        Update: {
          atualizado_em?: string
          atualizado_por?: string | null
          id?: string
          organization_id?: string | null
          raio_maximo_km?: number | null
          rastreamento_ativo?: boolean | null
          taxa_entrega?: number | null
          valor_min_entrega_gratis?: number | null
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
          atualizado_em: string
          atualizado_por: string | null
          id: string
          metodos_pagamento: Json | null
          moeda: string | null
          organization_id: string | null
          taxa_imposto: number | null
        }
        Insert: {
          atualizado_em?: string
          atualizado_por?: string | null
          id?: string
          metodos_pagamento?: Json | null
          moeda?: string | null
          organization_id?: string | null
          taxa_imposto?: number | null
        }
        Update: {
          atualizado_em?: string
          atualizado_por?: string | null
          id?: string
          metodos_pagamento?: Json | null
          moeda?: string | null
          organization_id?: string | null
          taxa_imposto?: number | null
        }
        Relationships: []
      }
      configuracoes_notificacoes: {
        Row: {
          atualizado_em: string
          atualizado_por: string | null
          email_ativo: boolean | null
          id: string
          notificacao_estoque: boolean | null
          notificacao_pedidos: boolean | null
          organization_id: string | null
          sms_ativo: boolean | null
        }
        Insert: {
          atualizado_em?: string
          atualizado_por?: string | null
          email_ativo?: boolean | null
          id?: string
          notificacao_estoque?: boolean | null
          notificacao_pedidos?: boolean | null
          organization_id?: string | null
          sms_ativo?: boolean | null
        }
        Update: {
          atualizado_em?: string
          atualizado_por?: string | null
          email_ativo?: boolean | null
          id?: string
          notificacao_estoque?: boolean | null
          notificacao_pedidos?: boolean | null
          organization_id?: string | null
          sms_ativo?: boolean | null
        }
        Relationships: []
      }
      configuracoes_seguranca: {
        Row: {
          atualizado_em: string
          atualizado_por: string | null
          dois_fatores_ativo: boolean | null
          expiracao_senha_dias: number | null
          id: string
          nivel_log: string | null
          organization_id: string | null
          tempo_sessao_minutos: number | null
        }
        Insert: {
          atualizado_em?: string
          atualizado_por?: string | null
          dois_fatores_ativo?: boolean | null
          expiracao_senha_dias?: number | null
          id?: string
          nivel_log?: string | null
          organization_id?: string | null
          tempo_sessao_minutos?: number | null
        }
        Update: {
          atualizado_em?: string
          atualizado_por?: string | null
          dois_fatores_ativo?: boolean | null
          expiracao_senha_dias?: number | null
          id?: string
          nivel_log?: string | null
          organization_id?: string | null
          tempo_sessao_minutos?: number | null
        }
        Relationships: []
      }
      configuracoes_sistema: {
        Row: {
          atualizado_em: string
          atualizado_por: string | null
          email: string | null
          endereco: string | null
          id: string
          nome_empresa: string | null
          organization_id: string | null
          telefone: string | null
        }
        Insert: {
          atualizado_em?: string
          atualizado_por?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome_empresa?: string | null
          organization_id?: string | null
          telefone?: string | null
        }
        Update: {
          atualizado_em?: string
          atualizado_por?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome_empresa?: string | null
          organization_id?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      dashboard_data: {
        Row: {
          id: string
          organization_id: string | null
          sales_data: Json
          stock_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          organization_id?: string | null
          sales_data?: Json
          stock_data?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          sales_data?: Json
          stock_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      despesas: {
        Row: {
          atualizado_em: string
          caixa_movimentacao_id: string | null
          categoria: string | null
          criado_em: string
          data: string
          descricao: string
          id: string
          observacoes: string | null
          organization_id: string
          origem_dinheiro: string
          registrado_por: string
          registrado_por_nome: string | null
          tipo: string
          valor: number
          veiculo_id: string | null
          veiculo_placa: string | null
        }
        Insert: {
          atualizado_em?: string
          caixa_movimentacao_id?: string | null
          categoria?: string | null
          criado_em?: string
          data?: string
          descricao: string
          id?: string
          observacoes?: string | null
          organization_id?: string
          origem_dinheiro: string
          registrado_por?: string
          registrado_por_nome?: string | null
          tipo: string
          valor?: number
          veiculo_id?: string | null
          veiculo_placa?: string | null
        }
        Update: {
          atualizado_em?: string
          caixa_movimentacao_id?: string | null
          categoria?: string | null
          criado_em?: string
          data?: string
          descricao?: string
          id?: string
          observacoes?: string | null
          organization_id?: string
          origem_dinheiro?: string
          registrado_por?: string
          registrado_por_nome?: string | null
          tipo?: string
          valor?: number
          veiculo_id?: string | null
          veiculo_placa?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "despesas_caixa_movimentacao_id_fkey"
            columns: ["caixa_movimentacao_id"]
            isOneToOne: false
            referencedRelation: "movimentacoes_portaria"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentacoes_portaria: {
        Row: {
          cliente_id: string | null
          cliente_nome: string | null
          criado_em: string
          data_operacao: string
          delta_cheios: number
          delta_emprestados: number
          delta_vazios: number
          id: string
          observacoes: string | null
          organization_id: string
          produto: string
          referencia_id: string | null
          registrado_por: string
          registrado_por_nome: string | null
          tipo: string
          valor_dinheiro: number | null
        }
        Insert: {
          cliente_id?: string | null
          cliente_nome?: string | null
          criado_em?: string
          data_operacao?: string
          delta_cheios?: number
          delta_emprestados?: number
          delta_vazios?: number
          id?: string
          observacoes?: string | null
          organization_id: string
          produto: string
          referencia_id?: string | null
          registrado_por: string
          registrado_por_nome?: string | null
          tipo: string
          valor_dinheiro?: number | null
        }
        Update: {
          cliente_id?: string | null
          cliente_nome?: string | null
          criado_em?: string
          data_operacao?: string
          delta_cheios?: number
          delta_emprestados?: number
          delta_vazios?: number
          id?: string
          observacoes?: string | null
          organization_id?: string
          produto?: string
          referencia_id?: string | null
          registrado_por?: string
          registrado_por_nome?: string | null
          tipo?: string
          valor_dinheiro?: number | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          accepted_at: string | null
          address: Json | null
          assigned_at: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          delivered_at: string | null
          delivery_person: string | null
          has_empty_cylinder: boolean | null
          id: string
          is_complete_package: boolean | null
          notes: string | null
          organization_id: string | null
          origem_venda: string | null
          payment_method: string | null
          price: number | null
          product: string | null
          quantity: number | null
          rejection_reason: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          address?: Json | null
          assigned_at?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_person?: string | null
          has_empty_cylinder?: boolean | null
          id?: string
          is_complete_package?: boolean | null
          notes?: string | null
          organization_id?: string | null
          origem_venda?: string | null
          payment_method?: string | null
          price?: number | null
          product?: string | null
          quantity?: number | null
          rejection_reason?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          address?: Json | null
          assigned_at?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_person?: string | null
          has_empty_cylinder?: boolean | null
          id?: string
          is_complete_package?: boolean | null
          notes?: string | null
          organization_id?: string | null
          origem_venda?: string | null
          payment_method?: string | null
          price?: number | null
          product?: string | null
          quantity?: number | null
          rejection_reason?: string | null
          status?: string | null
          updated_at?: string
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
          ativo: boolean
          created_at: string
          id: string
          name: string
          organization_id: string | null
          role: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id: string
          name: string
          organization_id?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
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
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          organization_id: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          organization_id?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          organization_id?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
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
      rotas: {
        Row: {
          atualizado_em: string
          clientes_count: number
          criado_em: string
          criado_por: string
          data: string
          destino: string
          hora_retorno: string | null
          hora_saida: string | null
          id: string
          inventario: Json | null
          motorista_id: string | null
          motorista_nome: string
          observacoes: string | null
          organization_id: string
          status: string
        }
        Insert: {
          atualizado_em?: string
          clientes_count?: number
          criado_em?: string
          criado_por?: string
          data?: string
          destino: string
          hora_retorno?: string | null
          hora_saida?: string | null
          id?: string
          inventario?: Json | null
          motorista_id?: string | null
          motorista_nome: string
          observacoes?: string | null
          organization_id?: string
          status?: string
        }
        Update: {
          atualizado_em?: string
          clientes_count?: number
          criado_em?: string
          criado_por?: string
          data?: string
          destino?: string
          hora_retorno?: string | null
          hora_saida?: string | null
          id?: string
          inventario?: Json | null
          motorista_id?: string | null
          motorista_nome?: string
          observacoes?: string | null
          organization_id?: string
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
      saldo_portaria_atual: {
        Row: {
          cheios: number | null
          data_operacao: string | null
          devolucoes_dia: number | null
          emprestados: number | null
          organization_id: string | null
          produto: string | null
          vazios: number | null
          vendas_dia: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      clear_test_data: { Args: never; Returns: undefined }
      get_my_org: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      registrar_movimentacao_portaria: {
        Args: {
          _cliente_id?: string
          _cliente_nome?: string
          _delta_cheios: number
          _delta_emprestados: number
          _delta_vazios: number
          _observacoes?: string
          _produto: string
          _referencia_id?: string
          _tipo: string
        }
        Returns: string
      }
      set_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user" | "entregador"
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
      app_role: ["admin", "user", "entregador"],
    },
  },
} as const

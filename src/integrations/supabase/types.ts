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
          diferenca: number | null
          dinheiro_entregue: number | null
          dinheiro_esperado: number | null
          entregador_id: string
          entregador_nome: string | null
          id: string
          motivo_divergencia: string | null
          observacoes: string | null
          organization_id: string
          qtd_entregas: number
          qtd_recebimentos: number | null
          qtd_vendas_rua: number
          registrado_por: string | null
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
          diferenca?: number | null
          dinheiro_entregue?: number | null
          dinheiro_esperado?: number | null
          entregador_id: string
          entregador_nome?: string | null
          id?: string
          motivo_divergencia?: string | null
          observacoes?: string | null
          organization_id?: string
          qtd_entregas?: number
          qtd_recebimentos?: number | null
          qtd_vendas_rua?: number
          registrado_por?: string | null
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
          diferenca?: number | null
          dinheiro_entregue?: number | null
          dinheiro_esperado?: number | null
          entregador_id?: string
          entregador_nome?: string | null
          id?: string
          motivo_divergencia?: string | null
          observacoes?: string | null
          organization_id?: string
          qtd_entregas?: number
          qtd_recebimentos?: number | null
          qtd_vendas_rua?: number
          registrado_por?: string | null
          status?: string
          total_cartao?: number
          total_dinheiro?: number
          total_geral?: number
          total_pix?: number
        }
        Relationships: []
      }
      acoes_idempotentes: {
        Row: {
          acao: string
          chave: string
          conteudo: string | null
          criado_em: string
          organization_id: string
          resultado: string | null
          usuario: string
        }
        Insert: {
          acao: string
          chave: string
          conteudo?: string | null
          criado_em?: string
          organization_id: string
          resultado?: string | null
          usuario: string
        }
        Update: {
          acao?: string
          chave?: string
          conteudo?: string | null
          criado_em?: string
          organization_id?: string
          resultado?: string | null
          usuario?: string
        }
        Relationships: []
      }
      auditoria_correcoes: {
        Row: {
          antes: Json
          depois: Json
          feito_em: string
          feito_por: string
          id: string
          motivo: string
          organization_id: string
          registro_id: string
          tabela: string
        }
        Insert: {
          antes: Json
          depois: Json
          feito_em?: string
          feito_por: string
          id?: string
          motivo: string
          organization_id: string
          registro_id: string
          tabela: string
        }
        Update: {
          antes?: Json
          depois?: Json
          feito_em?: string
          feito_por?: string
          id?: string
          motivo?: string
          organization_id?: string
          registro_id?: string
          tabela?: string
        }
        Relationships: []
      }
      carga_movimentos: {
        Row: {
          carga_id: string
          criado_em: string
          delta_cheios: number
          delta_emprestados: number
          delta_vazios: number
          id: string
          order_id: string | null
          organization_id: string
          produto: string
          registrado_por: string
          tipo: string
        }
        Insert: {
          carga_id: string
          criado_em?: string
          delta_cheios?: number
          delta_emprestados?: number
          delta_vazios?: number
          id?: string
          order_id?: string | null
          organization_id: string
          produto: string
          registrado_por: string
          tipo: string
        }
        Update: {
          carga_id?: string
          criado_em?: string
          delta_cheios?: number
          delta_emprestados?: number
          delta_vazios?: number
          id?: string
          order_id?: string | null
          organization_id?: string
          produto?: string
          registrado_por?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "carga_movimentos_carga_id_fkey"
            columns: ["carga_id"]
            isOneToOne: false
            referencedRelation: "cargas"
            referencedColumns: ["id"]
          },
        ]
      }
      cargas: {
        Row: {
          criado_em: string
          criado_por: string
          data: string
          encerrado_em: string | null
          entregador_id: string
          id: string
          organization_id: string
          status: string
        }
        Insert: {
          criado_em?: string
          criado_por: string
          data?: string
          encerrado_em?: string | null
          entregador_id: string
          id?: string
          organization_id: string
          status?: string
        }
        Update: {
          criado_em?: string
          criado_por?: string
          data?: string
          encerrado_em?: string | null
          entregador_id?: string
          id?: string
          organization_id?: string
          status?: string
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
          data_nascimento: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: Json | null
          created_at?: string
          data_nascimento?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: Json | null
          created_at?: string
          data_nascimento?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
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
      comissao_bonus_faixas: {
        Row: {
          bonus: number
          created_at: string
          id: string
          organization_id: string
          valor_min_recebido: number
        }
        Insert: {
          bonus: number
          created_at?: string
          id?: string
          organization_id?: string
          valor_min_recebido: number
        }
        Update: {
          bonus?: number
          created_at?: string
          id?: string
          organization_id?: string
          valor_min_recebido?: number
        }
        Relationships: []
      }
      comissao_config: {
        Row: {
          ativo: boolean
          ciclo: string
          created_at: string
          id: string
          organization_id: string
          pagar_promissoria_no_recebimento: boolean
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          ciclo?: string
          created_at?: string
          id?: string
          organization_id?: string
          pagar_promissoria_no_recebimento?: boolean
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          ciclo?: string
          created_at?: string
          id?: string
          organization_id?: string
          pagar_promissoria_no_recebimento?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      comissao_fechamentos: {
        Row: {
          colaborador_nome: string
          created_at: string
          criado_por: string | null
          detalhes: Json | null
          id: string
          observacoes: string | null
          organization_id: string
          pago_em: string | null
          periodo_fim: string
          periodo_inicio: string
          status: string
          total_bonus: number
          total_comissao: number
          total_pagar: number
          total_vendido: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          colaborador_nome: string
          created_at?: string
          criado_por?: string | null
          detalhes?: Json | null
          id?: string
          observacoes?: string | null
          organization_id?: string
          pago_em?: string | null
          periodo_fim: string
          periodo_inicio: string
          status?: string
          total_bonus?: number
          total_comissao?: number
          total_pagar?: number
          total_vendido?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          colaborador_nome?: string
          created_at?: string
          criado_por?: string | null
          detalhes?: Json | null
          id?: string
          observacoes?: string | null
          organization_id?: string
          pago_em?: string | null
          periodo_fim?: string
          periodo_inicio?: string
          status?: string
          total_bonus?: number
          total_comissao?: number
          total_pagar?: number
          total_vendido?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      comissao_regras: {
        Row: {
          ativo: boolean
          colaborador_id: string | null
          colaborador_nome: string
          created_at: string
          fixo_por_botijao: number
          id: string
          modo: string
          organization_id: string
          perc_cartao: number
          perc_dinheiro: number
          perc_pix: number
          perc_promissoria: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ativo?: boolean
          colaborador_id?: string | null
          colaborador_nome: string
          created_at?: string
          fixo_por_botijao?: number
          id?: string
          modo?: string
          organization_id?: string
          perc_cartao?: number
          perc_dinheiro?: number
          perc_pix?: number
          perc_promissoria?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ativo?: boolean
          colaborador_id?: string | null
          colaborador_nome?: string
          created_at?: string
          fixo_por_botijao?: number
          id?: string
          modo?: string
          organization_id?: string
          perc_cartao?: number
          perc_dinheiro?: number
          perc_pix?: number
          perc_promissoria?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      conferencias_diarias: {
        Row: {
          caixa_observacao: string | null
          caixa_ok: boolean
          conferido_por: string | null
          conferido_por_nome: string | null
          created_at: string
          data: string
          estoque_observacao: string | null
          estoque_ok: boolean
          id: string
          organization_id: string
          rotas_observacao: string | null
          rotas_ok: boolean
          updated_at: string
        }
        Insert: {
          caixa_observacao?: string | null
          caixa_ok?: boolean
          conferido_por?: string | null
          conferido_por_nome?: string | null
          created_at?: string
          data?: string
          estoque_observacao?: string | null
          estoque_ok?: boolean
          id?: string
          organization_id?: string
          rotas_observacao?: string | null
          rotas_ok?: boolean
          updated_at?: string
        }
        Update: {
          caixa_observacao?: string | null
          caixa_ok?: boolean
          conferido_por?: string | null
          conferido_por_nome?: string | null
          created_at?: string
          data?: string
          estoque_observacao?: string | null
          estoque_ok?: boolean
          id?: string
          organization_id?: string
          rotas_observacao?: string | null
          rotas_ok?: boolean
          updated_at?: string
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
      conta_botijoes: {
        Row: {
          created_at: string
          data: string
          forma_pagamento: string | null
          id: string
          observacoes: string | null
          order_id: string | null
          organization_id: string
          parceiro_id: string
          parceiro_nome: string
          parceiro_tipo: string
          preco_unitario: number | null
          produto: string
          quantidade: number
          registrado_por: string | null
          rota_id: string | null
          tipo: string
          valor_total: number | null
          vasilhames_recebidos: number
        }
        Insert: {
          created_at?: string
          data?: string
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          order_id?: string | null
          organization_id?: string
          parceiro_id: string
          parceiro_nome: string
          parceiro_tipo: string
          preco_unitario?: number | null
          produto?: string
          quantidade?: number
          registrado_por?: string | null
          rota_id?: string | null
          tipo: string
          valor_total?: number | null
          vasilhames_recebidos?: number
        }
        Update: {
          created_at?: string
          data?: string
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          order_id?: string | null
          organization_id?: string
          parceiro_id?: string
          parceiro_nome?: string
          parceiro_tipo?: string
          preco_unitario?: number | null
          produto?: string
          quantidade?: number
          registrado_por?: string | null
          rota_id?: string | null
          tipo?: string
          valor_total?: number | null
          vasilhames_recebidos?: number
        }
        Relationships: []
      }
      contatos_recompra: {
        Row: {
          canal: string
          cliente_id: string
          cliente_nome: string
          contatado_em: string
          contatado_por: string
          id: string
          observacao: string | null
          organization_id: string
          resultado: string | null
          tipo: string
        }
        Insert: {
          canal?: string
          cliente_id: string
          cliente_nome: string
          contatado_em?: string
          contatado_por?: string
          id?: string
          observacao?: string | null
          organization_id?: string
          resultado?: string | null
          tipo: string
        }
        Update: {
          canal?: string
          cliente_id?: string
          cliente_nome?: string
          contatado_em?: string
          contatado_por?: string
          id?: string
          observacao?: string | null
          organization_id?: string
          resultado?: string | null
          tipo?: string
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
          colaborador_id: string | null
          colaborador_nome: string | null
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
          colaborador_id?: string | null
          colaborador_nome?: string | null
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
          colaborador_id?: string | null
          colaborador_nome?: string | null
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
      divergencias: {
        Row: {
          criado_em: string
          esperado: number
          id: string
          motivo: string
          order_id: string
          organization_id: string
          recebido: number
          registrado_por: string
        }
        Insert: {
          criado_em?: string
          esperado: number
          id?: string
          motivo: string
          order_id: string
          organization_id: string
          recebido: number
          registrado_por: string
        }
        Update: {
          criado_em?: string
          esperado?: number
          id?: string
          motivo?: string
          order_id?: string
          organization_id?: string
          recebido?: number
          registrado_por?: string
        }
        Relationships: []
      }
      entrega_eventos: {
        Row: {
          criado_em: string
          detalhes: Json
          entregador_anterior: string | null
          entregador_anterior_texto: string | null
          entregador_novo: string | null
          id: string
          motivo: string | null
          order_id: string
          organization_id: string
          registrado_por: string | null
          registrado_por_nome: string | null
          status_anterior: string | null
          status_novo: string | null
          tipo: string
        }
        Insert: {
          criado_em?: string
          detalhes?: Json
          entregador_anterior?: string | null
          entregador_anterior_texto?: string | null
          entregador_novo?: string | null
          id?: string
          motivo?: string | null
          order_id: string
          organization_id: string
          registrado_por?: string | null
          registrado_por_nome?: string | null
          status_anterior?: string | null
          status_novo?: string | null
          tipo: string
        }
        Update: {
          criado_em?: string
          detalhes?: Json
          entregador_anterior?: string | null
          entregador_anterior_texto?: string | null
          entregador_novo?: string | null
          id?: string
          motivo?: string | null
          order_id?: string
          organization_id?: string
          registrado_por?: string | null
          registrado_por_nome?: string | null
          status_anterior?: string | null
          status_novo?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "entrega_eventos_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      entregador_localizacoes: {
        Row: {
          accuracy: number | null
          created_at: string
          id: string
          latitude: number
          longitude: number
          nome: string | null
          organization_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          created_at?: string
          id?: string
          latitude: number
          longitude: number
          nome?: string | null
          organization_id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accuracy?: number | null
          created_at?: string
          id?: string
          latitude?: number
          longitude?: number
          nome?: string | null
          organization_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fechamentos_caixa: {
        Row: {
          created_at: string
          data_fechamento: string
          divergencias: Json
          estoque_final: Json
          fechado_por: string | null
          fechado_por_nome: string | null
          id: string
          observacoes: string | null
          organization_id: string
          quantidades: Json
          retroativo: boolean
          tem_divergencia: boolean
          tipo: string
          total_cartao: number
          total_dinheiro: number
          total_outros: number
          total_pix: number
          total_vendas: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_fechamento: string
          divergencias?: Json
          estoque_final?: Json
          fechado_por?: string | null
          fechado_por_nome?: string | null
          id?: string
          observacoes?: string | null
          organization_id?: string
          quantidades?: Json
          retroativo?: boolean
          tem_divergencia?: boolean
          tipo?: string
          total_cartao?: number
          total_dinheiro?: number
          total_outros?: number
          total_pix?: number
          total_vendas?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_fechamento?: string
          divergencias?: Json
          estoque_final?: Json
          fechado_por?: string | null
          fechado_por_nome?: string | null
          id?: string
          observacoes?: string | null
          organization_id?: string
          quantidades?: Json
          retroativo?: boolean
          tem_divergencia?: boolean
          tipo?: string
          total_cartao?: number
          total_dinheiro?: number
          total_outros?: number
          total_pix?: number
          total_vendas?: number
          updated_at?: string
        }
        Relationships: []
      }
      itens_conferencia: {
        Row: {
          carga_id: string | null
          cheios: number
          condicao: string
          criado_em: string
          id: string
          local: string
          motivo_resolucao: string | null
          organization_id: string
          produto: string
          registrado_por: string
          resolvido_em: string | null
          resolvido_por: string | null
          reversao_id: string
          status: string
          vazios: number
        }
        Insert: {
          carga_id?: string | null
          cheios?: number
          condicao: string
          criado_em?: string
          id?: string
          local: string
          motivo_resolucao?: string | null
          organization_id: string
          produto: string
          registrado_por: string
          resolvido_em?: string | null
          resolvido_por?: string | null
          reversao_id: string
          status?: string
          vazios?: number
        }
        Update: {
          carga_id?: string | null
          cheios?: number
          condicao?: string
          criado_em?: string
          id?: string
          local?: string
          motivo_resolucao?: string | null
          organization_id?: string
          produto?: string
          registrado_por?: string
          resolvido_em?: string | null
          resolvido_por?: string | null
          reversao_id?: string
          status?: string
          vazios?: number
        }
        Relationships: [
          {
            foreignKeyName: "itens_conferencia_reversao_id_fkey"
            columns: ["reversao_id"]
            isOneToOne: false
            referencedRelation: "reversoes"
            referencedColumns: ["id"]
          },
        ]
      }
      lembretes_manutencao: {
        Row: {
          ativo: boolean
          categoria: string
          created_at: string
          criado_por: string | null
          id: string
          intervalo_dias: number
          observacoes: string | null
          organization_id: string
          titulo: string
          ultima_execucao: string
          updated_at: string
          veiculo_id: string | null
          veiculo_placa: string | null
        }
        Insert: {
          ativo?: boolean
          categoria?: string
          created_at?: string
          criado_por?: string | null
          id?: string
          intervalo_dias?: number
          observacoes?: string | null
          organization_id?: string
          titulo: string
          ultima_execucao?: string
          updated_at?: string
          veiculo_id?: string | null
          veiculo_placa?: string | null
        }
        Update: {
          ativo?: boolean
          categoria?: string
          created_at?: string
          criado_por?: string | null
          id?: string
          intervalo_dias?: number
          observacoes?: string | null
          organization_id?: string
          titulo?: string
          ultima_execucao?: string
          updated_at?: string
          veiculo_id?: string | null
          veiculo_placa?: string | null
        }
        Relationships: []
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
          carga_id: string | null
          client_id: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          delivered_at: string | null
          delivery_person: string | null
          delivery_person_id: string | null
          entrega_prevista: string | null
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
          reseller_id: string | null
          status: string | null
          tipo_venda: string
          updated_at: string
          user_id: string
          vasilhames_entregues: number
          vasilhames_recebidos: number
        }
        Insert: {
          accepted_at?: string | null
          address?: Json | null
          assigned_at?: string | null
          carga_id?: string | null
          client_id?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_person?: string | null
          delivery_person_id?: string | null
          entrega_prevista?: string | null
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
          reseller_id?: string | null
          status?: string | null
          tipo_venda?: string
          updated_at?: string
          user_id: string
          vasilhames_entregues?: number
          vasilhames_recebidos?: number
        }
        Update: {
          accepted_at?: string | null
          address?: Json | null
          assigned_at?: string | null
          carga_id?: string | null
          client_id?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_person?: string | null
          delivery_person_id?: string | null
          entrega_prevista?: string | null
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
          reseller_id?: string | null
          status?: string | null
          tipo_venda?: string
          updated_at?: string
          user_id?: string
          vasilhames_entregues?: number
          vasilhames_recebidos?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_reseller_id_fkey"
            columns: ["reseller_id"]
            isOneToOne: false
            referencedRelation: "resellers"
            referencedColumns: ["id"]
          },
        ]
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
      pontos_revenda: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          media_botijoes: number
          nome: string
          observacoes: string | null
          organization_id: string
          povoado: string | null
          telefone: string | null
          updated_at: string
          vasilhames_emprestados: number
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          media_botijoes?: number
          nome: string
          observacoes?: string | null
          organization_id?: string
          povoado?: string | null
          telefone?: string | null
          updated_at?: string
          vasilhames_emprestados?: number
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          media_botijoes?: number
          nome?: string
          observacoes?: string | null
          organization_id?: string
          povoado?: string | null
          telefone?: string | null
          updated_at?: string
          vasilhames_emprestados?: number
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
      promissory_notes: {
        Row: {
          assigned_to: string | null
          client_id: string | null
          client_name: string
          cobrador_id: string | null
          created_at: string
          created_by: string | null
          due_date: string
          id: string
          notes: string | null
          order_id: string | null
          organization_id: string
          paid_amount: number | null
          paid_at: string | null
          payment_method: string | null
          status: string
          updated_at: string
          value: number
        }
        Insert: {
          assigned_to?: string | null
          client_id?: string | null
          client_name: string
          cobrador_id?: string | null
          created_at?: string
          created_by?: string | null
          due_date: string
          id?: string
          notes?: string | null
          order_id?: string | null
          organization_id?: string
          paid_amount?: number | null
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          updated_at?: string
          value?: number
        }
        Update: {
          assigned_to?: string | null
          client_id?: string | null
          client_name?: string
          cobrador_id?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          organization_id?: string
          paid_amount?: number | null
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          updated_at?: string
          value?: number
        }
        Relationships: []
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
      recebimentos: {
        Row: {
          acerto_id: string | null
          anulado_em: string | null
          anulado_reversao_id: string | null
          cobrador_id: string | null
          criado_em: string
          destino: string | null
          forma: string
          id: string
          order_id: string | null
          organization_id: string
          origem: string
          promissory_id: string | null
          recebido_por: string
          responsavel_id: string | null
          valor: number
        }
        Insert: {
          acerto_id?: string | null
          anulado_em?: string | null
          anulado_reversao_id?: string | null
          cobrador_id?: string | null
          criado_em?: string
          destino?: string | null
          forma: string
          id?: string
          order_id?: string | null
          organization_id: string
          origem: string
          promissory_id?: string | null
          recebido_por: string
          responsavel_id?: string | null
          valor: number
        }
        Update: {
          acerto_id?: string | null
          anulado_em?: string | null
          anulado_reversao_id?: string | null
          cobrador_id?: string | null
          criado_em?: string
          destino?: string | null
          forma?: string
          id?: string
          order_id?: string | null
          organization_id?: string
          origem?: string
          promissory_id?: string | null
          recebido_por?: string
          responsavel_id?: string | null
          valor?: number
        }
        Relationships: []
      }
      reembolsos: {
        Row: {
          acerto_id: string | null
          acerto_original_id: string | null
          criado_em: string
          data_operacao: string | null
          forma: string
          id: string
          order_id: string
          organization_id: string
          origem: string | null
          realizado_em: string | null
          realizado_por: string | null
          realizado_por_nome: string | null
          recebimento_id: string
          referencia: string | null
          responsavel_id: string | null
          reversao_id: string
          status: string
          valor: number
        }
        Insert: {
          acerto_id?: string | null
          acerto_original_id?: string | null
          criado_em?: string
          data_operacao?: string | null
          forma: string
          id?: string
          order_id: string
          organization_id: string
          origem?: string | null
          realizado_em?: string | null
          realizado_por?: string | null
          realizado_por_nome?: string | null
          recebimento_id: string
          referencia?: string | null
          responsavel_id?: string | null
          reversao_id: string
          status?: string
          valor: number
        }
        Update: {
          acerto_id?: string | null
          acerto_original_id?: string | null
          criado_em?: string
          data_operacao?: string | null
          forma?: string
          id?: string
          order_id?: string
          organization_id?: string
          origem?: string | null
          realizado_em?: string | null
          realizado_por?: string | null
          realizado_por_nome?: string | null
          recebimento_id?: string
          referencia?: string | null
          responsavel_id?: string | null
          reversao_id?: string
          status?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "reembolsos_reversao_id_fkey"
            columns: ["reversao_id"]
            isOneToOne: false
            referencedRelation: "reversoes"
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
      resellers: {
        Row: {
          active: boolean
          address: string | null
          contact_person: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          price_p13: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          contact_person?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          price_p13?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          contact_person?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          price_p13?: number
          updated_at?: string
        }
        Relationships: []
      }
      reversao_movimentos: {
        Row: {
          carga_id: string | null
          cheios: number
          condicao: string | null
          criado_em: string
          data_operacao: string
          emprestados: number
          id: string
          local: string
          movimento_id: string | null
          observacoes: string | null
          organization_id: string
          produto: string
          registrado_por: string
          registrado_por_nome: string | null
          reversao_id: string
          substituto: number
          tipo: string
          vazios: number
          vazios_cliente: number
        }
        Insert: {
          carga_id?: string | null
          cheios?: number
          condicao?: string | null
          criado_em?: string
          data_operacao: string
          emprestados?: number
          id?: string
          local: string
          movimento_id?: string | null
          observacoes?: string | null
          organization_id: string
          produto: string
          registrado_por: string
          registrado_por_nome?: string | null
          reversao_id: string
          substituto?: number
          tipo: string
          vazios?: number
          vazios_cliente?: number
        }
        Update: {
          carga_id?: string | null
          cheios?: number
          condicao?: string | null
          criado_em?: string
          data_operacao?: string
          emprestados?: number
          id?: string
          local?: string
          movimento_id?: string | null
          observacoes?: string | null
          organization_id?: string
          produto?: string
          registrado_por?: string
          registrado_por_nome?: string | null
          reversao_id?: string
          substituto?: number
          tipo?: string
          vazios?: number
          vazios_cliente?: number
        }
        Relationships: [
          {
            foreignKeyName: "reversao_movimentos_reversao_id_fkey"
            columns: ["reversao_id"]
            isOneToOne: false
            referencedRelation: "reversoes"
            referencedColumns: ["id"]
          },
        ]
      }
      reversoes: {
        Row: {
          atualizado_em: string
          concluido_em: string | null
          confirmado_cheios: number
          confirmado_emprestados: number
          confirmado_substituto: number
          confirmado_vazios_cliente: number
          confirmado_vazios_recolher: number
          data_operacao: string | null
          data_venda: string | null
          decidido_em: string | null
          decidido_por: string | null
          decidido_por_nome: string | null
          efeitos: Json
          esperado_cheios: number
          esperado_emprestados: number
          esperado_substituto: number
          esperado_vazios_cliente: number
          esperado_vazios_recolher: number
          id: string
          motivo: string
          order_id: string
          order_valida_id: string | null
          organization_id: string
          pagamento_duplicado: boolean | null
          produto: string | null
          promissoria_cancelada: number
          quantidade: number | null
          recusa_motivo: string | null
          solicitado_em: string
          solicitado_por: string
          solicitado_por_nome: string | null
          status: string
          status_pedido: string | null
          tipo: string
          tipo_venda: string | null
          valor_reembolsado: number
          valor_reembolso: number
          valor_venda: number | null
        }
        Insert: {
          atualizado_em?: string
          concluido_em?: string | null
          confirmado_cheios?: number
          confirmado_emprestados?: number
          confirmado_substituto?: number
          confirmado_vazios_cliente?: number
          confirmado_vazios_recolher?: number
          data_operacao?: string | null
          data_venda?: string | null
          decidido_em?: string | null
          decidido_por?: string | null
          decidido_por_nome?: string | null
          efeitos?: Json
          esperado_cheios?: number
          esperado_emprestados?: number
          esperado_substituto?: number
          esperado_vazios_cliente?: number
          esperado_vazios_recolher?: number
          id?: string
          motivo: string
          order_id: string
          order_valida_id?: string | null
          organization_id: string
          pagamento_duplicado?: boolean | null
          produto?: string | null
          promissoria_cancelada?: number
          quantidade?: number | null
          recusa_motivo?: string | null
          solicitado_em?: string
          solicitado_por: string
          solicitado_por_nome?: string | null
          status?: string
          status_pedido?: string | null
          tipo: string
          tipo_venda?: string | null
          valor_reembolsado?: number
          valor_reembolso?: number
          valor_venda?: number | null
        }
        Update: {
          atualizado_em?: string
          concluido_em?: string | null
          confirmado_cheios?: number
          confirmado_emprestados?: number
          confirmado_substituto?: number
          confirmado_vazios_cliente?: number
          confirmado_vazios_recolher?: number
          data_operacao?: string | null
          data_venda?: string | null
          decidido_em?: string | null
          decidido_por?: string | null
          decidido_por_nome?: string | null
          efeitos?: Json
          esperado_cheios?: number
          esperado_emprestados?: number
          esperado_substituto?: number
          esperado_vazios_cliente?: number
          esperado_vazios_recolher?: number
          id?: string
          motivo?: string
          order_id?: string
          order_valida_id?: string | null
          organization_id?: string
          pagamento_duplicado?: boolean | null
          produto?: string | null
          promissoria_cancelada?: number
          quantidade?: number | null
          recusa_motivo?: string | null
          solicitado_em?: string
          solicitado_por?: string
          solicitado_por_nome?: string | null
          status?: string
          status_pedido?: string | null
          tipo?: string
          tipo_venda?: string | null
          valor_reembolsado?: number
          valor_reembolso?: number
          valor_venda?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reversoes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reversoes_order_valida_id_fkey"
            columns: ["order_valida_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      rota_pontos: {
        Row: {
          cheios_entregues: number
          created_at: string
          id: string
          observacoes: string | null
          organization_id: string
          ponto_id: string
          ponto_nome: string
          rota_id: string
          vasilhames_recolhidos: number
        }
        Insert: {
          cheios_entregues?: number
          created_at?: string
          id?: string
          observacoes?: string | null
          organization_id?: string
          ponto_id: string
          ponto_nome: string
          rota_id: string
          vasilhames_recolhidos?: number
        }
        Update: {
          cheios_entregues?: number
          created_at?: string
          id?: string
          observacoes?: string | null
          organization_id?: string
          ponto_id?: string
          ponto_nome?: string
          rota_id?: string
          vasilhames_recolhidos?: number
        }
        Relationships: [
          {
            foreignKeyName: "rota_pontos_ponto_id_fkey"
            columns: ["ponto_id"]
            isOneToOne: false
            referencedRelation: "pontos_revenda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rota_pontos_rota_id_fkey"
            columns: ["rota_id"]
            isOneToOne: false
            referencedRelation: "rotas"
            referencedColumns: ["id"]
          },
        ]
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
      tarefas_mensais: {
        Row: {
          boletos_ok: boolean
          competencia: string
          conferido_por: string | null
          conferido_por_nome: string | null
          contabilidade_ok: boolean
          created_at: string
          id: string
          notas_fiscais_ok: boolean
          observacoes: string | null
          organization_id: string
          updated_at: string
        }
        Insert: {
          boletos_ok?: boolean
          competencia: string
          conferido_por?: string | null
          conferido_por_nome?: string | null
          contabilidade_ok?: boolean
          created_at?: string
          id?: string
          notas_fiscais_ok?: boolean
          observacoes?: string | null
          organization_id?: string
          updated_at?: string
        }
        Update: {
          boletos_ok?: boolean
          competencia?: string
          conferido_por?: string | null
          conferido_por_nome?: string | null
          contabilidade_ok?: boolean
          created_at?: string
          id?: string
          notas_fiscais_ok?: boolean
          observacoes?: string | null
          organization_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      templates_mensagem: {
        Row: {
          ativo: boolean
          atualizado_em: string
          conteudo: string
          criado_em: string
          id: string
          organization_id: string
          tipo: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          conteudo: string
          criado_em?: string
          id?: string
          organization_id?: string
          tipo: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          conteudo?: string
          criado_em?: string
          id?: string
          organization_id?: string
          tipo?: string
        }
        Relationships: []
      }
      trocas_cheque: {
        Row: {
          created_at: string
          criado_por: string | null
          criado_por_nome: string | null
          data: string
          descricao: string | null
          id: string
          itens: Json
          observacoes: string | null
          organization_id: string
          taxa_juros_mensal: number
          total_juros: number
          total_liquido: number
          total_valor: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          criado_por?: string | null
          criado_por_nome?: string | null
          data?: string
          descricao?: string | null
          id?: string
          itens?: Json
          observacoes?: string | null
          organization_id?: string
          taxa_juros_mensal?: number
          total_juros?: number
          total_liquido?: number
          total_valor?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          criado_por?: string | null
          criado_por_nome?: string | null
          data?: string
          descricao?: string | null
          id?: string
          itens?: Json
          observacoes?: string | null
          organization_id?: string
          taxa_juros_mensal?: number
          total_juros?: number
          total_liquido?: number
          total_valor?: number
          updated_at?: string
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
      vehicle_assignments: {
        Row: {
          created_at: string
          driver_id: string | null
          driver_name: string
          end_date: string | null
          id: string
          notes: string | null
          organization_id: string
          start_date: string
          status: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          driver_id?: string | null
          driver_name: string
          end_date?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          start_date?: string
          status?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          driver_id?: string | null
          driver_name?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          start_date?: string
          status?: string
          vehicle_id?: string
        }
        Relationships: []
      }
      vehicle_expenses: {
        Row: {
          amount: number
          created_at: string
          date: string
          description: string | null
          id: string
          notes: string | null
          organization_id: string
          type: string
          vehicle_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          type: string
          vehicle_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          type?: string
          vehicle_id?: string
        }
        Relationships: []
      }
      vehicle_fuels: {
        Row: {
          created_at: string
          date: string
          fuel_type: string | null
          id: string
          km: number | null
          liters: number
          notes: string | null
          organization_id: string
          price_per_liter: number | null
          station: string | null
          total: number
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          fuel_type?: string | null
          id?: string
          km?: number | null
          liters?: number
          notes?: string | null
          organization_id?: string
          price_per_liter?: number | null
          station?: string | null
          total?: number
          vehicle_id: string
        }
        Update: {
          created_at?: string
          date?: string
          fuel_type?: string | null
          id?: string
          km?: number | null
          liters?: number
          notes?: string | null
          organization_id?: string
          price_per_liter?: number | null
          station?: string | null
          total?: number
          vehicle_id?: string
        }
        Relationships: []
      }
      vehicle_maintenances: {
        Row: {
          cost: number
          created_at: string
          date: string
          description: string | null
          id: string
          km: number | null
          organization_id: string
          status: string
          type: string
          vehicle_id: string
          workshop: string | null
        }
        Insert: {
          cost?: number
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          km?: number | null
          organization_id?: string
          status?: string
          type: string
          vehicle_id: string
          workshop?: string | null
        }
        Update: {
          cost?: number
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          km?: number | null
          organization_id?: string
          status?: string
          type?: string
          vehicle_id?: string
          workshop?: string | null
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          brand: string | null
          created_at: string
          current_km: number | null
          id: string
          model: string | null
          notes: string | null
          organization_id: string
          plate: string
          status: string
          type: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          brand?: string | null
          created_at?: string
          current_km?: number | null
          id?: string
          model?: string | null
          notes?: string | null
          organization_id?: string
          plate: string
          status?: string
          type?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          brand?: string | null
          created_at?: string
          current_km?: number | null
          id?: string
          model?: string | null
          notes?: string | null
          organization_id?: string
          plate?: string
          status?: string
          type?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: []
      }
      whatsapp_mensagens: {
        Row: {
          created_at: string
          destinatario_nome: string | null
          enviado_em: string | null
          enviado_por: string | null
          erro: string | null
          id: string
          mensagem: string
          organization_id: string
          provedor: string | null
          provider_message_id: string | null
          referencia_id: string | null
          status: string
          telefone: string
          tipo: string
        }
        Insert: {
          created_at?: string
          destinatario_nome?: string | null
          enviado_em?: string | null
          enviado_por?: string | null
          erro?: string | null
          id?: string
          mensagem: string
          organization_id: string
          provedor?: string | null
          provider_message_id?: string | null
          referencia_id?: string | null
          status?: string
          telefone: string
          tipo?: string
        }
        Update: {
          created_at?: string
          destinatario_nome?: string | null
          enviado_em?: string | null
          enviado_por?: string | null
          erro?: string | null
          id?: string
          mensagem?: string
          organization_id?: string
          provedor?: string | null
          provider_message_id?: string | null
          referencia_id?: string | null
          status?: string
          telefone?: string
          tipo?: string
        }
        Relationships: []
      }
    }
    Views: {
      saldo_patio: {
        Row: {
          cheios: number | null
          organization_id: string | null
          produto: string | null
          vazios: number | null
        }
        Relationships: []
      }
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
      _carga_alvo: { Args: { _entregador_id: string }; Returns: string }
      _cobrador_valido: {
        Args: { _cobrador: string; _org: string }
        Returns: string
      }
      _consumir_carga: {
        Args: {
          _emprestados: number
          _entregador: string
          _order: string
          _org: string
          _produto: string
          _qtd: number
          _tipo: string
          _vazios: number
        }
        Returns: string
      }
      _consumir_vazios_carga: {
        Args: {
          _entregador: string
          _order: string
          _org: string
          _produto: string
          _qtd: number
        }
        Returns: string
      }
      _ctx_org: { Args: never; Returns: string }
      _destino_efetivo: {
        Args: { _destino: string; _forma: string; _origem: string }
        Returns: string
      }
      _eh_entrega: { Args: { _origem: string }; Returns: boolean }
      _entrega_aberta: { Args: { _status: string }; Returns: boolean }
      _entrega_data: {
        Args: { _criado: string; _prevista: string }
        Returns: string
      }
      _entregas_pendentes_fechamento: {
        Args: { _data: string; _org: string }
        Returns: {
          client_name: string
          created_at: string
          data_prevista: string
          delivery_person_id: string
          id: string
          status: string
        }[]
      }
      _forma_chave: { Args: { _f: string }; Returns: string }
      _forma_pedido: { Args: { _f: string }; Returns: string }
      _forma_validar: { Args: { _f: string; _valor: number }; Returns: string }
      _forma_valor_opcional: { Args: { _f: string }; Returns: boolean }
      _g1_ctl: { Args: never; Returns: boolean }
      _meu_nome: { Args: never; Returns: string }
      _produto_chave: { Args: { _p: string }; Returns: string }
      _reenvio:
        | {
            Args: { _acao: string; _chave: string; _org: string }
            Returns: string
          }
        | {
            Args: { _acao: string; _chave: string; _hash: string; _org: string }
            Returns: string
          }
      _reenvio_fim: {
        Args: { _chave: string; _org: string; _res: string }
        Returns: undefined
      }
      _registrar_pagamento: {
        Args: {
          _cliente: string
          _cliente_nome: string
          _forma: string
          _order: string
          _org: string
          _origem: string
          _valor: number
        }
        Returns: undefined
      }
      _reversao_atualizar: { Args: { _id: string }; Returns: string }
      _reversao_autorizar: { Args: { _id: string }; Returns: string }
      _reversao_vinculos: {
        Args: { _order: string; _org: string }
        Returns: Record<string, unknown>
      }
      _saldo_carga: {
        Args: { _carga: string; _produto: string }
        Returns: number
      }
      _saldo_portaria_cheios: {
        Args: { _data: string; _org: string; _produto: string }
        Returns: number
      }
      _tipo_venda_chave: { Args: { _t: string }; Returns: string }
      _transferir_para_carga: {
        Args: {
          _cheios: number
          _entregador: string
          _org: string
          _produto: string
          _ref_order: string
        }
        Returns: string
      }
      _travar_fechamento: { Args: { _org: string }; Returns: undefined }
      _travar_portaria: {
        Args: { _data: string; _org: string; _produto: string }
        Returns: undefined
      }
      acerto_previa: {
        Args: { _entregador_id: string }
        Returns: {
          categoria: string
          forma: string
          qtd: number
          total: number
        }[]
      }
      admin_corrigir_forma_pagamento: {
        Args: {
          _chave: string
          _motivo: string
          _nova_forma: string
          _order_id: string
        }
        Returns: string
      }
      admin_corrigir_pedido: {
        Args: {
          _motivo: string
          _novo_preco: number
          _novo_status: string
          _order_id: string
        }
        Returns: string
      }
      atribuir_cobrador: {
        Args: { _cobrador_id: string; _id: string }
        Returns: string
      }
      atribuir_entrega: {
        Args: {
          _chave?: string
          _entregador_id: string
          _order_id: string
          _retirar_da_portaria?: boolean
        }
        Returns: string
      }
      carga_devolver: {
        Args: {
          _carga_id: string
          _chave: string
          _cheios: number
          _produto: string
          _vazios: number
        }
        Returns: string
      }
      carga_historico: {
        Args: { _dias?: number; _entregador_id?: string }
        Returns: {
          carga_id: string
          cliente: string
          criado_em: string
          delta_cheios: number
          delta_vazios: number
          entregador_id: string
          entregador_nome: string
          id: string
          order_id: string
          produto: string
          registrado_por_nome: string
          tipo: string
        }[]
      }
      carga_resumo: {
        Args: { _entregador_id?: string }
        Returns: {
          aberta_em: string
          carga_id: string
          cascos_entregues: number
          cheios: number
          entregador_id: string
          entregador_nome: string
          produto: string
          vazios: number
        }[]
      }
      carga_saida: {
        Args: {
          _chave: string
          _cheios: number
          _entregador_id: string
          _produto: string
        }
        Returns: string
      }
      conferencia_resolver: {
        Args: {
          _chave: string
          _id: string
          _motivo: string
          _resultado: string
        }
        Returns: string
      }
      criar_promissoria_manual: {
        Args: {
          _chave: string
          _cliente_id: string
          _cliente_nome: string
          _cobrador_id: string
          _observacoes: string
          _valor: number
          _vencimento: string
        }
        Returns: string
      }
      current_profile_role: { Args: never; Returns: string }
      data_operacional: { Args: never; Returns: string }
      dinheiro_aguardando_acerto: {
        Args: never
        Returns: {
          destino: string
          qtd: number
          responsavel_id: string
          responsavel_nome: string
          total: number
        }[]
      }
      entrega_motivo_revisao: {
        Args: { _aceite: string; _dp: string; _dp_id: string; _status: string }
        Returns: string
      }
      entrega_regularizar: {
        Args: {
          _chave: string
          _entregador_id: string
          _motivo: string
          _order_id: string
        }
        Returns: string
      }
      entregador_aceitar_entrega: {
        Args: { _order_id: string }
        Returns: undefined
      }
      entregador_concluir_entrega: {
        Args: {
          _chave: string
          _forma: string
          _order_id: string
          _vasilhames_recebidos: number
        }
        Returns: string
      }
      entregador_recusar_entrega: {
        Args: { _motivo: string; _order_id: string }
        Returns: undefined
      }
      entregador_venda_rua: {
        Args: {
          _chave: string
          _cliente_fone: string
          _cliente_id: string
          _cliente_nome: string
          _forma: string
          _observacoes: string
          _produto: string
          _quantidade: number
          _tipo_venda: string
          _valor: number
          _vasilhames_entregues: number
          _vasilhames_recebidos: number
        }
        Returns: string
      }
      entregas_bloqueando_fechamento: {
        Args: { _data: string }
        Returns: {
          client_name: string
          created_at: string
          data_prevista: string
          entregador_nome: string
          id: string
          status: string
        }[]
      }
      g0_recover_own_profile: { Args: never; Returns: undefined }
      get_my_org: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_entregador: { Args: never; Returns: boolean }
      is_operador: { Args: never; Returns: boolean }
      listar_cobradores: {
        Args: never
        Returns: {
          id: string
          nome: string
          situacao: string
        }[]
      }
      listar_entregadores: {
        Args: never
        Returns: {
          id: string
          nome: string
        }[]
      }
      operador_concluir_entrega: {
        Args: {
          _chave: string
          _forma: string
          _motivo_divergencia: string
          _order_id: string
          _valor_recebido: number
          _vasilhames_recebidos: number
        }
        Returns: string
      }
      reatribuir_entrega:
        | {
            Args: {
              _motivo: string
              _novo_entregador_id: string
              _order_id: string
            }
            Returns: string
          }
        | {
            Args: {
              _chave: string
              _motivo: string
              _novo_entregador_id: string
              _order_id: string
              _transferir_carga: boolean
            }
            Returns: string
          }
      receber_promissoria: {
        Args: {
          _chave: string
          _cobrador_id?: string
          _forma: string
          _id: string
          _valor: number
        }
        Returns: string
      }
      reembolso_registrar: {
        Args: {
          _chave: string
          _id: string
          _origem: string
          _referencia: string
        }
        Returns: string
      }
      registrar_acerto: {
        Args: {
          _chave: string
          _dinheiro_entregue: number
          _entregador_id: string
          _motivo: string
        }
        Returns: string
      }
      registrar_movimentacao_portaria: {
        Args: {
          _cliente_id?: string
          _cliente_nome?: string
          _data_operacao?: string
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
      reversao_autorizar: {
        Args: { _chave: string; _id: string; _pagamento_duplicado: boolean }
        Returns: string
      }
      reversao_confirmar_fisico: {
        Args: {
          _carga_id: string
          _chave: string
          _cheios: number
          _condicao: string
          _id: string
          _local: string
          _observacoes: string
          _substituto: number
          _vazios_cliente: number
          _vazios_recolhidos: number
        }
        Returns: string
      }
      reversao_recusar: {
        Args: { _chave: string; _id: string; _motivo: string }
        Returns: string
      }
      reversao_solicitar: {
        Args: {
          _autorizar: boolean
          _chave: string
          _motivo: string
          _order_id: string
          _order_valida_id: string
          _pagamento_duplicado: boolean
          _tipo: string
        }
        Returns: string
      }
      saldo_transferivel_portaria: {
        Args: { _produto: string }
        Returns: {
          abertura_registrada: boolean
          cheios: number
          data_operacao: string
          produto: string
        }[]
      }
      set_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      venda_portaria: {
        Args: {
          _chave: string
          _cliente_id: string
          _cliente_nome: string
          _comodato?: boolean
          _devolveu_vazio: boolean
          _forma: string
          _observacoes: string
          _produto: string
          _quantidade: number
          _reseller_id: string
          _tipo_venda: string
          _valor: number
          _vasilhames_recebidos?: number
        }
        Returns: string
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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

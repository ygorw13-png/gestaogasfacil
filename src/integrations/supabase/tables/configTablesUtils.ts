
import { supabase } from "../client";
import { PostgrestResponse } from '@supabase/supabase-js';

export async function getConfiguracoesEstoque() {
  return await supabase
    .from('configuracoes_estoque')
    .select('*');
}

export async function updateConfiguracoesEstoque(id: string, data: any) {
  return await supabase
    .from('configuracoes_estoque')
    .update(data)
    .eq('id', id);
}

export async function getConfigSistema(organizationId: string | undefined) {
  if (!organizationId) return { data: null };
  
  return await supabase
    .from('configuracoes_sistema')
    .select('*')
    .eq('organization_id', organizationId)
    .maybeSingle();
}

export async function upsertConfigSistema(data: any) {
  // Verificar se já existe configuração para esta organização
  const { data: existingConfig } = await supabase
    .from('configuracoes_sistema')
    .select('id')
    .eq('organization_id', data.organization_id)
    .maybeSingle();
  
  if (existingConfig?.id) {
    // Atualizar configuração existente
    return await supabase
      .from('configuracoes_sistema')
      .update({ 
        nome_empresa: data.nome_empresa,
        endereco: data.endereco,
        telefone: data.telefone,
        email: data.email,
        atualizado_por: data.atualizado_por,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', existingConfig.id);
  } else {
    // Inserir nova configuração
    return await supabase
      .from('configuracoes_sistema')
      .insert([data]);
  }
}

export async function getConfigFinanceira(organizationId: string | undefined) {
  if (!organizationId) return { data: null };
  
  return await supabase
    .from('configuracoes_financeiras')
    .select('*')
    .eq('organization_id', organizationId)
    .maybeSingle();
}

export async function upsertConfigFinanceira(data: any) {
  // Verificar se já existe configuração para esta organização
  const { data: existingConfig } = await supabase
    .from('configuracoes_financeiras')
    .select('id')
    .eq('organization_id', data.organization_id)
    .maybeSingle();
  
  if (existingConfig?.id) {
    // Atualizar configuração existente
    return await supabase
      .from('configuracoes_financeiras')
      .update({ 
        moeda: data.moeda,
        taxa_imposto: data.taxa_imposto,
        metodos_pagamento: data.metodos_pagamento,
        atualizado_por: data.atualizado_por,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', existingConfig.id);
  } else {
    // Inserir nova configuração
    return await supabase
      .from('configuracoes_financeiras')
      .insert([data]);
  }
}

export async function getConfigEntrega(organizationId: string | undefined) {
  if (!organizationId) return { data: null };
  
  return await supabase
    .from('configuracoes_entrega')
    .select('*')
    .eq('organization_id', organizationId)
    .maybeSingle();
}

export async function upsertConfigEntrega(data: any) {
  // Verificar se já existe configuração para esta organização
  const { data: existingConfig } = await supabase
    .from('configuracoes_entrega')
    .select('id')
    .eq('organization_id', data.organization_id)
    .maybeSingle();
  
  if (existingConfig?.id) {
    // Atualizar configuração existente
    return await supabase
      .from('configuracoes_entrega')
      .update({ 
        taxa_entrega: data.taxa_entrega,
        valor_min_entrega_gratis: data.valor_min_entrega_gratis,
        raio_maximo_km: data.raio_maximo_km,
        rastreamento_ativo: data.rastreamento_ativo,
        atualizado_por: data.atualizado_por,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', existingConfig.id);
  } else {
    // Inserir nova configuração
    return await supabase
      .from('configuracoes_entrega')
      .insert([data]);
  }
}

export async function getConfigSeguranca(organizationId: string | undefined) {
  if (!organizationId) return { data: null };
  
  return await supabase
    .from('configuracoes_seguranca')
    .select('*')
    .eq('organization_id', organizationId)
    .maybeSingle();
}

export async function upsertConfigSeguranca(data: any) {
  // Verificar se já existe configuração para esta organização
  const { data: existingConfig } = await supabase
    .from('configuracoes_seguranca')
    .select('id')
    .eq('organization_id', data.organization_id)
    .maybeSingle();
  
  if (existingConfig?.id) {
    // Atualizar configuração existente
    return await supabase
      .from('configuracoes_seguranca')
      .update({ 
        tempo_sessao_minutos: data.tempo_sessao_minutos,
        expiracao_senha_dias: data.expiracao_senha_dias,
        dois_fatores_ativo: data.dois_fatores_ativo,
        nivel_log: data.nivel_log,
        atualizado_por: data.atualizado_por,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', existingConfig.id);
  } else {
    // Inserir nova configuração
    return await supabase
      .from('configuracoes_seguranca')
      .insert([data]);
  }
}

export async function getConfigNotificacoes(organizationId: string | undefined) {
  if (!organizationId) return { data: null };
  
  return await supabase
    .from('configuracoes_notificacoes')
    .select('*')
    .eq('organization_id', organizationId)
    .maybeSingle();
}

export async function upsertConfigNotificacoes(data: any) {
  // Verificar se já existe configuração para esta organização
  const { data: existingConfig } = await supabase
    .from('configuracoes_notificacoes')
    .select('id')
    .eq('organization_id', data.organization_id)
    .maybeSingle();
  
  if (existingConfig?.id) {
    // Atualizar configuração existente
    return await supabase
      .from('configuracoes_notificacoes')
      .update({ 
        email_ativo: data.email_ativo,
        sms_ativo: data.sms_ativo,
        notificacao_pedidos: data.notificacao_pedidos,
        notificacao_estoque: data.notificacao_estoque,
        atualizado_por: data.atualizado_por,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', existingConfig.id);
  } else {
    // Inserir nova configuração
    return await supabase
      .from('configuracoes_notificacoes')
      .insert([data]);
  }
}

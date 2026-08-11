CREATE TABLE public.whatsapp_mensagens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  telefone TEXT NOT NULL,
  destinatario_nome TEXT,
  tipo TEXT NOT NULL DEFAULT 'manual',
  mensagem TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  provedor TEXT,
  provider_message_id TEXT,
  erro TEXT,
  referencia_id UUID,
  enviado_por UUID,
  enviado_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.whatsapp_mensagens TO authenticated;
GRANT ALL ON public.whatsapp_mensagens TO service_role;

ALTER TABLE public.whatsapp_mensagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members manage whatsapp messages"
ON public.whatsapp_mensagens FOR ALL TO authenticated
USING (organization_id = public.get_my_org())
WITH CHECK (organization_id = public.get_my_org());

CREATE INDEX idx_whatsapp_mensagens_org_data ON public.whatsapp_mensagens (organization_id, created_at DESC);
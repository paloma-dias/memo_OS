-- ========================================
-- MIGRATION: Reestruturação Completa
-- Nova lógica: Ocorrência → OS
-- ========================================

-- 1. ADICIONAR NOVOS CAMPOS EM CLIENTES (baseado no Excel)
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS razao_social TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS empresa TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS numero_conta TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS telefone_principal TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS cidade TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS contato_primario TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS email_contato TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Ativa';

-- Renomear coluna nome para manter compatibilidade
COMMENT ON COLUMN public.clientes.nome IS 'Campo legado - usar razao_social';

-- 2. CRIAR TABELA DE OCORRÊNCIAS
CREATE TABLE IF NOT EXISTS public.ocorrencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT UNIQUE NOT NULL,
  id_cliente UUID REFERENCES public.clientes(id) NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  prioridade prioridade DEFAULT 'media',
  status_ocorrencia TEXT DEFAULT 'aberta', -- 'aberta', 'em_analise', 'convertida_em_os', 'cancelada'
  origem origem_os NOT NULL,
  situacao_garantia situacao_garantia NOT NULL,
  contato_cliente TEXT,
  telefone_contato TEXT,
  endereco_atendimento TEXT,
  observacoes TEXT,
  convertida_em_os BOOLEAN DEFAULT FALSE,
  id_os_gerada UUID REFERENCES public.ordens_servico(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- 3. ADICIONAR CAMPO NA OS PARA RASTREAR OCORRÊNCIA ORIGEM
ALTER TABLE public.ordens_servico ADD COLUMN IF NOT EXISTS id_ocorrencia UUID REFERENCES public.ocorrencias(id);

-- 4. ATUALIZAR ESTRUTURA DE TÉCNICOS
-- Adicionar campo tipo_recurso na tabela user_roles
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS tipo_recurso TEXT DEFAULT 'Conta';

-- 5. INDEXES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_ocorrencias_cliente ON public.ocorrencias(id_cliente);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_status ON public.ocorrencias(status_ocorrencia);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_numero ON public.ocorrencias(numero);
CREATE INDEX IF NOT EXISTS idx_os_ocorrencia ON public.ordens_servico(id_ocorrencia);

-- 6. RLS PARA OCORRÊNCIAS
ALTER TABLE public.ocorrencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view relevant ocorrencias"
  ON public.ocorrencias FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    created_by = auth.uid()
  );

CREATE POLICY "Users can create ocorrencias"
  ON public.ocorrencias FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update relevant ocorrencias"
  ON public.ocorrencias FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    created_by = auth.uid()
  );

CREATE POLICY "Admins can delete ocorrencias"
  ON public.ocorrencias FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 7. TRIGGER PARA UPDATED_AT
CREATE TRIGGER ocorrencias_updated_at
  BEFORE UPDATE ON public.ocorrencias
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 8. FUNÇÃO PARA GERAR NÚMERO DE OCORRÊNCIA
CREATE OR REPLACE FUNCTION public.gerar_numero_ocorrencia()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ano TEXT;
  contador INTEGER;
  numero_gerado TEXT;
BEGIN
  ano := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COUNT(*) + 1 INTO contador
  FROM public.ocorrencias
  WHERE numero LIKE 'OC-' || ano || '-%';
  
  numero_gerado := 'OC-' || ano || '-' || LPAD(contador::TEXT, 4, '0');
  
  RETURN numero_gerado;
END;
$$;

-- 9. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON TABLE public.ocorrencias IS 'Ocorrências registradas pelos clientes - primeira etapa antes de criar OS';
COMMENT ON COLUMN public.ocorrencias.status_ocorrencia IS 'Status: aberta, em_analise, convertida_em_os, cancelada';
COMMENT ON COLUMN public.ocorrencias.convertida_em_os IS 'Flag indicando se já foi convertida em OS';
COMMENT ON COLUMN public.ocorrencias.id_os_gerada IS 'ID da OS gerada a partir desta ocorrência';

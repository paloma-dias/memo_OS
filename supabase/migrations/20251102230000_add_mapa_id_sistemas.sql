-- Create ID Mapping table (De-Para)
CREATE TABLE public.mapa_id_sistemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_dinamics TEXT NOT NULL,
  entidade TEXT NOT NULL, -- 'cliente', 'produto', 'os', 'usuario'
  id_interno UUID NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(id_dinamics, entidade)
);

-- Enable RLS
ALTER TABLE public.mapa_id_sistemas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mapa_id_sistemas
CREATE POLICY "Users can view all mappings"
  ON public.mapa_id_sistemas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage mappings"
  ON public.mapa_id_sistemas FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER mapa_id_sistemas_updated_at
  BEFORE UPDATE ON public.mapa_id_sistemas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Add indexes for performance
CREATE INDEX idx_mapa_id_dinamics ON public.mapa_id_sistemas(id_dinamics);
CREATE INDEX idx_mapa_entidade ON public.mapa_id_sistemas(entidade);
CREATE INDEX idx_mapa_id_interno ON public.mapa_id_sistemas(id_interno);

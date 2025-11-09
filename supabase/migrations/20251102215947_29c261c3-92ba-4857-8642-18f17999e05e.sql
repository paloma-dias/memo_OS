-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE app_role AS ENUM ('admin', 'operador');
CREATE TYPE origem_os AS ENUM ('oficina', 'campo');
CREATE TYPE situacao_garantia AS ENUM ('garantia', 'fora_garantia');
CREATE TYPE status_os AS ENUM (
  'aberta',
  'designada',
  'em_diagnostico',
  'aguardando_aprovacao',
  'aguardando_pecas',
  'em_execucao',
  'finalizada'
);
CREATE TYPE prioridade AS ENUM ('baixa', 'media', 'alta');
CREATE TYPE condicao_pagamento AS ENUM ('a_vista', 'parcelado', 'boleto', 'cartao');

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telefone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User roles table (security best practice)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'operador',
  substatus_operador TEXT,
  id_dinamics TEXT UNIQUE,
  UNIQUE(user_id, role)
);

-- Clients table
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_dinamics TEXT UNIQUE,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  endereco TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Products catalog
CREATE TABLE public.produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Service Orders
CREATE TABLE public.ordens_servico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT UNIQUE NOT NULL,
  id_dinamics_os TEXT UNIQUE,
  id_cliente UUID REFERENCES public.clientes(id) NOT NULL,
  id_tecnico_principal UUID REFERENCES public.profiles(id),
  origem origem_os NOT NULL,
  situacao_garantia situacao_garantia NOT NULL,
  status_atual status_os DEFAULT 'aberta' NOT NULL,
  prioridade prioridade DEFAULT 'media',
  prazo DATE,
  laudo TEXT,
  condicao_pagamento condicao_pagamento,
  motivo_cancelamento TEXT,
  data_inicio_execucao TIMESTAMPTZ,
  data_fim_execucao TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Status flow log (prevents skipping stages)
CREATE TABLE public.fluxo_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_os UUID REFERENCES public.ordens_servico(id) ON DELETE CASCADE NOT NULL,
  status_anterior status_os,
  status_novo status_os NOT NULL,
  changed_by UUID REFERENCES public.profiles(id),
  changed_at TIMESTAMPTZ DEFAULT now()
);

-- Items/Parts for each OS
CREATE TABLE public.itens_os (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_os UUID REFERENCES public.ordens_servico(id) ON DELETE CASCADE NOT NULL,
  id_produto UUID REFERENCES public.produtos(id) NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Schedule/Reservations
CREATE TABLE public.agenda_reservas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_os UUID REFERENCES public.ordens_servico(id) ON DELETE CASCADE NOT NULL,
  id_tecnico UUID REFERENCES public.profiles(id) NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_inicio TIMESTAMPTZ NOT NULL,
  data_fim TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Photos for OS
CREATE TABLE public.fotos_os (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_os UUID REFERENCES public.ordens_servico(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  descricao TEXT,
  uploaded_by UUID REFERENCES public.profiles(id),
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fluxo_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_os ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fotos_os ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for clientes
CREATE POLICY "Users can view all clients"
  ON public.clientes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage clients"
  ON public.clientes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for produtos
CREATE POLICY "Users can view all products"
  ON public.produtos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage products"
  ON public.produtos FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for ordens_servico
CREATE POLICY "Users can view relevant OS"
  ON public.ordens_servico FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    id_tecnico_principal = auth.uid()
  );

CREATE POLICY "Admins can create OS"
  ON public.ordens_servico FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update relevant OS"
  ON public.ordens_servico FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    id_tecnico_principal = auth.uid()
  );

-- RLS Policies for fluxo_status
CREATE POLICY "Users can view status flow"
  ON public.fluxo_status FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert status changes"
  ON public.fluxo_status FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for itens_os
CREATE POLICY "Users can view items"
  ON public.itens_os FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage items"
  ON public.itens_os FOR ALL
  TO authenticated
  USING (true);

-- RLS Policies for agenda_reservas
CREATE POLICY "Users can view relevant reservations"
  ON public.agenda_reservas FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    id_tecnico = auth.uid()
  );

CREATE POLICY "Admins can manage reservations"
  ON public.agenda_reservas FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for fotos_os
CREATE POLICY "Users can view photos"
  ON public.fotos_os FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can upload photos"
  ON public.fotos_os FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER produtos_updated_at
  BEFORE UPDATE ON public.produtos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER ordens_servico_updated_at
  BEFORE UPDATE ON public.ordens_servico
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER agenda_reservas_updated_at
  BEFORE UPDATE ON public.agenda_reservas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to validate sequential status flow
CREATE OR REPLACE FUNCTION public.validate_status_transition()
RETURNS TRIGGER AS $$
DECLARE
  old_status status_os;
  status_sequence status_os[] := ARRAY[
    'aberta',
    'designada',
    'em_diagnostico',
    'aguardando_aprovacao',
    'aguardando_pecas',
    'em_execucao',
    'finalizada'
  ]::status_os[];
  old_pos INTEGER;
  new_pos INTEGER;
BEGIN
  -- Get the old status
  SELECT status_atual INTO old_status FROM public.ordens_servico WHERE id = NEW.id;
  
  -- Find positions in sequence
  SELECT idx INTO old_pos FROM unnest(status_sequence) WITH ORDINALITY arr(val, idx) WHERE val = old_status;
  SELECT idx INTO new_pos FROM unnest(status_sequence) WITH ORDINALITY arr(val, idx) WHERE val = NEW.status_atual;
  
  -- Allow only sequential progression (next step) or same status
  IF new_pos IS NOT NULL AND old_pos IS NOT NULL THEN
    IF new_pos != old_pos AND new_pos != old_pos + 1 THEN
      RAISE EXCEPTION 'Status transition not allowed. Must progress sequentially.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_sequential_status
  BEFORE UPDATE OF status_atual ON public.ordens_servico
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_status_transition();

-- Function to log status changes
CREATE OR REPLACE FUNCTION public.log_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status_atual IS DISTINCT FROM NEW.status_atual THEN
    INSERT INTO public.fluxo_status (id_os, status_anterior, status_novo, changed_by)
    VALUES (NEW.id, OLD.status_atual, NEW.status_atual, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_os_status_change
  AFTER UPDATE OF status_atual ON public.ordens_servico
  FOR EACH ROW
  EXECUTE FUNCTION public.log_status_change();
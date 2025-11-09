-- Fix security warnings: Add search_path to functions

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_status_transition()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  SELECT status_atual INTO old_status FROM public.ordens_servico WHERE id = NEW.id;
  SELECT idx INTO old_pos FROM unnest(status_sequence) WITH ORDINALITY arr(val, idx) WHERE val = old_status;
  SELECT idx INTO new_pos FROM unnest(status_sequence) WITH ORDINALITY arr(val, idx) WHERE val = NEW.status_atual;
  
  IF new_pos IS NOT NULL AND old_pos IS NOT NULL THEN
    IF new_pos != old_pos AND new_pos != old_pos + 1 THEN
      RAISE EXCEPTION 'Status transition not allowed. Must progress sequentially.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_status_change()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status_atual IS DISTINCT FROM NEW.status_atual THEN
    INSERT INTO public.fluxo_status (id_os, status_anterior, status_novo, changed_by)
    VALUES (NEW.id, OLD.status_atual, NEW.status_atual, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;
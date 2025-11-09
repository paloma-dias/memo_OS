import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Clock } from "lucide-react";

export const Agenda = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [reservas, setReservas] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { userRole, user } = useAuth();

  const [ordensServico, setOrdensServico] = useState<any[]>([]);
  const [tecnicos, setTecnicos] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    id_os: "",
    id_tecnico: "",
    titulo: "",
    descricao: "",
    data_inicio: "",
    hora_inicio: "",
    data_fim: "",
    hora_fim: "",
  });

  useEffect(() => {
    if (date) {
      fetchReservas();
    }
  }, [date, user]);

  useEffect(() => {
    if (userRole === "admin") {
      fetchOrdensServico();
      fetchTecnicos();
    }
  }, [userRole]);

  const fetchReservas = async () => {
    if (!date || !user) return;

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    let query = supabase
      .from("agenda_reservas")
      .select(`
        *,
        ordens_servico (
          numero,
          clientes (
            nome
          )
        ),
        profiles (
          nome
        )
      `)
      .gte("data_inicio", startOfDay.toISOString())
      .lte("data_inicio", endOfDay.toISOString())
      .order("data_inicio");

    // Operadores veem apenas suas reservas
    if (userRole === "operador") {
      query = query.eq("id_tecnico", user.id);
    }

    const { data, error } = await query;
    
    if (error) {
      toast({
        title: "Erro ao carregar agenda",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setReservas(data || []);
    }
  };

  const fetchOrdensServico = async () => {
    const { data, error } = await supabase
      .from("ordens_servico")
      .select("id, numero, clientes(nome)")
      .in("status_atual", ["aberta", "designada"])
      .order("created_at", { ascending: false });

    if (!error) {
      setOrdensServico(data || []);
    }
  };

  const fetchTecnicos = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select(`
        id,
        nome,
        user_roles!inner(role)
      `)
      .eq("user_roles.role", "operador");

    if (!error) {
      setTecnicos(data || []);
    }
  };

  const handleCreate = async () => {
    if (!formData.id_os || !formData.id_tecnico || !formData.titulo || 
        !formData.data_inicio || !formData.hora_inicio || 
        !formData.data_fim || !formData.hora_fim) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const dataInicio = new Date(`${formData.data_inicio}T${formData.hora_inicio}`);
      const dataFim = new Date(`${formData.data_fim}T${formData.hora_fim}`);

      if (dataFim <= dataInicio) {
        throw new Error("A data/hora de término deve ser posterior à de início.");
      }

      const { error } = await supabase
        .from("agenda_reservas")
        .insert([{
          id_os: formData.id_os,
          id_tecnico: formData.id_tecnico,
          titulo: formData.titulo,
          descricao: formData.descricao,
          data_inicio: dataInicio.toISOString(),
          data_fim: dataFim.toISOString(),
        }]);

      if (error) throw error;

      toast({
        title: "Reserva criada!",
        description: "A reserva foi agendada com sucesso.",
      });

      setOpen(false);
      setFormData({
        id_os: "",
        id_tecnico: "",
        titulo: "",
        descricao: "",
        data_inicio: "",
        hora_inicio: "",
        data_fim: "",
        hora_fim: "",
      });
      fetchReservas();
    } catch (error: any) {
      toast({
        title: "Erro ao criar reserva",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agenda</h1>
          <p className="text-muted-foreground">
            {userRole === "admin" ? "Visualize e gerencie todas as reservas" : "Suas reservas agendadas"}
          </p>
        </div>
        
        {userRole === "admin" && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Reserva
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Reserva na Agenda</DialogTitle>
                <DialogDescription>
                  Agende um técnico para uma ordem de serviço
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="id_os">Ordem de Serviço *</Label>
                  <Select
                    value={formData.id_os}
                    onValueChange={(value) => setFormData({ ...formData, id_os: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma OS..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ordensServico.map((os) => (
                        <SelectItem key={os.id} value={os.id}>
                          OS #{os.numero} - {os.clientes?.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="id_tecnico">Técnico *</Label>
                  <Select
                    value={formData.id_tecnico}
                    onValueChange={(value) => setFormData({ ...formData, id_tecnico: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um técnico..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tecnicos.map((tec) => (
                        <SelectItem key={tec.id} value={tec.id}>
                          {tec.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="titulo">Título *</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    placeholder="Ex: Manutenção preventiva"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_inicio">Data Início *</Label>
                  <Input
                    id="data_inicio"
                    type="date"
                    value={formData.data_inicio}
                    onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hora_inicio">Hora Início *</Label>
                  <Input
                    id="hora_inicio"
                    type="time"
                    value={formData.hora_inicio}
                    onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_fim">Data Término *</Label>
                  <Input
                    id="data_fim"
                    type="date"
                    value={formData.data_fim}
                    onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hora_fim">Hora Término *</Label>
                  <Input
                    id="hora_fim"
                    type="time"
                    value={formData.hora_fim}
                    onChange={(e) => setFormData({ ...formData, hora_fim: e.target.value })}
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Detalhes adicionais..."
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate} disabled={loading}>
                  <Clock className="w-4 h-4 mr-2" />
                  Criar Reserva
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
            locale={ptBR}
          />
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            {date && format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </h2>
          
          <div className="space-y-3">
            {reservas.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma reserva para este dia
              </p>
            ) : (
              reservas.map((reserva) => (
                <div
                  key={reserva.id}
                  className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-foreground">{reserva.titulo}</p>
                      <p className="text-sm text-muted-foreground">
                        OS #{reserva.ordens_servico?.numero}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {format(new Date(reserva.data_inicio), "HH:mm")} - {format(new Date(reserva.data_fim), "HH:mm")}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-1">
                    Cliente: {reserva.ordens_servico?.clientes?.nome}
                  </p>
                  
                  {userRole === "admin" && (
                    <p className="text-sm text-muted-foreground">
                      Técnico: {reserva.profiles?.nome}
                    </p>
                  )}
                  
                  {reserva.descricao && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {reserva.descricao}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
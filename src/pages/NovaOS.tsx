import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft } from "lucide-react";

export const NovaOS = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  const [clientes, setClientes] = useState<any[]>([]);
  const [tecnicos, setTecnicos] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    numero: "",
    id_cliente: "",
    id_tecnico_principal: "",
    origem: "oficina" as "oficina" | "campo",
    situacao_garantia: "fora_garantia" as "garantia" | "fora_garantia",
    prioridade: "media" as "baixa" | "media" | "alta",
    prazo: "",
  });

  useEffect(() => {
    fetchClientes();
    fetchTecnicos();
    generateNumeroOS();
  }, []);

  const generateNumeroOS = async () => {
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from("ordens_servico")
      .select("*", { count: "exact", head: true });
    
    const nextNumber = (count || 0) + 1;
    setFormData(prev => ({ ...prev, numero: `${year}-${String(nextNumber).padStart(3, "0")}` }));
  };

  const fetchClientes = async () => {
    const { data } = await supabase
      .from("clientes")
      .select("*")
      .order("nome");
    setClientes(data || []);
  };

  const fetchTecnicos = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, nome");
    setTecnicos(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from("ordens_servico")
      .insert([{
        ...formData,
        prazo: formData.prazo || null,
        id_tecnico_principal: formData.id_tecnico_principal || null,
        created_by: user.id,
      }]);
    
    if (error) {
      toast({ title: "Erro ao criar OS", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "OS criada com sucesso!" });
      navigate("/");
    }
  };

  if (userRole !== "admin") {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-muted-foreground">Apenas administradores podem criar OS</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nova Ordem de Serviço</h1>
          <p className="text-muted-foreground">Preencha os dados da nova OS</p>
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="numero">Número da OS *</Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente *</Label>
              <Select value={formData.id_cliente} onValueChange={(value) => setFormData({ ...formData, id_cliente: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="origem">Origem *</Label>
              <Select value={formData.origem} onValueChange={(value: "oficina" | "campo") => setFormData({ ...formData, origem: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oficina">Oficina</SelectItem>
                  <SelectItem value="campo">Campo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="garantia">Situação de Garantia *</Label>
              <Select value={formData.situacao_garantia} onValueChange={(value: "garantia" | "fora_garantia") => setFormData({ ...formData, situacao_garantia: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="garantia">Em Garantia</SelectItem>
                  <SelectItem value="fora_garantia">Fora de Garantia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prioridade">Prioridade</Label>
              <Select value={formData.prioridade} onValueChange={(value: "baixa" | "media" | "alta") => setFormData({ ...formData, prioridade: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prazo">Prazo</Label>
              <Input
                id="prazo"
                type="date"
                value={formData.prazo}
                onChange={(e) => setFormData({ ...formData, prazo: e.target.value })}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="tecnico">Técnico Responsável</Label>
              <Select value={formData.id_tecnico_principal} onValueChange={(value) => setFormData({ ...formData, id_tecnico_principal: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o técnico" />
                </SelectTrigger>
                <SelectContent>
                  {tecnicos.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => navigate("/")} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              Criar OS
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
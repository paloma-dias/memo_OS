import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Link2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const Mapeamento = () => {
  const [mapeamentos, setMapeamentos] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { userRole } = useAuth();

  const [formData, setFormData] = useState({
    id_dinamics: "",
    entidade: "cliente",
    id_interno: "",
    observacoes: "",
  });

  const [entidades, setEntidades] = useState<any[]>([]);

  useEffect(() => {
    fetchMapeamentos();
  }, []);

  useEffect(() => {
    if (formData.entidade) {
      fetchEntidades();
    }
  }, [formData.entidade]);

  if (userRole !== "admin") {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Acesso restrito a Administradores</p>
      </div>
    );
  }

  const fetchMapeamentos = async () => {
    try {
      const { data, error } = await supabase
        .from("mapa_id_sistemas")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMapeamentos(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar mapeamentos",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchEntidades = async () => {
    try {
      let table = "clientes";
      let selectFields = "id, nome";

      switch (formData.entidade) {
        case "cliente":
          table = "clientes";
          break;
        case "produto":
          table = "produtos";
          selectFields = "id, nome";
          break;
        case "usuario":
          table = "profiles";
          break;
        case "os":
          table = "ordens_servico";
          selectFields = "id, numero as nome";
          break;
      }

      const { data, error } = await supabase
        .from(table)
        .select(selectFields);

      if (error) throw error;
      setEntidades(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar entidades:", error);
    }
  };

  const handleCreate = async () => {
    if (!formData.id_dinamics || !formData.id_interno) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha ID Dynamics e selecione uma entidade interna.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("mapa_id_sistemas")
        .insert([formData]);

      if (error) throw error;

      toast({
        title: "Mapeamento criado!",
        description: "O De-Para foi registrado com sucesso.",
      });

      setOpen(false);
      setFormData({
        id_dinamics: "",
        entidade: "cliente",
        id_interno: "",
        observacoes: "",
      });
      fetchMapeamentos();
    } catch (error: any) {
      toast({
        title: "Erro ao criar mapeamento",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("mapa_id_sistemas")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Mapeamento removido",
        description: "O De-Para foi excluído com sucesso.",
      });

      fetchMapeamentos();
    } catch (error: any) {
      toast({
        title: "Erro ao remover mapeamento",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mapeamento De-Para</h1>
          <p className="text-muted-foreground">
            Vincule IDs do Dynamics com IDs internos do sistema
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Mapeamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Mapeamento De-Para</DialogTitle>
              <DialogDescription>
                Vincule um ID externo (Dynamics) a uma entidade interna.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="id_dinamics">ID Dynamics (Externo)</Label>
                <Input
                  id="id_dinamics"
                  value={formData.id_dinamics}
                  onChange={(e) => setFormData({ ...formData, id_dinamics: e.target.value })}
                  placeholder="Ex: DYN-12345"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="entidade">Tipo de Entidade</Label>
                <Select
                  value={formData.entidade}
                  onValueChange={(value) => setFormData({ ...formData, entidade: value, id_interno: "" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cliente">Cliente</SelectItem>
                    <SelectItem value="produto">Produto</SelectItem>
                    <SelectItem value="os">Ordem de Serviço</SelectItem>
                    <SelectItem value="usuario">Usuário</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="id_interno">Entidade Interna</Label>
                <Select
                  value={formData.id_interno}
                  onValueChange={(value) => setFormData({ ...formData, id_interno: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {entidades.map((entidade) => (
                      <SelectItem key={entidade.id} value={entidade.id}>
                        {entidade.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações (opcional)</Label>
                <Input
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Notas adicionais..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={loading}>
                <Link2 className="w-4 h-4 mr-2" />
                Criar Mapeamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Dynamics</TableHead>
              <TableHead>Entidade</TableHead>
              <TableHead>ID Interno</TableHead>
              <TableHead>Observações</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mapeamentos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum mapeamento cadastrado
                </TableCell>
              </TableRow>
            ) : (
              mapeamentos.map((map) => (
                <TableRow key={map.id}>
                  <TableCell className="font-mono text-sm">{map.id_dinamics}</TableCell>
                  <TableCell className="capitalize">{map.entidade}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {map.id_interno}
                  </TableCell>
                  <TableCell>{map.observacoes || "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(map.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

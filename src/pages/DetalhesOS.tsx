import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
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
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";

export const DetalhesOS = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [ordens, setOrdens] = useState<any[]>([]);
  const [selectedOS, setSelectedOS] = useState<any>(null);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [itensOS, setItensOS] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [laudoData, setLaudoData] = useState({
    laudo: "",
  });

  const [itemDialog, setItemDialog] = useState(false);
  const [itemData, setItemData] = useState({
    id_produto: "",
    quantidade: 1,
  });

  useEffect(() => {
    fetchOrdens();
    fetchProdutos();
  }, [user]);

  useEffect(() => {
    if (selectedOS) {
      setLaudoData({ laudo: selectedOS.laudo || "" });
      fetchItensOS();
    }
  }, [selectedOS]);

  const fetchOrdens = async () => {
    if (!user) return;

    let query = supabase
      .from("ordens_servico")
      .select(`
        *,
        clientes (nome),
        profiles!ordens_servico_id_tecnico_principal_fkey (nome)
      `)
      .in("status_atual", ["designada", "em_diagnostico", "aguardando_aprovacao"])
      .order("created_at", { ascending: false });

    const { data, error } = await query;
    
    if (error) {
      toast({
        title: "Erro ao carregar OS",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setOrdens(data || []);
      if (data && data.length > 0 && !selectedOS) {
        setSelectedOS(data[0]);
      }
    }
  };

  const fetchProdutos = async () => {
    const { data } = await supabase
      .from("produtos")
      .select("*")
      .order("nome");
    setProdutos(data || []);
  };

  const fetchItensOS = async () => {
    if (!selectedOS) return;

    const { data, error } = await supabase
      .from("itens_os")
      .select(`
        *,
        produtos (codigo, nome)
      `)
      .eq("id_os", selectedOS.id);

    if (!error) {
      setItensOS(data || []);
    }
  };

  const handleSalvarLaudo = async () => {
    if (!selectedOS) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("ordens_servico")
        .update({ laudo: laudoData.laudo })
        .eq("id", selectedOS.id);

      if (error) throw error;

      toast({
        title: "Laudo salvo!",
        description: "O diagnóstico foi registrado com sucesso.",
      });

      fetchOrdens();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar laudo",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdicionarItem = async () => {
    if (!selectedOS || !itemData.id_produto) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione um produto e informe a quantidade.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("itens_os")
        .insert([{
          id_os: selectedOS.id,
          id_produto: itemData.id_produto,
          quantidade: itemData.quantidade,
        }]);

      if (error) throw error;

      toast({
        title: "Item adicionado!",
        description: "Peça adicionada à cotação simples.",
      });

      setItemDialog(false);
      setItemData({ id_produto: "", quantidade: 1 });
      fetchItensOS();
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar item",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRemoverItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("itens_os")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      toast({
        title: "Item removido",
        description: "Peça removida da cotação.",
      });

      fetchItensOS();
    } catch (error: any) {
      toast({
        title: "Erro ao remover item",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!selectedOS) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhuma OS disponível para diagnóstico</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "designada": return "bg-blue-500";
      case "em_diagnostico": return "bg-yellow-500";
      case "aguardando_aprovacao": return "bg-orange-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Diagnóstico e Cotação</h1>
          <p className="text-muted-foreground">Registre o laudo e adicione peças necessárias</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Lista de OS */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Ordens de Serviço</h3>
          <div className="space-y-2">
            {ordens.map((os) => (
              <button
                key={os.id}
                onClick={() => setSelectedOS(os)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedOS?.id === os.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "hover:bg-muted border-border"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold">OS #{os.numero}</span>
                  <Badge className={getStatusColor(os.status_atual)} variant="secondary">
                    {os.status_atual === "designada" && "Designada"}
                    {os.status_atual === "em_diagnostico" && "Em Diagnóstico"}
                    {os.status_atual === "aguardando_aprovacao" && "Aguardando"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{os.clientes?.nome}</p>
              </button>
            ))}
          </div>
        </Card>

        {/* Detalhes e Laudo */}
        <Card className="p-6 md:col-span-2">
          <div className="space-y-6">
            {/* Informações da OS */}
            <div>
              <h3 className="text-xl font-semibold mb-4">OS #{selectedOS.numero}</h3>
              <div className="grid gap-3 md:grid-cols-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Cliente:</span>
                  <p className="font-medium">{selectedOS.clientes?.nome}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Técnico:</span>
                  <p className="font-medium">{selectedOS.profiles?.nome || "Não designado"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Origem:</span>
                  <p className="font-medium capitalize">{selectedOS.origem}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Garantia:</span>
                  <p className="font-medium">
                    {selectedOS.situacao_garantia === "garantia" ? "Em Garantia" : "Fora de Garantia"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Prioridade:</span>
                  <Badge variant="outline" className="capitalize">{selectedOS.prioridade}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Prazo:</span>
                  <p className="font-medium">
                    {selectedOS.prazo ? new Date(selectedOS.prazo).toLocaleDateString("pt-BR") : "Sem prazo"}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4" />

            {/* Laudo/Diagnóstico */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="laudo" className="text-base font-semibold">
                  Laudo / Diagnóstico
                </Label>
                <Button onClick={handleSalvarLaudo} disabled={loading} size="sm">
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Laudo
                </Button>
              </div>
              <Textarea
                id="laudo"
                value={laudoData.laudo}
                onChange={(e) => setLaudoData({ laudo: e.target.value })}
                placeholder="Descreva o diagnóstico do problema, peças necessárias, tempo estimado de reparo..."
                rows={6}
                className="w-full"
              />
            </div>

            <div className="border-t pt-4" />

            {/* Cotação Simples - Itens/Peças */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Cotação Simples - Peças Necessárias</Label>
                <Button onClick={() => setItemDialog(true)} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Peça
                </Button>
              </div>

              {itensOS.length === 0 ? (
                <div className="text-center py-8 border rounded-lg border-dashed">
                  <p className="text-muted-foreground">Nenhuma peça adicionada ainda</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Clique em "Adicionar Peça" para incluir itens
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-center">Quantidade</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itensOS.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-sm">{item.produtos?.codigo}</TableCell>
                        <TableCell>{item.produtos?.nome}</TableCell>
                        <TableCell className="text-center font-semibold">{item.quantidade}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoverItem(item.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Dialog Adicionar Item */}
      <Dialog open={itemDialog} onOpenChange={setItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Peça</DialogTitle>
            <DialogDescription>
              Selecione um produto e informe a quantidade necessária
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="produto">Produto *</Label>
              <Select
                value={itemData.id_produto}
                onValueChange={(value) => setItemData({ ...itemData, id_produto: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o produto..." />
                </SelectTrigger>
                <SelectContent>
                  {produtos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.codigo} - {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade *</Label>
              <Input
                id="quantidade"
                type="number"
                min="1"
                value={itemData.quantidade}
                onChange={(e) => setItemData({ ...itemData, quantidade: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAdicionarItem}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

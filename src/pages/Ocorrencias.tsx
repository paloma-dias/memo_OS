import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, ArrowRight, Eye, X } from "lucide-react";

export const Ocorrencias = () => {
  const [ocorrencias, setOcorrencias] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedOcorrencia, setSelectedOcorrencia] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user, userRole } = useAuth();

  const [formData, setFormData] = useState({
    id_cliente: "",
    titulo: "",
    descricao: "",
    prioridade: "media" as "baixa" | "media" | "alta",
    origem: "oficina" as "oficina" | "campo",
    situacao_garantia: "fora_garantia" as "garantia" | "fora_garantia",
    contato_cliente: "",
    telefone_contato: "",
    endereco_atendimento: "",
    observacoes: "",
  });

  useEffect(() => {
    fetchOcorrencias();
    fetchClientes();
  }, [user]);

  const fetchOcorrencias = async () => {
    if (!user) return;

    let query = supabase
      .from("ocorrencias")
      .select(`
        *,
        clientes (
          razao_social,
          nome,
          numero_conta,
          telefone_principal,
          cidade
        ),
        ordens_servico!ocorrencias_id_os_gerada_fkey (
      numero,
      status_atual
    )
  `)
      .order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      toast({
        title: "Erro ao carregar ocorrências",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setOcorrencias(data || []);
    }
  };

  const fetchClientes = async () => {
    const { data } = await supabase
      .from("clientes")
      .select("*")
      .eq("status", "Ativa")
      .order("razao_social");
    setClientes(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Gerar número da ocorrência
      const { data: numeroData, error: numeroError } = await supabase.rpc(
        "gerar_numero_ocorrencia"
      );

      if (numeroError) throw numeroError;

      const { error } = await supabase.from("ocorrencias").insert([{
        ...formData,
        numero: numeroData,
        created_by: user.id,
        status_ocorrencia: "aberta",
      }]);

      if (error) throw error;

      toast({
        title: "Ocorrência criada!",
        description: `Número: ${numeroData}`,
      });

      setOpen(false);
      setFormData({
        id_cliente: "",
        titulo: "",
        descricao: "",
        prioridade: "media",
        origem: "oficina",
        situacao_garantia: "fora_garantia",
        contato_cliente: "",
        telefone_contato: "",
        endereco_atendimento: "",
        observacoes: "",
      });
      fetchOcorrencias();
    } catch (error: any) {
      toast({
        title: "Erro ao criar ocorrência",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConverterEmOS = async (ocorrencia: any) => {
    if (ocorrencia.convertida_em_os) {
      toast({
        title: "Já convertida",
        description: "Esta ocorrência já foi convertida em OS.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Gerar número da OS
      const year = new Date().getFullYear();
      const { count } = await supabase
        .from("ordens_servico")
        .select("*", { count: "exact", head: true });

      const nextNumber = (count || 0) + 1;
      const numeroOS = `${year}-${String(nextNumber).padStart(3, "0")}`;

      // Criar OS
      const { data: osData, error: osError } = await supabase
        .from("ordens_servico")
        .insert([{
          numero: numeroOS,
          id_cliente: ocorrencia.id_cliente,
          id_ocorrencia: ocorrencia.id,
          origem: ocorrencia.origem,
          situacao_garantia: ocorrencia.situacao_garantia,
          prioridade: ocorrencia.prioridade,
          status_atual: "aberta",
          created_by: user?.id,
        }])
        .select()
        .single();

      if (osError) throw osError;

      // Atualizar ocorrência
      const { error: updateError } = await supabase
        .from("ocorrencias")
        .update({
          convertida_em_os: true,
          id_os_gerada: osData.id,
          status_ocorrencia: "convertida_em_os",
        })
        .eq("id", ocorrencia.id);

      if (updateError) throw updateError;

      toast({
        title: "OS criada com sucesso!",
        description: `Ordem de Serviço #${numeroOS} foi criada.`,
      });

      fetchOcorrencias();
    } catch (error: any) {
      toast({
        title: "Erro ao converter em OS",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aberta":
        return "bg-yellow-500";
      case "em_analise":
        return "bg-blue-500";
      case "convertida_em_os":
        return "bg-green-500";
      case "cancelada":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      aberta: "Aberta",
      em_analise: "Em Análise",
      convertida_em_os: "Convertida em OS",
      cancelada: "Cancelada",
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ocorrências</h1>
          <p className="text-muted-foreground">
            Registre ocorrências dos clientes - primeira etapa antes de criar OS
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Ocorrência
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Nova Ocorrência</DialogTitle>
              <DialogDescription>
                Primeiro passo: registre a ocorrência do cliente
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="cliente">Cliente *</Label>
                  <Select
                    value={formData.id_cliente}
                    onValueChange={(value) => setFormData({ ...formData, id_cliente: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.razao_social || c.nome} {c.numero_conta && `- ${c.numero_conta}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="titulo">Título da Ocorrência *</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    placeholder="Ex: Máquina com defeito no motor"
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="descricao">Descrição do Problema</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descreva detalhadamente o problema relatado..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="origem">Origem *</Label>
                  <Select
                    value={formData.origem}
                    onValueChange={(value: "oficina" | "campo") =>
                      setFormData({ ...formData, origem: value })
                    }
                  >
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
                  <Select
                    value={formData.situacao_garantia}
                    onValueChange={(value: "garantia" | "fora_garantia") =>
                      setFormData({ ...formData, situacao_garantia: value })
                    }
                  >
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
                  <Select
                    value={formData.prioridade}
                    onValueChange={(value: "baixa" | "media" | "alta") =>
                      setFormData({ ...formData, prioridade: value })
                    }
                  >
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
                  <Label htmlFor="contato">Contato do Cliente</Label>
                  <Input
                    id="contato"
                    value={formData.contato_cliente}
                    onChange={(e) => setFormData({ ...formData, contato_cliente: e.target.value })}
                    placeholder="Nome do contato"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone de Contato</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone_contato}
                    onChange={(e) => setFormData({ ...formData, telefone_contato: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="endereco">Endereço de Atendimento</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco_atendimento}
                    onChange={(e) =>
                      setFormData({ ...formData, endereco_atendimento: e.target.value })
                    }
                    placeholder="Endereço completo para atendimento"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    placeholder="Informações adicionais..."
                    rows={2}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  Registrar Ocorrência
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>OS Gerada</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ocorrencias.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhuma ocorrência registrada
                </TableCell>
              </TableRow>
            ) : (
              ocorrencias.map((oc) => (
                <TableRow key={oc.id}>
                  <TableCell className="font-semibold">{oc.numero}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {oc.clientes?.razao_social || oc.clientes?.nome}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {oc.clientes?.numero_conta}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{oc.titulo}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {oc.prioridade}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(oc.status_ocorrencia)}>
                      {getStatusLabel(oc.status_ocorrencia)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {oc.ordens_servico ? (
                      <span className="text-sm font-mono">#{oc.ordens_servico.numero}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedOcorrencia(oc);
                        setDetailsOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {!oc.convertida_em_os && userRole === "admin" && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleConverterEmOS(oc)}
                      >
                        <ArrowRight className="w-4 h-4 mr-1" />
                        Converter em OS
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Dialog Detalhes */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Ocorrência</DialogTitle>
          </DialogHeader>

          {selectedOcorrencia && (
            <div className="space-y-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">Número</Label>
                  <p className="font-semibold">{selectedOcorrencia.numero}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge className={getStatusColor(selectedOcorrencia.status_ocorrencia)}>
                    {getStatusLabel(selectedOcorrencia.status_ocorrencia)}
                  </Badge>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-muted-foreground">Cliente</Label>
                  <p className="font-medium">
                    {selectedOcorrencia.clientes?.razao_social ||
                      selectedOcorrencia.clientes?.nome}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedOcorrencia.clientes?.numero_conta} -{" "}
                    {selectedOcorrencia.clientes?.cidade}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-muted-foreground">Título</Label>
                  <p className="font-medium">{selectedOcorrencia.titulo}</p>
                </div>
                {selectedOcorrencia.descricao && (
                  <div className="md:col-span-2">
                    <Label className="text-muted-foreground">Descrição</Label>
                    <p className="text-sm">{selectedOcorrencia.descricao}</p>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">Origem</Label>
                  <p className="capitalize">{selectedOcorrencia.origem}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Garantia</Label>
                  <p>
                    {selectedOcorrencia.situacao_garantia === "garantia"
                      ? "Em Garantia"
                      : "Fora de Garantia"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Prioridade</Label>
                  <Badge variant="outline" className="capitalize">
                    {selectedOcorrencia.prioridade}
                  </Badge>
                </div>
                {selectedOcorrencia.contato_cliente && (
                  <div>
                    <Label className="text-muted-foreground">Contato</Label>
                    <p>{selectedOcorrencia.contato_cliente}</p>
                  </div>
                )}
                {selectedOcorrencia.telefone_contato && (
                  <div>
                    <Label className="text-muted-foreground">Telefone</Label>
                    <p>{selectedOcorrencia.telefone_contato}</p>
                  </div>
                )}
                {selectedOcorrencia.endereco_atendimento && (
                  <div className="md:col-span-2">
                    <Label className="text-muted-foreground">Endereço de Atendimento</Label>
                    <p>{selectedOcorrencia.endereco_atendimento}</p>
                  </div>
                )}
                {selectedOcorrencia.observacoes && (
                  <div className="md:col-span-2">
                    <Label className="text-muted-foreground">Observações</Label>
                    <p className="text-sm">{selectedOcorrencia.observacoes}</p>
                  </div>
                )}
                {selectedOcorrencia.ordens_servico && (
                  <div className="md:col-span-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <Label className="text-muted-foreground">OS Gerada</Label>
                    <p className="font-semibold">
                      #{selectedOcorrencia.ordens_servico.numero}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Status: {selectedOcorrencia.ordens_servico.status_atual}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setDetailsOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

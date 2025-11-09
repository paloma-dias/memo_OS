import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
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
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// --- CORREÇÃO DE TIPO (1/3) ---
// 1. Definimos os tipos exatos que o banco de dados espera
type CondicaoPagamento = "a_vista" | "parcelado" | "boleto" | "cartao";

// 2. Definimos a interface para o nosso estado do formulário
interface AprovacaoFormData {
  condicao_pagamento: CondicaoPagamento | ""; // Permitimos "" para o estado inicial
  motivo_cancelamento: string;
}
// --- FIM DA CORREÇÃO 1 ---

export const Aprovacao = () => {
  const [ordensAguardando, setOrdensAguardando] = useState<any[]>([]);
  const [selectedOS, setSelectedOS] = useState<any>(null);
  const [modalType, setModalType] = useState<"aprovar" | "rejeitar" | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { userRole } = useAuth();

  // --- CORREÇÃO DE TIPO (2/3) ---
  // 3. Aplicamos a interface ao nosso useState
  const [formData, setFormData] = useState<AprovacaoFormData>({
    condicao_pagamento: "", // O estado inicial agora é válido
    motivo_cancelamento: "",
  });
  // --- FIM DA CORREÇÃO 2 ---

  useEffect(() => {
    fetchOrdensAguardando();
  }, []);

  if (userRole !== "admin") {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Acesso restrito a Administradores</p>
      </div>
    );
  }

  const fetchOrdensAguardando = async () => {
    try {
      const { data, error } = await supabase
        .from("ordens_servico")
        .select(`
          *,
          clientes (nome, telefone),
          tecnico: profiles!id_tecnico_principal (nome), 
          itens_os (
            quantidade,
            produtos (nome, codigo)
          )
        `)
        .eq("status_atual", "aguardando_aprovacao")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrdensAguardando(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar OS",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleOpenModal = (os: any, type: "aprovar" | "rejeitar") => {
    setSelectedOS(os);
    setModalType(type);
    setFormData({
      // Usamos 'as CondicaoPagamento' para garantir que o tipo seja correto
      condicao_pagamento: (os.condicao_pagamento as CondicaoPagamento) || "",
      motivo_cancelamento: os.motivo_cancelamento || "",
    });
  };

  const handleAprovar = async () => {
    if (!formData.condicao_pagamento) {
      toast({
        title: "Campo obrigatório",
        description: "Selecione a condição de pagamento.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Agora o TypeScript sabe que 'formData.condicao_pagamento' é válido
      const { error } = await supabase
        .from("ordens_servico")
        .update({
          status_atual: "aguardando_pecas",
          condicao_pagamento: formData.condicao_pagamento,
        })
        .eq("id", selectedOS.id);

      if (error) throw error;

      toast({
        title: "OS Aprovada!",
        description: `OS #${selectedOS.numero} foi aprovada e avançada para Aguardando Peças.`,
      });

      setModalType(null);
      setSelectedOS(null);
      fetchOrdensAguardando();
    } catch (error: any) {
      toast({
        title: "Erro ao aprovar OS",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRejeitar = async () => {
    // ... (nenhuma mudança aqui) ...
    if (!formData.motivo_cancelamento) {
      toast({
        title: "Campo obrigatório",
        description: "Informe o motivo da rejeição/cancelamento.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("ordens_servico")
        .update({
          motivo_cancelamento: formData.motivo_cancelamento,
        })
        .eq("id", selectedOS.id);

      if (error) throw error;

      toast({
        title: "OS Rejeitada",
        description: `OS #${selectedOS.numero} foi rejeitada. Motivo registrado.`,
      });

      setModalType(null);
      setSelectedOS(null);
      fetchOrdensAguardando();
    } catch (error: any) {
      toast({
        title: "Erro ao rejeitar OS",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ... (cabeçalho da página) ... */}
       <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Aprovação de OS</h1>
          <p className="text-muted-foreground">
            Gerencie as ordens de serviço aguardando aprovação
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          <Clock className="w-4 h-4 mr-2" />
          {ordensAguardando.length} aguardando
        </Badge>
      </div>

      {ordensAguardando.length === 0 ? (
        // ... (bloco "Tudo em dia!") ...
        <Card className="p-12 text-center">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
          <h3 className="text-xl font-semibold mb-2">Tudo em dia!</h3>
          <p className="text-muted-foreground">
            Não há ordens de serviço aguardando aprovação no momento.
          </p>
        </Card>
      ) : (
        // ... (bloco da tabela) ...
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número OS</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Técnico</TableHead>
                <TableHead>Laudo</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordensAguardando.map((os) => (
                <TableRow key={os.id}>
                  <TableCell className="font-semibold">#{os.numero}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{os.clientes?.nome}</p>
                      <p className="text-xs text-muted-foreground">{os.clientes?.telefone}</p>
                    </div>
                  </TableCell>
                  <TableCell>{os.tecnico?.nome || "-"}</TableCell>
                  <TableCell className="max-w-xs">
                    <p className="text-sm truncate">{os.laudo || "Sem laudo"}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {os.itens_os?.length || 0} itens
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleOpenModal(os, "aprovar")}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleOpenModal(os, "rejeitar")}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Rejeitar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Modal de Aprovação */}
      <Dialog open={modalType === "aprovar"} onOpenChange={() => setModalType(null)}>
        <DialogContent>
          {/* ... (conteúdo do modal) ... */}
          <DialogHeader>
            <DialogTitle>Aprovar Ordem de Serviço</DialogTitle>
            <DialogDescription>
              OS #{selectedOS?.numero} - {selectedOS?.clientes?.nome}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <h4 className="font-semibold text-sm">Detalhes da OS</h4>
              <p className="text-sm"><strong>Laudo:</strong> {selectedOS?.laudo || "N/A"}</p>
              <div className="text-sm">
                <strong>Itens solicitados:</strong>
                <ul className="ml-4 mt-1">
                  {selectedOS?.itens_os?.map((item: any, idx: number) => (
                    <li key={idx}>
                      • {item.produtos?.nome} (Cód: {item.produtos?.codigo}) - Qtd: {item.quantidade}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="condicao_pagamento">
                Condição de Pagamento <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.condicao_pagamento}
                // --- CORREÇÃO DE TIPO (3/3) ---
                // Fazemos um "cast" para o TypeScript saber que
                // o 'value' (string) é do tipo 'CondicaoPagamento'
                onValueChange={(value) => setFormData({ ...formData, condicao_pagamento: value as CondicaoPagamento })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a_vista">À Vista</SelectItem>
                  <SelectItem value="parcelado">Parcelado</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="cartao">Cartão</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalType(null)}>
              Cancelar
            </Button>
            <Button onClick={handleAprovar} disabled={loading}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Aprovar e Avançar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Rejeição */}
      <Dialog open={modalType === "rejeitar"} onOpenChange={() => setModalType(null)}>
        {/* ... (nenhuma mudança aqui) ... */}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar/Cancelar Ordem de Serviço</DialogTitle>
            <DialogDescription>
              OS #{selectedOS?.numero} - {selectedOS?.clientes?.nome}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive font-medium">
                ⚠️ Esta ação registrará o motivo de cancelamento da OS.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivo_cancelamento">
                Motivo do Cancelamento <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="motivo_cancelamento"
                value={formData.motivo_cancelamento}
                onChange={(e) => setFormData({ ...formData, motivo_cancelamento: e.target.value })}
                placeholder="Descreva o motivo da rejeição/cancelamento..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalType(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleRejeitar} disabled={loading}>
              <XCircle className="w-4 h-4 mr-2" />
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { KanbanColumn } from "@/components/Kanban/KanbanColumn";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const STATUS_COLUMNS = [
  { id: "aberta", title: "Aberta", color: "bg-status-pending" },
  { id: "designada", title: "Designada", color: "bg-status-progress" },
  { id: "em_diagnostico", title: "Em Diagnóstico", color: "bg-status-progress" },
  { id: "aguardando_aprovacao", title: "Aguardando Aprovação", color: "bg-status-pending" },
  { id: "aguardando_pecas", title: "Aguardando Peças", color: "bg-status-delayed" },
  { id: "em_execucao", title: "Em Execução", color: "bg-status-progress" },
  { id: "finalizada", title: "Finalizada", color: "bg-status-completed" },
];

export const Kanban = () => {
  const [columns, setColumns] = useState<any[]>([]);
  const { toast } = useToast();
  const { userRole, user } = useAuth();

  useEffect(() => {
    fetchOrdens();
  }, [user, userRole]);

  const fetchOrdens = async () => {
    if (!user) return;

    let query = supabase
      .from("ordens_servico")
      .select(`
        *,
        clientes (nome),
    profiles!ordens_servico_id_tecnico_principal_fkey (nome)
  `);

    if (userRole === "operador") {
      query = query.eq("id_tecnico_principal", user.id);
    }

    const { data, error } = await query;
    
    if (error) {
      toast({ title: "Erro ao carregar OS", description: error.message, variant: "destructive" });
      return;
    }

    const columnsData = STATUS_COLUMNS.map(col => ({
      ...col,
      orders: (data || [])
        .filter((os: any) => os.status_atual === col.id)
        .map((os: any) => ({
          id: os.id,
          numero: os.numero,
          cliente: os.clientes?.nome || "N/A",
          tecnico: os.profiles?.nome || "Não designado",
          prazo: os.prazo ? new Date(os.prazo).toLocaleDateString("pt-BR") : "Sem prazo",
          prioridade: os.prioridade,
        })),
    }));

    setColumns(columnsData);
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const sourceColIndex = STATUS_COLUMNS.findIndex(c => c.id === source.droppableId);
    const destColIndex = STATUS_COLUMNS.findIndex(c => c.id === destination.droppableId);

    // Só permite avançar para o próximo status sequencial
    if (destColIndex !== sourceColIndex + 1) {
      toast({
        title: "Movimento não permitido",
        description: "Só é possível avançar para o próximo status sequencial.",
        variant: "destructive",
      });
      return;
    }

    // Update no banco
    const { error } = await supabase
      .from("ordens_servico")
      .update({ status_atual: destination.droppableId as any })
      .eq("id", draggableId);

    if (error) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Status atualizado!",
        description: `OS movida para ${STATUS_COLUMNS[destColIndex].title}`,
      });
      fetchOrdens();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Kanban</h1>
          <p className="text-muted-foreground">
            Arraste as OS para o próximo status sequencial
          </p>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {columns.map((column) => (
              <Droppable key={column.id} droppableId={column.id}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    <KanbanColumn
                      title={column.title}
                      count={column.orders.length}
                      orders={column.orders}
                      color={column.color}
                    />
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </div>
      </DragDropContext>

      <div className="p-4 bg-muted/50 rounded-lg border border-border">
        <p className="text-sm text-muted-foreground">
          <strong>Importante:</strong> As OS só podem avançar para o próximo status sequencial.
          Não é permitido pular etapas no fluxo de trabalho.
        </p>
      </div>
    </div>
  );
};

export default Kanban;

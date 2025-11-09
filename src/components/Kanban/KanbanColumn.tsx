import { Draggable } from "@hello-pangea/dnd";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ServiceOrder {
  id: string;
  numero: string;
  cliente: string;
  tecnico: string;
  prazo: string;
  prioridade: "alta" | "media" | "baixa";
}

interface KanbanColumnProps {
  title: string;
  count: number;
  orders: ServiceOrder[];
  color: string;
}

export const KanbanColumn = ({ title, count, orders, color }: KanbanColumnProps) => {
  const getPriorityColor = (prioridade: string) => {
    switch (prioridade) {
      case "alta":
        return "bg-status-delayed";
      case "media":
        return "bg-status-pending";
      default:
        return "bg-status-progress";
    }
  };

  return (
    <div className="flex flex-col gap-3 min-w-[300px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${color}`} />
          <h3 className="font-semibold text-foreground">{title}</h3>
        </div>
        <Badge variant="secondary">{count}</Badge>
      </div>

      <div className="space-y-3 min-h-[200px]">
        {orders.map((order, index) => (
          <Draggable key={order.id} draggableId={order.id} index={index}>
            {(provided, snapshot) => (
              <Card
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                className={`p-4 cursor-move hover:shadow-md transition-shadow ${
                  snapshot.isDragging ? "shadow-lg ring-2 ring-primary" : ""
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-foreground">OS #{order.numero}</p>
                      <p className="text-sm text-muted-foreground">{order.cliente}</p>
                    </div>
                    <div className={`h-2 w-2 rounded-full ${getPriorityColor(order.prioridade)}`} />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Técnico:</span>
                    <span className="font-medium text-foreground">{order.tecnico}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Prazo:</span>
                    <span className="font-medium text-foreground">{order.prazo}</span>
                  </div>
                </div>
              </Card>
            )}
          </Draggable>
        ))}

        {orders.length === 0 && (
          <div className="flex items-center justify-center h-32 border-2 border-dashed border-border rounded-lg">
            <p className="text-sm text-muted-foreground">Nenhuma OS</p>
          </div>
        )}
      </div>
    </div>
  );
};

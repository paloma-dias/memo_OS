export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agenda_reservas: {
        Row: {
          created_at: string | null
          data_fim: string
          data_inicio: string
          descricao: string | null
          id: string
          id_os: string
          id_tecnico: string
          titulo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_fim: string
          data_inicio: string
          descricao?: string | null
          id?: string
          id_os: string
          id_tecnico: string
          titulo: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_fim?: string
          data_inicio?: string
          descricao?: string | null
          id?: string
          id_os?: string
          id_tecnico?: string
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agenda_reservas_id_os_fkey"
            columns: ["id_os"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_reservas_id_tecnico_fkey"
            columns: ["id_tecnico"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          created_at: string | null
          email: string | null
          endereco: string | null
          id: string
          id_dinamics: string | null
          nome: string
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          id_dinamics?: string | null
          nome: string
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          id_dinamics?: string | null
          nome?: string
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      fluxo_status: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          id: string
          id_os: string
          status_anterior: Database["public"]["Enums"]["status_os"] | null
          status_novo: Database["public"]["Enums"]["status_os"]
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          id_os: string
          status_anterior?: Database["public"]["Enums"]["status_os"] | null
          status_novo: Database["public"]["Enums"]["status_os"]
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          id_os?: string
          status_anterior?: Database["public"]["Enums"]["status_os"] | null
          status_novo?: Database["public"]["Enums"]["status_os"]
        }
        Relationships: [
          {
            foreignKeyName: "fluxo_status_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fluxo_status_id_os_fkey"
            columns: ["id_os"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      fotos_os: {
        Row: {
          descricao: string | null
          id: string
          id_os: string
          uploaded_at: string | null
          uploaded_by: string | null
          url: string
        }
        Insert: {
          descricao?: string | null
          id?: string
          id_os: string
          uploaded_at?: string | null
          uploaded_by?: string | null
          url: string
        }
        Update: {
          descricao?: string | null
          id?: string
          id_os?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "fotos_os_id_os_fkey"
            columns: ["id_os"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fotos_os_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_os: {
        Row: {
          created_at: string | null
          id: string
          id_os: string
          id_produto: string
          quantidade: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          id_os: string
          id_produto: string
          quantidade?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          id_os?: string
          id_produto?: string
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "itens_os_id_os_fkey"
            columns: ["id_os"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_os_id_produto_fkey"
            columns: ["id_produto"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      ordens_servico: {
        Row: {
          condicao_pagamento:
            | Database["public"]["Enums"]["condicao_pagamento"]
            | null
          created_at: string | null
          created_by: string | null
          data_fim_execucao: string | null
          data_inicio_execucao: string | null
          id: string
          id_cliente: string
          id_dinamics_os: string | null
          id_tecnico_principal: string | null
          laudo: string | null
          motivo_cancelamento: string | null
          numero: string
          origem: Database["public"]["Enums"]["origem_os"]
          prazo: string | null
          prioridade: Database["public"]["Enums"]["prioridade"] | null
          situacao_garantia: Database["public"]["Enums"]["situacao_garantia"]
          status_atual: Database["public"]["Enums"]["status_os"]
          updated_at: string | null
        }
        Insert: {
          condicao_pagamento?:
            | Database["public"]["Enums"]["condicao_pagamento"]
            | null
          created_at?: string | null
          created_by?: string | null
          data_fim_execucao?: string | null
          data_inicio_execucao?: string | null
          id?: string
          id_cliente: string
          id_dinamics_os?: string | null
          id_tecnico_principal?: string | null
          laudo?: string | null
          motivo_cancelamento?: string | null
          numero: string
          origem: Database["public"]["Enums"]["origem_os"]
          prazo?: string | null
          prioridade?: Database["public"]["Enums"]["prioridade"] | null
          situacao_garantia: Database["public"]["Enums"]["situacao_garantia"]
          status_atual?: Database["public"]["Enums"]["status_os"]
          updated_at?: string | null
        }
        Update: {
          condicao_pagamento?:
            | Database["public"]["Enums"]["condicao_pagamento"]
            | null
          created_at?: string | null
          created_by?: string | null
          data_fim_execucao?: string | null
          data_inicio_execucao?: string | null
          id?: string
          id_cliente?: string
          id_dinamics_os?: string | null
          id_tecnico_principal?: string | null
          laudo?: string | null
          motivo_cancelamento?: string | null
          numero?: string
          origem?: Database["public"]["Enums"]["origem_os"]
          prazo?: string | null
          prioridade?: Database["public"]["Enums"]["prioridade"] | null
          situacao_garantia?: Database["public"]["Enums"]["situacao_garantia"]
          status_atual?: Database["public"]["Enums"]["status_os"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ordens_servico_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_id_cliente_fkey"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_id_tecnico_principal_fkey"
            columns: ["id_tecnico_principal"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          codigo: string
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          codigo: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          codigo?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          nome: string
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          nome: string
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          id_dinamics: string | null
          role: Database["public"]["Enums"]["app_role"]
          substatus_operador: string | null
          user_id: string
        }
        Insert: {
          id?: string
          id_dinamics?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          substatus_operador?: string | null
          user_id: string
        }
        Update: {
          id?: string
          id_dinamics?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          substatus_operador?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "operador"
      condicao_pagamento: "a_vista" | "parcelado" | "boleto" | "cartao"
      origem_os: "oficina" | "campo"
      prioridade: "baixa" | "media" | "alta"
      situacao_garantia: "garantia" | "fora_garantia"
      status_os:
        | "aberta"
        | "designada"
        | "em_diagnostico"
        | "aguardando_aprovacao"
        | "aguardando_pecas"
        | "em_execucao"
        | "finalizada"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "operador"],
      condicao_pagamento: ["a_vista", "parcelado", "boleto", "cartao"],
      origem_os: ["oficina", "campo"],
      prioridade: ["baixa", "media", "alta"],
      situacao_garantia: ["garantia", "fora_garantia"],
      status_os: [
        "aberta",
        "designada",
        "em_diagnostico",
        "aguardando_aprovacao",
        "aguardando_pecas",
        "em_execucao",
        "finalizada",
      ],
    },
  },
} as const

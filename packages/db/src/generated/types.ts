export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          account_type_id: string | null
          breached_at: string | null
          created_at: string
          current_balance: number
          current_pnl: number
          current_position_contracts: number
          deleted_at: string | null
          funded_at: string | null
          highest_balance: number
          id: string
          last_updated_at: string
          nickname: string
          open_pnl: number
          prop_firm_id: string | null
          rules_config: Json
          starting_balance: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_type_id?: string | null
          breached_at?: string | null
          created_at?: string
          current_balance: number
          current_pnl?: number
          current_position_contracts?: number
          deleted_at?: string | null
          funded_at?: string | null
          highest_balance: number
          id?: string
          last_updated_at?: string
          nickname: string
          open_pnl?: number
          prop_firm_id?: string | null
          rules_config: Json
          starting_balance: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_type_id?: string | null
          breached_at?: string | null
          created_at?: string
          current_balance?: number
          current_pnl?: number
          current_position_contracts?: number
          deleted_at?: string | null
          funded_at?: string | null
          highest_balance?: number
          id?: string
          last_updated_at?: string
          nickname?: string
          open_pnl?: number
          prop_firm_id?: string | null
          rules_config?: Json
          starting_balance?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_account_type_id_fkey"
            columns: ["account_type_id"]
            isOneToOne: false
            referencedRelation: "prop_firm_account_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_prop_firm_id_fkey"
            columns: ["prop_firm_id"]
            isOneToOne: false
            referencedRelation: "prop_firms"
            referencedColumns: ["id"]
          },
        ]
      }
      chart_layouts: {
        Row: {
          content: Json
          created_at: string
          id: string
          is_default: boolean
          name: string
          resolution: string
          symbol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: Json
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          resolution: string
          symbol: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          resolution?: string
          symbol?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      checklist_items: {
        Row: {
          checklist_id: string
          created_at: string
          display_order: number
          id: string
          input_type: string
          is_required: boolean
          prompt: string
          user_id: string
        }
        Insert: {
          checklist_id: string
          created_at?: string
          display_order?: number
          id?: string
          input_type?: string
          is_required?: boolean
          prompt: string
          user_id: string
        }
        Update: {
          checklist_id?: string
          created_at?: string
          display_order?: number
          id?: string
          input_type?: string
          is_required?: boolean
          prompt?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_runs: {
        Row: {
          account_id: string | null
          checklist_id: string
          created_at: string
          id: string
          is_complete: boolean
          responses: Json
          trading_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          checklist_id: string
          created_at?: string
          id?: string
          is_complete?: boolean
          responses: Json
          trading_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          checklist_id?: string
          created_at?: string
          id?: string
          is_complete?: boolean
          responses?: Json
          trading_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_runs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_runs_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      checklists: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_default: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_default?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      economic_events: {
        Row: {
          actual: number | null
          country: string
          currency: string | null
          external_id: string
          fetched_at: string
          forecast: number | null
          id: string
          impact: string
          name: string
          previous: number | null
          scheduled_for: string
          source: string
          unit: string | null
        }
        Insert: {
          actual?: number | null
          country: string
          currency?: string | null
          external_id: string
          fetched_at?: string
          forecast?: number | null
          id?: string
          impact: string
          name: string
          previous?: number | null
          scheduled_for: string
          source: string
          unit?: string | null
        }
        Update: {
          actual?: number | null
          country?: string
          currency?: string | null
          external_id?: string
          fetched_at?: string
          forecast?: number | null
          id?: string
          impact?: string
          name?: string
          previous?: number | null
          scheduled_for?: string
          source?: string
          unit?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string
          id: string
          onboarded_at: string | null
          theme: string
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          onboarded_at?: string | null
          theme?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          onboarded_at?: string | null
          theme?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      prop_firm_account_types: {
        Row: {
          consistency_rule_pct: number | null
          created_at: string
          daily_loss_limit: number | null
          id: string
          max_contracts: number | null
          name: string
          profit_target: number | null
          prop_firm_id: string
          rules_doc_url: string | null
          rules_version: string
          slug: string
          starting_balance: number
          static_max_loss: number | null
          trailing_drawdown: number | null
        }
        Insert: {
          consistency_rule_pct?: number | null
          created_at?: string
          daily_loss_limit?: number | null
          id?: string
          max_contracts?: number | null
          name: string
          profit_target?: number | null
          prop_firm_id: string
          rules_doc_url?: string | null
          rules_version?: string
          slug: string
          starting_balance: number
          static_max_loss?: number | null
          trailing_drawdown?: number | null
        }
        Update: {
          consistency_rule_pct?: number | null
          created_at?: string
          daily_loss_limit?: number | null
          id?: string
          max_contracts?: number | null
          name?: string
          profit_target?: number | null
          prop_firm_id?: string
          rules_doc_url?: string | null
          rules_version?: string
          slug?: string
          starting_balance?: number
          static_max_loss?: number | null
          trailing_drawdown?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prop_firm_account_types_prop_firm_id_fkey"
            columns: ["prop_firm_id"]
            isOneToOne: false
            referencedRelation: "prop_firms"
            referencedColumns: ["id"]
          },
        ]
      }
      prop_firms: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          slug: string
          website: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          slug: string
          website?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          slug?: string
          website?: string | null
        }
        Relationships: []
      }
      trade_screenshots: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          storage_path: string
          trade_id: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          storage_path: string
          trade_id: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          storage_path?: string
          trade_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_screenshots_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          account_id: string
          contracts: number
          created_at: string
          deleted_at: string | null
          direction: string
          emotional_state: string | null
          entry_at: string
          entry_price: number
          exit_at: string | null
          exit_price: number | null
          external_id: string | null
          fees: number
          id: string
          notes: string | null
          pnl: number | null
          setup_tag: string | null
          source: string
          symbol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          contracts: number
          created_at?: string
          deleted_at?: string | null
          direction: string
          emotional_state?: string | null
          entry_at: string
          entry_price: number
          exit_at?: string | null
          exit_price?: number | null
          external_id?: string | null
          fees?: number
          id?: string
          notes?: string | null
          pnl?: number | null
          setup_tag?: string | null
          source?: string
          symbol: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          contracts?: number
          created_at?: string
          deleted_at?: string | null
          direction?: string
          emotional_state?: string | null
          entry_at?: string
          entry_price?: number
          exit_at?: string | null
          exit_price?: number | null
          external_id?: string | null
          fees?: number
          id?: string
          notes?: string | null
          pnl?: number | null
          setup_tag?: string | null
          source?: string
          symbol?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          alert_threshold_danger_pct: number
          alert_threshold_warning_pct: number
          created_at: string
          default_account_id: string | null
          default_resolution: string
          default_symbol: string
          density: string
          email_notifications_enabled: boolean
          realtime_alerts_enabled: boolean
          reduced_motion: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_threshold_danger_pct?: number
          alert_threshold_warning_pct?: number
          created_at?: string
          default_account_id?: string | null
          default_resolution?: string
          default_symbol?: string
          density?: string
          email_notifications_enabled?: boolean
          realtime_alerts_enabled?: boolean
          reduced_motion?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_threshold_danger_pct?: number
          alert_threshold_warning_pct?: number
          created_at?: string
          default_account_id?: string | null
          default_resolution?: string
          default_symbol?: string
          density?: string
          email_notifications_enabled?: boolean
          realtime_alerts_enabled?: boolean
          reduced_motion?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_default_account_id_fkey"
            columns: ["default_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const


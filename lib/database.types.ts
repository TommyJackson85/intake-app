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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      aml_checks: {
        Row: {
          check_status: string | null
          check_type: string
          client_id: string | null
          created_at: string | null
          created_by_user_id: string | null
          firm_id: string
          has_high_risk_jurisdiction: boolean | null
          has_pep_flag: boolean | null
          has_sanctions_flag: boolean | null
          id: string
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          check_status?: string | null
          check_type: string
          client_id?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          firm_id: string
          has_high_risk_jurisdiction?: boolean | null
          has_pep_flag?: boolean | null
          has_sanctions_flag?: boolean | null
          id?: string
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          check_status?: string | null
          check_type?: string
          client_id?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          firm_id?: string
          has_high_risk_jurisdiction?: boolean | null
          has_pep_flag?: boolean | null
          has_sanctions_flag?: boolean | null
          id?: string
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aml_checks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aml_checks_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          created_at: string | null
          description: string | null
          event_type: string
          firm_id: string | null
          id: string
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_type: string
          firm_id?: string | null
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_type?: string
          firm_id?: string | null
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          beneficial_owner_name: string | null
          beneficial_owner_relationship: string | null
          city: string | null
          created_at: string | null
          created_by_user_id: string | null
          email: string
          firm_id: string
          full_name: string
          id: string
          is_pep: boolean | null
          kyc_status: string | null
          phone: string | null
          risk_assessment: string | null
          state: string | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          beneficial_owner_name?: string | null
          beneficial_owner_relationship?: string | null
          city?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          email: string
          firm_id: string
          full_name: string
          id?: string
          is_pep?: boolean | null
          kyc_status?: string | null
          phone?: string | null
          risk_assessment?: string | null
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          beneficial_owner_name?: string | null
          beneficial_owner_relationship?: string | null
          city?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          email?: string
          firm_id?: string
          full_name?: string
          id?: string
          is_pep?: boolean | null
          kyc_status?: string | null
          phone?: string | null
          risk_assessment?: string | null
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      firms: {
        Row: {
          created_at: string | null
          email_contact: string | null
          id: string
          is_demo_firm: boolean
          is_test_firm: boolean
          name: string
          state: string
        }
        Insert: {
          created_at?: string | null
          email_contact?: string | null
          id?: string
          is_demo_firm?: boolean
          is_test_firm?: boolean
          name: string
          state: string
        }
        Update: {
          created_at?: string | null
          email_contact?: string | null
          id?: string
          is_demo_firm?: boolean
          is_test_firm?: boolean
          name?: string
          state?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          assigned_to_user_id: string | null
          client_email: string
          client_full_name: string | null
          client_phone: string | null
          created_at: string
          firm_id: string
          id: string
          intake_data: Json
          last_client_activity_at: string | null
          matter_type: string
          notes: string | null
          portal_token_created_at: string | null
          portal_token_hash: string | null
          property_address: string | null
          status: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          assigned_to_user_id?: string | null
          client_email: string
          client_full_name?: string | null
          client_phone?: string | null
          created_at?: string
          firm_id: string
          id?: string
          intake_data?: Json
          last_client_activity_at?: string | null
          matter_type: string
          notes?: string | null
          portal_token_created_at?: string | null
          portal_token_hash?: string | null
          property_address?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to_user_id?: string | null
          client_email?: string
          client_full_name?: string | null
          client_phone?: string | null
          created_at?: string
          firm_id?: string
          id?: string
          intake_data?: Json
          last_client_activity_at?: string | null
          matter_type?: string
          notes?: string | null
          portal_token_created_at?: string | null
          portal_token_hash?: string | null
          property_address?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_user_id_fkey"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      impersonation_sessions: {
        Row: {
          id: string
          impersonator_user_id: string
          impersonated_user_id: string
          started_at: string
          ended_at: string | null
          reason: string | null
          env: 'development' | 'staging' | 'production'
          metadata: Json
        }
        Insert: {
          id?: string
          impersonator_user_id: string
          impersonated_user_id: string
          started_at?: string
          ended_at?: string | null
          reason?: string | null
          env?: 'development' | 'staging' | 'production'
          metadata?: Json
        }
        Update: {
          id?: string
          impersonator_user_id?: string
          impersonated_user_id?: string
          started_at?: string
          ended_at?: string | null
          reason?: string | null
          env?: 'development' | 'staging' | 'production'
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "impersonation_sessions_impersonator_user_id_fkey"
            columns: ["impersonator_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "impersonation_sessions_impersonated_user_id_fkey"
            columns: ["impersonated_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_leads: {
        Row: {
          created_at: string | null
          email: string
          firm_name: string | null
          id: string
          ip_address: unknown
          state: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          firm_name?: string | null
          id?: string
          ip_address?: unknown
          state?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          firm_name?: string | null
          id?: string
          ip_address?: unknown
          state?: string | null
        }
        Relationships: []
      }
      matters: {
        Row: {
          client_id: string
          closed_at: string | null
          counterparty_name: string | null
          created_at: string | null
          created_by_user_id: string | null
          deal_size_usd: number | null
          deletion_due_date: string | null
          expected_closing_date: string | null
          firm_id: string
          id: string
          matter_type: string
          opened_at: string | null
          property_address: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          closed_at?: string | null
          counterparty_name?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          deal_size_usd?: number | null
          deletion_due_date?: string | null
          expected_closing_date?: string | null
          firm_id: string
          id?: string
          matter_type: string
          opened_at?: string | null
          property_address?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          closed_at?: string | null
          counterparty_name?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          deal_size_usd?: number | null
          deletion_due_date?: string | null
          expected_closing_date?: string | null
          firm_id?: string
          id?: string
          matter_type?: string
          opened_at?: string | null
          property_address?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matters_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matters_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          citizenship_country: string | null
          client_id: string | null
          created_at: string | null
          deleted_at: string | null
          email: string | null
          firm_id: string | null
          full_name: string | null
          id: string
          is_deleted: boolean | null
          is_demo_guest: boolean
          is_dev_sudo: boolean
          is_us_citizen_or_resident: boolean | null
          phone: string | null
          privacy_accepted_at: string | null
          role: string | null
          terms_accepted_at: string | null
          terms_version: string | null
        }
        Insert: {
          citizenship_country?: string | null
          client_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          firm_id?: string | null
          full_name?: string | null
          id: string
          is_deleted?: boolean | null
          is_demo_guest?: boolean
          is_dev_sudo?: boolean
          is_us_citizen_or_resident?: boolean | null
          phone?: string | null
          privacy_accepted_at?: string | null
          role?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
        }
        Update: {
          citizenship_country?: string | null
          client_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          firm_id?: string | null
          full_name?: string | null
          id?: string
          is_deleted?: boolean | null
          is_demo_guest?: boolean
          is_dev_sudo?: boolean
          is_us_citizen_or_resident?: boolean | null
          phone?: string | null
          privacy_accepted_at?: string | null
          role?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          ip_address: unknown
          is_valid: boolean
          last_activity: string
          token_hash: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: unknown
          is_valid?: boolean
          last_activity?: string
          token_hash: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown
          is_valid?: boolean
          last_activity?: string
          token_hash?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_or_get_demo_firm: { Args: never; Returns: string }
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
  public: {
    Enums: {},
  },
} as const

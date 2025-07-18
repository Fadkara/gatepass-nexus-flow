export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      assets: {
        Row: {
          asset_id: string
          asset_type: string
          brand: string | null
          created_at: string
          current_location: string | null
          id: string
          model: string | null
          purchase_date: string | null
          serial_number: string
          status: string | null
          updated_at: string
          warranty_expiry: string | null
        }
        Insert: {
          asset_id: string
          asset_type: string
          brand?: string | null
          created_at?: string
          current_location?: string | null
          id?: string
          model?: string | null
          purchase_date?: string | null
          serial_number: string
          status?: string | null
          updated_at?: string
          warranty_expiry?: string | null
        }
        Update: {
          asset_id?: string
          asset_type?: string
          brand?: string | null
          created_at?: string
          current_location?: string | null
          id?: string
          model?: string | null
          purchase_date?: string | null
          serial_number?: string
          status?: string | null
          updated_at?: string
          warranty_expiry?: string | null
        }
        Relationships: []
      }
      communications: {
        Row: {
          communication_type: string | null
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          priority: string | null
          read_at: string | null
          recipient_department: string | null
          recipient_id: string | null
          recipient_type: string | null
          sender_id: string
          subject: string
          updated_at: string
        }
        Insert: {
          communication_type?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          priority?: string | null
          read_at?: string | null
          recipient_department?: string | null
          recipient_id?: string | null
          recipient_type?: string | null
          sender_id: string
          subject: string
          updated_at?: string
        }
        Update: {
          communication_type?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          priority?: string | null
          read_at?: string | null
          recipient_department?: string | null
          recipient_id?: string | null
          recipient_type?: string | null
          sender_id?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_assets: {
        Row: {
          asset_id: string
          assigned_by: string | null
          assigned_date: string
          created_at: string
          employee_id: string
          id: string
          is_active: boolean | null
          notes: string | null
          returned_date: string | null
          updated_at: string
        }
        Insert: {
          asset_id: string
          assigned_by?: string | null
          assigned_date?: string
          created_at?: string
          employee_id: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          returned_date?: string | null
          updated_at?: string
        }
        Update: {
          asset_id?: string
          assigned_by?: string | null
          assigned_date?: string
          created_at?: string
          employee_id?: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          returned_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_assets_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_assets_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string
          department: string
          employee_id: string
          face_encoding: string | null
          hire_date: string | null
          id: string
          is_active: boolean | null
          position: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department: string
          employee_id: string
          face_encoding?: string | null
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          position?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string
          employee_id?: string
          face_encoding?: string | null
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          position?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gatepasses: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          department: string
          exit_time: string
          exited_at: string | null
          gatepass_id: string
          id: string
          items_carried: string | null
          reason: string
          requester_id: string
          requester_name: string
          status: Database["public"]["Enums"]["gatepass_status"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          department: string
          exit_time: string
          exited_at?: string | null
          gatepass_id: string
          id?: string
          items_carried?: string | null
          reason: string
          requester_id: string
          requester_name: string
          status?: Database["public"]["Enums"]["gatepass_status"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          department?: string
          exit_time?: string
          exited_at?: string | null
          gatepass_id?: string
          id?: string
          items_carried?: string | null
          reason?: string
          requester_id?: string
          requester_name?: string
          status?: Database["public"]["Enums"]["gatepass_status"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          department: string
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department: string
          email: string
          full_name: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string
          email?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          department: string | null
          full_name: string
          id: string
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          full_name: string
          id: string
        }
        Update: {
          created_at?: string | null
          department?: string | null
          full_name?: string
          id?: string
        }
        Relationships: []
      }
      visitors: {
        Row: {
          check_in_time: string | null
          check_out_time: string | null
          company: string | null
          created_at: string
          email: string | null
          expected_checkout: string | null
          face_encoding: string | null
          full_name: string
          host_employee_id: string | null
          id: string
          phone: string | null
          purpose_of_visit: string
          status: string | null
          updated_at: string
          visitor_id: string
        }
        Insert: {
          check_in_time?: string | null
          check_out_time?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          expected_checkout?: string | null
          face_encoding?: string | null
          full_name: string
          host_employee_id?: string | null
          id?: string
          phone?: string | null
          purpose_of_visit: string
          status?: string | null
          updated_at?: string
          visitor_id: string
        }
        Update: {
          check_in_time?: string | null
          check_out_time?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          expected_checkout?: string | null
          face_encoding?: string | null
          full_name?: string
          host_employee_id?: string | null
          id?: string
          phone?: string | null
          purpose_of_visit?: string
          status?: string | null
          updated_at?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visitors_host_employee_id_fkey"
            columns: ["host_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_asset_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_employee_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_gatepass_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_visitor_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
    }
    Enums: {
      app_role: "admin" | "security_officer" | "staff"
      gatepass_status: "pending" | "approved" | "rejected" | "issued" | "exited"
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
      app_role: ["admin", "security_officer", "staff"],
      gatepass_status: ["pending", "approved", "rejected", "issued", "exited"],
    },
  },
} as const

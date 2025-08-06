// run the following command to generate the types
// COPY THIS COMMENT FIRST AS IT WILL BE ERASED BY THE COMMAND
// supabase gen types typescript --project-id idwtzqkrzbdwrijwlduz > supabase_SQL/database.types.ts
// project id is found in the supabase project settings

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
      events: {
        Row: {
          category: string | null
          created_at: string | null
          error_message: string | null
          id: string
          is_dev: boolean | null
          is_error: boolean | null
          name: string
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          is_dev?: boolean | null
          is_error?: boolean | null
          name: string
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          is_dev?: boolean | null
          is_error?: boolean | null
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          billing_cycle: string | null
          created_at: string | null
          current_period_end: string | null
          email: string | null
          full_name: string | null
          id: string
          last_payment_date: string | null
          payment_status: string | null
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          subscription_cancel_at_period_end: boolean | null
          subscription_created_at: string | null
          subscription_status: string | null
          subscription_tier: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          billing_cycle?: string | null
          created_at?: string | null
          current_period_end?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          last_payment_date?: string | null
          payment_status?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          subscription_cancel_at_period_end?: boolean | null
          subscription_created_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          billing_cycle?: string | null
          created_at?: string | null
          current_period_end?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          last_payment_date?: string | null
          payment_status?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          subscription_cancel_at_period_end?: boolean | null
          subscription_created_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      resume_tailoring_history: {
        Row: {
          applied_with_this_version: boolean | null
          company_name: string | null
          cover_letter_content: string | null
          created_at: string | null
          custom_answers: Json | null
          generation_options: Json | null
          id: string
          job_description: string
          job_title: string | null
          job_url: string | null
          llm_provider: string
          model_used: string
          notes: string | null
          original_resume_content: string | null
          original_resume_id: string | null
          prompt_version: string | null
          standard_answers: Json | null
          status: string | null
          tailored_resume_content: string
          tailoring_date: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          applied_with_this_version?: boolean | null
          company_name?: string | null
          cover_letter_content?: string | null
          created_at?: string | null
          custom_answers?: Json | null
          generation_options?: Json | null
          id?: string
          job_description: string
          job_title?: string | null
          job_url?: string | null
          llm_provider: string
          model_used: string
          notes?: string | null
          original_resume_content?: string | null
          original_resume_id?: string | null
          prompt_version?: string | null
          standard_answers?: Json | null
          status?: string | null
          tailored_resume_content: string
          tailoring_date?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          applied_with_this_version?: boolean | null
          company_name?: string | null
          cover_letter_content?: string | null
          created_at?: string | null
          custom_answers?: Json | null
          generation_options?: Json | null
          id?: string
          job_description?: string
          job_title?: string | null
          job_url?: string | null
          llm_provider?: string
          model_used?: string
          notes?: string | null
          original_resume_content?: string | null
          original_resume_id?: string | null
          prompt_version?: string | null
          standard_answers?: Json | null
          status?: string | null
          tailored_resume_content?: string
          tailoring_date?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resume_tailoring_history_original_resume_id_fkey"
            columns: ["original_resume_id"]
            isOneToOne: false
            referencedRelation: "user_resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_credits: {
        Row: {
          created_at: string | null
          id: string
          last_reset_date: string | null
          remaining_credits: number | null
          subscription_type: string | null
          total_credits: number
          updated_at: string | null
          used_credits: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_reset_date?: string | null
          remaining_credits?: number | null
          subscription_type?: string | null
          total_credits?: number
          updated_at?: string | null
          used_credits?: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_reset_date?: string | null
          remaining_credits?: number | null
          subscription_type?: string | null
          total_credits?: number
          updated_at?: string | null
          used_credits?: number
          user_id?: string
        }
        Relationships: []
      }
      user_resumes: {
        Row: {
          created_at: string | null
          id: string
          is_primary: boolean | null
          latex_content: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          latex_content: string
          title?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          latex_content?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      resume_tailoring_summary: {
        Row: {
          applied_versions: number | null
          first_tailoring_date: string | null
          interviews: number | null
          last_tailoring_date: string | null
          offers: number | null
          rejections: number | null
          total_tailorings: number | null
          user_id: string | null
          withdrawals: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      deduct_user_credit: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      get_user_tailoring_stats: {
        Args: { p_user_id: string }
        Returns: {
          total_tailorings: number
          tailorings_this_month: number
          applied_versions: number
          interviews: number
          offers: number
          success_rate: number
        }[]
      }
      set_primary_resume: {
        Args: { p_user_id: string; p_resume_id: string }
        Returns: boolean
      }
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

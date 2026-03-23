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
      application_forms: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          lecture_id: string
          speaker_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          lecture_id: string
          speaker_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          lecture_id?: string
          speaker_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_forms_lecture_id_fkey"
            columns: ["lecture_id"]
            isOneToOne: false
            referencedRelation: "lectures"
            referencedColumns: ["id"]
          },
        ]
      }
      form_questions: {
        Row: {
          created_at: string
          form_id: string
          has_other: boolean
          id: string
          is_required: boolean
          options: Json | null
          order_index: number
          question_text: string
          question_type: Database["public"]["Enums"]["question_type"]
        }
        Insert: {
          created_at?: string
          form_id: string
          has_other?: boolean
          id?: string
          is_required?: boolean
          options?: Json | null
          order_index?: number
          question_text: string
          question_type?: Database["public"]["Enums"]["question_type"]
        }
        Update: {
          created_at?: string
          form_id?: string
          has_other?: boolean
          id?: string
          is_required?: boolean
          options?: Json | null
          order_index?: number
          question_text?: string
          question_type?: Database["public"]["Enums"]["question_type"]
        }
        Relationships: [
          {
            foreignKeyName: "form_questions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "application_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      form_responses: {
        Row: {
          answers: Json
          applicant_email: string
          applicant_name: string
          created_at: string
          form_id: string
          id: string
          license_number: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          answers?: Json
          applicant_email: string
          applicant_name: string
          created_at?: string
          form_id: string
          id?: string
          license_number?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          answers?: Json
          applicant_email?: string
          applicant_name?: string
          created_at?: string
          form_id?: string
          id?: string
          license_number?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_responses_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "application_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      lecture_materials: {
        Row: {
          created_at: string
          file_name: string
          file_url: string
          id: string
          is_published: boolean
          lecture_id: string
          order_index: number
          speaker_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_url: string
          id?: string
          is_published?: boolean
          lecture_id: string
          order_index?: number
          speaker_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_url?: string
          id?: string
          is_published?: boolean
          lecture_id?: string
          order_index?: number
          speaker_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lecture_materials_lecture_id_fkey"
            columns: ["lecture_id"]
            isOneToOne: false
            referencedRelation: "lectures"
            referencedColumns: ["id"]
          },
        ]
      }
      lecture_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          lecture_id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          lecture_id: string
          student_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          lecture_id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lecture_notes_lecture_id_fkey"
            columns: ["lecture_id"]
            isOneToOne: false
            referencedRelation: "lectures"
            referencedColumns: ["id"]
          },
        ]
      }
      lecture_questions: {
        Row: {
          answered_at: string | null
          answered_by: string | null
          created_at: string
          id: string
          is_answered: boolean
          lecture_id: string
          question_text: string
          student_id: string
          student_name: string
        }
        Insert: {
          answered_at?: string | null
          answered_by?: string | null
          created_at?: string
          id?: string
          is_answered?: boolean
          lecture_id: string
          question_text: string
          student_id: string
          student_name: string
        }
        Update: {
          answered_at?: string | null
          answered_by?: string | null
          created_at?: string
          id?: string
          is_answered?: boolean
          lecture_id?: string
          question_text?: string
          student_id?: string
          student_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "lecture_questions_lecture_id_fkey"
            columns: ["lecture_id"]
            isOneToOne: false
            referencedRelation: "lectures"
            referencedColumns: ["id"]
          },
        ]
      }
      lectures: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          pdf_url: string | null
          speaker_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          pdf_url?: string | null
          speaker_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          pdf_url?: string | null
          speaker_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          license_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          license_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          license_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      security_logs: {
        Row: {
          created_at: string
          event_type: string
          id: string
          ip_address: string | null
          lecture_id: string | null
          lecture_title: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          ip_address?: string | null
          lecture_id?: string | null
          lecture_title?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          lecture_id?: string | null
          lecture_title?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_logs_lecture_id_fkey"
            columns: ["lecture_id"]
            isOneToOne: false
            referencedRelation: "lectures"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_lecture_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          id: string
          lecture_id: string
          staff_user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          id?: string
          lecture_id: string
          staff_user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          id?: string
          lecture_id?: string
          staff_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_lecture_assignments_lecture_id_fkey"
            columns: ["lecture_id"]
            isOneToOne: false
            referencedRelation: "lectures"
            referencedColumns: ["id"]
          },
        ]
      }
      student_drawings: {
        Row: {
          created_at: string
          drawing_data: Json
          id: string
          lecture_id: string
          material_id: string
          page_number: number
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          drawing_data?: Json
          id?: string
          lecture_id: string
          material_id: string
          page_number?: number
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          drawing_data?: Json
          id?: string
          lecture_id?: string
          material_id?: string
          page_number?: number
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_drawings_lecture_id_fkey"
            columns: ["lecture_id"]
            isOneToOne: false
            referencedRelation: "lectures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_drawings_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "lecture_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whitelist: {
        Row: {
          admin_memo: string | null
          business_registration: boolean
          certificate_sent: boolean
          created_at: string
          email: string
          form_response_id: string | null
          id: string
          invoice_issued: boolean
          is_new_student: boolean
          is_registered: boolean
          lecture_id: string
          license_number: string | null
          payment_confirmed: boolean
          phone_number: string | null
          speaker_id: string
          student_name: string | null
          survey_completed: boolean
        }
        Insert: {
          admin_memo?: string | null
          business_registration?: boolean
          certificate_sent?: boolean
          created_at?: string
          email: string
          form_response_id?: string | null
          id?: string
          invoice_issued?: boolean
          is_new_student?: boolean
          is_registered?: boolean
          lecture_id: string
          license_number?: string | null
          payment_confirmed?: boolean
          phone_number?: string | null
          speaker_id: string
          student_name?: string | null
          survey_completed?: boolean
        }
        Update: {
          admin_memo?: string | null
          business_registration?: boolean
          certificate_sent?: boolean
          created_at?: string
          email?: string
          form_response_id?: string | null
          id?: string
          invoice_issued?: boolean
          is_new_student?: boolean
          is_registered?: boolean
          lecture_id?: string
          license_number?: string | null
          payment_confirmed?: boolean
          phone_number?: string | null
          speaker_id?: string
          student_name?: string | null
          survey_completed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "whitelist_form_response_id_fkey"
            columns: ["form_response_id"]
            isOneToOne: false
            referencedRelation: "form_responses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whitelist_lecture_id_fkey"
            columns: ["lecture_id"]
            isOneToOne: false
            referencedRelation: "lectures"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_whitelist_email: {
        Args: { _email: string }
        Returns: {
          exists_in_whitelist: boolean
          lecture_id: string
          speaker_id: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_role: { Args: { _user_id: string }; Returns: boolean }
      is_valid_whitelist_submission: {
        Args: {
          _form_response_id: string
          _lecture_id: string
          _speaker_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "master" | "speaker" | "student" | "staff"
      question_type:
        | "multiple_choice"
        | "short_answer"
        | "long_answer"
        | "description"
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
      app_role: ["master", "speaker", "student", "staff"],
      question_type: [
        "multiple_choice",
        "short_answer",
        "long_answer",
        "description",
      ],
    },
  },
} as const

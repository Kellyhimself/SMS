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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          created_at: string | null
          date: string
          id: string
          recorded_by: string | null
          remarks: string | null
          school_id: string | null
          status: string
          student_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          recorded_by?: string | null
          remarks?: string | null
          school_id?: string | null
          status: string
          student_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          recorded_by?: string | null
          remarks?: string | null
          school_id?: string | null
          status?: string
          student_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "attendance_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "parent_dashboard"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_webhook_logs: {
        Row: {
          bank_type: string
          created_at: string | null
          error_message: string | null
          id: string
          processed_at: string | null
          school_id: string
          status: string
          updated_at: string | null
          webhook_data: Json
        }
        Insert: {
          bank_type: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          processed_at?: string | null
          school_id: string
          status: string
          updated_at?: string | null
          webhook_data: Json
        }
        Update: {
          bank_type?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          processed_at?: string | null
          school_id?: string
          status?: string
          updated_at?: string | null
          webhook_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "bank_webhook_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_levels: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          school_id: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          school_id: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_levels_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          academic_year: string
          created_at: string
          date: string
          exam_type: string
          grade: string
          id: string
          passing_marks: number
          principal_remarks: string | null
          remarks: string | null
          school_id: string
          score: number
          student_id: string
          subject: string
          sync_status: string | null
          teacher_remarks: string | null
          term: string
          total_marks: number
          updated_at: string
        }
        Insert: {
          academic_year: string
          created_at?: string
          date: string
          exam_type?: string
          grade: string
          id?: string
          passing_marks: number
          principal_remarks?: string | null
          remarks?: string | null
          school_id: string
          score: number
          student_id: string
          subject: string
          sync_status?: string | null
          teacher_remarks?: string | null
          term: string
          total_marks: number
          updated_at?: string
        }
        Update: {
          academic_year?: string
          created_at?: string
          date?: string
          exam_type?: string
          grade?: string
          id?: string
          passing_marks?: number
          principal_remarks?: string | null
          remarks?: string | null
          school_id?: string
          score?: number
          student_id?: string
          subject?: string
          sync_status?: string | null
          teacher_remarks?: string | null
          term?: string
          total_marks?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "attendance_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "exams_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "parent_dashboard"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "exams_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_types: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          school_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          school_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          school_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_types_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      fees: {
        Row: {
          academic_year: string | null
          amount: number
          amount_paid: number | null
          created_at: string
          date: string
          description: string | null
          due_date: string | null
          fee_type: string | null
          id: string
          payment_date: string | null
          payment_details: Json | null
          payment_method: string | null
          payment_reference: string | null
          receipt_url: string | null
          school_id: string
          status: string
          student_admission_number: string | null
          student_id: string
          student_name: string | null
          sync_status: string | null
          term: string | null
          updated_at: string
        }
        Insert: {
          academic_year?: string | null
          amount: number
          amount_paid?: number | null
          created_at?: string
          date: string
          description?: string | null
          due_date?: string | null
          fee_type?: string | null
          id?: string
          payment_date?: string | null
          payment_details?: Json | null
          payment_method?: string | null
          payment_reference?: string | null
          receipt_url?: string | null
          school_id: string
          status: string
          student_admission_number?: string | null
          student_id: string
          student_name?: string | null
          sync_status?: string | null
          term?: string | null
          updated_at?: string
        }
        Update: {
          academic_year?: string | null
          amount?: number
          amount_paid?: number | null
          created_at?: string
          date?: string
          description?: string | null
          due_date?: string | null
          fee_type?: string | null
          id?: string
          payment_date?: string | null
          payment_details?: Json | null
          payment_method?: string | null
          payment_reference?: string | null
          receipt_url?: string | null
          school_id?: string
          status?: string
          student_admission_number?: string | null
          student_id?: string
          student_name?: string | null
          sync_status?: string | null
          term?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fees_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fees_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "attendance_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "fees_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "parent_dashboard"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "fees_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      installment_plans: {
        Row: {
          created_at: string | null
          end_date: string
          fee_id: string | null
          id: string
          installment_amount: number
          installment_count: number
          start_date: string
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_date: string
          fee_id?: string | null
          id?: string
          installment_amount: number
          installment_count: number
          start_date: string
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string
          fee_id?: string | null
          id?: string
          installment_amount?: number
          installment_count?: number
          start_date?: string
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "installment_plans_fee_id_fkey"
            columns: ["fee_id"]
            isOneToOne: false
            referencedRelation: "fees"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          message: string
          recipient_email: string | null
          recipient_phone: string | null
          school_id: string
          sent_at: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          message: string
          recipient_email?: string | null
          recipient_phone?: string | null
          school_id: string
          sent_at?: string | null
          status: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string
          recipient_email?: string | null
          recipient_phone?: string | null
          school_id?: string
          sent_at?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_codes: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          otp: string
          parent_id: string | null
          phone: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          otp: string
          parent_id?: string | null
          phone: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          otp?: string
          parent_id?: string | null
          phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "otp_codes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parent_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "otp_codes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parent_dashboard"
            referencedColumns: ["parent_id"]
          },
        ]
      }
      parent_accounts: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string
          school_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone: string
          school_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string
          school_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parent_accounts_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          parent_id: string | null
          phone: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id: string
          parent_id?: string | null
          phone: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          parent_id?: string | null
          phone?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parent_sessions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parent_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_sessions_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parent_dashboard"
            referencedColumns: ["parent_id"]
          },
        ]
      }
      parent_student_links: {
        Row: {
          created_at: string | null
          id: string
          is_primary: boolean | null
          parent_id: string | null
          relationship: string | null
          student_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          parent_id?: string | null
          relationship?: string | null
          student_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          parent_id?: string | null
          relationship?: string | null
          student_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parent_student_links_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parent_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_student_links_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parent_dashboard"
            referencedColumns: ["parent_id"]
          },
          {
            foreignKeyName: "parent_student_links_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "attendance_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "parent_student_links_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "parent_dashboard"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "parent_student_links_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_references: {
        Row: {
          amount: number
          bank_name: string | null
          bank_transaction_id: string | null
          created_at: string | null
          fee_id: string
          id: string
          payment_date: string | null
          payment_method: string | null
          reference: string
          school_id: string
          status: string
          student_admission_number: string
          student_name: string
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          bank_name?: string | null
          bank_transaction_id?: string | null
          created_at?: string | null
          fee_id: string
          id?: string
          payment_date?: string | null
          payment_method?: string | null
          reference: string
          school_id: string
          status: string
          student_admission_number: string
          student_name: string
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          bank_name?: string | null
          bank_transaction_id?: string | null
          created_at?: string | null
          fee_id?: string
          id?: string
          payment_date?: string | null
          payment_method?: string | null
          reference?: string
          school_id?: string
          status?: string
          student_admission_number?: string
          student_name?: string
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_references_fee_id_fkey"
            columns: ["fee_id"]
            isOneToOne: false
            referencedRelation: "fees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_references_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      report_cards: {
        Row: {
          academic_year: string
          average_marks: number
          class_position: number | null
          created_at: string
          exam_id: string | null
          grade: string
          id: string
          parent_signature: boolean | null
          principal_remarks: string | null
          school_id: string
          student_id: string | null
          teacher_remarks: string | null
          term: string
          total_marks: number
          updated_at: string
        }
        Insert: {
          academic_year: string
          average_marks: number
          class_position?: number | null
          created_at?: string
          exam_id?: string | null
          grade: string
          id?: string
          parent_signature?: boolean | null
          principal_remarks?: string | null
          school_id: string
          student_id?: string | null
          teacher_remarks?: string | null
          term: string
          total_marks: number
          updated_at?: string
        }
        Update: {
          academic_year?: string
          average_marks?: number
          class_position?: number | null
          created_at?: string
          exam_id?: string | null
          grade?: string
          id?: string
          parent_signature?: boolean | null
          principal_remarks?: string | null
          school_id?: string
          student_id?: string | null
          teacher_remarks?: string | null
          term?: string
          total_marks?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_cards_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_cards_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_cards_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "attendance_summary"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "report_cards_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "parent_dashboard"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "report_cards_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          bank_api_settings: Json | null
          created_at: string
          email: string
          id: string
          name: string
          payment_settings: Json | null
          phone: string | null
          subscription_plan: string
          updated_at: string
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          address?: string | null
          bank_api_settings?: Json | null
          created_at?: string
          email: string
          id?: string
          name: string
          payment_settings?: Json | null
          phone?: string | null
          subscription_plan: string
          updated_at?: string
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          address?: string | null
          bank_api_settings?: Json | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          payment_settings?: Json | null
          phone?: string | null
          subscription_plan?: string
          updated_at?: string
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schools_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          admission_number: string | null
          class: string
          created_at: string
          id: string
          name: string
          parent_email: string | null
          parent_phone: string
          school_id: string
          sync_status: string
          updated_at: string
        }
        Insert: {
          admission_number?: string | null
          class: string
          created_at?: string
          id?: string
          name: string
          parent_email?: string | null
          parent_phone: string
          school_id: string
          sync_status?: string
          updated_at?: string
        }
        Update: {
          admission_number?: string | null
          class?: string
          created_at?: string
          id?: string
          name?: string
          parent_email?: string | null
          parent_phone?: string
          school_id?: string
          sync_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string
          created_at: string
          id: string
          is_core: boolean | null
          level_id: string | null
          name: string
          school_id: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_core?: boolean | null
          level_id?: string | null
          name: string
          school_id: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_core?: boolean | null
          level_id?: string | null
          name?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "curriculum_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          role: string
          school_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name?: string
          role?: string
          school_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: string
          school_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      attendance_summary: {
        Row: {
          absent_count: number | null
          attendance_percentage: number | null
          class: string | null
          excused_count: number | null
          late_count: number | null
          present_count: number | null
          school_id: string | null
          student_id: string | null
          student_name: string | null
          total_days: number | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_cross_school_lookup: {
        Row: {
          parent_account_ids: string[] | null
          parent_names: string[] | null
          phone: string | null
          school_count: number | null
          school_ids: string[] | null
        }
        Relationships: []
      }
      parent_dashboard: {
        Row: {
          absent_days: number | null
          admission_number: string | null
          attendance_percentage: number | null
          class: string | null
          is_primary: boolean | null
          late_days: number | null
          outstanding_amount: number | null
          parent_email: string | null
          parent_id: string | null
          parent_name: string | null
          parent_phone: string | null
          present_days: number | null
          relationship: string | null
          student_id: string | null
          student_name: string | null
          total_attendance_days: number | null
          total_fee_amount: number | null
          total_fees: number | null
          total_paid_amount: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_or_create_parent_account: {
        Args: {
          p_phone: string
          p_school_id: string
          p_name?: string
          p_email?: string
        }
        Returns: string
      }
      link_parent_to_student_cross_school: {
        Args: {
          p_phone: string
          p_student_id: string
          p_relationship?: string
          p_is_primary?: boolean
        }
        Returns: string
      }
      sync_users_from_auth: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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

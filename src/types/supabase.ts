export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_sessions: {
        Row: {
          admin_id: string | null
          created_at: string
          expires_at: string
          id: string
          project_id: string | null
          session_token: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          expires_at: string
          id?: string
          project_id?: string | null
          session_token: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          project_id?: string | null
          session_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_sessions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      admins: {
        Row: {
          created_at: string
          email: string
          id: string
          password_hash: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          password_hash: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          password_hash?: string
        }
        Relationships: []
      }
      attendances: {
        Row: {
          created_at: string | null
          date: string
          employee_id: string | null
          id: string
          project_id: string | null
          status: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          employee_id?: string | null
          id?: string
          project_id?: string | null
          status?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          employee_id?: string | null
          id?: string
          project_id?: string | null
          status?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_project_fk"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_wages: {
        Row: {
          amount: number
          created_at: string | null
          date: string
          description: string | null
          employee_id: string | null
          id: string
          project_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          date: string
          description?: string | null
          employee_id?: string | null
          id?: string
          project_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          date?: string
          description?: string | null
          employee_id?: string | null
          id?: string
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_wages_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_wages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      deductions: {
        Row: {
          amount: number
          created_at: string | null
          date: string
          description: string | null
          employee_id: string | null
          id: string
          project_id: string | null
          type: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          date: string
          description?: string | null
          employee_id?: string | null
          id?: string
          project_id?: string | null
          type: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          date?: string
          description?: string | null
          employee_id?: string | null
          id?: string
          project_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "deductions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string | null
          daily_wage: number
          email: string | null
          hire_date: string | null
          id: string
          identity_number: string | null
          is_present: boolean | null
          monthly_attendance: number[] | null
          name: string
          password_code: string
          password_hash: string | null
          phone: string | null
          position: string | null
          project_id: string | null
          today_verified: boolean | null
          total_days: number | null
          work_days: number | null
        }
        Insert: {
          created_at?: string | null
          daily_wage: number
          email?: string | null
          hire_date?: string | null
          id?: string
          identity_number?: string | null
          is_present?: boolean | null
          monthly_attendance?: number[] | null
          name: string
          password_code: string
          password_hash?: string | null
          phone?: string | null
          position?: string | null
          project_id?: string | null
          today_verified?: boolean | null
          total_days?: number | null
          work_days?: number | null
        }
        Update: {
          created_at?: string | null
          daily_wage?: number
          email?: string | null
          hire_date?: string | null
          id?: string
          identity_number?: string | null
          is_present?: boolean | null
          monthly_attendance?: number[] | null
          name?: string
          password_code?: string
          password_hash?: string | null
          phone?: string | null
          position?: string | null
          project_id?: string | null
          today_verified?: boolean | null
          total_days?: number | null
          work_days?: number | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: number
          message: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          message: string
        }
        Update: {
          created_at?: string | null
          id?: number
          message?: string
        }
        Relationships: []
      }
      personnel: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string
          password: string | null
          role: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          password?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          password?: string | null
          role?: string | null
        }
        Relationships: []
      }
      personnel_sessions: {
        Row: {
          created_at: string | null
          employee_id: string | null
          expires_at: string
          id: string
          session_token: string
        }
        Insert: {
          created_at?: string | null
          employee_id?: string | null
          expires_at: string
          id?: string
          session_token: string
        }
        Update: {
          created_at?: string | null
          employee_id?: string | null
          expires_at?: string
          id?: string
          session_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "personnel_sessions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      project_dashboards: {
        Row: {
          config: Json | null
          id: string
          project_id: string | null
        }
        Insert: {
          config?: Json | null
          id?: string
          project_id?: string | null
        }
        Update: {
          config?: Json | null
          id?: string
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_dashboards_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          location: string | null
          name: string
          start_date: string
          status: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          name: string
          start_date: string
          status?: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          name?: string
          start_date?: string
          status?: string
        }
        Relationships: []
      }
      salary_reports: {
        Row: {
          created_at: string | null
          deductions: number | null
          details: Json | null
          gross_salary: number | null
          id: string
          month: number
          net_salary: number | null
          personnel_id: string | null
          year: number
        }
        Insert: {
          created_at?: string | null
          deductions?: number | null
          details?: Json | null
          gross_salary?: number | null
          id?: string
          month: number
          net_salary?: number | null
          personnel_id?: string | null
          year: number
        }
        Update: {
          created_at?: string | null
          deductions?: number | null
          details?: Json | null
          gross_salary?: number | null
          id?: string
          month?: number
          net_salary?: number | null
          personnel_id?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "salary_reports_personnel_id_fkey"
            columns: ["personnel_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          due_date: string
          id: number
          name: string
          status: string | null
        }
        Insert: {
          due_date: string
          id?: number
          name: string
          status?: string | null
        }
        Update: {
          due_date?: string
          id?: number
          name?: string
          status?: string | null
        }
        Relationships: []
      }
      work_logs: {
        Row: {
          amount: number
          approved: boolean | null
          created_at: string | null
          date: string
          description: string | null
          employee_id: string | null
          hours_worked: number | null
          id: string
          personnel_id: string | null
          project_id: string | null
        }
        Insert: {
          amount?: number
          approved?: boolean | null
          created_at?: string | null
          date: string
          description?: string | null
          employee_id?: string | null
          hours_worked?: number | null
          id?: string
          personnel_id?: string | null
          project_id?: string | null
        }
        Update: {
          amount?: number
          approved?: boolean | null
          created_at?: string | null
          date?: string
          description?: string | null
          employee_id?: string | null
          hours_worked?: number | null
          id?: string
          personnel_id?: string | null
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_employee"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_logs_personnel_id_fkey"
            columns: ["personnel_id"]
            isOneToOne: false
            referencedRelation: "personnel"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_project: {
        Args: { p_id: string }
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

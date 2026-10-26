export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      daily_tasks: {
        Row: {
          created_at: string
          done: boolean
          duration_minutes: number
          id: string
          text: string
          task_date?: string
          user_id: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          duration_minutes?: number
          id?: string
          text: string
          task_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          done?: boolean
          duration_minutes?: number
          id?: string
          text?: string
          task_date?: string
          user_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          folder: string
          id: string
          mime_type: string | null
          name: string
          size_bytes: number | null
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          folder?: string
          id?: string
          mime_type?: string | null
          name: string
          size_bytes?: number | null
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          folder?: string
          id?: string
          mime_type?: string | null
          name?: string
          size_bytes?: number | null
          storage_path?: string
          user_id?: string
        }
        Relationships: []
      }
      post_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          likes_count: number
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          likes_count?: number
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          likes_count?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          created_at: string
          full_name: string | null
          grade_or_year: string | null
          id: string
          institution: string | null
          skills: string[] | null
          streak_count: number
          student_type: Database["public"]["Enums"]["student_type"] | null
          updated_at: string
          username: string | null
          impact_access?: boolean
          impact_partner_id?: string | null
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          grade_or_year?: string | null
          id: string
          institution?: string | null
          skills?: string[] | null
          streak_count?: number
          student_type?: Database["public"]["Enums"]["student_type"] | null
          updated_at?: string
          username?: string | null
          impact_access?: boolean
          impact_partner_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          grade_or_year?: string | null
          id?: string
          institution?: string | null
          skills?: string[] | null
          streak_count?: number
          student_type?: Database["public"]["Enums"]["student_type"] | null
          updated_at?: string
          username?: string | null
          impact_access?: boolean
          impact_partner_id?: string | null
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          created_at: string
          difficulty: string | null
          id: string
          score: number
          subject: string
          topic: string | null
          total: number
          user_id: string
        }
        Insert: {
          created_at?: string
          difficulty?: string | null
          id?: string
          score: number
          subject: string
          topic?: string | null
          total: number
          user_id: string
        }
        Update: {
          created_at?: string
          difficulty?: string | null
          id?: string
          score?: number
          subject?: string
          topic?: string | null
          total?: number
          user_id?: string
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          id: string
          user_id: string
          item_type: string
          item_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          item_type: string
          item_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          item_type?: string
          item_id?: string
          created_at?: string
        }
        Relationships: []
      }
      study_goals: {
        Row: {
          daily_goal_minutes: number
          studied_on: string
          studied_today_minutes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          daily_goal_minutes?: number
          studied_on?: string
          studied_today_minutes?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          daily_goal_minutes?: number
          studied_on?: string
          studied_today_minutes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      mistakes: {
        Row: {
          id: string
          user_id: string
          subject: string
          topic: string | null
          question: string
          user_answer: string | null
          correct_answer: string | null
          explanation: string | null
          source: string
          resolved: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subject: string
          topic?: string | null
          question: string
          user_answer?: string | null
          correct_answer?: string | null
          explanation?: string | null
          source?: string
          resolved?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subject?: string
          topic?: string | null
          question?: string
          user_answer?: string | null
          correct_answer?: string | null
          explanation?: string | null
          source?: string
          resolved?: boolean
          created_at?: string
        }
        Relationships: []
      }
      career_plans: {
        Row: {
          id: string
          user_id: string
          interests: string | null
          marks: string | null
          current_level: string | null
          goal: string | null
          plan_markdown: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          interests?: string | null
          marks?: string | null
          current_level?: string | null
          goal?: string | null
          plan_markdown: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          interests?: string | null
          marks?: string | null
          current_level?: string | null
          goal?: string | null
          plan_markdown?: string
          created_at?: string
        }
        Relationships: []
      }
      viva_sessions: {
        Row: {
          id: string
          user_id: string
          subject: string
          transcript: Json
          score: number | null
          feedback: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subject: string
          transcript?: Json
          score?: number | null
          feedback?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subject?: string
          transcript?: Json
          score?: number | null
          feedback?: string | null
          created_at?: string
        }
        Relationships: []
      }
      mood_logs: {
        Row: {
          id: string
          user_id: string
          mood: string
          source: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          mood: string
          source?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          mood?: string
          source?: string
          created_at?: string
        }
        Relationships: []
      }
      learning_sessions: {
        Row: {
          id: string
          user_id: string
          kind: string | null
          minutes: number
          source: string | null
          topic: string | null
          completed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          kind?: string | null
          minutes?: number
          source?: string | null
          topic?: string | null
          completed_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          kind?: string | null
          minutes?: number
          source?: string | null
          topic?: string | null
          completed_at?: string
        }
        Relationships: []
      }
      planner_items: {
        Row: {
          id: string
          user_id: string
          title: string
          date: string
          type: string
          subject: string | null
          duration_minutes: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          date: string
          type?: string
          subject?: string | null
          duration_minutes?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          date?: string
          type?: string
          subject?: string | null
          duration_minutes?: number | null
          created_at?: string
        }
        Relationships: []
      }
      study_materials: {
        Row: {
          id: string
          title: string
          subject: string
          course: string | null
          semester: string | null
          unit: string | null
          type: string
          description: string | null
          file_url: string
          uploaded_by: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          subject: string
          course?: string | null
          semester?: string | null
          unit?: string | null
          type: string
          description?: string | null
          file_url: string
          uploaded_by?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          subject?: string
          course?: string | null
          semester?: string | null
          unit?: string | null
          type?: string
          description?: string | null
          file_url?: string
          uploaded_by?: string | null
          status?: string
          created_at?: string
        }
        Relationships: []
      }
      ai_threads: {
        Row: {
          user_id: string
          channel: string
          messages: Json
          updated_at: string
        }
        Insert: {
          user_id: string
          channel: string
          messages?: Json
          updated_at?: string
        }
        Update: {
          user_id?: string
          channel?: string
          messages?: Json
          updated_at?: string
        }
        Relationships: []
      }
      credit_wallets: {
        Row: {
          user_id: string
          balance: number
          lifetime_earned: number
          lifetime_spent: number
          updated_at: string
        }
        Insert: {
          user_id: string
          balance?: number
          lifetime_earned?: number
          lifetime_spent?: number
          updated_at?: string
        }
        Update: {
          user_id?: string
          balance?: number
          lifetime_earned?: number
          lifetime_spent?: number
          updated_at?: string
        }
        Relationships: []
      }
      credit_ledger: {
        Row: {
          id: string
          user_id: string
          amount: number
          activity: string
          description: string | null
          ref_key: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          activity: string
          description?: string | null
          ref_key?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          activity?: string
          description?: string | null
          ref_key?: string | null
          created_at?: string
        }
        Relationships: []
      }
      ngo_partners: {
        Row: {
          id: string
          name: string
          contact_email: string | null
          referral_code: string
          seeded_students: number
          seeded_active_students: number
          students_joined: number
          active_students: number
          invited_emails: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          contact_email?: string | null
          referral_code: string
          seeded_students?: number
          seeded_active_students?: number
          students_joined?: number
          active_students?: number
          invited_emails?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          contact_email?: string | null
          referral_code?: string
          seeded_students?: number
          seeded_active_students?: number
          students_joined?: number
          active_students?: number
          invited_emails?: number
          created_at?: string
        }
        Relationships: []
      }
      ngo_invites: {
        Row: {
          id: string
          partner_id: string
          email: string
          created_at: string
        }
        Insert: {
          id?: string
          partner_id: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          partner_id?: string
          email?: string
          created_at?: string
        }
        Relationships: []
      }
      impact_applications: {
        Row: {
          id: string
          user_id: string
          school_type: string
          income_declared: boolean
          referral_code: string | null
          partner_id: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          school_type: string
          income_declared?: boolean
          referral_code?: string | null
          partner_id?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          school_type?: string
          income_declared?: boolean
          referral_code?: string | null
          partner_id?: string | null
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "impact_applications_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "ngo_partners"
            referencedColumns: ["id"]
          }
        ]
      }
      student_feedback: {
        Row: {
          id: string
          user_id: string
          rating: number
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          rating: number
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          rating?: number
          message?: string
          created_at?: string
        }
        Relationships: []
      }
      ai_access_blocks: {
        Row: {
          user_id: string
          message: string
          created_at: string
        }
        Insert: {
          user_id: string
          message: string
          created_at?: string
        }
        Update: {
          user_id?: string
          message?: string
          created_at?: string
        }
        Relationships: []
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
      award_learning_credits: {
        Args: {
          _activity: string
          _ref_key?: string
          _description?: string
        }
        Returns: Json
      }
      spend_learning_credits: {
        Args: {
          _amount: number
          _purpose: string
        }
        Returns: Json
      }
      eduvault_impact_totals: {
        Args: Record<string, never>
        Returns: {
          total_hours: number
          total_quizzes: number
          total_students: number
          ngo_sponsored_students: number
        }
      }
    }
    Enums: {
      app_role: "student" | "admin"
      student_type: "school" | "college"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["student", "admin"],
      student_type: ["school", "college"],
    },
  },
} as const

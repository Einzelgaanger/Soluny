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
      answers: {
        Row: {
          author_id: string
          body: string
          created_at: string
          downvotes: number
          earnings_awarded_kes: number
          id: string
          locked_at: string | null
          net_score: number
          question_id: string
          rank_position: number | null
          updated_at: string
          upvotes: number
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          downvotes?: number
          earnings_awarded_kes?: number
          id?: string
          locked_at?: string | null
          net_score?: number
          question_id: string
          rank_position?: number | null
          updated_at?: string
          upvotes?: number
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          downvotes?: number
          earnings_awarded_kes?: number
          id?: string
          locked_at?: string | null
          net_score?: number
          question_id?: string
          rank_position?: number | null
          updated_at?: string
          upvotes?: number
        }
        Relationships: [
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          category: Database["public"]["Enums"]["badge_category"]
          color: string
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          threshold: number
        }
        Insert: {
          category: Database["public"]["Enums"]["badge_category"]
          color?: string
          created_at?: string
          description: string
          icon?: string
          id?: string
          name: string
          threshold?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["badge_category"]
          color?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          threshold?: number
        }
        Relationships: []
      }
      content_earnings: {
        Row: {
          amount_kes: number
          author_id: string
          created_at: string
          id: string
          period_end: string
          period_start: string
          post_id: string
          views_counted: number
        }
        Insert: {
          amount_kes?: number
          author_id: string
          created_at?: string
          id?: string
          period_end: string
          period_start: string
          post_id: string
          views_counted?: number
        }
        Update: {
          amount_kes?: number
          author_id?: string
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          post_id?: string
          views_counted?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_earnings_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      earnings: {
        Row: {
          amount_kes: number
          answer_id: string | null
          created_at: string
          id: string
          mpesa_code: string | null
          payout_method: string | null
          payout_status: Database["public"]["Enums"]["payout_status"]
          user_id: string
        }
        Insert: {
          amount_kes: number
          answer_id?: string | null
          created_at?: string
          id?: string
          mpesa_code?: string | null
          payout_method?: string | null
          payout_status?: Database["public"]["Enums"]["payout_status"]
          user_id: string
        }
        Update: {
          amount_kes?: number
          answer_id?: string | null
          created_at?: string
          id?: string
          mpesa_code?: string | null
          payout_method?: string | null
          payout_status?: Database["public"]["Enums"]["payout_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "earnings_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "answers"
            referencedColumns: ["id"]
          },
        ]
      }
      flags: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          id: string
          reason: string
          reporter_id: string
          resolved_at: string | null
          status: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          reason: string
          reporter_id: string
          resolved_at?: string | null
          status?: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          status?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachment_name: string | null
          attachment_type: string | null
          attachment_url: string | null
          body: string
          created_at: string
          id: string
          read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          body: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          body?: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          method: string
          mpesa_code: string | null
          status: string
          stripe_payment_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          method: string
          mpesa_code?: string | null
          status?: string
          stripe_payment_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          method?: string
          mpesa_code?: string | null
          status?: string
          stripe_payment_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          like_count: number
          parent_id: string | null
          post_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          like_count?: number
          parent_id?: string | null
          post_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          like_count?: number
          parent_id?: string | null
          post_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          body: string
          comment_count: number
          cover_image_url: string | null
          created_at: string
          id: string
          is_published: boolean
          like_count: number
          media_urls: string[] | null
          tags: string[] | null
          title: string
          type: Database["public"]["Enums"]["post_type"]
          updated_at: string
          view_count: number
        }
        Insert: {
          author_id: string
          body?: string
          comment_count?: number
          cover_image_url?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          like_count?: number
          media_urls?: string[] | null
          tags?: string[] | null
          title: string
          type?: Database["public"]["Enums"]["post_type"]
          updated_at?: string
          view_count?: number
        }
        Update: {
          author_id?: string
          body?: string
          comment_count?: number
          cover_image_url?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          like_count?: number
          media_urls?: string[] | null
          tags?: string[] | null
          title?: string
          type?: Database["public"]["Enums"]["post_type"]
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          available_balance_kes: number
          avatar_url: string | null
          bio: string | null
          cp_balance: number
          created_at: string
          display_name: string | null
          expert_category: string | null
          follower_count: number
          following_count: number
          id: string
          is_verified_expert: boolean
          last_seen: string | null
          last_withdrawal_at: string | null
          phone_number: string | null
          rank: Database["public"]["Enums"]["community_rank"]
          subscription_expires_at: string | null
          subscription_plan: Database["public"]["Enums"]["subscription_plan"]
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          total_earnings_kes: number
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          available_balance_kes?: number
          avatar_url?: string | null
          bio?: string | null
          cp_balance?: number
          created_at?: string
          display_name?: string | null
          expert_category?: string | null
          follower_count?: number
          following_count?: number
          id?: string
          is_verified_expert?: boolean
          last_seen?: string | null
          last_withdrawal_at?: string | null
          phone_number?: string | null
          rank?: Database["public"]["Enums"]["community_rank"]
          subscription_expires_at?: string | null
          subscription_plan?: Database["public"]["Enums"]["subscription_plan"]
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          total_earnings_kes?: number
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          available_balance_kes?: number
          avatar_url?: string | null
          bio?: string | null
          cp_balance?: number
          created_at?: string
          display_name?: string | null
          expert_category?: string | null
          follower_count?: number
          following_count?: number
          id?: string
          is_verified_expert?: boolean
          last_seen?: string | null
          last_withdrawal_at?: string | null
          phone_number?: string | null
          rank?: Database["public"]["Enums"]["community_rank"]
          subscription_expires_at?: string | null
          subscription_plan?: Database["public"]["Enums"]["subscription_plan"]
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          total_earnings_kes?: number
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          answer_count: number
          author_id: string
          body: string
          category_tags: string[]
          created_at: string
          id: string
          prize_pool_kes: number
          status: Database["public"]["Enums"]["question_status"]
          title: string
          type: Database["public"]["Enums"]["question_type"]
          updated_at: string
          view_count: number
          voting_closes_at: string
        }
        Insert: {
          answer_count?: number
          author_id: string
          body: string
          category_tags?: string[]
          created_at?: string
          id?: string
          prize_pool_kes?: number
          status?: Database["public"]["Enums"]["question_status"]
          title: string
          type?: Database["public"]["Enums"]["question_type"]
          updated_at?: string
          view_count?: number
          voting_closes_at: string
        }
        Update: {
          answer_count?: number
          author_id?: string
          body?: string
          category_tags?: string[]
          created_at?: string
          id?: string
          prize_pool_kes?: number
          status?: Database["public"]["Enums"]["question_status"]
          title?: string
          type?: Database["public"]["Enums"]["question_type"]
          updated_at?: string
          view_count?: number
          voting_closes_at?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          bonus_claimed_today: boolean
          created_at: string
          current_streak: number
          id: string
          last_login_date: string | null
          longest_streak: number
          total_logins: number
          updated_at: string
          user_id: string
        }
        Insert: {
          bonus_claimed_today?: boolean
          created_at?: string
          current_streak?: number
          id?: string
          last_login_date?: string | null
          longest_streak?: number
          total_logins?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          bonus_claimed_today?: boolean
          created_at?: string
          current_streak?: number
          id?: string
          last_login_date?: string | null
          longest_streak?: number
          total_logins?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      votes: {
        Row: {
          answer_id: string
          created_at: string
          id: string
          updated_at: string
          value: number
          voter_id: string
        }
        Insert: {
          answer_id: string
          created_at?: string
          id?: string
          updated_at?: string
          value: number
          voter_id: string
        }
        Update: {
          answer_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          value?: number
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "answers"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          note: string | null
          receiver_id: string
          sender_id: string
          type: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          note?: string | null
          receiver_id: string
          sender_id: string
          type: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          note?: string | null
          receiver_id?: string
          sender_id?: string
          type?: string
        }
        Relationships: []
      }
      withdrawal_settings: {
        Row: {
          cooldown_hours: number
          daily_limit: number
          fee_percentage: number
          id: string
          max_withdrawal: number
          min_withdrawal: number
          plan: string
        }
        Insert: {
          cooldown_hours?: number
          daily_limit?: number
          fee_percentage?: number
          id?: string
          max_withdrawal?: number
          min_withdrawal?: number
          plan: string
        }
        Update: {
          cooldown_hours?: number
          daily_limit?: number
          fee_percentage?: number
          id?: string
          max_withdrawal?: number
          min_withdrawal?: number
          plan?: string
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
      increment_post_views: { Args: { p_post_id: string }; Returns: undefined }
      increment_view_count: {
        Args: { question_id: string }
        Returns: undefined
      }
      transfer_funds: {
        Args: {
          p_amount: number
          p_note?: string
          p_receiver_id: string
          p_type?: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      badge_category:
        | "followers"
        | "content"
        | "earnings"
        | "streak"
        | "special"
      community_rank:
        | "newcomer"
        | "contributor"
        | "analyst"
        | "scholar"
        | "sage"
        | "grand_master"
      payout_status: "pending" | "processing" | "completed" | "failed"
      post_type:
        | "article"
        | "video"
        | "image_post"
        | "research_paper"
        | "discussion"
      question_status: "open" | "voting" | "closed" | "removed"
      question_type:
        | "problem"
        | "debate"
        | "opinion_poll"
        | "sponsored_challenge"
        | "knowledge_qa"
      subscription_plan:
        | "free"
        | "monthly"
        | "annual"
        | "institutional"
        | "bronze"
        | "silver"
        | "gold"
        | "platinum"
      subscription_status: "free" | "active" | "expired" | "cancelled"
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
      app_role: ["admin", "moderator", "user"],
      badge_category: ["followers", "content", "earnings", "streak", "special"],
      community_rank: [
        "newcomer",
        "contributor",
        "analyst",
        "scholar",
        "sage",
        "grand_master",
      ],
      payout_status: ["pending", "processing", "completed", "failed"],
      post_type: [
        "article",
        "video",
        "image_post",
        "research_paper",
        "discussion",
      ],
      question_status: ["open", "voting", "closed", "removed"],
      question_type: [
        "problem",
        "debate",
        "opinion_poll",
        "sponsored_challenge",
        "knowledge_qa",
      ],
      subscription_plan: [
        "free",
        "monthly",
        "annual",
        "institutional",
        "bronze",
        "silver",
        "gold",
        "platinum",
      ],
      subscription_status: ["free", "active", "expired", "cancelled"],
    },
  },
} as const

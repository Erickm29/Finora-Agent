export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          auth_user_id: string | null;
          display_name: string | null;
          telegram_user_id: number | null;
          locale: string;
          currency: string;
          preferences: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id?: string | null;
          display_name?: string | null;
          telegram_user_id?: number | null;
          locale?: string;
          currency?: string;
          preferences?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          target_amount_bobs: number;
          target_months: number;
          base_monthly_bobs: number;
          accumulated_bobs: number;
          status: string;
          product_url: string | null;
          last_price_check_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          target_amount_bobs: number;
          target_months: number;
          base_monthly_bobs: number;
          accumulated_bobs?: number;
          status?: string;
          product_url?: string | null;
          last_price_check_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["goals"]["Insert"]>;
      };
      goal_transactions: {
        Row: {
          id: string;
          goal_id: string;
          user_id: string;
          type: string;
          amount_bobs: number;
          source: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          goal_id: string;
          user_id: string;
          type: string;
          amount_bobs: number;
          source: string;
          note?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["goal_transactions"]["Insert"]
        >;
      };
      pending_actions: {
        Row: {
          id: string;
          user_id: string;
          goal_id: string | null;
          kind: string;
          payload: Json;
          status: string;
          channel_created: string;
          confirm_token: string;
          expires_at: string;
          confirmed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          goal_id?: string | null;
          kind: string;
          payload?: Json;
          status?: string;
          channel_created: string;
          confirm_token: string;
          expires_at: string;
          confirmed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["pending_actions"]["Insert"]
        >;
      };
      conversation_sessions: {
        Row: {
          id: string;
          user_id: string;
          channel: string;
          external_chat_id: string;
          active_goal_id: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          channel: string;
          external_chat_id: string;
          active_goal_id?: string | null;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["conversation_sessions"]["Insert"]
        >;
      };
      conversation_messages: {
        Row: {
          id: string;
          session_id: string;
          role: string;
          content: string;
          tool_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          role: string;
          content: string;
          tool_name?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["conversation_messages"]["Insert"]
        >;
      };
      market_snapshots: {
        Row: {
          id: string;
          query: string;
          source: string;
          data: Json;
          fetched_at: string;
        };
        Insert: {
          id?: string;
          query: string;
          source: string;
          data?: Json;
          fetched_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["market_snapshots"]["Insert"]
        >;
      };
      telegram_link_tokens: {
        Row: {
          token: string;
          user_id: string;
          expires_at: string;
          used_at: string | null;
          created_at: string;
        };
        Insert: {
          token: string;
          user_id: string;
          expires_at: string;
          used_at?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["telegram_link_tokens"]["Insert"]
        >;
      };
    };
  };
};

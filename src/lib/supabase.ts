import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check for valid Supabase configuration
const hasValidSupabaseConfig = supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') && 
  supabaseUrl.includes('.supabase.co') &&
  supabaseAnonKey.length > 20;

if (!hasValidSupabaseConfig) {
  console.warn('⚠️ Supabase not configured properly. Please connect to Supabase to enable full functionality.');
  console.warn('Missing or invalid environment variables:', {
    VITE_SUPABASE_URL: supabaseUrl ? 'Present' : 'Missing',
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? 'Present' : 'Missing'
  });
}

// Create client with fallback for missing config
export const supabase = hasValidSupabaseConfig 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-key');

// Export configuration status
export const isSupabaseConfigured = hasValidSupabaseConfig;

// Database types matching your existing schema
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          image_url?: string;
          likes?: string[];
          dislikes?: string[];
          notes?: string;
          created_at: string;
          updated_at: string;
          user_id: string;
          status?: string;
          looks_rating?: number;
          bench?: boolean;
          hearts?: number;
          total_spent?: number;
        };
        Insert: {
          id?: string;
          name: string;
          image_url?: string;
          likes?: string[];
          dislikes?: string[];
          notes?: string;
          created_at?: string;
          updated_at?: string;
          user_id: string;
          status?: string;
          looks_rating?: number;
          bench?: boolean;
          hearts?: number;
          total_spent?: number;
        };
        Update: {
          name?: string;
          image_url?: string;
          likes?: string[];
          dislikes?: string[];
          notes?: string;
          updated_at?: string;
          status?: string;
          looks_rating?: number;
          bench?: boolean;
          hearts?: number;
          total_spent?: number;
        };
      };
      meetings: {
        Row: {
          id: string;
          profile_id?: string;
          type: string;
          amount_spent?: number;
          base?: string;
          rating?: number;
          notes?: string;
          date?: string;
          created_at: string;
          updated_at: string;
          performance_rating?: number;
        };
        Insert: {
          id?: string;
          profile_id?: string;
          type: string;
          amount_spent?: number;
          base?: string;
          rating?: number;
          notes?: string;
          date?: string;
          created_at?: string;
          updated_at?: string;
          performance_rating?: number;
        };
        Update: {
          profile_id?: string;
          type?: string;
          amount_spent?: number;
          base?: string;
          rating?: number;
          notes?: string;
          date?: string;
          updated_at?: string;
          performance_rating?: number;
        };
      };
      upcoming_dates: {
        Row: {
          id: string;
          profile_id?: string;
          type: string;
          date: string;
          notes?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id?: string;
          type: string;
          date: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          profile_id?: string;
          type?: string;
          date?: string;
          notes?: string;
          updated_at?: string;
        };
      };
      stripe_customers: {
        Row: {
          id: number;
          user_id: string;
          customer_id: string;
          created_at: string;
          updated_at: string;
          deleted_at?: string;
        };
        Insert: {
          user_id: string;
          customer_id: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string;
        };
        Update: {
          customer_id?: string;
          updated_at?: string;
          deleted_at?: string;
        };
      };
      stripe_subscriptions: {
        Row: {
          id: number;
          customer_id: string;
          subscription_id?: string;
          price_id?: string;
          current_period_start?: number;
          current_period_end?: number;
          cancel_at_period_end: boolean;
          payment_method_brand?: string;
          payment_method_last4?: string;
          status: string;
          created_at: string;
          updated_at: string;
          deleted_at?: string;
        };
        Insert: {
          customer_id: string;
          subscription_id?: string;
          price_id?: string;
          current_period_start?: number;
          current_period_end?: number;
          cancel_at_period_end?: boolean;
          payment_method_brand?: string;
          payment_method_last4?: string;
          status: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string;
        };
        Update: {
          subscription_id?: string;
          price_id?: string;
          current_period_start?: number;
          current_period_end?: number;
          cancel_at_period_end?: boolean;
          payment_method_brand?: string;
          payment_method_last4?: string;
          status?: string;
          updated_at?: string;
          deleted_at?: string;
        };
      };
      stripe_orders: {
        Row: {
          id: number;
          checkout_session_id: string;
          payment_intent_id: string;
          customer_id: string;
          amount_subtotal: number;
          amount_total: number;
          currency: string;
          payment_status: string;
          status: string;
          created_at: string;
          updated_at: string;
          deleted_at?: string;
        };
        Insert: {
          checkout_session_id: string;
          payment_intent_id: string;
          customer_id: string;
          amount_subtotal: number;
          amount_total: number;
          currency: string;
          payment_status: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string;
        };
        Update: {
          payment_status?: string;
          status?: string;
          updated_at?: string;
          deleted_at?: string;
        };
      };
    };
    Views: {
      stripe_user_subscriptions: {
        Row: {
          customer_id: string;
          subscription_id?: string;
          subscription_status: string;
          price_id?: string;
          current_period_start?: number;
          current_period_end?: number;
          cancel_at_period_end: boolean;
          payment_method_brand?: string;
          payment_method_last4?: string;
        };
      };
      stripe_user_orders: {
        Row: {
          customer_id: string;
          order_id: number;
          checkout_session_id: string;
          payment_intent_id: string;
          amount_subtotal: number;
          amount_total: number;
          currency: string;
          payment_status: string;
          order_status: string;
          order_date: string;
        };
      };
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
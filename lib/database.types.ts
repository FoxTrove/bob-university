// Auto-generated TypeScript types from Supabase schema
// Based on: supabase/schema.sql

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'individual' | 'salon_owner' | 'staff' | 'admin';
export type PlanType = 'free' | 'individual' | 'salon';
export type EntitlementStatus = 'active' | 'canceled' | 'past_due' | 'expired';
export type PurchaseSource = 'apple' | 'stripe';
export type ProductType = 'subscription' | 'certification' | 'event' | 'merch';
export type PurchaseStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type Platform = 'ios' | 'android' | 'web';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: UserRole;
          salon_id: string | null;
          years_experience: number | null;
          location: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          salon_id?: string | null;
          years_experience?: number | null;
          location?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          salon_id?: string | null;
          years_experience?: number | null;
          location?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      salons: {
        Row: {
          id: string;
          name: string;
          owner_id: string | null;
          max_staff: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_id?: string | null;
          max_staff?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          owner_id?: string | null;
          max_staff?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      entitlements: {
        Row: {
          id: string;
          user_id: string;
          plan: PlanType;
          status: EntitlementStatus;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan?: PlanType;
          status?: EntitlementStatus;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan?: PlanType;
          status?: EntitlementStatus;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      purchases: {
        Row: {
          id: string;
          user_id: string;
          source: PurchaseSource;
          product_type: ProductType;
          product_id: string;
          external_id: string;
          status: PurchaseStatus;
          amount_cents: number | null;
          currency: string;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source: PurchaseSource;
          product_type: ProductType;
          product_id: string;
          external_id: string;
          status?: PurchaseStatus;
          amount_cents?: number | null;
          currency?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          source?: PurchaseSource;
          product_type?: ProductType;
          product_id?: string;
          external_id?: string;
          status?: PurchaseStatus;
          amount_cents?: number | null;
          currency?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      modules: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          thumbnail_url: string | null;
          sort_order: number;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          thumbnail_url?: string | null;
          sort_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          thumbnail_url?: string | null;
          sort_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      videos: {
        Row: {
          id: string;
          module_id: string | null;
          title: string;
          description: string | null;
          video_url: string;
          thumbnail_url: string | null;
          duration_seconds: number | null;
          sort_order: number;
          is_free: boolean;
          is_published: boolean;
          transcript: string | null;
          mux_playback_id: string | null;
          mux_asset_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          module_id?: string | null;
          title: string;
          description?: string | null;
          video_url: string;
          thumbnail_url?: string | null;
          duration_seconds?: number | null;
          sort_order?: number;
          is_free?: boolean;
          is_published?: boolean;
          transcript?: string | null;
          mux_playback_id?: string | null;
          mux_asset_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          module_id?: string | null;
          title?: string;
          description?: string | null;
          video_url?: string;
          thumbnail_url?: string | null;
          duration_seconds?: number | null;
          sort_order?: number;
          is_free?: boolean;
          is_published?: boolean;
          transcript?: string | null;
          mux_playback_id?: string | null;
          mux_asset_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      video_progress: {
        Row: {
          id: string;
          user_id: string;
          video_id: string;
          watched_seconds: number;
          duration_seconds: number | null;
          completed: boolean;
          completed_at: string | null;
          last_watched_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          video_id: string;
          watched_seconds?: number;
          duration_seconds?: number | null;
          completed?: boolean;
          completed_at?: string | null;
          last_watched_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          video_id?: string;
          watched_seconds?: number;
          duration_seconds?: number | null;
          completed?: boolean;
          completed_at?: string | null;
          last_watched_at?: string;
          created_at?: string;
        };
      };
      push_tokens: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          platform: Platform | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token: string;
          platform?: Platform | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          token?: string;
          platform?: Platform | null;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}

// Convenience type aliases for Row types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Salon = Database['public']['Tables']['salons']['Row'];
export type Entitlement = Database['public']['Tables']['entitlements']['Row'];
export type Purchase = Database['public']['Tables']['purchases']['Row'];
export type Module = Database['public']['Tables']['modules']['Row'];
export type Video = Database['public']['Tables']['videos']['Row'];
export type VideoProgress = Database['public']['Tables']['video_progress']['Row'];
export type PushToken = Database['public']['Tables']['push_tokens']['Row'];

// Insert types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type SalonInsert = Database['public']['Tables']['salons']['Insert'];
export type EntitlementInsert = Database['public']['Tables']['entitlements']['Insert'];
export type PurchaseInsert = Database['public']['Tables']['purchases']['Insert'];
export type ModuleInsert = Database['public']['Tables']['modules']['Insert'];
export type VideoInsert = Database['public']['Tables']['videos']['Insert'];
export type VideoProgressInsert = Database['public']['Tables']['video_progress']['Insert'];
export type PushTokenInsert = Database['public']['Tables']['push_tokens']['Insert'];

// Update types
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type SalonUpdate = Database['public']['Tables']['salons']['Update'];
export type EntitlementUpdate = Database['public']['Tables']['entitlements']['Update'];
export type PurchaseUpdate = Database['public']['Tables']['purchases']['Update'];
export type ModuleUpdate = Database['public']['Tables']['modules']['Update'];
export type VideoUpdate = Database['public']['Tables']['videos']['Update'];
export type VideoProgressUpdate = Database['public']['Tables']['video_progress']['Update'];
export type PushTokenUpdate = Database['public']['Tables']['push_tokens']['Update'];

// Extended types for common queries
export type ModuleWithVideos = Module & {
  videos: Video[];
};

export type VideoWithProgress = Video & {
  video_progress?: VideoProgress | null;
};

export type ModuleWithProgress = Module & {
  videos: VideoWithProgress[];
  totalVideos: number;
  completedVideos: number;
  progressPercent: number;
};

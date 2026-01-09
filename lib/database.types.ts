// Generated TypeScript types from Supabase database schema
// Generated at: 2025-12-16T17:34:20.634Z

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      certification_required_modules: {
        Row: {
          id: string;
          module_id: string;
          created_at: string | null;
        }
        Insert: {
          id?: string;
          module_id: string;
          created_at?: string | null;
        }
        Update: {
          id?: string;
          module_id?: string;
          created_at?: string | null;
        }
        Relationships: [];
      }
      certification_settings: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          price_cents: number;
          badge_image_url: string | null;
          requires_review: boolean | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        }
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          price_cents: number;
          badge_image_url?: string | null;
          requires_review?: boolean | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        }
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          price_cents?: number;
          badge_image_url?: string | null;
          requires_review?: boolean | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        }
        Relationships: [];
      }
      collection_access: {
        Row: {
          id: string;
          collection_id: string;
          user_id: string;
          granted_at: string | null;
          expires_at: string | null;
          source: string | null;
          source_id: string | null;
          notes: string | null;
          created_at: string | null;
        }
        Insert: {
          id?: string;
          collection_id: string;
          user_id: string;
          granted_at?: string | null;
          expires_at?: string | null;
          source?: string | null;
          source_id?: string | null;
          notes?: string | null;
          created_at?: string | null;
        }
        Update: {
          id?: string;
          collection_id?: string;
          user_id?: string;
          granted_at?: string | null;
          expires_at?: string | null;
          source?: string | null;
          source_id?: string | null;
          notes?: string | null;
          created_at?: string | null;
        }
        Relationships: [];
      }
      collection_videos: {
        Row: {
          id: string;
          collection_id: string;
          video_id: string;
          sort_order: number | null;
          custom_title: string | null;
          custom_description: string | null;
          created_at: string | null;
        }
        Insert: {
          id?: string;
          collection_id: string;
          video_id: string;
          sort_order?: number | null;
          custom_title?: string | null;
          custom_description?: string | null;
          created_at?: string | null;
        }
        Update: {
          id?: string;
          collection_id?: string;
          video_id?: string;
          sort_order?: number | null;
          custom_title?: string | null;
          custom_description?: string | null;
          created_at?: string | null;
        }
        Relationships: [];
      }
      collections: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          thumbnail_url: string | null;
          collection_type: string | null;
          event_date: string | null;
          event_location: string | null;
          is_published: boolean | null;
          access_starts_at: string | null;
          access_ends_at: string | null;
          sort_order: number | null;
          created_at: string | null;
          updated_at: string | null;
        }
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          thumbnail_url?: string | null;
          collection_type?: string | null;
          event_date?: string | null;
          event_location?: string | null;
          is_published?: boolean | null;
          access_starts_at?: string | null;
          access_ends_at?: string | null;
          sort_order?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        }
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          thumbnail_url?: string | null;
          collection_type?: string | null;
          event_date?: string | null;
          event_location?: string | null;
          is_published?: boolean | null;
          access_starts_at?: string | null;
          access_ends_at?: string | null;
          sort_order?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        }
        Relationships: [];
      }
      entitlements: {
        Row: {
          id: string;
          user_id: string;
          plan: string | null;
          status: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        }
        Insert: {
          id?: string;
          user_id: string;
          plan?: string | null;
          status?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        }
        Update: {
          id?: string;
          user_id?: string;
          plan?: string | null;
          status?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        }
        Relationships: [];
      }
      event_registrations: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          status: string | null;
          ticket_type: string | null;
          amount_paid_cents: number | null;
          payment_id: string | null;
          registered_at: string | null;
          confirmed_at: string | null;
          cancelled_at: string | null;
          notes: string | null;
        }
        Insert: {
          id?: string;
          event_id: string;
          user_id: string;
          status?: string | null;
          ticket_type?: string | null;
          amount_paid_cents?: number | null;
          payment_id?: string | null;
          registered_at?: string | null;
          confirmed_at?: string | null;
          cancelled_at?: string | null;
          notes?: string | null;
        }
        Update: {
          id?: string;
          event_id?: string;
          user_id?: string;
          status?: string | null;
          ticket_type?: string | null;
          amount_paid_cents?: number | null;
          payment_id?: string | null;
          registered_at?: string | null;
          confirmed_at?: string | null;
          cancelled_at?: string | null;
          notes?: string | null;
        }
        Relationships: [];
      }
      events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          event_date: string;
          event_end_date: string | null;
          location: string | null;
          venue_name: string | null;
          venue_address: string | null;
          max_capacity: number | null;
          price_cents: number | null;
          early_bird_price_cents: number | null;
          early_bird_deadline: string | null;
          collection_id: string | null;
          thumbnail_url: string | null;
          is_published: boolean | null;
          registration_open: boolean | null;
          created_at: string | null;
          updated_at: string | null;
          stripe_product_id: string | null;
          stripe_price_id: string | null;
        }
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          event_date: string;
          event_end_date?: string | null;
          location?: string | null;
          venue_name?: string | null;
          venue_address?: string | null;
          max_capacity?: number | null;
          price_cents?: number | null;
          early_bird_price_cents?: number | null;
          early_bird_deadline?: string | null;
          collection_id?: string | null;
          thumbnail_url?: string | null;
          is_published?: boolean | null;
          registration_open?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
          stripe_product_id?: string | null;
          stripe_price_id?: string | null;
        }
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          event_date?: string;
          event_end_date?: string | null;
          location?: string | null;
          venue_name?: string | null;
          venue_address?: string | null;
          max_capacity?: number | null;
          price_cents?: number | null;
          early_bird_price_cents?: number | null;
          early_bird_deadline?: string | null;
          collection_id?: string | null;
          thumbnail_url?: string | null;
          is_published?: boolean | null;
          registration_open?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
          stripe_product_id?: string | null;
          stripe_price_id?: string | null;
        }
        Relationships: [];
      }
      modules: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          thumbnail_url: string | null;
          sort_order: number | null;
          is_published: boolean | null;
          created_at: string | null;
          updated_at: string | null;
          drip_days: number | null;
          drip_buckets: Record<string, any> | null;
        }
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          thumbnail_url?: string | null;
          sort_order?: number | null;
          is_published?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
          drip_days?: number | null;
          drip_buckets?: Record<string, any> | null;
        }
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          thumbnail_url?: string | null;
          sort_order?: number | null;
          is_published?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
          drip_days?: number | null;
          drip_buckets?: Record<string, any> | null;
        }
        Relationships: [];
      }
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: string | null;
          salon_id: string | null;
          years_experience: number | null;
          location: string | null;
          created_at: string | null;
          updated_at: string | null;
          stripe_customer_id: string | null;
          has_completed_onboarding: boolean | null;
        }
        Insert: {
          id?: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: string | null;
          salon_id?: string | null;
          years_experience?: number | null;
          location?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          stripe_customer_id?: string | null;
          has_completed_onboarding?: boolean | null;
        }
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: string | null;
          salon_id?: string | null;
          years_experience?: number | null;
          location?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          stripe_customer_id?: string | null;
          has_completed_onboarding?: boolean | null;
        }
        Relationships: [];
      }
      purchases: {
        Row: {
          id: string;
          user_id: string;
          source: string;
          product_type: string;
          product_id: string;
          external_id: string;
          status: string | null;
          amount_cents: number | null;
          currency: string | null;
          metadata: Record<string, any> | null;
          created_at: string | null;
          updated_at: string | null;
        }
        Insert: {
          id?: string;
          user_id: string;
          source: string;
          product_type: string;
          product_id: string;
          external_id: string;
          status?: string | null;
          amount_cents?: number | null;
          currency?: string | null;
          metadata?: Record<string, any> | null;
          created_at?: string | null;
          updated_at?: string | null;
        }
        Update: {
          id?: string;
          user_id?: string;
          source?: string;
          product_type?: string;
          product_id?: string;
          external_id?: string;
          status?: string | null;
          amount_cents?: number | null;
          currency?: string | null;
          metadata?: Record<string, any> | null;
          created_at?: string | null;
          updated_at?: string | null;
        }
        Relationships: [];
      }
      push_tokens: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          platform: string | null;
          created_at: string | null;
        }
        Insert: {
          id?: string;
          user_id: string;
          token: string;
          platform?: string | null;
          created_at?: string | null;
        }
        Update: {
          id?: string;
          user_id?: string;
          token?: string;
          platform?: string | null;
          created_at?: string | null;
        }
        Relationships: [];
      }
      salons: {
        Row: {
          id: string;
          name: string;
          owner_id: string | null;
          max_staff: number | null;
          created_at: string | null;
          updated_at: string | null;
        }
        Insert: {
          id?: string;
          name: string;
          owner_id?: string | null;
          max_staff?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        }
        Update: {
          id?: string;
          name?: string;
          owner_id?: string | null;
          max_staff?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        }
        Relationships: [];
      }
      stylist_profiles: {
        Row: {
          id: string;
          user_id: string;
          display_name: string;
          bio: string | null;
          profile_photo_url: string | null;
          salon_name: string | null;
          city: string | null;
          state: string | null;
          country: string | null;
          latitude: number | null;
          longitude: number | null;
          contact_email: string | null;
          phone: string | null;
          instagram_handle: string | null;
          booking_url: string | null;
          is_public: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        }
        Insert: {
          id?: string;
          user_id: string;
          display_name: string;
          bio?: string | null;
          profile_photo_url?: string | null;
          salon_name?: string | null;
          city?: string | null;
          state?: string | null;
          country?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          contact_email?: string | null;
          phone?: string | null;
          instagram_handle?: string | null;
          booking_url?: string | null;
          is_public?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        }
        Update: {
          id?: string;
          user_id?: string;
          display_name?: string;
          bio?: string | null;
          profile_photo_url?: string | null;
          salon_name?: string | null;
          city?: string | null;
          state?: string | null;
          country?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          contact_email?: string | null;
          phone?: string | null;
          instagram_handle?: string | null;
          booking_url?: string | null;
          is_public?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        }
        Relationships: [];
      }
      user_certifications: {
        Row: {
          id: string;
          user_id: string;
          status: string | null;
          submission_video_url: string | null;
          feedback: string | null;
          attempt_number: number | null;
          submitted_at: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          approved_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        }
        Insert: {
          id?: string;
          user_id: string;
          status?: string | null;
          submission_video_url?: string | null;
          feedback?: string | null;
          attempt_number?: number | null;
          submitted_at?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          approved_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        }
        Update: {
          id?: string;
          user_id?: string;
          status?: string | null;
          submission_video_url?: string | null;
          feedback?: string | null;
          attempt_number?: number | null;
          submitted_at?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          approved_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        }
        Relationships: [];
      }
      video_library: {
        Row: {
          id: string;
          title: string;
          filename: string | null;
          mux_asset_id: string | null;
          mux_playback_id: string | null;
          duration_seconds: number | null;
          thumbnail_url: string | null;
          created_at: string | null;
          updated_at: string | null;
        }
        Insert: {
          id?: string;
          title: string;
          filename?: string | null;
          mux_asset_id?: string | null;
          mux_playback_id?: string | null;
          duration_seconds?: number | null;
          thumbnail_url?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        }
        Update: {
          id?: string;
          title?: string;
          filename?: string | null;
          mux_asset_id?: string | null;
          mux_playback_id?: string | null;
          duration_seconds?: number | null;
          thumbnail_url?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        }
        Relationships: [];
      }
      video_progress: {
        Row: {
          id: string;
          user_id: string;
          video_id: string;
          watched_seconds: number | null;
          duration_seconds: number | null;
          completed: boolean | null;
          completed_at: string | null;
          last_watched_at: string | null;
          created_at: string | null;
        }
        Insert: {
          id?: string;
          user_id: string;
          video_id: string;
          watched_seconds?: number | null;
          duration_seconds?: number | null;
          completed?: boolean | null;
          completed_at?: string | null;
          last_watched_at?: string | null;
          created_at?: string | null;
        }
        Update: {
          id?: string;
          user_id?: string;
          video_id?: string;
          watched_seconds?: number | null;
          duration_seconds?: number | null;
          completed?: boolean | null;
          completed_at?: string | null;
          last_watched_at?: string | null;
          created_at?: string | null;
        }
        Relationships: [];
      }
      videos: {
        Row: {
          id: string;
          module_id: string | null;
          title: string;
          description: string | null;
          video_url: string | null;
          thumbnail_url: string | null;
          duration_seconds: number | null;
          sort_order: number | null;
          is_free: boolean | null;
          is_published: boolean | null;
          transcript: string | null;
          created_at: string | null;
          updated_at: string | null;
          mux_playback_id: string | null;
          mux_asset_id: string | null;
          drip_days: number | null;
          type: string | null;
          text_content: string | null;
          video_library_id: string | null;
          content_json: Record<string, any> | null;
        }
        Insert: {
          id?: string;
          module_id?: string | null;
          title: string;
          description?: string | null;
          video_url?: string | null;
          thumbnail_url?: string | null;
          duration_seconds?: number | null;
          sort_order?: number | null;
          is_free?: boolean | null;
          is_published?: boolean | null;
          transcript?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          mux_playback_id?: string | null;
          mux_asset_id?: string | null;
          drip_days?: number | null;
          type?: string | null;
          text_content?: string | null;
          video_library_id?: string | null;
          content_json?: Record<string, any> | null;
        }
        Update: {
          id?: string;
          module_id?: string | null;
          title?: string;
          description?: string | null;
          video_url?: string | null;
          thumbnail_url?: string | null;
          duration_seconds?: number | null;
          sort_order?: number | null;
          is_free?: boolean | null;
          is_published?: boolean | null;
          transcript?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          mux_playback_id?: string | null;
          mux_asset_id?: string | null;
          drip_days?: number | null;
          type?: string | null;
          text_content?: string | null;
          video_library_id?: string | null;
          content_json?: Record<string, any> | null;
        }
        Relationships: [];
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}

export type Video = Database['public']['Tables']['videos']['Row'];
export type VideoProgress = Database['public']['Tables']['video_progress']['Row'];
export type Module = Database['public']['Tables']['modules']['Row'];

export interface VideoWithProgress extends Video {
  video_progress: VideoProgress | null;
  module?: Module | null;
}


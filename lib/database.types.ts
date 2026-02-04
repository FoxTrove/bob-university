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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      certification_required_modules: {
        Row: {
          certification_id: string
          created_at: string | null
          id: string
          module_id: string
        }
        Insert: {
          certification_id: string
          created_at?: string | null
          id?: string
          module_id: string
        }
        Update: {
          certification_id?: string
          created_at?: string | null
          id?: string
          module_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certification_required_modules_certification_id_fkey"
            columns: ["certification_id"]
            isOneToOne: false
            referencedRelation: "certification_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certification_required_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      certification_settings: {
        Row: {
          badge_image_url: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          price_cents: number
          requires_review: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          badge_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          price_cents?: number
          requires_review?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Update: {
          badge_image_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          price_cents?: number
          requires_review?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      certification_ticket_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by_user_id: string
          assigned_to_user_id: string
          certification_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          notes: string | null
          redeemed_at: string | null
          salon_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by_user_id: string
          assigned_to_user_id: string
          certification_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          redeemed_at?: string | null
          salon_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by_user_id?: string
          assigned_to_user_id?: string
          certification_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          redeemed_at?: string | null
          salon_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certification_ticket_assignments_assigned_by_user_id_fkey"
            columns: ["assigned_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certification_ticket_assignments_assigned_to_user_id_fkey"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certification_ticket_assignments_certification_id_fkey"
            columns: ["certification_id"]
            isOneToOne: false
            referencedRelation: "certification_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certification_ticket_assignments_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_access: {
        Row: {
          collection_id: string
          created_at: string | null
          expires_at: string | null
          granted_at: string | null
          id: string
          notes: string | null
          source: string | null
          source_id: string | null
          user_id: string
        }
        Insert: {
          collection_id: string
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          id?: string
          notes?: string | null
          source?: string | null
          source_id?: string | null
          user_id: string
        }
        Update: {
          collection_id?: string
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          id?: string
          notes?: string | null
          source?: string | null
          source_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_access_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_videos: {
        Row: {
          collection_id: string
          created_at: string | null
          custom_description: string | null
          custom_title: string | null
          id: string
          sort_order: number | null
          video_id: string
        }
        Insert: {
          collection_id: string
          created_at?: string | null
          custom_description?: string | null
          custom_title?: string | null
          id?: string
          sort_order?: number | null
          video_id: string
        }
        Update: {
          collection_id?: string
          created_at?: string | null
          custom_description?: string | null
          custom_title?: string | null
          id?: string
          sort_order?: number | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_videos_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_videos_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          access_ends_at: string | null
          access_starts_at: string | null
          collection_type: string | null
          created_at: string | null
          description: string | null
          event_date: string | null
          event_location: string | null
          id: string
          is_published: boolean | null
          sort_order: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          access_ends_at?: string | null
          access_starts_at?: string | null
          collection_type?: string | null
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          event_location?: string | null
          id?: string
          is_published?: boolean | null
          sort_order?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          access_ends_at?: string | null
          access_starts_at?: string | null
          collection_type?: string | null
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          event_location?: string | null
          id?: string
          is_published?: boolean | null
          sort_order?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      community_bans: {
        Row: {
          banned_by: string
          banned_until: string | null
          created_at: string | null
          id: string
          reason: string
          user_id: string
        }
        Insert: {
          banned_by: string
          banned_until?: string | null
          created_at?: string | null
          id?: string
          reason: string
          user_id: string
        }
        Update: {
          banned_by?: string
          banned_until?: string | null
          created_at?: string | null
          id?: string
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_bans_banned_by_fkey"
            columns: ["banned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_bans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_comment_likes: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comment_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_comments: {
        Row: {
          content: string
          created_at: string | null
          hidden_at: string | null
          hidden_by: string | null
          id: string
          is_hidden: boolean | null
          likes_count: number | null
          parent_comment_id: string | null
          post_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          hidden_at?: string | null
          hidden_by?: string | null
          id?: string
          is_hidden?: boolean | null
          likes_count?: number | null
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          hidden_at?: string | null
          hidden_by?: string | null
          id?: string
          is_hidden?: boolean | null
          likes_count?: number | null
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_hidden_by_fkey"
            columns: ["hidden_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_mentions: {
        Row: {
          comment_id: string | null
          created_at: string | null
          id: string
          mentioned_by_user_id: string
          mentioned_user_id: string
          post_id: string | null
        }
        Insert: {
          comment_id?: string | null
          created_at?: string | null
          id?: string
          mentioned_by_user_id: string
          mentioned_user_id: string
          post_id?: string | null
        }
        Update: {
          comment_id?: string | null
          created_at?: string | null
          id?: string
          mentioned_by_user_id?: string
          mentioned_user_id?: string
          post_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_mentions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_mentions_mentioned_by_user_id_fkey"
            columns: ["mentioned_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_mentions_mentioned_user_id_fkey"
            columns: ["mentioned_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_mentions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          category: string | null
          comments_count: number | null
          content: string | null
          created_at: string | null
          hidden_at: string | null
          hidden_by: string | null
          hidden_reason: string | null
          id: string
          is_feedback_request: boolean | null
          is_hidden: boolean | null
          is_published: boolean | null
          likes_count: number | null
          media_urls: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          hidden_at?: string | null
          hidden_by?: string | null
          hidden_reason?: string | null
          id?: string
          is_feedback_request?: boolean | null
          is_hidden?: boolean | null
          is_published?: boolean | null
          likes_count?: number | null
          media_urls?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          hidden_at?: string | null
          hidden_by?: string | null
          hidden_reason?: string | null
          id?: string
          is_feedback_request?: boolean | null
          is_hidden?: boolean | null
          is_published?: boolean | null
          likes_count?: number | null
          media_urls?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_hidden_by_fkey"
            columns: ["hidden_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_reactions: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_reports: {
        Row: {
          action_taken: string | null
          comment_id: string | null
          created_at: string | null
          details: string | null
          id: string
          post_id: string | null
          reason: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          action_taken?: string | null
          comment_id?: string | null
          created_at?: string | null
          details?: string | null
          id?: string
          post_id?: string | null
          reason: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          action_taken?: string | null
          comment_id?: string | null
          created_at?: string | null
          details?: string | null
          id?: string
          post_id?: string | null
          reason?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          resend_id: string | null
          status: string | null
          subject: string | null
          template: string
          to_email: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          resend_id?: string | null
          status?: string | null
          subject?: string | null
          template: string
          to_email: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          resend_id?: string | null
          status?: string | null
          subject?: string | null
          template?: string
          to_email?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      entitlements: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: string | null
          status: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string | null
          status?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string | null
          status?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entitlements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          amount_paid_cents: number | null
          cancelled_at: string | null
          confirmed_at: string | null
          event_id: string
          id: string
          notes: string | null
          payment_id: string | null
          registered_at: string | null
          status: string | null
          ticket_type: string | null
          user_id: string
        }
        Insert: {
          amount_paid_cents?: number | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          event_id: string
          id?: string
          notes?: string | null
          payment_id?: string | null
          registered_at?: string | null
          status?: string | null
          ticket_type?: string | null
          user_id: string
        }
        Update: {
          amount_paid_cents?: number | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          event_id?: string
          id?: string
          notes?: string | null
          payment_id?: string | null
          registered_at?: string | null
          status?: string | null
          ticket_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          collection_id: string | null
          created_at: string | null
          description: string | null
          early_bird_deadline: string | null
          early_bird_price_cents: number | null
          event_date: string
          event_end_date: string | null
          id: string
          is_private: boolean | null
          is_published: boolean | null
          location: string | null
          max_capacity: number | null
          poster_url: string | null
          price_cents: number | null
          private_event_request_id: string | null
          promo_video_url: string | null
          registration_open: boolean | null
          salon_id: string | null
          stripe_price_id: string | null
          stripe_product_id: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          venue_address: string | null
          venue_name: string | null
        }
        Insert: {
          collection_id?: string | null
          created_at?: string | null
          description?: string | null
          early_bird_deadline?: string | null
          early_bird_price_cents?: number | null
          event_date: string
          event_end_date?: string | null
          id?: string
          is_private?: boolean | null
          is_published?: boolean | null
          location?: string | null
          max_capacity?: number | null
          poster_url?: string | null
          price_cents?: number | null
          private_event_request_id?: string | null
          promo_video_url?: string | null
          registration_open?: boolean | null
          salon_id?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          venue_address?: string | null
          venue_name?: string | null
        }
        Update: {
          collection_id?: string | null
          created_at?: string | null
          description?: string | null
          early_bird_deadline?: string | null
          early_bird_price_cents?: number | null
          event_date?: string
          event_end_date?: string | null
          id?: string
          is_private?: boolean | null
          is_published?: boolean | null
          location?: string | null
          max_capacity?: number | null
          poster_url?: string | null
          price_cents?: number | null
          private_event_request_id?: string | null
          promo_video_url?: string | null
          registration_open?: boolean | null
          salon_id?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          venue_address?: string | null
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_private_event_request_id_fkey"
            columns: ["private_event_request_id"]
            isOneToOne: false
            referencedRelation: "private_event_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      exit_surveys: {
        Row: {
          created_at: string | null
          details: string | null
          id: string
          plan: string | null
          reason: string
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          id?: string
          plan?: string | null
          reason: string
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          details?: string | null
          id?: string
          plan?: string | null
          reason?: string
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exit_surveys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          created_at: string | null
          description: string | null
          drip_buckets: Json | null
          drip_days: number | null
          id: string
          is_published: boolean | null
          sort_order: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          drip_buckets?: Json | null
          drip_days?: number | null
          id?: string
          is_published?: boolean | null
          sort_order?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          drip_buckets?: Json | null
          drip_days?: number | null
          id?: string
          is_published?: boolean | null
          sort_order?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_campaigns: {
        Row: {
          audience: string
          body: string
          created_at: string | null
          created_by: string | null
          deep_link: string | null
          failed_count: number | null
          id: string
          scheduled_for: string | null
          sent_at: string | null
          sent_count: number | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          audience: string
          body: string
          created_at?: string | null
          created_by?: string | null
          deep_link?: string | null
          failed_count?: number | null
          id?: string
          scheduled_for?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          audience?: string
          body?: string
          created_at?: string | null
          created_by?: string | null
          deep_link?: string | null
          failed_count?: number | null
          id?: string
          scheduled_for?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          certification_updates: boolean | null
          community_notifications: boolean | null
          created_at: string | null
          event_confirmations: boolean | null
          event_reminders: boolean | null
          id: string
          learning_updates: boolean | null
          newsletter: boolean | null
          payment_receipts: boolean | null
          progress_milestones: boolean | null
          promotional_emails: boolean | null
          subscription_updates: boolean | null
          tips_and_tutorials: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          certification_updates?: boolean | null
          community_notifications?: boolean | null
          created_at?: string | null
          event_confirmations?: boolean | null
          event_reminders?: boolean | null
          id?: string
          learning_updates?: boolean | null
          newsletter?: boolean | null
          payment_receipts?: boolean | null
          progress_milestones?: boolean | null
          promotional_emails?: boolean | null
          subscription_updates?: boolean | null
          tips_and_tutorials?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          certification_updates?: boolean | null
          community_notifications?: boolean | null
          created_at?: string | null
          event_confirmations?: boolean | null
          event_reminders?: boolean | null
          id?: string
          learning_updates?: boolean | null
          newsletter?: boolean | null
          payment_receipts?: boolean | null
          progress_milestones?: boolean | null
          promotional_emails?: boolean | null
          subscription_updates?: boolean | null
          tips_and_tutorials?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      private_event_invitations: {
        Row: {
          created_at: string
          event_id: string
          id: string
          invited_by_user_id: string
          invited_email: string | null
          invited_name: string | null
          invited_user_id: string | null
          responded_at: string | null
          response_message: string | null
          salon_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          invited_by_user_id: string
          invited_email?: string | null
          invited_name?: string | null
          invited_user_id?: string | null
          responded_at?: string | null
          response_message?: string | null
          salon_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          invited_by_user_id?: string
          invited_email?: string | null
          invited_name?: string | null
          invited_user_id?: string | null
          responded_at?: string | null
          response_message?: string | null
          salon_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "private_event_invitations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_event_invitations_invited_by_user_id_fkey"
            columns: ["invited_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_event_invitations_invited_user_id_fkey"
            columns: ["invited_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_event_invitations_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      private_event_requests: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          estimated_attendees: number
          event_type: string
          flexible_dates: boolean | null
          id: string
          location_type: string
          preferred_city: string | null
          preferred_end_date: string | null
          preferred_start_date: string
          requested_by_user_id: string
          salon_address: string | null
          salon_id: string
          scheduled_call_at: string | null
          special_requests: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          estimated_attendees: number
          event_type: string
          flexible_dates?: boolean | null
          id?: string
          location_type: string
          preferred_city?: string | null
          preferred_end_date?: string | null
          preferred_start_date: string
          requested_by_user_id: string
          salon_address?: string | null
          salon_id: string
          scheduled_call_at?: string | null
          special_requests?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          estimated_attendees?: number
          event_type?: string
          flexible_dates?: boolean | null
          id?: string
          location_type?: string
          preferred_city?: string | null
          preferred_end_date?: string | null
          preferred_start_date?: string
          requested_by_user_id?: string
          salon_address?: string | null
          salon_id?: string
          scheduled_call_at?: string | null
          special_requests?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "private_event_requests_requested_by_user_id_fkey"
            columns: ["requested_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_event_requests_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          community_level: number | null
          community_points: number | null
          created_at: string | null
          email: string
          full_name: string | null
          ghl_contact_id: string | null
          has_completed_onboarding: boolean | null
          id: string
          is_certified: boolean | null
          location: string | null
          push_token: string | null
          push_token_updated_at: string | null
          role: string | null
          salon_id: string | null
          skills_assessment: Json | null
          stripe_customer_id: string | null
          updated_at: string | null
          user_type: string | null
          years_experience: number | null
        }
        Insert: {
          avatar_url?: string | null
          community_level?: number | null
          community_points?: number | null
          created_at?: string | null
          email: string
          full_name?: string | null
          ghl_contact_id?: string | null
          has_completed_onboarding?: boolean | null
          id: string
          is_certified?: boolean | null
          location?: string | null
          push_token?: string | null
          push_token_updated_at?: string | null
          role?: string | null
          salon_id?: string | null
          skills_assessment?: Json | null
          stripe_customer_id?: string | null
          updated_at?: string | null
          user_type?: string | null
          years_experience?: number | null
        }
        Update: {
          avatar_url?: string | null
          community_level?: number | null
          community_points?: number | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          ghl_contact_id?: string | null
          has_completed_onboarding?: boolean | null
          id?: string
          is_certified?: boolean | null
          location?: string | null
          push_token?: string | null
          push_token_updated_at?: string | null
          role?: string | null
          salon_id?: string | null
          skills_assessment?: Json | null
          stripe_customer_id?: string | null
          updated_at?: string | null
          user_type?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_salon"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          amount_cents: number | null
          created_at: string | null
          currency: string | null
          external_id: string
          id: string
          metadata: Json | null
          product_id: string
          product_type: string
          source: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount_cents?: number | null
          created_at?: string | null
          currency?: string | null
          external_id: string
          id?: string
          metadata?: Json | null
          product_id: string
          product_type: string
          source: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number | null
          created_at?: string | null
          currency?: string | null
          external_id?: string
          id?: string
          metadata?: Json | null
          product_id?: string
          product_type?: string
          source?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          created_at: string | null
          id: string
          platform: string | null
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          platform?: string | null
          token: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          platform?: string | null
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_ledger: {
        Row: {
          amount_cents: number
          charge_id: string | null
          created_at: string | null
          currency: string
          external_id: string | null
          fee_cents: number | null
          id: string
          metadata: Json | null
          net_cents: number | null
          occurred_at: string
          payment_intent_id: string | null
          plan: string | null
          platform: string | null
          product_type: string
          source: string
          status: string
          subscription_id: string | null
          user_id: string | null
        }
        Insert: {
          amount_cents?: number
          charge_id?: string | null
          created_at?: string | null
          currency?: string
          external_id?: string | null
          fee_cents?: number | null
          id?: string
          metadata?: Json | null
          net_cents?: number | null
          occurred_at?: string
          payment_intent_id?: string | null
          plan?: string | null
          platform?: string | null
          product_type: string
          source: string
          status?: string
          subscription_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount_cents?: number
          charge_id?: string | null
          created_at?: string | null
          currency?: string
          external_id?: string | null
          fee_cents?: number | null
          id?: string
          metadata?: Json | null
          net_cents?: number | null
          occurred_at?: string
          payment_intent_id?: string | null
          plan?: string | null
          platform?: string | null
          product_type?: string
          source?: string
          status?: string
          subscription_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "revenue_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_certification_tickets: {
        Row: {
          available_tickets: number
          created_at: string | null
          id: string
          salon_id: string
          total_tickets: number
          updated_at: string | null
        }
        Insert: {
          available_tickets?: number
          created_at?: string | null
          id?: string
          salon_id: string
          total_tickets?: number
          updated_at?: string | null
        }
        Update: {
          available_tickets?: number
          created_at?: string | null
          id?: string
          salon_id?: string
          total_tickets?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salon_certification_tickets_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: true
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salon_invites: {
        Row: {
          access_code_id: string | null
          created_at: string | null
          expires_at: string
          id: string
          invited_by_user_id: string
          invited_user_id: string
          message: string | null
          responded_at: string | null
          salon_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          access_code_id?: string | null
          created_at?: string | null
          expires_at: string
          id?: string
          invited_by_user_id: string
          invited_user_id: string
          message?: string | null
          responded_at?: string | null
          salon_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          access_code_id?: string | null
          created_at?: string | null
          expires_at?: string
          id?: string
          invited_by_user_id?: string
          invited_user_id?: string
          message?: string | null
          responded_at?: string | null
          salon_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salon_invites_access_code_id_fkey"
            columns: ["access_code_id"]
            isOneToOne: false
            referencedRelation: "staff_access_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_invites_invited_by_user_id_fkey"
            columns: ["invited_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_invites_invited_user_id_fkey"
            columns: ["invited_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salon_invites_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salons: {
        Row: {
          created_at: string | null
          id: string
          max_staff: number | null
          name: string
          owner_id: string | null
          seat_subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          max_staff?: number | null
          name: string
          owner_id?: string | null
          seat_subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          max_staff?: number | null
          name?: string
          owner_id?: string | null
          seat_subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salons_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_access_codes: {
        Row: {
          code: string
          created_at: string | null
          expires_at: string | null
          id: string
          invite_sent_at: string | null
          invited_email: string | null
          max_uses: number | null
          owner_id: string
          salon_id: string | null
          updated_at: string | null
          used_count: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invite_sent_at?: string | null
          invited_email?: string | null
          max_uses?: number | null
          owner_id: string
          salon_id?: string | null
          updated_at?: string | null
          used_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invite_sent_at?: string | null
          invited_email?: string | null
          max_uses?: number | null
          owner_id?: string
          salon_id?: string | null
          updated_at?: string | null
          used_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_access_codes_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      stylist_profiles: {
        Row: {
          bio: string | null
          booking_url: string | null
          city: string | null
          contact_email: string | null
          country: string | null
          created_at: string | null
          display_name: string
          id: string
          instagram_handle: string | null
          is_public: boolean | null
          latitude: number | null
          longitude: number | null
          phone: string | null
          profile_photo_url: string | null
          salon_name: string | null
          state: string | null
          updated_at: string | null
          user_id: string
          zip_code: string | null
        }
        Insert: {
          bio?: string | null
          booking_url?: string | null
          city?: string | null
          contact_email?: string | null
          country?: string | null
          created_at?: string | null
          display_name: string
          id?: string
          instagram_handle?: string | null
          is_public?: boolean | null
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          profile_photo_url?: string | null
          salon_name?: string | null
          state?: string | null
          updated_at?: string | null
          user_id: string
          zip_code?: string | null
        }
        Update: {
          bio?: string | null
          booking_url?: string | null
          city?: string | null
          contact_email?: string | null
          country?: string | null
          created_at?: string | null
          display_name?: string
          id?: string
          instagram_handle?: string | null
          is_public?: boolean | null
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          profile_photo_url?: string | null
          salon_name?: string | null
          state?: string | null
          updated_at?: string | null
          user_id?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stylist_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          amount_cents: number
          apple_product_id: string | null
          created_at: string
          currency: string
          description: string | null
          features: Json | null
          google_product_id: string | null
          id: string
          interval: string
          is_active: boolean
          plan: string
          stripe_price_id: string
          stripe_product_id: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          apple_product_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json | null
          google_product_id?: string | null
          id?: string
          interval?: string
          is_active?: boolean
          plan: string
          stripe_price_id: string
          stripe_product_id: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          apple_product_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json | null
          google_product_id?: string | null
          id?: string
          interval?: string
          is_active?: boolean
          plan?: string
          stripe_price_id?: string
          stripe_product_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscription_records: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          external_id: string | null
          id: string
          paused_at: string | null
          plan: string | null
          provider_metadata: Json | null
          source: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          external_id?: string | null
          id?: string
          paused_at?: string | null
          plan?: string | null
          provider_metadata?: Json | null
          source: string
          status: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          external_id?: string | null
          id?: string
          paused_at?: string | null
          plan?: string | null
          provider_metadata?: Json | null
          source?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_certifications: {
        Row: {
          approved_at: string | null
          attempt_number: number | null
          certification_id: string
          created_at: string | null
          feedback: string | null
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          submission_video_url: string | null
          submitted_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          attempt_number?: number | null
          certification_id: string
          created_at?: string | null
          feedback?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          submission_video_url?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approved_at?: string | null
          attempt_number?: number | null
          certification_id?: string
          created_at?: string | null
          feedback?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          submission_video_url?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_certifications_certification_id_fkey"
            columns: ["certification_id"]
            isOneToOne: false
            referencedRelation: "certification_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_certifications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_certifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      video_library: {
        Row: {
          created_at: string | null
          duration_seconds: number | null
          filename: string | null
          id: string
          mux_asset_id: string | null
          mux_playback_id: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          duration_seconds?: number | null
          filename?: string | null
          id?: string
          mux_asset_id?: string | null
          mux_playback_id?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number | null
          filename?: string | null
          id?: string
          mux_asset_id?: string | null
          mux_playback_id?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      video_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          duration_seconds: number | null
          id: string
          last_watched_at: string | null
          user_id: string
          video_id: string
          watched_seconds: number | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          last_watched_at?: string | null
          user_id: string
          video_id: string
          watched_seconds?: number | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          last_watched_at?: string | null
          user_id?: string
          video_id?: string
          watched_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "video_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_progress_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          content_json: Json | null
          created_at: string | null
          description: string | null
          drip_days: number | null
          duration_seconds: number | null
          id: string
          is_free: boolean | null
          is_published: boolean | null
          module_id: string | null
          mux_asset_id: string | null
          mux_playback_id: string | null
          sort_order: number | null
          text_content: string | null
          thumbnail_url: string | null
          title: string
          transcript: string | null
          type: string | null
          updated_at: string | null
          video_library_id: string | null
          video_url: string | null
        }
        Insert: {
          content_json?: Json | null
          created_at?: string | null
          description?: string | null
          drip_days?: number | null
          duration_seconds?: number | null
          id?: string
          is_free?: boolean | null
          is_published?: boolean | null
          module_id?: string | null
          mux_asset_id?: string | null
          mux_playback_id?: string | null
          sort_order?: number | null
          text_content?: string | null
          thumbnail_url?: string | null
          title: string
          transcript?: string | null
          type?: string | null
          updated_at?: string | null
          video_library_id?: string | null
          video_url?: string | null
        }
        Update: {
          content_json?: Json | null
          created_at?: string | null
          description?: string | null
          drip_days?: number | null
          duration_seconds?: number | null
          id?: string
          is_free?: boolean | null
          is_published?: boolean | null
          module_id?: string | null
          mux_asset_id?: string | null
          mux_playback_id?: string | null
          sort_order?: number | null
          text_content?: string | null
          thumbnail_url?: string | null
          title?: string
          transcript?: string | null
          type?: string | null
          updated_at?: string | null
          video_library_id?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "videos_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "videos_video_library_id_fkey"
            columns: ["video_library_id"]
            isOneToOne: false
            referencedRelation: "video_library"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_community_points: {
        Args: { points_to_add: number; user_id: string }
        Returns: undefined
      }
      calculate_community_level: { Args: { points: number }; Returns: number }
      get_level_thresholds: {
        Args: { current_level: number }
        Returns: {
          level_max: number
          level_min: number
          next_level: number
        }[]
      }
      get_pending_salon_invites_count: {
        Args: { user_uuid: string }
        Returns: number
      }
      get_user_role: { Args: never; Returns: string }
      has_active_subscription: { Args: { user_uuid: string }; Returns: boolean }
      is_user_banned: { Args: { check_user_id: string }; Returns: boolean }
      search_users_for_mention: {
        Args: { limit_count?: number; search_query: string }
        Returns: {
          avatar_url: string
          community_level: number
          full_name: string
          id: string
          is_certified: boolean
          is_ray: boolean
        }[]
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

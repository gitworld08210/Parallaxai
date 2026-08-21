// Supabase Database Types

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          cover_url: string | null;
          bio: string | null;
          verified: boolean;
          verification_kind: string | null;
          followers_count: number;
          following_count: number;
          posts_count: number;
          onboarded_at: string | null;
          interests: string[] | null;
          account_type: "personal" | "organization" | null;
          organization_id: string | null;
          is_creator: boolean | null;
          is_admin: boolean | null;
          is_founder: boolean | null;
          role: string | null;
          department: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          cover_url?: string | null;
          bio?: string | null;
          verified?: boolean;
          verification_kind?: string | null;
          followers_count?: number;
          following_count?: number;
          posts_count?: number;
          onboarded_at?: string | null;
          interests?: string[] | null;
          account_type?: "personal" | "organization" | null;
          organization_id?: string | null;
          is_creator?: boolean | null;
          is_admin?: boolean | null;
          is_founder?: boolean | null;
          role?: string | null;
          department?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          cover_url?: string | null;
          bio?: string | null;
          verified?: boolean;
          verification_kind?: string | null;
          followers_count?: number;
          following_count?: number;
          posts_count?: number;
          onboarded_at?: string | null;
          interests?: string[] | null;
          account_type?: "personal" | "organization" | null;
          organization_id?: string | null;
          is_creator?: boolean | null;
          is_admin?: boolean | null;
          is_founder?: boolean | null;
          role?: string | null;
          department?: string | null;
          updated_at?: string;
        };
      };
      communities: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category: string | null;
          logo_url: string | null;
          cover_url: string | null;
          creator_id: string;
          member_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          category?: string | null;
          logo_url?: string | null;
          cover_url?: string | null;
          creator_id: string;
          member_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          category?: string | null;
          logo_url?: string | null;
          cover_url?: string | null;
          creator_id?: string;
          member_count?: number;
          updated_at?: string;
        };
      };
      community_members: {
        Row: {
          community_id: string;
          user_id: string;
          role: "owner" | "admin" | "member";
          joined_at: string;
        };
        Insert: {
          community_id: string;
          user_id: string;
          role?: "owner" | "admin" | "member";
          joined_at?: string;
        };
        Update: {
          community_id?: string;
          user_id?: string;
          role?: "owner" | "admin" | "member";
          joined_at?: string;
        };
      };
      community_posts: {
        Row: {
          id: string;
          community_id: string;
          user_id: string;
          content: string | null;
          media_url: string | null;
          media_type: "image" | "video" | "audio" | null;
          likes_count: number;
          comments_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          community_id: string;
          user_id: string;
          content?: string | null;
          media_url?: string | null;
          media_type?: "image" | "video" | "audio" | null;
          likes_count?: number;
          comments_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          community_id?: string;
          user_id?: string;
          content?: string | null;
          media_url?: string | null;
          media_type?: "image" | "video" | "audio" | null;
          likes_count?: number;
          comments_count?: number;
          updated_at?: string;
        };
      };
      subscription_tiers: {
        Row: {
          id: string;
          creator_id: string;
          name: string;
          price: number;
          features: string[] | null;
          currency: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          name: string;
          price: number;
          features?: string[] | null;
          currency?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          name?: string;
          price?: number;
          features?: string[] | null;
          currency?: string;
          active?: boolean;
          updated_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          creator_id: string;
          subscriber_id: string;
          tier_id: string;
          status: "active" | "cancelled" | "past_due";
          started_at: string;
          current_period_end: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          subscriber_id: string;
          tier_id: string;
          status?: "active" | "cancelled" | "past_due";
          started_at?: string;
          current_period_end: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          subscriber_id?: string;
          tier_id?: string;
          status?: "active" | "cancelled" | "past_due";
          started_at?: string;
          current_period_end?: string;
          updated_at?: string;
        };
      };
      subscription_transactions: {
        Row: {
          id: string;
          subscription_id: string;
          amount: number;
          currency: string;
          status: string;
          stripe_session_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          subscription_id: string;
          amount: number;
          currency: string;
          status: string;
          stripe_session_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          subscription_id?: string;
          amount?: number;
          currency?: string;
          status?: string;
          stripe_session_id?: string | null;
          created_at?: string;
        };
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          target_type: "post" | "profile" | "comment";
          target_id: string;
          reason: string;
          status: "pending" | "reviewed" | "dismissed";
          reviewed_by: string | null;
          reviewed_at: string | null;
          action_taken: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          target_type: "post" | "profile" | "comment";
          target_id: string;
          reason: string;
          status?: "pending" | "reviewed" | "dismissed";
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          action_taken?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          target_type?: "post" | "profile" | "comment";
          target_id?: string;
          reason?: string;
          status?: "pending" | "reviewed" | "dismissed";
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          action_taken?: string | null;
          updated_at?: string;
        };
      };
      content_flags: {
        Row: {
          id: string;
          user_id: string;
          content_type: string;
          content_id: string;
          flag_type: string;
          severity: number;
          is_reviewed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content_type: string;
          content_id: string;
          flag_type: string;
          severity?: number;
          is_reviewed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content_type?: string;
          content_id?: string;
          flag_type?: string;
          severity?: number;
          is_reviewed?: boolean;
          created_at?: string;
        };
      };
      live_streams: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          stream_key: string;
          viewer_count: number;
          total_gifts: number;
          is_live: boolean;
          started_at: string | null;
          ended_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          stream_key: string;
          viewer_count?: number;
          total_gifts?: number;
          is_live?: boolean;
          started_at?: string | null;
          ended_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          stream_key?: string;
          viewer_count?: number;
          total_gifts?: number;
          is_live?: boolean;
          started_at?: string | null;
          ended_at?: string | null;
          created_at?: string;
        };
      };
      // --- Migrated Firestore collections ---
      posts: {
        Row: {
          id: string;
          user_id: string;
          content: string | null;
          media_url: string | null;
          media_type: "image" | "video" | "audio" | null;
          like_count: number;
          comment_count: number;
          view_count: number;
          created_at: string;
          is_reel: boolean;
          status: string;
          has_certificate: boolean;
          scheduled_for: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          content?: string | null;
          media_url?: string | null;
          media_type?: "image" | "video" | "audio" | null;
          like_count?: number;
          comment_count?: number;
          view_count?: number;
          created_at?: string;
          is_reel?: boolean;
          status?: string;
          has_certificate?: boolean;
          scheduled_for?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          content?: string | null;
          media_url?: string | null;
          media_type?: "image" | "video" | "audio" | null;
          like_count?: number;
          comment_count?: number;
          view_count?: number;
          created_at?: string;
          is_reel?: boolean;
          status?: string;
          has_certificate?: boolean;
          scheduled_for?: string | null;
        };
      };
      likes: {
        Row: {
          id: string;
          user_id: string;
          post_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          post_id?: string;
          created_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at: string;
          profile: Record<string, unknown> | null;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at?: string;
          profile?: Record<string, unknown> | null;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          content?: string;
          created_at?: string;
          profile?: Record<string, unknown> | null;
        };
      };
      stories: {
        Row: {
          id: string;
          user_id: string;
          media_url: string;
          media_type: "image" | "video";
          created_at: string;
          expires_at: string;
          viewers: string[] | null;
          reactions: Record<string, unknown>[] | null;
          profile: Record<string, unknown> | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          media_url: string;
          media_type: "image" | "video";
          created_at?: string;
          expires_at: string;
          viewers?: string[] | null;
          reactions?: Record<string, unknown>[] | null;
          profile?: Record<string, unknown> | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          media_url?: string;
          media_type?: "image" | "video";
          created_at?: string;
          expires_at?: string;
          viewers?: string[] | null;
          reactions?: Record<string, unknown>[] | null;
          profile?: Record<string, unknown> | null;
        };
      };
      follows: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          read: boolean;
          type: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          read?: boolean;
          type: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          read?: boolean;
          type?: string;
          content?: string;
          created_at?: string;
        };
      };
      unread_counts: {
        Row: {
          id: string;
          user_id: string;
          conversation_id: string;
          count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          conversation_id: string;
          count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          conversation_id?: string;
          count?: number;
          created_at?: string;
        };
      };
      saves: {
        Row: {
          id: string;
          user_id: string;
          post_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          post_id?: string;
          created_at?: string;
        };
      };
      wallets: {
        Row: {
          id: string;
          user_id: string;
          total: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          total?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          total?: number;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          sender_id: string;
          recipient_id: string;
          amount: number;
          type: string;
          post_id: string | null;
          message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          recipient_id: string;
          amount: number;
          type: string;
          post_id?: string | null;
          message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          recipient_id?: string;
          amount?: number;
          type?: string;
          post_id?: string | null;
          message?: string | null;
          created_at?: string;
        };
      };
      coin_purchases: {
        Row: {
          id: string;
          user_id: string;
          package_id: string | null;
          amount_inr: number;
          coins: number;
          utr_number: string | null;
          status: string;
          admin_note: string | null;
          created_at: string;
          approved_at: string | null;
          approved_by: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          package_id?: string | null;
          amount_inr: number;
          coins: number;
          utr_number?: string | null;
          status?: string;
          admin_note?: string | null;
          created_at?: string;
          approved_at?: string | null;
          approved_by?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          package_id?: string | null;
          amount_inr?: number;
          coins?: number;
          utr_number?: string | null;
          status?: string;
          admin_note?: string | null;
          created_at?: string;
          approved_at?: string | null;
          approved_by?: string | null;
        };
      };
      coin_topups: {
        Row: {
          id: string;
          user_id: string;
          coins: number;
          status: string;
          created_at: string;
          approved_at: string | null;
          reviewer_id: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          coins: number;
          status?: string;
          created_at?: string;
          approved_at?: string | null;
          reviewer_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          coins?: number;
          status?: string;
          created_at?: string;
          approved_at?: string | null;
          reviewer_id?: string | null;
        };
      };
      payment_settings: {
        Row: {
          id: string;
          upi_id: string | null;
          qr_url: string | null;
          payee_name: string | null;
        };
        Insert: {
          id?: string;
          upi_id?: string | null;
          qr_url?: string | null;
          payee_name?: string | null;
        };
        Update: {
          id?: string;
          upi_id?: string | null;
          qr_url?: string | null;
          payee_name?: string | null;
        };
      };
      verification_requests: {
        Row: {
          id: string;
          user_id: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          status?: string;
          created_at?: string;
        };
      };
      virtual_world_applications: {
        Row: {
          id: string;
          user_id: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          status?: string;
          created_at?: string;
        };
      };
      onboarding_sessions: {
        Row: {
          id: string;
          email: string;
          role: string | null;
          department: string | null;
          salary_offered: string | null;
          appointed_by: string | null;
          status: string;
          created_at: string;
          joining_letter_url: string | null;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          role?: string | null;
          department?: string | null;
          salary_offered?: string | null;
          appointed_by?: string | null;
          status?: string;
          created_at?: string;
          joining_letter_url?: string | null;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          role?: string | null;
          department?: string | null;
          salary_offered?: string | null;
          appointed_by?: string | null;
          status?: string;
          created_at?: string;
          joining_letter_url?: string | null;
          expires_at?: string | null;
        };
      };
      push_tokens: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          platform: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token: string;
          platform: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          token?: string;
          platform?: string;
          updated_at?: string;
        };
      };
      admin_audit_logs: {
        Row: {
          id: string;
          actor_user_id: string;
          module: string;
          action: string;
          target_type: string | null;
          target_id: string | null;
          before: Record<string, unknown> | null;
          after: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_user_id: string;
          module: string;
          action: string;
          target_type?: string | null;
          target_id?: string | null;
          before?: Record<string, unknown> | null;
          after?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_user_id?: string;
          module?: string;
          action?: string;
          target_type?: string | null;
          target_id?: string | null;
          before?: Record<string, unknown> | null;
          after?: Record<string, unknown> | null;
          created_at?: string;
        };
      };
      error_logs: {
        Row: {
          id: string;
          message: string;
          stack: string | null;
          user_id: string | null;
          page: string | null;
          timestamp: string;
          device: string | null;
          app_version: string | null;
          extra: Record<string, unknown> | null;
        };
        Insert: {
          id?: string;
          message: string;
          stack?: string | null;
          user_id?: string | null;
          page?: string | null;
          timestamp?: string;
          device?: string | null;
          app_version?: string | null;
          extra?: Record<string, unknown> | null;
        };
        Update: {
          id?: string;
          message?: string;
          stack?: string | null;
          user_id?: string | null;
          page?: string | null;
          timestamp?: string;
          device?: string | null;
          app_version?: string | null;
          extra?: Record<string, unknown> | null;
        };
      };
      conversations: {
        Row: {
          id: string;
          member_ids: string[];
          is_group: boolean;
          last_message_text: string | null;
          last_message_at: string | null;
          typing: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          member_ids: string[];
          is_group?: boolean;
          last_message_text?: string | null;
          last_message_at?: string | null;
          typing?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          member_ids?: string[];
          is_group?: boolean;
          last_message_text?: string | null;
          last_message_at?: string | null;
          typing?: Record<string, unknown> | null;
          created_at?: string;
        };
      };
      conversation_reads: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          unread_count: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          unread_count?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          user_id?: string;
          unread_count?: number;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          media_url: string | null;
          media_type: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          media_url?: string | null;
          media_type?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          content?: string;
          media_url?: string | null;
          media_type?: string | null;
          created_at?: string;
        };
      };
      usernames: {
        Row: {
          id: string;
          user_id: string;
          uid: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          uid: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          uid?: string;
          updated_at?: string;
        };
      };
      email_accounts: {
        Row: {
          id: string;
          email: string;
          count: number;
          last_uid: string | null;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          count?: number;
          last_uid?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          count?: number;
          last_uid?: string | null;
          updated_at?: string;
        };
      };
      config: {
        Row: {
          id: string;
          data: Record<string, unknown>;
        };
        Insert: {
          id: string;
          data: Record<string, unknown>;
        };
        Update: {
          id?: string;
          data?: Record<string, unknown>;
        };
      };
      coin_transactions: {
        Row: {
          id: string;
          user_id: string;
          kind: string;
          amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          kind: string;
          amount: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          kind?: string;
          amount?: number;
          created_at?: string;
        };
      };
      tips: {
        Row: {
          id: string;
          sender_id: string;
          recipient_id: string;
          amount_cents: number;
          net_cents: number;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          recipient_id: string;
          amount_cents: number;
          net_cents: number;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          recipient_id?: string;
          amount_cents?: number;
          net_cents?: number;
          status?: string;
          created_at?: string;
        };
      };
      live_gifts: {
        Row: {
          id: string;
          stream_id: string | null;
          gift_id: string | null;
          sender_id: string;
          coins_total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          stream_id?: string | null;
          gift_id?: string | null;
          sender_id: string;
          coins_total: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          stream_id?: string | null;
          gift_id?: string | null;
          sender_id?: string;
          coins_total?: number;
          created_at?: string;
        };
      };
      post_unlocks: {
        Row: {
          id: string;
          user_id: string;
          amount_cents: number;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount_cents: number;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount_cents?: number;
          status?: string;
          created_at?: string;
        };
      };
      creator_payout_requests: {
        Row: {
          id: string;
          user_id: string;
          amount_cents: number;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount_cents: number;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount_cents?: number;
          status?: string;
          created_at?: string;
        };
      };
      // --- Additional tables used in the app ---
      calls: {
        Row: {
          id: string;
          conversation_id: string;
          caller_id: string;
          callee_id: string;
          kind: string;
          status: string;
          started_at: string | null;
          ended_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          caller_id: string;
          callee_id: string;
          kind: string;
          status?: string;
          started_at?: string | null;
          ended_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          caller_id?: string;
          callee_id?: string;
          kind?: string;
          status?: string;
          started_at?: string | null;
          ended_at?: string | null;
          created_at?: string;
        };
      };
      call_signals: {
        Row: {
          id: string;
          call_id: string;
          from_user: string;
          to_user: string;
          kind: string;
          payload: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          call_id: string;
          from_user: string;
          to_user: string;
          kind: string;
          payload: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          call_id?: string;
          from_user?: string;
          to_user?: string;
          kind?: string;
          payload?: Record<string, unknown>;
          created_at?: string;
        };
      };
      blocks: {
        Row: {
          id: string;
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          blocker_id: string;
          blocked_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          blocker_id?: string;
          blocked_id?: string;
          created_at?: string;
        };
      };
      mutes: {
        Row: {
          id: string;
          user_id: string;
          muted_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          muted_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          muted_id?: string;
          created_at?: string;
        };
      };
      live_chat: {
        Row: {
          id: string;
          stream_id: string;
          user_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          stream_id: string;
          user_id: string;
          body: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          stream_id?: string;
          user_id?: string;
          body?: string;
          created_at?: string;
        };
      };
      live_tickets: {
        Row: {
          id: string;
          stream_id: string;
          user_id: string;
          coins_paid: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          stream_id: string;
          user_id: string;
          coins_paid: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          stream_id?: string;
          user_id?: string;
          coins_paid?: number;
          created_at?: string;
        };
      };
      gift_catalog: {
        Row: {
          id: string;
          name: string;
          icon: string;
          cost_coins: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          icon: string;
          cost_coins: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          icon?: string;
          cost_coins?: number;
          created_at?: string;
        };
      };
      creator_subscriptions: {
        Row: {
          id: string;
          subscriber_id: string;
          creator_id: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          subscriber_id: string;
          creator_id: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          subscriber_id?: string;
          creator_id?: string;
          status?: string;
          created_at?: string;
        };
      };
      user_interests: {
        Row: {
          id: string;
          user_id: string;
          interest: string;
          weight: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          interest: string;
          weight?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          interest?: string;
          weight?: number;
          created_at?: string;
        };
      };
      ads_user_interests: {
        Row: {
          id: string;
          user_id: string;
          interest: string;
          score: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          interest: string;
          score?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          interest?: string;
          score?: number;
          created_at?: string;
        };
      };
      content_context: {
        Row: {
          id: string;
          post_id: string;
          context: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          context: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          context?: Record<string, unknown>;
          created_at?: string;
        };
      };
      content_taxonomy: {
        Row: {
          id: string;
          post_id: string;
          tags: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          tags: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          tags?: string[];
          created_at?: string;
        };
      };
      ledger: {
        Row: {
          id: string;
          user_id: string;
          kind: string;
          amount: number;
          balance_after: number;
          reference_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          kind: string;
          amount: number;
          balance_after: number;
          reference_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          kind?: string;
          amount?: number;
          balance_after?: number;
          reference_id?: string | null;
          created_at?: string;
        };
      };
      story_stickers: {
        Row: {
          id: string;
          story_id: string;
          type: string;
          data: Record<string, unknown>;
          position_x: number;
          position_y: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          story_id: string;
          type: string;
          data: Record<string, unknown>;
          position_x: number;
          position_y: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          story_id?: string;
          type?: string;
          data?: Record<string, unknown>;
          position_x?: number;
          position_y?: number;
          created_at?: string;
        };
      };
      virtual_world_access: {
        Row: {
          id: string;
          user_id: string;
          granted_at: string;
          status: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          granted_at?: string;
          status?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          granted_at?: string;
          status?: string;
        };
      };
      virtual_world_logs: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          data: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          data?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: string;
          data?: Record<string, unknown> | null;
          created_at?: string;
        };
      };
    };
  };
};

// TODO: The following tables still lack type definitions and use `as any` casts
// when accessed via supabase.from(). They should be added in a future type-generation pass:
// - close_friends
// - post_collaborators
// - platform_settings
// - sup_tickets
// - login_events
// - engagement_events
// - platform_activity
// - message_passcodes
// - story_sticker_responses
// - organization_settings

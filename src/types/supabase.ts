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
      wallets: {
        Row: {
          id: string;
          user_id: string;
          balance: number;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          balance?: number;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          balance?: number;
          currency?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          currency: string;
          type: "credit" | "debit";
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          currency: string;
          type: "credit" | "debit";
          description: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          currency?: string;
          type?: "credit" | "debit";
          description?: string;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string;
          data: any | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          body: string;
          data?: any | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          body?: string;
          data?: any | null;
          is_read?: boolean;
          created_at?: string;
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
      posts: {
        Row: {
          id: string;
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
          user_id?: string;
          content?: string | null;
          media_url?: string | null;
          media_type?: "image" | "video" | "audio" | null;
          likes_count?: number;
          comments_count?: number;
          updated_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          content: string;
          likes_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          content: string;
          likes_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          content?: string;
          likes_count?: number;
          updated_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          name: string | null;
          is_group: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name?: string | null;
          is_group?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          is_group?: boolean;
          created_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string | null;
          media_url: string | null;
          media_type: "image" | "video" | "audio" | "text" | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content?: string | null;
          media_url?: string | null;
          media_type?: "image" | "video" | "audio" | "text" | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          content?: string | null;
          media_url?: string | null;
          media_type?: "image" | "video" | "audio" | "text" | null;
          is_read?: boolean;
          created_at?: string;
        };
      };
      stories: {
        Row: {
          id: string;
          user_id: string;
          media_url: string;
          media_type: "image" | "video";
          expires_at: string;
          likes_count: number;
          views_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          media_url: string;
          media_type: "image" | "video";
          expires_at: string;
          likes_count?: number;
          views_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          media_url?: string;
          media_type?: "image" | "video";
          expires_at?: string;
          likes_count?: number;
          views_count?: number;
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
          is_live?: boolean;
          started_at?: string | null;
          ended_at?: string | null;
          created_at?: string;
        };
      };
      coin_purchases: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          currency: string;
          status: "pending" | "completed" | "failed";
          stripe_session_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          currency: string;
          status?: "pending" | "completed" | "failed";
          stripe_session_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          currency?: string;
          status?: "pending" | "completed" | "failed";
          stripe_session_id?: string | null;
          created_at?: string;
        };
      };
    };
  };
};

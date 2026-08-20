import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/types/supabase";

type Community = Database["public"]["Tables"]["communities"]["Row"];
type CommunityMember = Database["public"]["Tables"]["community_members"]["Row"];
type CommunityPost = Database["public"]["Tables"]["community_posts"]["Row"];

export const communityService = {
  // Get all communities
  async getAllCommunities(): Promise<Community[] | null> {
    const { data, error } = await supabase
      .from("communities")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get community by ID
  async getCommunityById(communityId: string): Promise<Community | null> {
    const { data, error } = await supabase
      .from("communities")
      .select("*")
      .eq("id", communityId)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  // Create a new community
  async createCommunity(data: {
    name: string;
    description?: string;
    category?: string;
    logo_url?: string;
    cover_url?: string;
    creator_id: string;
  }): Promise<Community | null> {
    const { data: community, error } = await supabase
      .from("communities")
      .insert({
        name: data.name,
        description: data.description,
        category: data.category,
        logo_url: data.logo_url,
        cover_url: data.cover_url,
        creator_id: data.creator_id,
        member_count: 1,
      })
      .select()
      .maybeSingle();

    if (error) throw error;

    // Add creator as owner
    if (community) {
      await supabase.from("community_members").insert({
        community_id: community.id,
        user_id: data.creator_id,
        role: "owner",
        joined_at: new Date().toISOString(),
      });
    }

    return community;
  },

  // Update community
  async updateCommunity(
    communityId: string,
    data: Partial<{
      name: string;
      description: string;
      category: string;
      logo_url: string;
      cover_url: string;
    }>
  ): Promise<Community | null> {
    const { data: updatedCommunity, error } = await supabase
      .from("communities")
      .update(data)
      .eq("id", communityId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return updatedCommunity;
  },

  // Delete community
  async deleteCommunity(communityId: string): Promise<void> {
    const { error } = await supabase
      .from("communities")
      .delete()
      .eq("id", communityId);

    if (error) throw error;
  },

  // Add member to community
  async addMember(
    communityId: string,
    userId: string,
    role: "owner" | "admin" | "member" = "member"
  ): Promise<void> {
    const { error } = await supabase.from("community_members").insert({
      community_id: communityId,
      user_id: userId,
      role,
      joined_at: new Date().toISOString(),
    });

    if (error) throw error;

    // Update member count
    await supabase.rpc("increment_member_count", { community_id: communityId });
  },

  // Remove member from community
  async removeMember(communityId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from("community_members")
      .delete()
      .eq("community_id", communityId)
      .eq("user_id", userId);

    if (error) throw error;
  },

  // Get community members
  async getMembers(communityId: string): Promise<CommunityMember[]> {
    const { data, error } = await supabase
      .from("community_members")
      .select("*")
      .eq("community_id", communityId);

    if (error) throw error;
    return data;
  },

  // Check if user is member
  async isMember(communityId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("community_members")
      .select("count")
      .eq("community_id", communityId)
      .eq("user_id", userId)
      .single();

    if (error) throw error;
    return (data.count as number) > 0;
  },

  // Get community posts
  async getPosts(communityId: string): Promise<CommunityPost[]> {
    const { data, error } = await supabase
      .from("community_posts")
      .select("*")
      .eq("community_id", communityId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Create post in community
  async createPost(data: {
    community_id: string;
    user_id: string;
    content?: string;
    media_url?: string;
    media_type?: "image" | "video" | "audio";
  }): Promise<CommunityPost | null> {
    const { data: post, error } = await supabase
      .from("community_posts")
      .insert(data)
      .select()
      .maybeSingle();

    if (error) throw error;
    return post;
  },

  // Update post
  async updatePost(postId: string, data: Partial<CommunityPost>): Promise<CommunityPost | null> {
    const { data: updatedPost, error } = await supabase
      .from("community_posts")
      .update(data)
      .eq("id", postId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return updatedPost;
  },

  // Delete post
  async deletePost(postId: string): Promise<void> {
    const { error } = await supabase
      .from("community_posts")
      .delete()
      .eq("id", postId);

    if (error) throw error;
  },
};

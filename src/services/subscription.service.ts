import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/types/supabase";

type SubscriptionTier = Database["public"]["Tables"]["subscription_tiers"]["Row"];
type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
type SubscriptionTransaction = Database["public"]["Tables"]["subscription_transactions"]["Row"];

export const subscriptionService = {
  // Get all subscription tiers for a creator
  async getCreatorTiers(creatorId: string): Promise<SubscriptionTier[]> {
    const { data, error } = await supabase
      .from("subscription_tiers")
      .select("*")
      .eq("creator_id", creatorId)
      .order("price", { ascending: true });

    if (error) throw error;
    return data;
  },

  // Get tier by ID
  async getTierById(tierId: string): Promise<SubscriptionTier | null> {
    const { data, error } = await supabase
      .from("subscription_tiers")
      .select("*")
      .eq("id", tierId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Create tier
  async createTier(data: {
    creator_id: string;
    name: string;
    price: number;
    features?: string[];
    currency?: string;
    active?: boolean;
  }): Promise<SubscriptionTier | null> {
    const { data: tier, error } = await supabase
      .from("subscription_tiers")
      .insert({
        creator_id: data.creator_id,
        name: data.name,
        price: data.price,
        features: data.features,
        currency: data.currency || "USD",
        active: data.active ?? true,
      })
      .select()
      .maybeSingle();

    if (error) throw error;
    return tier;
  },

  // Update tier
  async updateTier(tierId: string, data: Partial<SubscriptionTier>): Promise<SubscriptionTier | null> {
    const { data: updatedTier, error } = await supabase
      .from("subscription_tiers")
      .update(data)
      .eq("id", tierId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return updatedTier;
  },

  // Delete tier (soft delete by setting active to false)
  async deleteTier(tierId: string): Promise<void> {
    const { error } = await supabase
      .from("subscription_tiers")
      .update({ active: false })
      .eq("id", tierId);

    if (error) throw error;
  },

  // Get user subscriptions
  async getUserSubscriptions(userId: string): Promise<Subscription[]> {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .or(`subscriber_id.eq.${userId},creator_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get creator's subscribers
  async getCreatorSubscribers(creatorId: string): Promise<Subscription[]> {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("creator_id", creatorId)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Subscribe to a tier
  async subscribe(data: {
    creator_id: string;
    subscriber_id: string;
    tier_id: string;
  }): Promise<Subscription | null> {
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .insert({
        creator_id: data.creator_id,
        subscriber_id: data.subscriber_id,
        tier_id: data.tier_id,
        status: "active",
        started_at: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      })
      .select()
      .maybeSingle();

    if (error) throw error;
    return subscription;
  },

  // Cancel subscription
  async cancelSubscription(subscriptionId: string): Promise<void> {
    const { error } = await supabase
      .from("subscriptions")
      .update({ status: "cancelled" })
      .eq("id", subscriptionId);

    if (error) throw error;
  },

  // Reactivate subscription
  async reactivateSubscription(subscriptionId: string): Promise<void> {
    const { error } = await supabase
      .from("subscriptions")
      .update({ status: "active" })
      .eq("id", subscriptionId);

    if (error) throw error;
  },

  // Create transaction
  async createTransaction(data: {
    subscription_id: string;
    amount: number;
    currency: string;
    status: string;
    stripe_session_id?: string;
  }): Promise<SubscriptionTransaction | null> {
    const { data: transaction, error } = await supabase
      .from("subscription_transactions")
      .insert(data)
      .select()
      .maybeSingle();

    if (error) throw error;
    return transaction;
  },

  // Get transaction by subscription
  async getTransactionsBySubscription(subscriptionId: string): Promise<SubscriptionTransaction[]> {
    const { data, error } = await supabase
      .from("subscription_transactions")
      .select("*")
      .eq("subscription_id", subscriptionId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },
};

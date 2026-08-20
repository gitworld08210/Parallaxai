import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { subscriptionService } from "@/services/subscription.service";
import { useAuth } from "@/contexts/AuthProvider";

// Hook to get creator tiers
export const useCreatorTiers = (creatorId: string) => {
  return useQuery({
    queryKey: ["creatorTiers", creatorId],
    queryFn: () => subscriptionService.getCreatorTiers(creatorId),
    enabled: !!creatorId,
  });
};

// Hook to get a specific tier
export const useTier = (tierId: string) => {
  return useQuery({
    queryKey: ["tier", tierId],
    queryFn: () => subscriptionService.getTierById(tierId),
    enabled: !!tierId,
  });
};

// Hook to get user subscriptions
export const useUserSubscriptions = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["userSubscriptions", user?.id],
    queryFn: () => subscriptionService.getUserSubscriptions(user!.id),
    enabled: !!user?.id,
  });
};

// Hook to get creator subscribers
export const useCreatorSubscribers = (creatorId: string) => {
  return useQuery({
    queryKey: ["creatorSubscribers", creatorId],
    queryFn: () => subscriptionService.getCreatorSubscribers(creatorId),
    enabled: !!creatorId,
  });
};

// Hook to subscribe to a tier
export const useSubscribeToTier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: subscriptionService.subscribe,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["creatorTiers", variables.creator_id] });
      queryClient.invalidateQueries({ queryKey: ["userSubscriptions", variables.subscriber_id] });
    },
  });
};

// Hook to cancel subscription
export const useCancelSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: subscriptionService.cancelSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userSubscriptions"] });
    },
  });
};

// Hook to create subscription tier
export const useCreateTier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: subscriptionService.createTier,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["creatorTiers", variables.creator_id] });
    },
  });
};

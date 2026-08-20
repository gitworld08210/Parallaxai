import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { communityService } from "@/services/community.service";
import { useAuth } from "@/contexts/AuthProvider";

// Hook to get all communities
export const useCommunities = () => {
  return useQuery({
    queryKey: ["communities"],
    queryFn: () => communityService.getAllCommunities(),
  });
};

// Hook to get a specific community
export const useCommunity = (communityId: string) => {
  return useQuery({
    queryKey: ["community", communityId],
    queryFn: () => communityService.getCommunityById(communityId),
    enabled: !!communityId,
  });
};

// Hook to get community posts
export const useCommunityPosts = (communityId: string) => {
  return useQuery({
    queryKey: ["communityPosts", communityId],
    queryFn: () => communityService.getPosts(communityId),
    enabled: !!communityId,
  });
};

// Hook to create a community
export const useCreateCommunity = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: communityService.createCommunity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
    },
  });
};

// Hook to join a community
export const useJoinCommunity = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ communityId, userId }: { communityId: string; userId: string }) =>
      communityService.addMember(communityId, userId, "member"),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["community", variables.communityId] });
      queryClient.invalidateQueries({ queryKey: ["communities"] });
    },
  });
};

// Hook to leave a community
export const useLeaveCommunity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ communityId, userId }: { communityId: string; userId: string }) =>
      communityService.removeMember(communityId, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["community", variables.communityId] });
      queryClient.invalidateQueries({ queryKey: ["communities"] });
    },
  });
};

// Hook to create a post in a community
export const useCreateCommunityPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: communityService.createPost,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["communityPosts", variables.community_id] });
    },
  });
};

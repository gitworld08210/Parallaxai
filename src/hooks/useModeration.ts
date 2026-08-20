import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { moderationService } from "@/services/moderation.service";

// Hook to get pending reports
export const usePendingReports = () => {
  return useQuery({
    queryKey: ["pendingReports"],
    queryFn: () => moderationService.getPendingReports(),
  });
};

// Hook to get report by ID
export const useReport = (reportId: string) => {
  return useQuery({
    queryKey: ["report", reportId],
    queryFn: () => moderationService.getReportById(reportId),
    enabled: !!reportId,
  });
};

// Hook to get moderation queue
export const useModerationQueue = () => {
  return useQuery({
    queryKey: ["moderationQueue"],
    queryFn: () => moderationService.getModerationQueue(),
  });
};

// Hook to get unreviewed flags count
export const useUnreviewedFlagsCount = () => {
  return useQuery({
    queryKey: ["unreviewedFlagsCount"],
    queryFn: () => moderationService.getUnreviewedFlagsCount(),
  });
};

// Hook to create report
export const useCreateReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: moderationService.createReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingReports"] });
      queryClient.invalidateQueries({ queryKey: ["unreviewedFlagsCount"] });
    },
  });
};

// Hook to review report
export const useReviewReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: moderationService.reviewReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingReports"] });
      queryClient.invalidateQueries({ queryKey: ["unreviewedFlagsCount"] });
    },
  });
};

// Hook to dismiss report
export const useDismissReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: moderationService.dismissReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingReports"] });
      queryClient.invalidateQueries({ queryKey: ["unreviewedFlagsCount"] });
    },
  });
};

// Hook to flag content (auto-classification)
export const useFlagContent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: moderationService.flagContent,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contentFlags", variables.content_type, variables.content_id] });
      queryClient.invalidateQueries({ queryKey: ["unreviewedFlagsCount"] });
    },
  });
};

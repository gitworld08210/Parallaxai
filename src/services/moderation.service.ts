import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/types/supabase";

type Report = Database["public"]["Tables"]["reports"]["Row"];
type ContentFlag = Database["public"]["Tables"]["content_flags"]["Row"];

export const moderationService = {
  // Create a report
  async createReport(data: {
    reporter_id: string;
    target_type: "post" | "profile" | "comment";
    target_id: string;
    reason: string;
  }): Promise<Report | null> {
    const { data: report, error } = await supabase
      .from("reports")
      .insert({
        reporter_id: data.reporter_id,
        target_type: data.target_type,
        target_id: data.target_id,
        reason: data.reason,
        status: "pending",
      })
      .select()
      .maybeSingle();

    if (error) throw error;

    // Auto-flag the content
    await supabase.from("content_flags").insert({
      user_id: data.reporter_id,
      content_type: data.target_type,
      content_id: data.target_id,
      flag_type: "user_report",
      severity: 1,
      is_reviewed: false,
    });

    return report;
  },

  // Get pending reports
  async getPendingReports(): Promise<Report[]> {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get report by ID
  async getReportById(reportId: string): Promise<Report | null> {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("id", reportId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Review report
  async reviewReport(
    reportId: string,
    data: {
      reviewed_by: string;
      action_taken?: string;
    }
  ): Promise<Report | null> {
    const { data: updatedReport, error } = await supabase
      .from("reports")
      .update({
        status: "reviewed",
        reviewed_by: data.reviewed_by,
        reviewed_at: new Date().toISOString(),
        action_taken: data.action_taken,
      })
      .eq("id", reportId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return updatedReport;
  },

  // Dismiss report
  async dismissReport(reportId: string, reviewedBy: string): Promise<void> {
    const { error } = await supabase
      .from("reports")
      .update({
        status: "dismissed",
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", reportId);

    if (error) throw error;
  },

  // Get content flags
  async getContentFlags(contentType: string, contentId: string): Promise<ContentFlag[]> {
    const { data, error } = await supabase
      .from("content_flags")
      .select("*")
      .eq("content_type", contentType)
      .eq("content_id", contentId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  // Flag content (auto-classification)
  async flagContent(data: {
    user_id: string;
    content_type: string;
    content_id: string;
    flag_type: string;
    severity?: number;
  }): Promise<ContentFlag | null> {
    const { data: flag, error } = await supabase
      .from("content_flags")
      .insert({
        user_id: data.user_id,
        content_type: data.content_type,
        content_id: data.content_id,
        flag_type: data.flag_type,
        severity: data.severity || 1,
        is_reviewed: false,
      })
      .select()
      .maybeSingle();

    if (error) throw error;
    return flag;
  },

  // Mark content as reviewed
  async markContentAsReviewed(contentType: string, contentId: string): Promise<void> {
    const { error } = await supabase
      .from("content_flags")
      .update({ is_reviewed: true })
      .eq("content_type", contentType)
      .eq("content_id", contentId);

    if (error) throw error;
  },

  // Get unreviewed flags count
  async getUnreviewedFlagsCount(): Promise<number> {
    const { count, error } = await supabase
      .from("content_flags")
      .select("*", { count: "exact", head: true })
      .eq("is_reviewed", false);

    if (error) throw error;
    return (count as number) || 0;
  },

  // Get moderation queue (unreviewed flags)
  async getModerationQueue(): Promise<ContentFlag[]> {
    const { data, error } = await supabase
      .from("content_flags")
      .select("*")
      .eq("is_reviewed", false)
      .order("severity", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },
};

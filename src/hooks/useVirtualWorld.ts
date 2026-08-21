import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useCallback } from "react";

import { useAuth } from "@/contexts/AuthProvider";
import { uploadToCloudinary } from "@/lib/cloudinary";


export type VwApplication = {
  id: string;
  user_id: string;
  full_name: string;
  aadhaar_number: string;
  aadhaar_front_path: string | null;
  aadhaar_back_path: string | null;
  selfie_path: string | null;
  purpose: string;
  contact_phone: string | null;
  status: string;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type VwAccess = {
  user_id: string;
  is_active: boolean;
  daily_limit: number;
};

export type VwLog = {
  id: string;
  channel: string;
  to_number: string;
  body: string | null;
  status: string;
  error: string | null;
  created_at: string;
};

export const useVirtualWorld = () => {
  const { user } = useAuth();
  const [application, setApplication] = useState<VwApplication | null>(null);
  const [access, setAccess] = useState<VwAccess | null>(null);
  const [logs, setLogs] = useState<VwLog[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setApplication(null);
      setAccess(null);
      setLogs([]);
      setLoading(false);
      return;
    }
    
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      
      const { data: appData } = await supabase.from('virtual_world_applications' as any).select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1);
      const { data: accessData } = await supabase.from('virtual_world_access' as any).select('*').eq('user_id', user.id).limit(1);
      const { data: logsData } = await supabase.from('virtual_world_logs' as any).select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30);
      
      setApplication((appData as any[] || []).length > 0 ? (appData as any[])[0] as VwApplication : null);
      setAccess((accessData as any[] || []).length > 0 ? (accessData as any[])[0] as VwAccess : null);
      setLogs((logsData as any[] || []) as VwLog[]);
    } catch (err) {
      console.error("Error fetching virtual world data:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { application, access, logs, loading, refresh };
};

export const uploadKycFile = async (userId: string, kind: string, file: File) => {
  return await uploadToCloudinary(file);

};

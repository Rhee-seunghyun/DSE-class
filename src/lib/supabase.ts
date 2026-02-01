import { supabase } from "@/integrations/supabase/client";

export type AppRole = 'master' | 'speaker' | 'student';

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  license_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export async function getUserRole(userId: string): Promise<AppRole | null> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();
  
  if (error || !data) return null;
  return data.role as AppRole;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error || !data) return null;
  return data as UserProfile;
}

export async function logSecurityEvent(
  userId: string | null,
  lectureId: string | null,
  eventType: string,
  lectureTitle?: string,
  userEmail?: string
) {
  const { error } = await supabase
    .from('security_logs')
    .insert({
      user_id: userId,
      lecture_id: lectureId,
      event_type: eventType,
      lecture_title: lectureTitle,
      user_email: userEmail,
      user_agent: navigator.userAgent,
    });
  
  if (error) {
    console.error('Failed to log security event:', error);
  }
}

export { supabase };

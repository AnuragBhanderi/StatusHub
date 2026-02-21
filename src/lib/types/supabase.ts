export interface UserPreferences {
  id: string;
  user_id: string;
  theme: string;
  compact: boolean;
  my_stack: string[];
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  push_enabled: boolean;
  email_enabled: boolean;
  email_address: string | null;
  severity_threshold: "all" | "outages_only" | "major_only";
  created_at: string;
  updated_at: string;
}

export interface ServiceStatusSnapshot {
  id: string;
  service_slug: string;
  status: string;
  incident_title: string | null;
  snapshot_at: string;
}

export interface EmailAlertLog {
  id: string;
  user_id: string;
  service_slug: string;
  old_status: string;
  new_status: string;
  sent_at: string;
}

export interface Database {
  public: {
    Tables: {
      user_preferences: {
        Row: UserPreferences;
        Insert: {
          id?: string;
          user_id: string;
          theme?: string;
          compact?: boolean;
          my_stack?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          theme?: string;
          compact?: boolean;
          my_stack?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notification_preferences: {
        Row: NotificationPreferences;
        Insert: {
          id?: string;
          user_id: string;
          push_enabled?: boolean;
          email_enabled?: boolean;
          email_address?: string | null;
          severity_threshold?: "all" | "outages_only" | "major_only";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          push_enabled?: boolean;
          email_enabled?: boolean;
          email_address?: string | null;
          severity_threshold?: "all" | "outages_only" | "major_only";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      service_status_snapshots: {
        Row: ServiceStatusSnapshot;
        Insert: {
          id?: string;
          service_slug: string;
          status: string;
          incident_title?: string | null;
          snapshot_at?: string;
        };
        Update: {
          id?: string;
          service_slug?: string;
          status?: string;
          incident_title?: string | null;
          snapshot_at?: string;
        };
        Relationships: [];
      };
      email_alert_log: {
        Row: EmailAlertLog;
        Insert: {
          id?: string;
          user_id: string;
          service_slug: string;
          old_status: string;
          new_status: string;
          sent_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          service_slug?: string;
          old_status?: string;
          new_status?: string;
          sent_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

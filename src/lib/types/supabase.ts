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
  severity_threshold: string;
  created_at: string;
  updated_at: string;
}

export interface IncidentSnapshotEntry {
  id: string;
  status: string;
  impact: string;
  updateCount: number;
}

export interface ServiceStatusSnapshot {
  id: string;
  service_slug: string;
  status: string;
  incident_title: string | null;
  incidents_json: IncidentSnapshotEntry[] | null;
  snapshot_at: string;
}

export interface EmailAlertLog {
  id: string;
  user_id: string;
  service_slug: string;
  old_status: string;
  new_status: string;
  event_type: string;
  sent_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  lemon_squeezy_customer_id: string | null;
  lemon_squeezy_subscription_id: string | null;
  plan: "free" | "pro";
  status: "active" | "cancelled" | "past_due" | "expired" | "paused";
  current_period_end: string | null;
  cancel_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  service_slugs: string[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
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
          severity_threshold?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          push_enabled?: boolean;
          email_enabled?: boolean;
          email_address?: string | null;
          severity_threshold?: string;
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
          incidents_json?: IncidentSnapshotEntry[] | null;
          snapshot_at?: string;
        };
        Update: {
          id?: string;
          service_slug?: string;
          status?: string;
          incident_title?: string | null;
          incidents_json?: IncidentSnapshotEntry[] | null;
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
          event_type?: string;
          sent_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          service_slug?: string;
          old_status?: string;
          new_status?: string;
          event_type?: string;
          sent_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: Subscription;
        Insert: {
          id?: string;
          user_id: string;
          lemon_squeezy_customer_id?: string | null;
          lemon_squeezy_subscription_id?: string | null;
          plan?: "free" | "pro";
          status?: "active" | "cancelled" | "past_due" | "expired" | "paused";
          current_period_end?: string | null;
          cancel_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          lemon_squeezy_customer_id?: string | null;
          lemon_squeezy_subscription_id?: string | null;
          plan?: "free" | "pro";
          status?: "active" | "cancelled" | "past_due" | "expired" | "paused";
          current_period_end?: string | null;
          cancel_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: Project;
        Insert: {
          id?: string;
          user_id: string;
          name?: string;
          slug: string;
          service_slugs?: string[];
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          slug?: string;
          service_slugs?: string[];
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
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

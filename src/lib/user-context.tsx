"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import type { User, Session, SupabaseClient } from "@supabase/supabase-js";
import type { ThemeKey } from "@/config/themes";
import type { Project } from "@/lib/types/supabase";
import type { Plan, PromoInfo } from "@/lib/subscription";
import { getActiveServiceInfo, type ActiveServiceInfo } from "@/lib/subscription";

// Event-based toast so user-context can fire toasts without being inside ToastProvider
type ToastType = "error" | "success" | "info";
type ToastListener = (message: string, type: ToastType) => void;
const toastListeners: ToastListener[] = [];
const pendingToasts: { message: string; type: ToastType }[] = [];
export function onToast(listener: ToastListener) {
  toastListeners.push(listener);
  // Flush any toasts that fired before the listener was registered
  if (pendingToasts.length > 0) {
    pendingToasts.forEach(({ message, type }) => listener(message, type));
    pendingToasts.length = 0;
  }
  return () => {
    const idx = toastListeners.indexOf(listener);
    if (idx >= 0) toastListeners.splice(idx, 1);
  };
}
function fireToast(message: string, type: ToastType = "error") {
  if (toastListeners.length === 0) {
    pendingToasts.push({ message, type });
    return;
  }
  toastListeners.forEach((fn) => fn(message, type));
}

const SUPABASE_ENABLED =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export interface NotificationPrefs {
  pushEnabled: boolean;
  emailEnabled: boolean;
  emailAddress: string;
  severityThreshold: string;
}

interface UserContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isSupabaseEnabled: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
  preferences: {
    theme: ThemeKey;
    compact: boolean;
    sort: "status" | "name" | "category";
  };
  setTheme: (theme: ThemeKey) => void;
  setCompact: (compact: boolean) => void;
  setSort: (sort: "status" | "name" | "category") => void;
  // Projects (replaces My Stack)
  plan: Plan;
  promoInfo: PromoInfo | null;
  projects: Project[];
  activeProjectId: string | null;
  activeProjectSlugs: string[];
  setActiveProject: (id: string) => void;
  addServiceToProject: (slug: string, projectId?: string) => Promise<boolean>;
  removeServiceFromProject: (slug: string, projectId?: string) => Promise<void>;
  isInActiveProject: (slug: string) => boolean;
  createProject: (name: string) => Promise<Project | null>;
  deleteProject: (id: string) => Promise<boolean>;
  renameProject: (id: string, name: string) => Promise<boolean>;
  reorderProjectServices: (projectId: string, newSlugs: string[]) => Promise<boolean>;
  setDefaultProject: (id: string) => Promise<boolean>;
  refreshProjects: () => Promise<void>;
  activeServiceInfo: ActiveServiceInfo;
  wasProTrial: boolean;
  showUpgradeModal: boolean;
  setShowUpgradeModal: (show: boolean) => void;
  // Notification preferences
  notificationPrefs: NotificationPrefs;
  setPushEnabled: (enabled: boolean) => void;
  setEmailEnabled: (enabled: boolean) => void;
  setEmailAddress: (addr: string) => void;
  setSeverityThreshold: (threshold: string) => void;
  saveNotificationPrefs: (prefs: {
    push_enabled: boolean;
    email_enabled: boolean;
    email_address: string;
    severity_threshold: string;
  }) => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>;

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabaseRef = useRef<AnySupabaseClient | null>(null);

  // Preferences state
  const [theme, setThemeState] = useState<ThemeKey>("dark");
  const [compact, setCompactState] = useState(false);
  const [sort, setSortState] = useState<"status" | "name" | "category">("status");

  // Projects state (replaces myStack)
  const [plan, setPlan] = useState<Plan>("free");
  const [promoInfo, setPromoInfo] = useState<PromoInfo | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectIdState] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [wasProTrial, setWasProTrial] = useState(false);

  // Notification preferences state
  const [pushEnabled, setPushEnabledState] = useState(false);
  const [emailEnabled, setEmailEnabledState] = useState(false);
  const [emailAddress, setEmailAddressState] = useState("");
  const [severityThreshold, setSeverityThresholdState] = useState("all");

  // Derive active project's service slugs
  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0] || null;
  const activeProjectSlugs = activeProject?.service_slugs || [];

  // Derive which services are active vs frozen based on plan limits
  const activeServiceInfo = useMemo(
    () => getActiveServiceInfo(projects, plan),
    [projects, plan]
  );

  function loadFromLocalStorage() {
    if (typeof window === "undefined") return;
    const savedTheme = localStorage.getItem("statushub_theme") as ThemeKey | null;
    if (savedTheme) setThemeState(savedTheme);
    const savedCompact = localStorage.getItem("statushub_compact");
    if (savedCompact === "true") setCompactState(true);
    const savedSort = localStorage.getItem("statushub_sort") as "status" | "name" | "category" | null;
    if (savedSort && ["status", "name", "category"].includes(savedSort)) setSortState(savedSort);

    // Load notification prefs from localStorage
    const savedPush = localStorage.getItem("statushub_push_enabled");
    if (savedPush === "true") setPushEnabledState(true);
    const savedEmail = localStorage.getItem("statushub_email_enabled");
    if (savedEmail === "true") setEmailEnabledState(true);
    const savedAddr = localStorage.getItem("statushub_email_address");
    if (savedAddr) setEmailAddressState(savedAddr);
    const savedThreshold = localStorage.getItem("statushub_severity_threshold");
    if (savedThreshold) setSeverityThresholdState(savedThreshold);

    // Load active project ID from localStorage
    const savedActiveProject = localStorage.getItem("statushub_active_project");
    if (savedActiveProject) setActiveProjectIdState(savedActiveProject);
  }

  // Load preferences via server API route
  async function loadFromAPI() {
    try {
      const res = await fetch("/api/preferences");
      if (!res.ok) {
        fireToast("Failed to load preferences (HTTP " + res.status + ")");
        loadFromLocalStorage();
        return;
      }
      const data = await res.json();

      if (data.preferences) {
        setThemeState(data.preferences.theme as ThemeKey);
        setCompactState(data.preferences.compact);
        localStorage.setItem("statushub_theme", data.preferences.theme);
        localStorage.setItem("statushub_compact", data.preferences.compact ? "true" : "false");
      } else {
        // No preferences in DB yet — use localStorage and save to DB
        loadFromLocalStorage();
        await savePreferencesToAPI({
          theme: localStorage.getItem("statushub_theme") || "dark",
          compact: localStorage.getItem("statushub_compact") === "true",
        });
      }

      // Load plan
      if (data.plan) {
        setPlan(data.plan);
      }

      // Load promo info
      setPromoInfo(data.promoInfo || null);

      // Load wasProTrial flag for downgrade detection
      if (data.wasProTrial) {
        setWasProTrial(true);
      }

      // Load projects
      if (data.projects && data.projects.length > 0) {
        setProjects(data.projects);
        // Set active project: use saved preference, or default project, or first
        const savedActiveProject = localStorage.getItem("statushub_active_project");
        const matchesSaved = savedActiveProject && data.projects.some((p: Project) => p.id === savedActiveProject);
        if (matchesSaved) {
          setActiveProjectIdState(savedActiveProject);
        } else {
          const defaultProject = data.projects.find((p: Project) => p.is_default) || data.projects[0];
          setActiveProjectIdState(defaultProject.id);
          localStorage.setItem("statushub_active_project", defaultProject.id);
        }
      }

      if (data.notificationPreferences) {
        setPushEnabledState(data.notificationPreferences.push_enabled ?? false);
        setEmailEnabledState(data.notificationPreferences.email_enabled ?? false);
        setEmailAddressState(data.notificationPreferences.email_address ?? "");
        setSeverityThresholdState(data.notificationPreferences.severity_threshold ?? "all");
      }
    } catch {
      fireToast("Network error loading preferences");
      loadFromLocalStorage();
    }
  }

  // Save preferences via server API route
  async function savePreferencesToAPI(updates: {
    theme?: string;
    compact?: boolean;
  }) {
    try {
      const res = await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: updates }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        fireToast("Failed to save: " + (data.errors?.join(", ") || res.statusText));
      }
    } catch {
      fireToast("Network error saving preferences");
    }
  }

  // Save notification preferences via server API route
  async function saveNotificationPrefsToAPI(prefs: {
    push_enabled: boolean;
    email_enabled: boolean;
    email_address: string;
    severity_threshold: string;
  }) {
    try {
      const res = await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationPreferences: prefs }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        fireToast("Failed to save: " + (data.errors?.join(", ") || res.statusText));
      }
    } catch {
      fireToast("Network error saving notification settings");
    }
  }

  // Initialize
  useEffect(() => {
    if (!SUPABASE_ENABLED) {
      loadFromLocalStorage();
      setIsLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    import("@/lib/supabase/client").then(({ createClient }) => {
      const client = createClient();
      supabaseRef.current = client;

      // Use getUser() to validate session, then load preferences via API
      client.auth.getUser().then(async ({ data: { user: u } }) => {
        if (u) {
          const { data: { session: s } } = await client.auth.getSession();
          setSession(s);
          setUser(u);
          await loadFromAPI();
        } else {
          setUser(null);
          setSession(null);
          loadFromLocalStorage();
        }
        setIsLoading(false);
      });

      const {
        data: { subscription },
      } = client.auth.onAuthStateChange(async (event, s) => {
        setSession(s);
        setUser(s?.user ?? null);

        if (event === "SIGNED_IN" && s?.user) {
          await loadFromAPI();
        }
        if (event === "SIGNED_OUT") {
          setPlan("free");
          setPromoInfo(null);
          setProjects([]);
          setActiveProjectIdState(null);
          loadFromLocalStorage();
        }
      });

      unsubscribe = () => subscription.unsubscribe();
    });

    return () => unsubscribe?.();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Save to localStorage + DB via API
  const savePreferences = useCallback(
    async (updates: {
      theme?: string;
      compact?: boolean;
    }) => {
      if (typeof window !== "undefined") {
        if (updates.theme !== undefined)
          localStorage.setItem("statushub_theme", updates.theme);
        if (updates.compact !== undefined)
          localStorage.setItem(
            "statushub_compact",
            updates.compact ? "true" : "false"
          );
      }

      if (user) {
        await savePreferencesToAPI(updates);
      }
    },
    [user]
  );

  // Save notification preferences to localStorage + DB via API
  const saveNotificationPrefs = useCallback(
    async (prefs: {
      push_enabled: boolean;
      email_enabled: boolean;
      email_address: string;
      severity_threshold: string;
    }) => {
      setPushEnabledState(prefs.push_enabled);
      setEmailEnabledState(prefs.email_enabled);
      setEmailAddressState(prefs.email_address);
      setSeverityThresholdState(prefs.severity_threshold);

      if (typeof window !== "undefined") {
        localStorage.setItem("statushub_push_enabled", prefs.push_enabled ? "true" : "false");
        localStorage.setItem("statushub_email_enabled", prefs.email_enabled ? "true" : "false");
        localStorage.setItem("statushub_email_address", prefs.email_address);
        localStorage.setItem("statushub_severity_threshold", prefs.severity_threshold);
      }

      if (user) {
        await saveNotificationPrefsToAPI(prefs);
      }
    },
    [user]
  );

  const setTheme = useCallback(
    (t: ThemeKey) => {
      setThemeState(t);
      savePreferences({ theme: t });
    },
    [savePreferences]
  );

  const setCompact = useCallback(
    (c: boolean) => {
      setCompactState(c);
      savePreferences({ compact: c });
    },
    [savePreferences]
  );

  const setSort = useCallback(
    (s: "status" | "name" | "category") => {
      setSortState(s);
      if (typeof window !== "undefined") {
        localStorage.setItem("statushub_sort", s);
      }
    },
    []
  );

  // --- Project management ---

  const setActiveProject = useCallback((id: string) => {
    setActiveProjectIdState(id);
    if (typeof window !== "undefined") {
      localStorage.setItem("statushub_active_project", id);
    }
  }, []);

  const refreshProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch {
      // silent
    }
  }, []);

  const isInActiveProject = useCallback(
    (slug: string) => activeProjectSlugs.includes(slug),
    [activeProjectSlugs]
  );

  const addServiceToProject = useCallback(
    async (slug: string, projectId?: string): Promise<boolean> => {
      const targetId = projectId || activeProjectId;
      const target = projects.find((p) => p.id === targetId);
      if (!target) return false;

      if (target.service_slugs.includes(slug)) return true; // already added

      const newSlugs = [...target.service_slugs, slug];

      // Optimistic update
      setProjects((prev) =>
        prev.map((p) => (p.id === targetId ? { ...p, service_slugs: newSlugs } : p))
      );

      try {
        const res = await fetch(`/api/projects/${targetId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ service_slugs: newSlugs }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          // Revert optimistic update
          setProjects((prev) =>
            prev.map((p) => (p.id === targetId ? { ...p, service_slugs: target.service_slugs } : p))
          );
          if (data.upgrade) {
            setShowUpgradeModal(true);
          } else {
            fireToast(data.error || "Failed to add service");
          }
          return false;
        }
        return true;
      } catch {
        // Revert
        setProjects((prev) =>
          prev.map((p) => (p.id === targetId ? { ...p, service_slugs: target.service_slugs } : p))
        );
        fireToast("Network error adding service");
        return false;
      }
    },
    [activeProjectId, projects]
  );

  const removeServiceFromProject = useCallback(
    async (slug: string, projectId?: string) => {
      const targetId = projectId || activeProjectId;
      const target = projects.find((p) => p.id === targetId);
      if (!target) return;

      const newSlugs = target.service_slugs.filter((s) => s !== slug);

      // Optimistic update
      setProjects((prev) =>
        prev.map((p) => (p.id === targetId ? { ...p, service_slugs: newSlugs } : p))
      );

      try {
        const res = await fetch(`/api/projects/${targetId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ service_slugs: newSlugs }),
        });

        if (!res.ok) {
          // Revert
          setProjects((prev) =>
            prev.map((p) => (p.id === targetId ? { ...p, service_slugs: target.service_slugs } : p))
          );
          fireToast("Failed to remove service");
        }
      } catch {
        // Revert
        setProjects((prev) =>
          prev.map((p) => (p.id === targetId ? { ...p, service_slugs: target.service_slugs } : p))
        );
        fireToast("Network error removing service");
      }
    },
    [activeProjectId, projects]
  );

  const createProject = useCallback(
    async (name: string): Promise<Project | null> => {
      try {
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, service_slugs: [] }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data.upgrade) {
            setShowUpgradeModal(true);
          } else {
            fireToast(data.error || "Failed to create project");
          }
          return null;
        }

        const data = await res.json();
        const newProject = data.project as Project;
        setProjects((prev) => [...prev, newProject]);
        return newProject;
      } catch {
        fireToast("Network error creating project");
        return null;
      }
    },
    []
  );

  const deleteProject = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          fireToast(data.error || "Failed to delete project");
          return false;
        }

        setProjects((prev) => prev.filter((p) => p.id !== id));
        // If we deleted the active project, switch to default
        if (activeProjectId === id) {
          const remaining = projects.filter((p) => p.id !== id);
          const defaultP = remaining.find((p) => p.is_default) || remaining[0];
          if (defaultP) {
            setActiveProject(defaultP.id);
          }
        }
        return true;
      } catch {
        fireToast("Network error deleting project");
        return false;
      }
    },
    [activeProjectId, projects, setActiveProject]
  );

  const renameProject = useCallback(
    async (id: string, name: string): Promise<boolean> => {
      try {
        const res = await fetch(`/api/projects/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });

        if (!res.ok) {
          fireToast("Failed to rename project");
          return false;
        }

        const data = await res.json();
        const updated = data.project;
        setProjects((prev) =>
          prev.map((p) => (p.id === id ? { ...p, name: updated.name, slug: updated.slug } : p))
        );
        return true;
      } catch {
        fireToast("Network error renaming project");
        return false;
      }
    },
    []
  );

  const reorderProjectServices = useCallback(
    async (projectId: string, newSlugs: string[]): Promise<boolean> => {
      const target = projects.find((p) => p.id === projectId);
      if (!target) return false;

      // Optimistic update
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, service_slugs: newSlugs } : p))
      );

      try {
        const res = await fetch(`/api/projects/${projectId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ service_slugs: newSlugs }),
        });

        if (!res.ok) {
          // Revert
          setProjects((prev) =>
            prev.map((p) => (p.id === projectId ? { ...p, service_slugs: target.service_slugs } : p))
          );
          fireToast("Failed to reorder services");
          return false;
        }
        return true;
      } catch {
        setProjects((prev) =>
          prev.map((p) => (p.id === projectId ? { ...p, service_slugs: target.service_slugs } : p))
        );
        fireToast("Network error reordering services");
        return false;
      }
    },
    [projects]
  );

  const setDefaultProject = useCallback(
    async (projectId: string): Promise<boolean> => {
      const oldProjects = [...projects];

      // Optimistic: mark this as default, unmark others
      setProjects((prev) =>
        prev.map((p) => ({ ...p, is_default: p.id === projectId }))
      );

      try {
        const res = await fetch(`/api/projects/${projectId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ set_default: true }),
        });

        if (!res.ok) {
          setProjects(oldProjects);
          fireToast("Failed to set default project");
          return false;
        }
        return true;
      } catch {
        setProjects(oldProjects);
        fireToast("Network error setting default project");
        return false;
      }
    },
    [projects]
  );

  // --- Notification setters ---

  const setPushEnabled = useCallback(
    (enabled: boolean) => {
      saveNotificationPrefs({
        push_enabled: enabled,
        email_enabled: emailEnabled,
        email_address: emailAddress,
        severity_threshold: severityThreshold,
      });
    },
    [saveNotificationPrefs, emailEnabled, emailAddress, severityThreshold]
  );

  const setEmailEnabled = useCallback(
    (enabled: boolean) => {
      saveNotificationPrefs({
        push_enabled: pushEnabled,
        email_enabled: enabled,
        email_address: emailAddress,
        severity_threshold: severityThreshold,
      });
    },
    [saveNotificationPrefs, pushEnabled, emailAddress, severityThreshold]
  );

  const setEmailAddress = useCallback(
    (addr: string) => {
      saveNotificationPrefs({
        push_enabled: pushEnabled,
        email_enabled: emailEnabled,
        email_address: addr,
        severity_threshold: severityThreshold,
      });
    },
    [saveNotificationPrefs, pushEnabled, emailEnabled, severityThreshold]
  );

  const setSeverityThreshold = useCallback(
    (threshold: string) => {
      saveNotificationPrefs({
        push_enabled: pushEnabled,
        email_enabled: emailEnabled,
        email_address: emailAddress,
        severity_threshold: threshold,
      });
    },
    [saveNotificationPrefs, pushEnabled, emailEnabled, emailAddress]
  );

  const signInWithGoogle = useCallback(async () => {
    const client = supabaseRef.current;
    if (!client) return;
    await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }, []);

  const signInWithGitHub = useCallback(async () => {
    const client = supabaseRef.current;
    if (!client) return;
    await client.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }, []);

  const signOutFn = useCallback(async () => {
    const client = supabaseRef.current;
    if (client) {
      client.auth.signOut({ scope: "local" }).catch(() => {});
    }
    // Manually clear all Supabase auth cookies
    document.cookie.split(";").forEach((c) => {
      const name = c.trim().split("=")[0];
      if (name.startsWith("sb-")) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      }
    });
    setUser(null);
    setSession(null);
    window.location.href = "/dashboard";
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        session,
        isLoading,
        isSupabaseEnabled: SUPABASE_ENABLED,
        signInWithGoogle,
        signInWithGitHub,
        signOut: signOutFn,
        preferences: { theme, compact, sort },
        setTheme,
        setCompact,
        setSort,
        // Projects
        plan,
        promoInfo,
        projects,
        activeProjectId: activeProject?.id || null,
        activeProjectSlugs,
        setActiveProject,
        addServiceToProject,
        removeServiceFromProject,
        isInActiveProject,
        createProject,
        deleteProject,
        renameProject,
        reorderProjectServices,
        setDefaultProject,
        refreshProjects,
        activeServiceInfo,
        wasProTrial,
        showUpgradeModal,
        setShowUpgradeModal,
        // Notifications
        notificationPrefs: {
          pushEnabled,
          emailEnabled,
          emailAddress,
          severityThreshold,
        },
        setPushEnabled,
        setEmailEnabled,
        setEmailAddress,
        setSeverityThreshold,
        saveNotificationPrefs,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

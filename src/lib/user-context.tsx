"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type { User, Session, SupabaseClient } from "@supabase/supabase-js";
import type { ThemeKey } from "@/config/themes";
import type { UserPreferences } from "@/lib/types/supabase";

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
    myStack: string[];
  };
  setTheme: (theme: ThemeKey) => void;
  setCompact: (compact: boolean) => void;
  toggleStack: (slug: string) => void;
  setMyStack: (stack: string[]) => void;
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
  const [myStack, setMyStackState] = useState<string[]>([]);

  // Notification preferences state
  const [pushEnabled, setPushEnabledState] = useState(false);
  const [emailEnabled, setEmailEnabledState] = useState(false);
  const [emailAddress, setEmailAddressState] = useState("");
  const [severityThreshold, setSeverityThresholdState] = useState("all");

  function loadFromLocalStorage() {
    if (typeof window === "undefined") return;
    const savedTheme = localStorage.getItem("statushub_theme") as ThemeKey | null;
    if (savedTheme) setThemeState(savedTheme);
    const savedStack = localStorage.getItem("statushub_my_stack");
    if (savedStack) {
      try {
        setMyStackState(JSON.parse(savedStack));
      } catch {
        /* ignore parse errors */
      }
    }
    const savedCompact = localStorage.getItem("statushub_compact");
    if (savedCompact === "true") setCompactState(true);

    // Load notification prefs from localStorage
    const savedPush = localStorage.getItem("statushub_push_enabled");
    if (savedPush === "true") setPushEnabledState(true);
    const savedEmail = localStorage.getItem("statushub_email_enabled");
    if (savedEmail === "true") setEmailEnabledState(true);
    const savedAddr = localStorage.getItem("statushub_email_address");
    if (savedAddr) setEmailAddressState(savedAddr);
    const savedThreshold = localStorage.getItem("statushub_severity_threshold");
    if (savedThreshold) setSeverityThresholdState(savedThreshold);
  }

  async function loadFromDatabase(client: AnySupabaseClient, userId: string) {
    const { data, error } = await client
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    const prefs = data as UserPreferences | null;
    if (prefs && !error) {
      setThemeState(prefs.theme as ThemeKey);
      setCompactState(prefs.compact);
      setMyStackState(prefs.my_stack);
    } else {
      loadFromLocalStorage();
    }

    // Load notification preferences
    const { data: notifData } = await client
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (notifData) {
      setPushEnabledState(notifData.push_enabled ?? false);
      setEmailEnabledState(notifData.email_enabled ?? false);
      setEmailAddressState(notifData.email_address ?? "");
      setSeverityThresholdState(notifData.severity_threshold ?? "all");
    }
  }

  async function migrateLocalStorageToDatabase(
    client: AnySupabaseClient,
    userId: string
  ) {
    const { data: existing } = await client
      .from("user_preferences")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (existing) {
      await loadFromDatabase(client, userId);
      return;
    }

    const localTheme = localStorage.getItem("statushub_theme") || "dark";
    const localCompact = localStorage.getItem("statushub_compact") === "true";
    let localStack: string[] = [];
    try {
      localStack = JSON.parse(
        localStorage.getItem("statushub_my_stack") || "[]"
      );
    } catch {
      /* ignore */
    }

    await client.from("user_preferences").insert({
      user_id: userId,
      theme: localTheme,
      compact: localCompact,
      my_stack: localStack,
    });

    setThemeState(localTheme as ThemeKey);
    setCompactState(localCompact);
    setMyStackState(localStack);
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

      client.auth.getSession().then(({ data: { session: s } }) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          loadFromDatabase(client, s.user.id).then(() => setIsLoading(false));
        } else {
          loadFromLocalStorage();
          setIsLoading(false);
        }
      });

      const {
        data: { subscription },
      } = client.auth.onAuthStateChange(async (event, s) => {
        setSession(s);
        setUser(s?.user ?? null);

        if (event === "SIGNED_IN" && s?.user) {
          await migrateLocalStorageToDatabase(client, s.user.id);
        }
        if (event === "SIGNED_OUT") {
          loadFromLocalStorage();
        }
      });

      unsubscribe = () => subscription.unsubscribe();
    });

    return () => unsubscribe?.();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Save to localStorage + DB
  const savePreferences = useCallback(
    async (updates: {
      theme?: string;
      compact?: boolean;
      my_stack?: string[];
    }) => {
      if (typeof window !== "undefined") {
        if (updates.theme !== undefined)
          localStorage.setItem("statushub_theme", updates.theme);
        if (updates.compact !== undefined)
          localStorage.setItem(
            "statushub_compact",
            updates.compact ? "true" : "false"
          );
        if (updates.my_stack !== undefined)
          localStorage.setItem(
            "statushub_my_stack",
            JSON.stringify(updates.my_stack)
          );
      }

      const client = supabaseRef.current;
      if (client && user) {
        await client
          .from("user_preferences")
          .upsert({ user_id: user.id, ...updates }, { onConflict: "user_id" });
      }
    },
    [user]
  );

  // Save notification preferences to localStorage + DB
  const saveNotificationPrefs = useCallback(
    (prefs: {
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

      const client = supabaseRef.current;
      if (client && user) {
        client
          .from("notification_preferences")
          .upsert(
            {
              user_id: user.id,
              push_enabled: prefs.push_enabled,
              email_enabled: prefs.email_enabled,
              email_address: prefs.email_address,
              severity_threshold: prefs.severity_threshold,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          )
          .then(() => {});
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

  const toggleStack = useCallback(
    (slug: string) => {
      setMyStackState((prev) => {
        const next = prev.includes(slug)
          ? prev.filter((s) => s !== slug)
          : [...prev, slug];
        savePreferences({ my_stack: next });
        return next;
      });
    },
    [savePreferences]
  );

  const setMyStack = useCallback(
    (stack: string[]) => {
      setMyStackState(stack);
      savePreferences({ my_stack: stack });
    },
    [savePreferences]
  );

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
    window.location.href = "/";
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
        preferences: { theme, compact, myStack },
        setTheme,
        setCompact,
        toggleStack,
        setMyStack,
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

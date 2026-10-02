import type { Session, User } from "@supabase/supabase-js";
import { vi } from "vitest";

import type { SupabaseClient } from "@/storage/supabase";

type AuthListener = (event: string, session: Session | null) => void;

export interface FakeUser {
  id?: string;
  email?: string;
  avatarUrl?: string;
}

/** A Supabase client faking only the auth calls and the RPC the app makes. */
export interface FakeSupabase {
  client: SupabaseClient;
  signInWithOAuth: ReturnType<typeof vi.fn>;
  signOut: ReturnType<typeof vi.fn>;
  rpc: ReturnType<typeof vi.fn>;
}

function aSession(user: FakeUser): Session {
  const sessionUser = {
    id: user.id ?? "user-1",
    email: user.email ?? "ada@example.com",
    user_metadata: user.avatarUrl === undefined ? {} : { avatar_url: user.avatarUrl },
  } as unknown as User; // safe: the app reads only id, email and user_metadata
  return { user: sessionUser } as unknown as Session; // safe: the app reads only session.user
}

/** Returns a fake client, signed in as `user` when one is given. */
export function aFakeSupabase(user?: FakeUser): FakeSupabase {
  let session: Session | null = user === undefined ? null : aSession(user);
  const listeners = new Set<AuthListener>();

  function emit(event: string) {
    for (const listener of listeners) {
      listener(event, session);
    }
  }

  const signInWithOAuth = vi.fn(() => Promise.resolve({ data: {}, error: null }));
  const signOut = vi.fn(() => {
    session = null;
    emit("SIGNED_OUT");
    return Promise.resolve({ error: null });
  });
  const rpc = vi.fn(() => Promise.resolve({ data: null, error: null }));

  const auth = {
    onAuthStateChange(listener: AuthListener) {
      listeners.add(listener);
      // Supabase reports the stored session once, right after subscribing.
      queueMicrotask(() => listener("INITIAL_SESSION", session));
      return { data: { subscription: { unsubscribe: () => listeners.delete(listener) } } };
    },
    signInWithOAuth,
    signOut,
  };

  const client = { auth, rpc } as unknown as SupabaseClient; // safe: covers every call the app makes
  return { client, signInWithOAuth, signOut, rpc };
}

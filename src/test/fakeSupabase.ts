import type { Session, User } from "@supabase/supabase-js";
import { vi } from "vitest";

import type { AccountService } from "@/storage/accountService";
import { createSupabaseAccountService, type SupabaseClient } from "@/storage/supabase";

type AuthListener = (event: string, session: Session | null) => void;

export interface FakeUser {
  id?: string;
  email?: string;
  avatarUrl?: string;
}

interface QueryResponse {
  data?: unknown;
  error: { message: string; code?: string } | null;
}

/** What the saves table answers each kind of query with; the default is an empty table. */
export interface FakeTableResponses {
  select?: QueryResponse;
  insert?: QueryResponse;
  update?: QueryResponse;
}

/** A Supabase client faking only the auth calls, the RPC and the saves queries the app makes. */
export interface FakeSupabase {
  client: SupabaseClient;
  /** The real Supabase AccountService over the fake client, for the app under test. */
  accountService: AccountService;
  signInWithOAuth: ReturnType<typeof vi.fn>;
  signOut: ReturnType<typeof vi.fn>;
  rpc: ReturnType<typeof vi.fn>;
  /** Called with the values of each insert. */
  insert: ReturnType<typeof vi.fn>;
  /** Called with the values of each update and the version it matched on. */
  update: ReturnType<typeof vi.fn>;
}

function aSession(user: FakeUser): Session {
  const sessionUser = {
    id: user.id ?? "user-1",
    email: user.email ?? "ada@example.com",
    user_metadata: user.avatarUrl === undefined ? {} : { avatar_url: user.avatarUrl },
  } as unknown as User; // safe: the app reads only id, email and user_metadata
  return { user: sessionUser } as unknown as Session; // safe: the app reads only session.user
}

/** Returns a fake client, signed in as `user` when one is given, over a saves table answering `table`. */
export function aFakeSupabase(user?: FakeUser, table: FakeTableResponses = {}): FakeSupabase {
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

  const insert = vi.fn(() => Promise.resolve(table.insert ?? { error: null }));
  const update = vi.fn();

  // Each method returns the next link of the query chain the app builds, ending in a promise.
  function from() {
    return {
      select: () => ({
        maybeSingle: () => Promise.resolve(table.select ?? { data: null, error: null }),
      }),
      insert,
      update: (values: unknown) => ({
        eq: (_column: string, version: unknown) => ({
          select: () => {
            update(values, version);
            return Promise.resolve(table.update ?? { data: [], error: null });
          },
        }),
      }),
    };
  }

  const client = { auth, rpc, from } as unknown as SupabaseClient; // safe: covers every call the app makes
  const accountService = createSupabaseAccountService(client);
  return { client, accountService, signInWithOAuth, signOut, rpc, insert, update };
}

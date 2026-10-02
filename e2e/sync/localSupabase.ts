import { execSync } from "node:child_process";

/** The local stack's address and its fixed development keys, never production's. */
export interface LocalSupabase {
  url: string;
  publishableKey: string;
  secretKey: string;
}

function readVariable(env: string, name: string): string {
  const match = new RegExp(`^${name}="?([^"\\n]*)"?$`, "m").exec(env);
  if (match?.[1] === undefined || match[1] === "") {
    throw new Error(
      `${name} is missing from \`supabase status -o env\`. Is \`pnpm supabase start\` running?`,
    );
  }
  return match[1];
}

/** Parses the output of `supabase status -o env`. */
export function readLocalSupabase(env: string): LocalSupabase {
  return {
    url: readVariable(env, "API_URL"),
    publishableKey: readVariable(env, "PUBLISHABLE_KEY"),
    secretKey: readVariable(env, "SECRET_KEY"),
  };
}

let cached: LocalSupabase | undefined;

/** Returns the running local stack, read once per test worker. */
export function localSupabase(): LocalSupabase {
  cached ??= readLocalSupabase(execSync("pnpm exec supabase status -o env", { encoding: "utf8" }));
  return cached;
}

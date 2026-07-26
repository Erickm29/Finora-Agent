import {
  GoalsService,
  GuardrailsService,
  MicrosavingsService,
  PendingActionsService,
  createInMemoryRepos,
  stubWallbit,
  type DomainRepos,
} from "@finora/domain";
import { createWallbitClient } from "./integrations/wallbit.js";
import { createSupabaseRepos } from "./persistence/supabase-repos.js";
import { env } from "./env.js";

let repos: DomainRepos | null = null;

export function getRepos(): DomainRepos {
  if (!repos) {
    const wallbit = createWallbitClient();
    if (env.useMemory) {
      repos = createInMemoryRepos(wallbit);
      console.info("[finora] Using in-memory store (local / no Supabase).");
    } else {
      repos = createSupabaseRepos({
        url: env.supabaseUrl,
        serviceRoleKey: env.supabaseServiceRoleKey,
        wallbit,
      });
      console.info("[finora] Using Supabase store (service role).");
    }
  }
  return repos;
}

export function services() {
  const r = getRepos();
  return {
    goals: new GoalsService(r),
    guardrails: new GuardrailsService(r),
    microsavings: new MicrosavingsService(r),
    pendingActions: new PendingActionsService(r),
    repos: r,
    wallbit: r.wallbit ?? stubWallbit,
  };
}

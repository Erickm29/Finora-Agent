import {
  GoalsService,
  GuardrailsService,
  MicrosavingsService,
  PendingActionsService,
  PreferencesService,
  createInMemoryRepos,
  stubWallbit,
  type DomainRepos,
} from "@finora/domain";
import { GoalInvestmentAnalysisService } from "./analysis/goal-investment-analysis.service.js";
import { createWallbitClient } from "./integrations/wallbit.js";
import { createSupabaseRepos } from "./persistence/supabase-repos.js";
import { env } from "./env.js";

let repos: DomainRepos | null = null;
let goalAnalysis: GoalInvestmentAnalysisService | null = null;

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

/**
 * Singleton: el servicio mantiene el registro de análisis en curso, así que no
 * puede reconstruirse en cada request.
 */
export function getGoalAnalysisService(): GoalInvestmentAnalysisService {
  if (!goalAnalysis) {
    goalAnalysis = new GoalInvestmentAnalysisService(getRepos());
  }
  return goalAnalysis;
}

export function services() {
  const r = getRepos();
  return {
    goals: new GoalsService(r),
    goalAnalysis: getGoalAnalysisService(),
    guardrails: new GuardrailsService(r),
    microsavings: new MicrosavingsService(r),
    pendingActions: new PendingActionsService(r),
    preferences: new PreferencesService(r),
    repos: r,
    wallbit: r.wallbit ?? stubWallbit,
  };
}

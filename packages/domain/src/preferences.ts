import {
  normalizeDigestPreferences,
  type DigestPreferences,
  type PatchPreferencesInput,
} from "@finora/shared";
import type { DomainRepos, Profile } from "./types.js";

export function preferencesOf(profile: Profile): DigestPreferences {
  return normalizeDigestPreferences(profile.preferences);
}

export class PreferencesService {
  constructor(private readonly repos: DomainRepos) {}

  async get(userId: string): Promise<DigestPreferences> {
    const profile = await this.repos.profiles.ensure(userId);
    return preferencesOf(profile);
  }

  async patch(
    userId: string,
    patch: PatchPreferencesInput,
  ): Promise<DigestPreferences> {
    await this.repos.profiles.ensure(userId);
    const updated = await this.repos.profiles.updatePreferences(userId, patch);
    return preferencesOf(updated);
  }
}

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PreferencesService } from "./preferences.js";
import { createInMemoryRepos } from "./memory.js";

describe("PreferencesService", () => {
  it("defaults and patches digest prefs", async () => {
    const repos = createInMemoryRepos();
    const prefs = new PreferencesService(repos);
    const userId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

    const initial = await prefs.get(userId);
    assert.equal(initial.digest_enabled, false);
    assert.equal(initial.digest_local_time, "08:00");
    assert.equal(initial.timezone, "America/La_Paz");

    const updated = await prefs.patch(userId, {
      digest_enabled: true,
      digest_local_time: "18:00",
    });
    assert.equal(updated.digest_enabled, true);
    assert.equal(updated.digest_local_time, "18:00");

    const again = await prefs.get(userId);
    assert.equal(again.digest_enabled, true);
    assert.equal(again.digest_local_time, "18:00");
  });
});

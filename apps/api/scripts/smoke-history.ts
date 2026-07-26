import { services } from "../src/container.ts";
import { runAgentTurn } from "../src/agent/runtime.ts";

const uid = "ffffffff-ffff-ffff-ffff-ffffffffffff";
const chat = "history-smoke-chat";

await services().repos.profiles.ensure(uid);

const t1 = await runAgentTurn({
  userId: uid,
  channel: "web",
  externalChatId: chat,
  text: "Hola, quiero una meta para un viaje a Santa Cruz",
});
console.log("T1", t1.sessionId, t1.replies[0]?.text.slice(0, 160));

const t2 = await runAgentTurn({
  userId: uid,
  channel: "web",
  externalChatId: chat,
  text: "¿De qué meta hablamos recién?",
});
console.log("T2", t2.sessionId, t2.replies[0]?.text.slice(0, 280));
console.log("SAME_SESSION", t1.sessionId === t2.sessionId);

const msgs = await services().repos.conversations.listRecentMessages(t1.sessionId, 20);
console.log(
  "MSG_COUNT",
  msgs.length,
  msgs.map((m) => `${m.role}:${m.content.slice(0, 40)}`),
);

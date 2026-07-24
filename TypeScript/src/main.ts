import { Bot } from "./bot";
import { BotRunner } from "./bot_logic/bot_runner";

const URL_REMOTE = "https://jg26.jdis.ca";

console.log("Starting JDIS Bot Client...");
void BotRunner.run(URL_REMOTE, Bot.TOKEN).catch((error) => {
  console.log(`[ERROR] Bot runner crashed: ${String(error)}`);
});

import * as MessageProtocol from "./client/message_protocol";
import { IBot } from "./bot_logic/ibot";
import { IStrategy } from "./strategies/strategy";
import { Orchestrator } from "./strategies/orchestrator";

export class Bot implements IBot {
	public static readonly TOKEN = "BOTA-KfwG-Fusq-4XbQ";

	private readonly strategy: IStrategy = new Orchestrator();

	public getNextAction(
		state: MessageProtocol.GameState,
	): MessageProtocol.ActionBase | null {
		const bot = state.Bot;
		if (!bot) {
			console.log("NO BOT");
			return null;
		}

		if (!state.Base) {
			console.log("NO BASE");
			console.log(JSON.stringify(state.Base));
			return null;
		}

		return this.strategy.getNextAction(state);
	}
}

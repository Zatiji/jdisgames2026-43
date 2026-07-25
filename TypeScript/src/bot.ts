import * as MessageProtocol from "./client/message_protocol";
import { IBot } from "./bot_logic/ibot";
import { MoveLeftStrategy } from "./strategies/move_left_strategy";
import { IStrategy } from "./strategies/strategy";
import {FetchStrategy} from "./strategies/fetch_strategy";
import {MoveAction, Position} from "./client/message_protocol";

export class Bot implements IBot {
	// EDIT THIS FOR YOUR OWN BOT TOKEN
	public static readonly TOKEN = "BOTA-KfwG-Fusq-4XbQ";

	// Swap this to try a different strategy (see src/strategies/).
	private readonly strategy: IStrategy = new FetchStrategy();

	public getNextAction(
		state: MessageProtocol.GameState,
	): MessageProtocol.ActionBase | null {
		const bot = state.Bot;
		if (!bot) {
			console.log("NO BOT")
			return null;
		}

		if (!state.Base) {
			console.log("NO BASE")
			console.log(JSON.stringify(state.Base))
			return null;
		}

		return this.strategy.getNextAction(state);
	}
}

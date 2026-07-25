import * as MessageProtocol from "./client/message_protocol";
import { IBot } from "./bot_logic/ibot";
import { GatherStrategy } from "./strategies/gather_strategy";
import { IStrategy } from "./strategies/strategy";

export class Bot implements IBot {
	// EDIT THIS FOR YOUR OWN BOT TOKEN
	public static readonly TOKEN = "BOTA-KfwG-Fusq-4XbQ";

	// Swap this to try a different strategy (see src/strategies/).
	private readonly strategy: IStrategy = new GatherStrategy();

	public getNextAction(
		state: MessageProtocol.GameState,
	): MessageProtocol.ActionBase | null {
		return this.strategy.getNextAction(state);
	}
}

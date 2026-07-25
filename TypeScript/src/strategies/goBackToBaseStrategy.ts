import {
	ActionBase,
	DepositToBaseAction,
	GameState,
} from "../client/message_protocol";
import { IStrategy } from "./strategy";

const GATHER_RANGE = 1;
const DEPOSIT_RANGE = 1;

// Basic "just go fetch things" strategy: gather whatever resource is
// closest, and deposit at base once the inventory is full.
export class GoBackToBaseStrategy implements IStrategy {
	public getNextAction(state: GameState): ActionBase | null {
		return new DepositToBaseAction();
	}
}

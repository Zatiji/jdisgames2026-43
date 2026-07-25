import { ActionBase, GameState, Position } from "../client/message_protocol";
import { stepInDirection } from "../helpers/queries";
import { IStrategy } from "./strategy";

const LEFT = new Position(-1, 0);

export class MoveLeftStrategy implements IStrategy {
  public getNextAction(state: GameState): ActionBase | null {
    const bot = state.Bot;
    if (!bot) {
      return null;
    }

    return stepInDirection(LEFT, bot.Position, state);
  }
}

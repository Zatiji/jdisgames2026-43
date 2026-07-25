import { ActionBase, GameState, MoveAction, Position } from "../client/message_protocol";
import { IStrategy } from "./strategy";

export class MoveLeftStrategy implements IStrategy {
  public getNextAction(state: GameState): ActionBase | null {
    const bot = state.Bot;
    if (!bot) {
      return null;
    }

    return new MoveAction(new Position(bot.Position.X - 1, bot.Position.Y));
  }
}

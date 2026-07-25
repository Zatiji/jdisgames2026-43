import { ActionBase, GameState } from "../client/message_protocol";

export interface IStrategy {
  getNextAction(state: GameState): ActionBase | null;
}

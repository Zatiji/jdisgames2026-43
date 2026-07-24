import { ActionBase, GameState } from "../client/message_protocol";

export interface IBot {
  getNextAction(state: GameState): ActionBase | null;
}

import { ActionBase, GameState, MoveAction, Position } from "../client/message_protocol";
import { IStrategy } from "./strategy";
import {nearestResource} from "../helpers/queries";

export class OctopussyStrategy implements IStrategy {
    public getNextAction(state: GameState): ActionBase | null {
        const bot = state.Bot;
        if (!bot) {
            return null;
        }

        return null;
    }
}

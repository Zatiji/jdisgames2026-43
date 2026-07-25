import { ActionBase, DepositToBaseAction, GameState, GatherNodeAction, MoveAction, RespawnAction } from "../client/message_protocol";
import { distance, isInventoryFull, nearestResource } from "../state/queries";
import { IStrategy } from "./strategy";

const GATHER_RANGE = 1;
const DEPOSIT_RANGE = 1;

export class GatherStrategy implements IStrategy {
  public getNextAction(state: GameState): ActionBase | null {
    const bot = state.Bot;
    if (!bot) {
      return null;
    }

    if (bot.Health <= 0) {
      return new RespawnAction();
    }

    if (isInventoryFull(bot) && state.Base) {
      if (distance(bot.Position, state.Base.Position) <= DEPOSIT_RANGE) {
        return new DepositToBaseAction();
      }

      return new MoveAction(state.Base.Position);
    }

    const resource = nearestResource(state, (r) => r.CurrentAmount > 0);
    if (!resource) {
      return null;
    }

    if (distance(bot.Position, resource.Position) <= GATHER_RANGE) {
      return new GatherNodeAction(resource.Position);
    }

    return new MoveAction(resource.Position);
  }
}

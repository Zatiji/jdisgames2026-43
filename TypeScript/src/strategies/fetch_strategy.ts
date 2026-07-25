import {
  ActionBase,
  DepositToBaseAction,
  GameState,
  GatherNodeAction,
  MoveAction,
  Position,
  RespawnAction
} from "../client/message_protocol";
import {distance, isInventoryFull, moveTowards, nearestResource} from "../state/queries";
import { IStrategy } from "./strategy";

const GATHER_RANGE = 1;
const DEPOSIT_RANGE = 1;

// Basic "just go fetch things" strategy: gather whatever resource is
// closest, and deposit at base once the inventory is full.
export class FetchStrategy implements IStrategy {
  public getNextAction(state: GameState): ActionBase | null {
    const bot = state.Bot;
    if (!bot) {
      console.log("NO BOT")
      return null;
    }

    if (bot.Health <= 0) {
      console.log("RESPAWNING")
      return new RespawnAction();
    }

    if (isInventoryFull(bot) && state.Base) {
      if (distance(bot.Position, state.Base.Position) <= DEPOSIT_RANGE) {
        console.log("DEPOSIT TO BASE")
        return new DepositToBaseAction();
      }

      console.log("MOVING TOWARDS BASE")
      return new MoveAction(state.Base.Position);
    }

    // Just go to whichever resource is closest, regardless of whether it
    // currently has any stock.
    const resource = nearestResource(state);
    if (!resource) {
      return null;
    }

    if (distance(bot.Position, resource.Position) <= GATHER_RANGE) {
      console.log("GATHERING NODE")
      return new GatherNodeAction(resource.Position);
    }

    console.log("MOVING TO RESOURCE")
    console.log("Resource POSITION: ", JSON.stringify(resource.Position));
    return moveTowards(resource.Position, bot.Position);
  }
}

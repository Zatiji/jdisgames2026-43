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
export class GoBackToBaseStrategy implements IStrategy {
  public getNextAction(state: GameState): ActionBase | null {
    if ()

    return new DepositToBaseAction();
  }
}

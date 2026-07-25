import {
  ActionBase,
  DepositToBaseAction,
  GameState,
  GatherNodeAction,
  Position,
  RespawnAction,
} from "../client/message_protocol";
import {
  distance,
  hasKnownStructureAt,
  isInventoryFull,
  moveTowards,
  nearestResource,
  rememberVisibleStructures,
  stepInDirection,
} from "../helpers/queries";
import { IStrategy } from "./strategy";

const GATHER_RANGE = 1;
const DEPOSIT_RANGE = 1;

const CARDINAL_DIRECTIONS = [
  new Position(1, 0),
  new Position(-1, 0),
  new Position(0, 1),
  new Position(0, -1),
];

// Legs need to clear the base's safe zone (its exact size isn't exposed by the
// protocol) so exploration actually reaches new ground instead of pacing
// back and forth near base.
const MIN_EXPLORE_LEG = 30;
const MAX_EXPLORE_LEG = 60;

function randomExploreLeg(): number {
  return MIN_EXPLORE_LEG + Math.floor(Math.random() * (MAX_EXPLORE_LEG - MIN_EXPLORE_LEG + 1));
}

// Priority-ordered guard list: dead > carrying enough > resource in sight >
// explore. First match wins, so the "cross-cutting" concerns (dying,
// hauling back a full inventory) live here once instead of being duplicated
// in every leaf strategy.
export class Orchestrator implements IStrategy {
  private exploreDirection: Position | null = null;
  private exploreStepsLeft = 0;

  public getNextAction(state: GameState): ActionBase | null {
    const bot = state.Bot;
    if (!bot) {
      console.log("NO BOT");
      return null;
    }

    if (bot.Health <= 0) {
      console.log("RESPAWNING");
      return new RespawnAction();
    }

    rememberVisibleStructures(state);

    if (isInventoryFull(bot) && state.Base) {
      if (distance(bot.Position, state.Base.Position) <= DEPOSIT_RANGE) {
        console.log("DEPOSIT TO BASE");
        return new DepositToBaseAction();
      }

      console.log("MOVING TOWARDS BASE");
      return moveTowards(state.Base.Position, bot.Position, state);
    }

    // Skip nodes known to have a structure (an extractor/pump) on them — those
    // harvest passively, so walking over to hand-gather them is wasted effort.
    const resource = nearestResource(state, (r) => !hasKnownStructureAt(r.Position));
    if (resource) {
      if (distance(bot.Position, resource.Position) <= GATHER_RANGE) {
        console.log("GATHERING NODE");
        return new GatherNodeAction(resource.Position);
      }

      console.log("MOVING TO RESOURCE");
      return moveTowards(resource.Position, bot.Position, state);
    }

    return this.explore(bot.Position, state);
  }

  // No known resources in sight: walk a random cardinal leg until it ends
  // (step budget spent or fully boxed in), then pick a new random direction.
  // Direction/steps-left persist across ticks and across being preempted by
  // a higher-priority guard, so exploration resumes instead of restarting.
  private explore(from: Position, state: GameState): ActionBase | null {
    if (this.exploreDirection === null || this.exploreStepsLeft <= 0) {
      this.exploreDirection = CARDINAL_DIRECTIONS[Math.floor(Math.random() * CARDINAL_DIRECTIONS.length)];
      this.exploreStepsLeft = randomExploreLeg();
    }

    console.log("EXPLORING");
    const move = stepInDirection(this.exploreDirection, from, state);
    if (!move) {
      // Boxed in on every side we can see: drop the leg so next tick rolls a fresh direction.
      this.exploreDirection = null;
      return null;
    }

    this.exploreStepsLeft -= 1;
    return move;
  }
}

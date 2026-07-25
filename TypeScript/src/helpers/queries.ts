import {
  ActionBase,
  BaseInfo,
  GameState,
  InternalStructureInfo,
  ItemStack, MoveAction,
  PlayerInfo,
  Position,
  Resource,
  VisiblePlayer,
  VisibleStructure,
} from "../client/message_protocol";

export function distance(a: Position, b: Position): number {
  return Math.hypot(a.X - b.X, a.Y - b.Y);
}

export function nearestResource(
  state: GameState,
  predicate: (resource: Resource) => boolean = () => true,
): Resource | null {
  return nearestOf(state.VisibleResources.filter(predicate), (r) => r.Position, state.Bot?.Position);
}

// Terrain categories that block movement. The exact set of categories the
// server sends isn't documented — adjust this list once confirmed against
// live data. Matching is case-insensitive on top of the structure/entity
// checks, which are always reliable blockers.
const BLOCKING_TERRAIN_CATEGORIES = new Set(["water", "obstacle", "wall"]);

// Returns true if a visible tile is known to block movement (a structure,
// another bot/companion, or blocking terrain). Moving into a solid tile
// doesn't error — the server just silently doesn't move the bot — so this
// must be checked before every MoveAction. Tiles outside vision return
// false (unknown), since there's no information to route around them.
export function isBlocked(state: GameState, position: Position): boolean {
  const tile = state.getTileAt(position);
  if (!tile) {
    return false;
  }
  if (tile.HasStructure || tile.HasEntity) {
    return true;
  }
  return BLOCKING_TERRAIN_CATEGORIES.has(tile.TerrainCategory.toLowerCase());
}

// Labels a single cardinal step relative to the bot for debug logging.
// Assumes Y+ is down and Y- is up (adjust if the server's coordinate
// system turns out inverted).
function directionLabel(from: Position, to: Position): string {
  if (to.X > from.X) return "RIGHT";
  if (to.X < from.X) return "LEFT";
  if (to.Y > from.Y) return "DOWN";
  if (to.Y < from.Y) return "UP";
  return "NONE";
}

function logObstacle(from: Position, blockedStep: Position): void {
  console.log(`OBSTACLE ON THE ${directionLabel(from, blockedStep)} OF THE BOT`);
}

// Movement is cardinal-only (no diagonals) and one tile per MoveAction.
// Picks a single step from `from` toward `to`, trying the direct route
// first and going around if that tile turns out solid (bot, structure,
// wall, etc.).
export function moveTowards(
    to: Position,
    from: Position,
    state: GameState): ActionBase | null {
  const dx = to.X - from.X;
  const dy = to.Y - from.Y;

  if (dx === 0 && dy === 0) {
    return null; // already there
  }

  const primary = Math.abs(dx) >= Math.abs(dy)
    ? new Position(from.X + Math.sign(dx), from.Y)
    : new Position(from.X, from.Y + Math.sign(dy));
  const secondary = Math.abs(dx) >= Math.abs(dy)
    ? new Position(from.X, from.Y + Math.sign(dy))
    : new Position(from.X + Math.sign(dx), from.Y);

  // Sidesteps: go around the obstacle perpendicular to the primary axis.
  const candidates = [
    primary,
    secondary,
    Math.abs(dx) >= Math.abs(dy) ? new Position(from.X, from.Y + 1) : new Position(from.X + 1, from.Y),
    Math.abs(dx) >= Math.abs(dy) ? new Position(from.X, from.Y - 1) : new Position(from.X - 1, from.Y),
  ].filter((candidate) => candidate.X !== from.X || candidate.Y !== from.Y);

  for (const candidate of candidates) {
    if (isBlocked(state, candidate)) {
      logObstacle(from, candidate);
      continue;
    }
    return new MoveAction(candidate);
  }

  // Fully boxed in as far as we can see: stay put rather than walk into a wall.
  return null;
}

// For strategies that always try to step in one fixed direction (e.g. "move
// left"): steps that way unless blocked, in which case it logs the obstacle
// and tries the perpendicular sidesteps to go around it.
export function stepInDirection(
    direction: Position,
    from: Position,
    state: GameState): ActionBase | null {
  const primary = new Position(from.X + direction.X, from.Y + direction.Y);

  const candidates = [
    primary,
    direction.X !== 0 ? new Position(from.X, from.Y + 1) : new Position(from.X + 1, from.Y),
    direction.X !== 0 ? new Position(from.X, from.Y - 1) : new Position(from.X - 1, from.Y),
  ];

  for (const candidate of candidates) {
    if (isBlocked(state, candidate)) {
      logObstacle(from, candidate);
      continue;
    }
    return new MoveAction(candidate);
  }

  // Boxed in on every side we can see: stay put.
  return null;
}

export function nearestEnemy(state: GameState): VisiblePlayer | null {
  const enemies = state.VisiblePlayers.filter((p) => !p.IsAlly && !p.IsSelf && p.Alive);
  return nearestOf(enemies, (p) => p.Position, state.Bot?.Position);
}

export function nearestStructure(
  state: GameState,
  predicate: (structure: VisibleStructure) => boolean = () => true,
): VisibleStructure | null {
  return nearestOf(state.VisibleStructures.filter(predicate), (s) => s.Position, state.Bot?.Position);
}

function nearestOf<T>(
  items: T[],
  positionOf: (item: T) => Position,
  from: Position | undefined,
): T | null {
  if (!from || items.length === 0) {
    return null;
  }

  let closest = items[0];
  let closestDistance = distance(from, positionOf(closest));

  for (const item of items.slice(1)) {
    const d = distance(from, positionOf(item));
    if (d < closestDistance) {
      closest = item;
      closestDistance = d;
    }
  }

  return closest;
}

export function isLowHealth(bot: PlayerInfo, threshold = 0.3): boolean {
  if (bot.MaxHealth <= 0) {
    return false;
  }

  return bot.Health / bot.MaxHealth <= threshold;
}

export function isInSafeZone(state: GameState, position: Position): boolean {
  const tile = state.getTileAt(position);
  return tile?.Zone === "SafeZone" || tile?.Zone === "BaseZone";
}

export function hasItem(inventory: ItemStack[], itemName: string, quantity = 1): boolean {
  const stack = inventory.find((item) => item.ItemName === itemName);
  return (stack?.Quantity ?? 0) >= quantity;
}

export function isInventoryFull(bot: PlayerInfo): boolean {
  return bot.Slots > 0 && bot.Inventory.length >= bot.Slots;
}

export function isBaseStorageFull(base: BaseInfo): boolean {
  return base.StorageSlots > 0 && base.Inventory.length >= base.StorageSlots;
}

export function findIdleInternalStructure(base: BaseInfo, type: string): InternalStructureInfo | null {
  return (
    base.InternalStructures.find(
      (structure) =>
        structure.Type === type &&
        !structure.Locked &&
        structure.Queue.length === 0 &&
        structure.GeneratorQueue.length === 0,
    ) ?? null
  );
}

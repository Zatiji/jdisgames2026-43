import {
  BaseInfo,
  GameState,
  InternalStructureInfo,
  ItemStack,
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

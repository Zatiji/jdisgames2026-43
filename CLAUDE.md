# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

This is a competitor's starterkit for JDIS Games 2026, a real-time multiplayer bot competition. A bot connects over SignalR to a remote game server (`https://jg26.jdis.ca`), receives `GameState` updates every tick, and returns an `ActionBase` to execute. Only the `TypeScript/` starterkit is in use in this repo (other language starterkits have been removed).

## Commands (run from `TypeScript/`)

- `npm install` — install dependencies
- `npm run dev` — run the bot directly with `tsx` (`src/main.ts`)
- `npm run build` — type-check and compile to `dist/` via `tsc`
- `npm start` — run the compiled bot from `dist/main.js`

There is no test suite or linter configured in this project.

## Architecture

- `src/bot.ts` — **the only file meant to be edited**. Implements `IBot.getNextAction(state): ActionBase | null`, called once per tick. Also holds the bot's auth `TOKEN`.
- `src/main.ts` — entry point; starts `BotRunner` against the remote server URL with `Bot.TOKEN`.
- `src/bot_logic/bot_runner.ts` and `src/client/*.ts` are marked `NE PAS MODIFIER CE FICHIER` / `DO NOT MODIFY THIS FILE` — treat them as fixed framework code, not implementation surface.
  - `bot_runner.ts` connects the `GameClient`, wires the bot's `getNextAction` into the tick loop, and handles graceful shutdown on `SIGINT`.
  - `client/game_client.ts` manages the SignalR connection/auth handshake and only sends one action per new tick.
  - `client/message_protocol.ts` defines the full data model: `GameState` and its nested types (`Tile`, `Resource`, `PlayerInfo`, `VisiblePlayer`, `VisibleCompanion`, `VisibleStructure`, `TeamInfo`, `BaseInfo`, etc.), each with a `fromServer(data)` deserializer, plus the `ActionBase` subclasses (`MoveAction`, `GatherNodeAction`, `AttackAction`, `DepositToBaseAction`, `WithdrawFromBaseAction`, `SendCompanionAction`, `PlaceExtractorAction`, `PlacePumpAction`, `PlaceRadarAction`, `DestroyStructureAction`, `AddItemToMuseumPedestalAction`, `RespawnAction`), each with a `toServerPayload()` serializer.
- The bot has only partial/limited vision (`VisibleTiles`, `VisibleResources`, etc.) — it does not see the whole map. `GameState` updates can be full snapshots or deltas (`updateVision` vs `updatePartialVision`), handled transparently inside `message_protocol.ts`.
- `TypeScript/README-EN.md` / `README-FR.md` document the available actions and state fields in full detail — consult them for the game's action/data vocabulary before adding bot logic.

## Git

Claude must never perform git actions (commit, push, branch, merge, reset, etc.) in this repository, even if asked implicitly. All git operations are performed by the human user.

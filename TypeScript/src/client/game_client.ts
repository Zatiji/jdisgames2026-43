// ============================== //
//                                //
//  NE PAS MODIFIER CE FICHIER    //
//   DO NOT MODIFY THIS FILE      //
//                                //
// ============================== //

import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from "@microsoft/signalr";
import { ActionBase, GameState } from "./message_protocol";

type ServerData = Record<string, unknown>;
type UpdateHandler = (state: GameState) => ActionBase | null;

export class GameClient {
  private readonly connection: HubConnection;
  private authenticated = false;
  private authError: Error | null = null;
  private authResolver: (() => void) | null = null;
  private readonly currentState = new GameState();
  private lastActionTickSent = -1;
  private sendingAction = false;
  private onUpdate: UpdateHandler | null = null;

  public constructor(url: string, token: string) {
    this.connection = new HubConnectionBuilder()
      .withUrl(`${url}/api/hub?token=${encodeURIComponent(token)}&type=bot`)
      .withAutomaticReconnect([0, 5000, 5000, 5000, 5000])
      .configureLogging(LogLevel.Warning)
      .build();

    this.connection.on("Authenticated", (...args: unknown[]) => this.onAuthenticated(...args));
    this.connection.on("Error", (...args: unknown[]) => this.onError(...args));
  }

  public async connect(): Promise<boolean> {
    try {
      await this.connection.start();
      console.log("[INFO] Network connection established, waiting for token validation...");

      await this.waitForAuthentication(5000);

      if (this.authError) {
        throw this.authError;
      }

      return true;
    } catch (error) {
      console.log(`[ERROR] Connection failed: ${String(error)}`);
      return false;
    }
  }

  public backendListening(onUpdate: UpdateHandler): void {
    this.onUpdate = onUpdate;
    this.connection.on("Tick", (...args: unknown[]) => this.onTick(...args));
    this.connection.on("ReceiveVisibleMap", (...args: unknown[]) => this.onReceiveVisibleMap(...args));
    this.connection.on("ReceivePlayerInfo", (...args: unknown[]) => this.onReceivePlayerInfo(...args));
  }

  public async stop(): Promise<void> {
    await this.connection.stop();
  }

  private waitForAuthentication(timeoutMs: number): Promise<void> {
    if (this.authenticated || this.authError) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.authResolver = null;
        reject(new Error("No authentication response from the server."));
      }, timeoutMs);

      this.authResolver = () => {
        clearTimeout(timeout);
        resolve();
      };
    });
  }

  private onAuthenticated(..._args: unknown[]): void {
    console.log("[AUTH] Successfully authenticated.");
    this.authenticated = true;
    this.authResolver?.();
  }

  private onError(...args: unknown[]): void {
    const message = this.firstArg(args);
    if (!this.authenticated) {
      this.authError = new Error(String(message));
      console.log(`[AUTH] Authentication error: ${String(message)}`);
      this.authResolver?.();
      return;
    }

    console.log(`[SERVER] Error: ${String(message)}`);
  }

  private onTick(...args: unknown[]): void {
    try {
      const data = this.firstArg(args);
      if (this.isServerData(data)) {
        this.currentState.CurrentTick = Number(data.tick ?? this.currentState.CurrentTick);
      }

      void this.trySendAction();
    } catch (error) {
      console.log(`[ERROR] Tick: ${String(error)}`);
    }
  }

  private onReceiveVisibleMap(...args: unknown[]): void {
    try {
      const data = this.firstArg(args);
      if (this.isServerData(data)) {
        this.currentState.updateVisionFromServer(data);
      }

      void this.trySendAction();
    } catch (error) {
      console.log(`[ERROR] ReceiveVisibleMap: ${String(error)}`);
    }
  }

  private onReceivePlayerInfo(...args: unknown[]): void {
    const data = this.firstArg(args);
    if (this.isServerData(data)) {
      this.currentState.updatePlayer(data);
    }
  }

  private async trySendAction(): Promise<void> {
    if (this.sendingAction || !this.onUpdate) {
      return;
    }

    this.sendingAction = true;
    try {
      await this.trySendActionCore();
    } finally {
      this.sendingAction = false;
    }
  }

  private async trySendActionCore(): Promise<void> {
    if (!this.currentState.Bot) {
      console.log("[BOT] Waiting for bot state initialization...");
      return;
    }

    if (this.currentState.CurrentTick <= this.lastActionTickSent) {
      return;
    }

    const action = this.onUpdate?.(this.currentState) ?? null;
    if (!action) {
      return;
    }

    this.lastActionTickSent = this.currentState.CurrentTick;

    const envelope = {
      type: "COMMAND",
      action: action.toServerPayload(),
      tick: this.currentState.CurrentTick,
    };

    console.log("=== [BOT->SERVER] Sending JSON ===");
    console.log(JSON.stringify(envelope, null, 2));
    console.log("===============================");

    await this.connection.invoke("SubmitAction", envelope);
  }

  private firstArg(args: unknown[]): unknown {
    if (args.length === 1 && Array.isArray(args[0]) && args[0].length > 0) {
      return args[0][0];
    }

    return args.length > 0 ? args[0] : null;
  }

  private isServerData(value: unknown): value is ServerData {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }
}

import * as MessageProtocol from "./client/message_protocol";
import { IBot } from "./bot_logic/ibot";

export class Bot implements IBot {
  // EDIT THIS FOR YOUR OWN BOT TOKEN
  public static readonly TOKEN = "BOTA-abcd-1234-ABCD";

  public getNextAction(
    state: MessageProtocol.GameState,
  ): MessageProtocol.ActionBase | null {
      return null;
  }
}

// ============================== //
//                                //
//  NE PAS MODIFIER CE FICHIER    //
//   DO NOT MODIFY THIS FILE      //
//                                //
// ============================== //

import { Bot } from "../bot";
import { GameClient } from "../client/game_client";
import { ActionBase, GameState } from "../client/message_protocol";

export class BotRunner {
	public static async run(serverUrl: string, token: string): Promise<void> {
		const bot = new Bot();
		console.log("[SUCCESS] Bot loaded.");

		const client = new GameClient(serverUrl, token);

		try {
			console.log(`[INFO] Connecting to server: ${serverUrl}`);
			const connected = await client.connect();
			if (!connected) {
				console.log("[ERROR] The bot could not authenticate.");
				return;
			}

			console.log("[SUCCESS] Connected and authenticated to the server.");
		} catch (error) {
			console.log("[ERROR] Could not connect to the remote server.");
			console.log(`-> Details: ${String(error)}`);
			return;
		}

		client.backendListening((state: GameState): ActionBase | null => {
			try {
				return bot.getNextAction(state);
			} catch (error) {
				console.log(`[ERROR] Bot error: ${String(error)}`);
				console.error(error);
				return null;
			}
		});

		const stop = async (): Promise<void> => {
			await client.stop();
			console.log("[INFO] Bot stopped.");
			process.exit(0);
		};

		process.on("SIGINT", () => {
			void stop();
		});
	}
}

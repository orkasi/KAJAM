import config from "@colyseus/tools";
import { monitor } from "@colyseus/monitor";
import { playground } from "@colyseus/playground";
import basicAuth from "express-basic-auth";

/**
 * Import your Room files
 */
import { MyRoom } from "./rooms/MyRoom.js";

export default config.default({
	initializeGameServer: (gameServer) => {
		/**
		 * Define your room handlers:
		 */
		gameServer.define("my_room", MyRoom).filterBy(["code"]);
	},

	initializeExpress: (app) => {
		/**
		 * Bind your custom express routes here:
		 * Read more: https://expressjs.com/en/starter/basic-routing.html
		 */
		app.get("/hello_world", (req, res) => {
			res.send("It's time to kick ass and chew bubblegum!");
		});

		/**
		 * Use @colyseus/playground
		 * (It is not recommended to expose this route in a production environment)
		 */
		if (process.env.NODE_ENV !== "production") {
			app.use("/", playground);
		}

		/**
		 * Bind @colyseus/monitor
		 * It is recommended to protect this route with a password.
		 * Read more: https://docs.colyseus.io/colyseus/tools/monitor/#restrict-access-to-the-panel-using-a-password
		 *
		 */
		const basicAuthMiddleware = basicAuth({
			// list of users and passwords
			users: {
				nomure: "rattpuap077",
			},
			// sends WWW-Authenticate header, which will prompt the user to fill
			// credentials in
			challenge: true,
		});
		app.use(
			"/colyseus",
			basicAuthMiddleware,
			monitor({
				columns: ["roomId", "name", "clients", { metadata: "players" }, "locked", "elapsedTime"],
			}),
		);
	},

	beforeListen: () => {
		/**
		 * Before before gameServer.listen() is called.
		 */
	},
});

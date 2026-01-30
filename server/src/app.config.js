import path from "node:path";
import { fileURLToPath } from "node:url";

import { monitor } from "@colyseus/monitor";
import config from "@colyseus/tools";
import express from "express";
import basicAuth from "express-basic-auth";

/**
 * Import your Room files
 */
import { MyRoom } from "./rooms/MyRoom.js";

export default config({
	initializeGameServer: (gameServer) => {
		/**
		 * Define your room handlers:
		 */
		gameServer.define("my_room", MyRoom).filterBy(["code"]);
	},

	initializeExpress: (app) => {
		const isProduction = process.env.NODE_ENV === "production";
		const monitorEnabled = process.env.MONITOR_ENABLED === "true";
		const serveClient = process.env.SERVE_CLIENT === "true";
		const frameAncestors = process.env.FRAME_ANCESTORS;

		/**
		 * Bind your custom express routes here:
		 * Read more: https://expressjs.com/en/starter/basic-routing.html
		 */
		if (frameAncestors) {
			app.use((_req, res, next) => {
				res.setHeader("Content-Security-Policy", `frame-ancestors ${frameAncestors}`);
				next();
			});
		}

		app.get("/healthz", (_req, res) => {
			res.status(200).send("ok");
		});

		app.get("/hello_world", (req, res) => {
			res.send("It's time to kick ass and chew bubblegum!");
		});

		if (serveClient) {
			const __filename = fileURLToPath(import.meta.url);
			const __dirname = path.dirname(__filename);
			const clientDist = path.resolve(__dirname, "../../client/dist");
			app.use(express.static(clientDist));
		}

		/**
		 * Bind @colyseus/monitor
		 * It is recommended to protect this route with a password.
		 * Read more: https://docs.colyseus.io/colyseus/tools/monitor/#restrict-access-to-the-panel-using-a-password
		 *
		 */
		if (monitorEnabled) {
			const monitorUser = process.env.MONITOR_USER;
			const monitorPass = process.env.MONITOR_PASS;
			if (!monitorUser || !monitorPass) {
				throw new Error("MONITOR_USER and MONITOR_PASS are required when MONITOR_ENABLED=true");
			}

			const basicAuthMiddleware = basicAuth({
				users: { [monitorUser]: monitorPass },
				challenge: true,
			});
			// Serve the monitor only at /monitor.
			app.use("/monitor", basicAuthMiddleware, monitor());
		}
	},

	beforeListen: () => {
		/**
		 * Before before gameServer.listen() is called.
		 */
	},
});

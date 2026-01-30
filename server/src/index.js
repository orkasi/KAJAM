/**
 * IMPORTANT:
 * ---------
 * Do not manually edit this file if you'd like to host your server on Colyseus Cloud
 *
 * If you're self-hosting (without Colyseus Cloud), you can manually
 * instantiate a Colyseus Server as documented here:
 *
 * See: https://docs.colyseus.io/server/api/#constructor-options
 */
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Server } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { monitor } from "@colyseus/monitor";
import basicAuth from "express-basic-auth";
import express from "express";

import { MyRoom } from "./rooms/MyRoom.js";

const isProduction = process.env.NODE_ENV === "production";
const monitorEnabled = process.env.MONITOR_ENABLED === "true";
const serveClient = process.env.SERVE_CLIENT === "true";
const frameAncestors = process.env.FRAME_ANCESTORS;
const port = Number(process.env.PORT || 2567);

const app = express();

if (frameAncestors) {
	app.use((_req, res, next) => {
		res.setHeader("Content-Security-Policy", `frame-ancestors ${frameAncestors}`);
		next();
	});
}

app.get("/healthz", (_req, res) => {
	res.status(200).send("ok");
});

app.get("/hello_world", (_req, res) => {
	res.send("It's time to kick ass and chew bubblegum!");
});

if (serveClient) {
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);
	const clientDist = path.resolve(__dirname, "../../client/dist");
	app.use(express.static(clientDist));
}

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
	app.use("/colyseus", basicAuthMiddleware, monitor());
}

const server = http.createServer(app);
const gameServer = new Server({
	transport: new WebSocketTransport({ server }),
});

gameServer.define("my_room", MyRoom).filterBy(["code"]);

gameServer
	.listen(port)
	.then(() => {
		console.log(`⚔️  Listening on http://localhost:${port}`);
		if (!isProduction) {
			console.log("Environment:", process.env.NODE_ENV);
		}
	})
	.catch((err) => {
		console.error("Failed to start server", err);
		process.exit(1);
	});

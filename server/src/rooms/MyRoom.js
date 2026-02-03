import { Room } from "@colyseus/core";
import { MyRoomState, Player } from "./schema/MyRoomState.js";

const START_DELAY_MS = 3200;
const PATCH_RATE_MS = Math.round(1000 / 30);
const DEFAULT_DIFFICULTY = { spawnIntervalMultiplier: 1.25, durationMultiplier: 1.1 };

const GAME_MODES = {
	fish: { spawnIntervalMs: 100, durationMs: 20000 },
	rat: { spawnIntervalMs: 150, durationMs: 5000 },
	butterfly: { spawnIntervalMs: 100, durationMs: 10000 },
};

function getModeConfig(mode) {
	const base = GAME_MODES[mode];
	if (!base) return null;
	const spawnIntervalMs = Math.max(60, Math.round(base.spawnIntervalMs * DEFAULT_DIFFICULTY.spawnIntervalMultiplier));
	const durationMs = Math.max(3000, Math.round(base.durationMs * DEFAULT_DIFFICULTY.durationMultiplier));
	return { spawnIntervalMs, durationMs };
}

export class MyRoom extends Room {
	maxClients = 2;

	onCreate() {
		this.setState(new MyRoomState());
		this.setPatchRate(PATCH_RATE_MS);
		this.winner = null;
		this.clock.start();
		this.autoDispose = true;
		this.state.phase = "lobby";
		this.state.mode = "";
		this.state.startAt = 0;
		this.emptyRoomTimeout = null;
		this.round = {
			state: "idle",
			mode: null,
			startTimeout: null,
			obstacleInterval: null,
			endTimeout: null,
		};

		this.onMessage("move", (client, message) => {
			const player = this.state.players.get(client.sessionId);
			if (!player) return;
			const x = Number(message?.x);
			const y = Number(message?.y);
			if (!Number.isFinite(x) || !Number.isFinite(y)) return;
			player.x = x;
			player.y = y;
			this.broadcastFastMove(client, { x, y });
		});

		this.onMessage("moveB", (client, message) => {
			const player = this.state.players.get(client.sessionId);
			if (!player) return;
			const x = Number(message?.pos?.x);
			const y = Number(message?.pos?.y);
			const angle = Number(message?.angle);
			if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(angle)) return;
			player.x = x;
			player.y = y;
			player.angle = angle;
			this.broadcastFastMove(client, { x, y, angle });
		});

		this.onMessage("ready", (client) => this.handleReady(client, "fish"));
		this.onMessage("readyRat", (client) => this.handleReady(client, "rat"));
		this.onMessage("readyButterfly", (client) => this.handleReady(client, "butterfly"));

		this.onMessage("collide", (client, message) => {
			const collideID = Number(message);
			if (!Number.isFinite(collideID)) return;
			this.broadcast("opponentCollided", { sessionId: client.sessionId, collideID });
		});

		this.onMessage("ended", (client) => {
			if (this.round.state !== "ended" && this.winner === null) return;
			this.resetRound();
		});

		this.onMessage("won", (client) => {
			if (this.round.state !== "running" && this.round.state !== "ended") return;
			if (this.winner !== null) return;
			const victor = this.state.players.get(client.sessionId);
			if (!victor) return;
			const loser = Array.from(this.state.players.values()).find((player) => player.sessionId !== client.sessionId);
			if (!loser) return;
			victor.score += 1;
			this.winner = client;
			this.round.state = "ended";
			this.state.phase = "ended";
			this.state.startAt = 0;
			if (this.round.startTimeout) {
				this.round.startTimeout.clear();
				this.round.startTimeout = null;
			}
			if (this.round.obstacleInterval) {
				this.round.obstacleInterval.clear();
				this.round.obstacleInterval = null;
			}
			if (this.round.endTimeout) {
				this.round.endTimeout.clear();
				this.round.endTimeout = null;
			}
			console.log(`${victor.name} won! They are now at ${victor.score} points! ${loser.name} is still at ${loser.score} points!`);
			this.broadcast("won", { winner: victor, loser });
		});
	}

	broadcastFastMove(client, payload) {
		const message = {
			sessionId: client.sessionId,
			t: Date.now(),
			...payload,
		};
		this.clients.forEach((other) => {
			if (other.sessionId !== client.sessionId) {
				other.send("moveFast", message);
			}
		});
	}

	handleReady(client, mode) {
		if (this.round.state !== "idle") return;

		const player = this.state.players.get(client.sessionId);
		if (!player) return;
		player.ready = true;

		if (this.areAllPlayersReady()) {
			this.startRound(mode);
			this.state.players.forEach((p) => {
				p.ready = false;
			});
		}
	}

	startRound(mode) {
		const config = getModeConfig(mode);
		if (!config) return;

		this.round.state = "countdown";
		this.round.mode = mode;
		this.winner = null;
		this.state.mode = mode;
		this.state.phase = "countdown";
		this.state.startAt = Date.now() + START_DELAY_MS;
		this.broadcast("start", { startAt: this.state.startAt, mode });

		this.round.startTimeout = this.clock.setTimeout(() => {
			this.round.state = "running";
			this.state.phase = "running";
			this.runGameLoop(config);
		}, START_DELAY_MS);
	}

	runGameLoop({ spawnIntervalMs, durationMs }) {
		let id = 0;
		this.round.obstacleInterval = this.clock.setInterval(() => {
			id++;
			this.broadcast("spawnObstacle", { data: Math.random() * 9999, obstacleID: id });
		}, spawnIntervalMs);

		this.round.endTimeout = this.clock.setTimeout(() => {
			if (this.round.obstacleInterval) {
				this.round.obstacleInterval.clear();
				this.round.obstacleInterval = null;
			}
			this.round.state = "ended";
			this.state.phase = "ended";
			this.state.startAt = 0;
			this.broadcast("end");
		}, durationMs);
	}

	resetRound() {
		this.winner = null;
		this.round.state = "idle";
		this.round.mode = null;
		this.state.mode = "";
		this.state.phase = "lobby";
		this.state.startAt = 0;

		if (this.round.startTimeout) {
			this.round.startTimeout.clear();
			this.round.startTimeout = null;
		}
		if (this.round.obstacleInterval) {
			this.round.obstacleInterval.clear();
			this.round.obstacleInterval = null;
		}
		if (this.round.endTimeout) {
			this.round.endTimeout.clear();
			this.round.endTimeout = null;
		}

		this.state.players.forEach((p) => {
			p.ready = false;
		});
	}

	onJoin(client, options) {
		console.log(client.sessionId, "joined!");
		if (this.emptyRoomTimeout) {
			this.emptyRoomTimeout.clear();
			this.emptyRoomTimeout = null;
		}
		const existing = this.state.players.get(client.sessionId);
		if (existing) {
			if (typeof options?.playerName === "string") {
				existing.name = options.playerName;
			}
		} else {
			const player = new Player();
			player.sessionId = client.sessionId;
			player.name = typeof options?.playerName === "string" ? options.playerName : "Player";
			player.x = Number.isFinite(Number(options?.playerPos?.x)) ? options.playerPos.x : 0;
			player.y = Number.isFinite(Number(options?.playerPos?.y)) ? options.playerPos.y : 0;
			player.score = 0;
			player.angle = 0;
			player.ready = false;
			this.state.players.set(client.sessionId, player);
		}

		if (this.round.state === "countdown" || this.round.state === "running") {
			client.send("start", { startAt: this.state.startAt, mode: this.round.mode });
		} else if (this.round.state === "ended") {
			client.send("end");
		}
	}

	async onLeave(client, consented) {
		const leavingPlayer = this.state.players.get(client.sessionId);
		const playerName = leavingPlayer?.name ?? client.sessionId;
		console.log(`${playerName} left!\nsessionId: ${client.sessionId}`);
		if (!consented) {
			try {
				await this.allowReconnection(client, 15);
				return;
			} catch {
				// reconnection failed
			}
		}

		this.winner = null;
		this.state.players.delete(client.sessionId);
		this.resetRound();
		if (this.state.players.size === 0) {
			this.emptyRoomTimeout = this.clock.setTimeout(() => {
				this.disconnect();
			}, 30000);
		}
	}

	onDispose() {
		console.log("room", this.roomId, "disposing...");
	}

	areAllPlayersReady() {
		if (this.state.players.size < 2) return false;

		let allReady = true;
		this.state.players.forEach((player) => {
			if (!player.ready) allReady = false;
		});
		return allReady;
	}
}

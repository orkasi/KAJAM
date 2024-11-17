import { Room } from "@colyseus/core";
import { MyRoomState, Player } from "./schema/MyRoomState.js";

export class MyRoom extends Room {
	maxClients = 2;

	onCreate(options) {
		if (options.code !== "nocode") {
			this.roomId = options.code;
		}
		this.setState(new MyRoomState());
		this.winner = null;
		this.clock.start();

		this.onMessage("move", (client, message) => {
			const player = this.state.players.get(client.sessionId);
			player.x = message.x;
			player.y = message.y;
		});

		this.onMessage("moveB", (client, message) => {
			const player = this.state.players.get(client.sessionId);
			player.x = message.pos.x;
			player.y = message.pos.y;
			player.angle = message.angle;
		});

		this.onMessage("ready", (client, message) => {
			const player = this.state.players.get(client.sessionId);
			player.ready = true;
			if (this.areAllPlayersReady()) {
				this.broadcast("start");
				this.clock.setTimeout(() => {
					this.gameLoop();
				}, 1000);
				this.state.players.forEach((player) => {
					player.ready = false;
				});
			}
		});

		this.onMessage("readyRat", (client, message) => {
			const player = this.state.players.get(client.sessionId);
			player.ready = true;
			if (this.areAllPlayersReady()) {
				this.broadcast("start");
				this.clock.setTimeout(() => {
					this.gameLoopRat();
				}, 1000);
				this.state.players.forEach((player) => {
					player.ready = false;
				});
			}
		});

		this.onMessage("readyButterfly", (client, message) => {
			const player = this.state.players.get(client.sessionId);
			player.ready = true;
			if (this.areAllPlayersReady()) {
				this.broadcast("start");
				this.clock.setTimeout(() => {
					this.gameLoopB();
				}, 1000);
				this.state.players.forEach((player) => {
					player.ready = false;
				});
			}
		});

		this.onMessage("collide", (client, message) => {
			this.broadcast("opponentCollided", { sessionId: client.sessionId, collideID: message });
		});

		this.onMessage("ended", (client) => {
			this.winner = null;
		});

		this.onMessage("won", (client) => {
			if (this.winner === null) {
				const victor = this.state.players.get(client.sessionId);
				victor.score += 1;
				const loser = Array.from(this.state.players.values()).find((player) => player.sessionId !== client.sessionId);
				this.winner = client;
				console.log(`${victor.name} won! They are now at ${victor.score} points! ${loser.name} is still at ${loser.score} points!`);
				this.broadcast("won", { winner: victor, loser: loser });
			}
		});
	}

	gameLoopB() {
		let id = 0;
		const delayedInterval = this.clock.setInterval(() => {
			id++;
			this.broadcast("spawnObstacle", { data: Math.random() * 9999, obstacleID: id });
		}, 20);
		this.clock.setTimeout(() => {
			delayedInterval.clear();
			this.broadcast("end");
		}, 10000);
	}

	gameLoopRat() {
		let id = 0;
		const delayedInterval = this.clock.setInterval(() => {
			id++;
			this.broadcast("spawnObstacle", { data: Math.random() * 9999, obstacleID: id });
		}, 100);
		this.clock.setTimeout(() => {
			delayedInterval.clear();
			this.broadcast("end");
		}, 5000);
	}

	gameLoop() {
		let id = 0;
		const delayedInterval = this.clock.setInterval(() => {
			id++;
			this.broadcast("spawnObstacle", { data: Math.random() * 9999, obstacleID: id });
		}, 20);
		this.clock.setTimeout(() => {
			delayedInterval.clear();
			this.broadcast("end");
		}, 10000);
	}

	onJoin(client, options) {
		console.log(client.sessionId, "joined!");
		const player = new Player();
		player.sessionId = client.sessionId;
		player.name = options.playerName;
		player.x = options.playerPos.x;
		player.y = options.playerPos.y;
		player.score = 0;
		player.angle = 0;
		player.ready = false;
		this.state.players.set(client.sessionId, player);
	}

	onLeave(client, options) {
		const playerName = this.state.players.get(client.sessionId).name;
		console.log(`${playerName} left!\nsessionId: ${client.sessionId}`);
		this.state.players.delete(client.sessionId);
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

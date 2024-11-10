import { k } from "../init";
import { createRatScene } from "./rat";
import { tweenFunc, overlay, createCoolText } from "../utils";

export const startPos = k.vec2(k.width() / 2, k.height() / 2);
const FISHSPEED = 50;

export function createFishScene() {
	k.scene("fish", (room) => {
		k.setBackground(rgb(109, 128, 250));
		const players = {};
		const killRoom = [];
		let startP = false;
		let startO = false;

		killRoom.push(
			room.state.players.onAdd((player, sessionId) => {
				if (!startO) {
					if (sessionId !== room.sessionId) {
						players[sessionId] = k.add([k.sprite("sukomi"), k.pos(startPos), k.opacity(1), k.anchor("center"), k.rotate(), k.timer(), overlay(rgb(174, 226, 255), 0.4)]);

						createCoolText(players[sessionId], player.name, 0, -players[sessionId].height, 15);

						players[sessionId].onUpdate(() => {
							if (player.y - 5 > players[sessionId].pos.y) {
								players[sessionId].pos.y += (player.y - players[sessionId].pos.y) * 12 * k.dt();
								players[sessionId].angle += (30 - players[sessionId].angle) * 12 * k.dt();
							} else if (player.y + 5 < players[sessionId].pos.y) {
								players[sessionId].pos.y += (player.y - players[sessionId].pos.y) * 12 * k.dt();
								players[sessionId].angle += (-30 - players[sessionId].angle) * 12 * k.dt();
							} else {
								players[sessionId].angle += (0 - players[sessionId].angle) * 12 * k.dt();
							}
							if (startO) {
								players[sessionId].pos.x += (players[sessionId].pos.x + FISHSPEED - players[sessionId].pos.x) * 12 * k.dt();
							}
						});
					}
				}
			}),
		);

		killRoom.push(
			room.state.players.onRemove((player, sessionId) => {
				if (players[sessionId]) {
					k.destroy(players[sessionId]);
				}
			}),
		);

		const cPlayer = k.add([k.sprite("sukomi"), k.pos(startPos), k.body(), k.anchor("center"), k.rotate(), k.z(2), k.area(), k.timer(), k.opacity(1), "player"]);

		createCoolText(cPlayer, room.state.players.get(room.sessionId).name, 0, -cPlayer.height, 15);

		let upPressed = false;
		let downPressed = false;

		k.onKeyPress(["up", "w"], () => (upPressed = true));
		k.onKeyRelease(["up", "w"], () => (upPressed = false));
		k.onKeyPress(["down", "s"], () => (downPressed = true));
		k.onKeyRelease(["down", "s"], () => (downPressed = false));

		const readyText = createCoolText(k, "Press space to get ready", k.width() * 0.85, k.height() / 2, 50);

		const readyKey = k.onKeyPress("space", () => {
			readyText.text = "Ready";
			room.send("ready");
			room.onMessage("start", () => {
				k.wait(1, () => {
					readyText.text = "Go";
					readyText.textSize = 128;
					readyText.font = "Iosevka-Heavy";
					readyText.pos = k.vec2(k.width() * 1.2, k.height() / 2, 50);
					readyText.use(move(k.LEFT, 400));
					startP = true;
					startO = true;
					readyKey.cancel();
					k.wait(5, () => {
						k.destroy(readyText);
					});
				});
			});
		});

		cPlayer.onUpdate(() => {
			if (upPressed && cPlayer.pos.y > 50) {
				cPlayer.pos.y += (cPlayer.pos.y - 50 - cPlayer.pos.y) * 12 * k.dt();
				cPlayer.angle += (-30 - cPlayer.angle) * 12 * k.dt();
			} else if (downPressed && cPlayer.pos.y < k.height() - 50) {
				cPlayer.pos.y += (cPlayer.pos.y + 50 - cPlayer.pos.y) * 12 * k.dt();
				cPlayer.angle += (30 - cPlayer.angle) * 12 * k.dt();
			} else if (!downPressed && !upPressed) {
				cPlayer.angle += (0 - cPlayer.angle) * 12 * k.dt();
			}
			room.send("move", cPlayer.pos);

			if (startP) {
				cPlayer.pos.x += (cPlayer.pos.x + FISHSPEED - cPlayer.pos.x) * 12 * k.dt();
			}
			const targetCamX = cPlayer.pos.x + k.width() * 0.3;
			const dampedCamX = k.lerp(k.camPos().x, targetCamX, 3 * k.dt());
			k.camPos(k.vec2(dampedCamX, k.height() / 2));
		});

		let lastPos = k.width() * 2;

		let isEnding = false;

		killRoom.push(
			room.onMessage("spawnObstacle", (data) => {
				if (!isEnding) {
					k.randSeed(data);
					const obstacle = k.add([k.sprite("bobo", { flipX: true }), k.pos(k.rand(lastPos, lastPos + k.width() / 8), k.rand(20, k.height() - 20)), k.area(), k.rotate(), k.animate(), k.scale(k.rand(0.5, 1.5)), "obstacle"]);
					lastPos = obstacle.pos.x;
					obstacle.use(move(k.LEFT, 400));
					obstacle.animate("angle", [k.rand(-25, -15), k.rand(-10, 0)], {
						duration: k.rand(0.3, 0.6),
						direction: "ping-pong",
					});
				}
			}),
		);

		killRoom.push(
			room.onMessage("end", () => {
				isEnding = true;
				const finishLine = createCoolText(k, "finish line", lastPos + k.width() * 0.75, k.height() / 2, 64, k.z(3), k.timer(), k.move(k.LEFT, 400), k.area({ scale: k.vec2(20, 1) }), k.rotate(90), "finish");
				finishLine.letterSpacing = 25;
			}),
		);

		const loseMusic = k.play("loseSound", {
			loop: false,
			paused: true,
			volume: 0.8,
		});

		const wonMusic = k.play("wonSound", {
			loop: false,
			paused: true,
		});

		killRoom.push(
			room.onMessage("won", (message) => {
				createRatScene();
				if (opponentStunTime === stunTime) {
					createRatScene();
					k.scene("DRAW", () => {
						drawSound.paused = false;
						k.setBackground(rgb(166, 85, 95));
						createCoolText(k, "DRAW", k.width() / 2, k.height() / 2, 64);
						k.wait(5, () => {
							k.go("rat", room);
							createCoolText(k, `${message.loser.name} : ${message.loser.score}		-		${message.winner.name} : ${message.winner.score}`, k.width() / 2, k.height() / 4, 32);
						});
					});
					room.send("lost");
					k.go("DRAW");
				} else {
					loseMusic.paused = false;
					if (message.winner.sessionId !== room.sessionId) {
						k.scene("lost", () => {
							k.setBackground(rgb(166, 85, 95));
							createCoolText(k, "You have lost!", k.width() / 2, k.height() / 2, 64);
							createCoolText(k, `${message.loser.name} : ${message.loser.score}		-		${message.winner.name} : ${message.winner.score}`, k.width() / 2, k.height() / 4, 32);
							k.wait(5, () => {
								k.go("rat", room);
							});
						});
						room.send("lost");
						k.go("lost");
					} else {
						k.scene("won", () => {
							wonMusic.paused = false;
							k.setBackground(rgb(166, 85, 95));
							createCoolText(k, "You have won!", k.width() / 2, k.height() / 2, 64);
							createCoolText(k, `${message.winner.name} : ${message.winner.score}		-		${message.loser.name} : ${message.loser.score}`, k.width() / 2, k.height() / 4, 32);
							k.wait(5, () => {
								k.go("rat", room);
							});
						});
						k.go("won");
					}
				}
			}),
		);

		const drawSound = k.play("drawSound", {
			loop: false,
			paused: true,
		});

		k.onCollide("finish", "player", () => room.send("won"));

		let opponentStunTime = 0;
		let stunTime = 0;
		let stunTimerP = false;
		let stunTimerO = false;

		const hurtSound = k.play("hitHurt", {
			loop: false,
			paused: true,
			volume: 0.8,
		});

		killRoom.push(
			room.onMessage("opponentCollided", (message) => {
				if (message.sessionId !== room.sessionId) {
					if (!stunTimerO) {
						hurtSound.play();
						hurtSound.volume = 0.5;
						opponentStunTime += 1;
						startO = false;
						stunTimerO = true;
						k.wait(1, () => {
							stunTimerO = false;
							startO = true;
							hurtSound.stop();
						});
						k.destroy(get("*", { recursive: true }).filter((obj) => obj.id === message.collideID)[0]);
						tweenFunc(players[message.sessionId], "angle", 360, 0, 0.25, 1);
						tweenFunc(players[message.sessionId], "opacity", 0, 1, 0.25, 4);
					}
				}
			}),
		);

		k.onCollide("obstacle", "player", (collidedObstacle) => {
			if (!stunTimerP) {
				hurtSound.play();
				stunTime += 1;
				startP = false;
				stunTimerP = true;
				k.wait(1, () => {
					stunTimerP = false;
					startP = true;
					hurtSound.stop();
				});
				room.send("collide", collidedObstacle.id);
				k.destroy(collidedObstacle);
				tweenFunc(cPlayer, "angle", 360, 0, 0.25, 1);
				tweenFunc(cPlayer, "opacity", 0, 1, 0.25, 4);
			}
		});
		k.onSceneLeave(() => {
			killRoom.forEach((kill) => kill());
		});
	});
}

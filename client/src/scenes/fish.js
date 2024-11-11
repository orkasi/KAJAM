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
						players[0] = k.add([k.sprite("sukomi"), k.pos(startPos), k.opacity(1), k.anchor("center"), k.rotate(), k.timer(), overlay(rgb(174, 226, 255), 0.4)]);
						players[1] = player;
						createCoolText(players[0], player.name, 0, -players[0].height, 15);

						players[0].onUpdate(() => {
							if (player.y - 5 > players[0].pos.y) {
								players[0].pos.y += (player.y - players[0].pos.y) * 12 * k.dt();
								players[0].angle += (30 - players[0].angle) * 12 * k.dt();
							} else if (player.y + 5 < players[0].pos.y) {
								players[0].pos.y += (player.y - players[0].pos.y) * 12 * k.dt();
								players[0].angle += (-30 - players[0].angle) * 12 * k.dt();
							} else {
								players[0].angle += (0 - players[0].angle) * 12 * k.dt();
							}
							if (startO) {
								players[0].pos.x += (players[0].pos.x + FISHSPEED - players[0].pos.x) * 12 * k.dt();
							}
						});
					}
				}
			}),
		);

		killRoom.push(
			room.state.players.onRemove((player, sessionId) => {
				if (players[0]) {
					k.destroy(players[0]);
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
			readyKey.cancel();

			readyText.text = "Ready";
			room.send("ready");
			killRoom.push(
				room.onMessage("start", async () => {
					readyText.font = "Iosevka-Heavy";

					for (let i = 3; i > 0; i--) {
						readyText.text = i;
						k.play("count");
						await k.wait(1);
					}
					k.play("go");
					readyText.text = "Go";
					readyText.textSize = 128;
					readyText.pos = k.vec2(k.width() * 1.2, k.height() / 2, 50);
					readyText.use(move(k.LEFT, 400));
					startP = true;
					startO = true;
					k.wait(5, () => {
						k.destroy(readyText);
					});
				}),
			);
		});

		cPlayer.onUpdate(() => {
			if (upPressed && cPlayer.pos.y > 50 && !downPressed) {
				cPlayer.pos.y += (cPlayer.pos.y - 50 - cPlayer.pos.y) * 12 * k.dt();
				cPlayer.angle += (-30 - cPlayer.angle) * 12 * k.dt();
			} else if (downPressed && cPlayer.pos.y < k.height() - 50 && !upPressed) {
				cPlayer.pos.y += (cPlayer.pos.y + 50 - cPlayer.pos.y) * 12 * k.dt();
				cPlayer.angle += (30 - cPlayer.angle) * 12 * k.dt();
			} else if ((!downPressed && !upPressed) || (downPressed && upPressed)) {
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

		const obstacles = [];
		killRoom.push(
			room.onMessage("spawnObstacle", (data) => {
				if (!isEnding) {
					k.randSeed(data);
					const obstacle = k.add([k.sprite("bobo", { flipX: true }), k.pos(k.rand(lastPos, lastPos + k.width() / 8), k.rand(20, k.height() - 20)), k.area(), k.rotate(), k.timer(), k.opacity(), k.animate(), k.scale(k.rand(0.5, 1.5)), "obstacle"]);
					lastPos = obstacle.pos.x;
					obstacle.use(move(k.LEFT, 400));
					obstacle.animate("angle", [k.rand(-25, -15), k.rand(-10, 0)], {
						duration: k.rand(0.3, 0.6),
						direction: "ping-pong",
					});
					obstacle.onUpdate(() => {
						if (obstacle.pos.x < camPos().x - k.width()) {
							k.destroy(obstacle);
						}
					});
					obstacles.push(obstacle);
				}
			}),
		);

		killRoom.push(
			room.onMessage("end", () => {
				isEnding = true;
				const finishLine = createCoolText(k, "finish line", lastPos + k.width() * 0.75, k.height() / 2, 64, k.timer(), k.z(3), k.move(k.LEFT, 400), k.area({ scale: k.vec2(3, 1) }), k.rotate(90), "finish");
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
				if (message.winner.sessionId !== room.sessionId) {
					loseMusic.paused = false;

					k.scene("lost", async () => {
						k.setBackground(rgb(166, 85, 95));
						const mText = createCoolText(k, "You have lost!", k.width() / 2, k.height() / 3, 64);
						mText.font = "Iosevka-Heavy";
						createCoolText(k, `${message.loser.name} : ${message.loser.score}		-		${message.winner.name} : ${message.winner.score}`, k.width() / 2, k.height() * 0.15, 32);
						createCoolText(k, "Get ready to reborn as a rat!", k.width() / 2, k.height() * 0.6, 32);
						const timer = createCoolText(k, "5", k.width() / 2, k.height() * 0.8, 48);
						timer.font = "Iosevka-Heavy";
						k.play("count");

						for (let t = 4; t > 0; t--) {
							await k.wait(1);
							k.play("count");
							timer.text = t;
						}

						k.wait(1, () => {
							k.play("go");
							k.go("rat", room);
						});
					});
					room.send("ended");
					k.go("lost");
				} else {
					k.scene("won", async () => {
						wonMusic.paused = false;
						k.setBackground(rgb(166, 85, 95));
						const mText = createCoolText(k, "You have won!", k.width() / 2, k.height() / 3, 64);
						mText.font = "Iosevka-Heavy";
						createCoolText(k, `${message.winner.name} : ${message.winner.score}		-		${message.loser.name} : ${message.loser.score}`, k.width() / 2, k.height() * 0.15, 32);
						createCoolText(k, "Get ready to reborn as a rat!", k.width() / 2, k.height() * 0.6, 32);
						const timer = createCoolText(k, "5", k.width() / 2, k.height() * 0.8, 48);
						timer.font = "Iosevka-Heavy";
						k.play("count");

						for (let t = 4; t > 0; t--) {
							await k.wait(1);
							k.play("count");
							timer.text = t;
						}

						k.wait(1, () => {
							k.play("go");
							k.go("rat", room);
						});
					});
					k.go("won");
				}
			}),
		);

		const drawSound = k.play("drawSound", {
			loop: false,
			paused: true,
		});

		k.onCollide("finish", "player", () => {
			if (opponentStunTime === stunTime) {
				createRatScene();
				const me = room.state.players.get(room.sessionId);
				const opponent = players[1];
				k.scene("DRAW", async () => {
					drawSound.paused = false;
					k.setBackground(rgb(166, 85, 95));

					const mText = createCoolText(k, "DRAW", k.width() / 2, k.height() / 3, 64);
					mText.font = "Iosevka-Heavy";
					createCoolText(k, `${me.name} : ${me.score}		-		${opponent.name} : ${opponent.score}`, k.width() / 2, k.height() * 0.15, 32);
					createCoolText(k, "Get ready to reborn as a rat!", k.width() / 2, k.height() * 0.6, 32);
					const timer = createCoolText(k, "5", k.width() / 2, k.height() * 0.8, 48);
					timer.font = "Iosevka-Heavy";
					k.play("count");

					for (let t = 4; t > 0; t--) {
						await k.wait(1);
						k.play("count");
						timer.text = t;
					}
					k.wait(1, () => {
						k.play("go");
						k.go("rat", room);
					});
				});
				room.send("ended");
				k.go("DRAW");
			} else {
				room.send("won");
			}
		});

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
						opponentStunTime += 1;
						hurtSound.play();
						hurtSound.volume = 0.5;
						startO = false;
						stunTimerO = true;
						k.wait(1, () => {
							stunTimerO = false;
							startO = true;
							hurtSound.stop();
						});
						tweenFunc(players[0], "angle", 360, 0, 0.25, 1);
						tweenFunc(players[0], "opacity", 0, 1, 0.25, 4);
						const target = obstacles.find((obj) => obj.id === message.collideID);

						if (target) {
							tweenFunc(target, "scale", target.scale, k.vec2(0, 0), 0.5, 1);
							k.wait(0.5, () => {
								if (target) {
									k.destroy(target);
								}
							});
						}
					}
				}
			}),
		);

		k.onCollide("obstacle", "player", (collidedObstacle) => {
			if (!stunTimerP) {
				stunTime += 1;
				hurtSound.play();
				startP = false;
				stunTimerP = true;
				k.wait(1, () => {
					stunTimerP = false;
					startP = true;
					hurtSound.stop();
				});
				tweenFunc(cPlayer, "angle", 360, 0, 0.25, 1);
				tweenFunc(cPlayer, "opacity", 0, 1, 0.25, 4);
				tweenFunc(collidedObstacle, "scale", collidedObstacle.scale, k.vec2(0, 0), 0.5, 1);

				k.wait(0.5, () => {
					if (collidedObstacle) {
						k.destroy(collidedObstacle);
					}
				});

				room.send("collide", collidedObstacle.id);
			}
		});
		k.onSceneLeave(() => {
			killRoom.forEach((kill) => kill());
		});
	});
}

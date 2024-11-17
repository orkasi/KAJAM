import { k } from "../init";
import { createRatScene } from "./rat";
import { tweenFunc, overlay, createCoolText, createTiledBackground, createTutorialRect, createNormalText, createMuteButton } from "../utils";
import { createLeaveScene } from "./leave";

export const startPos = k.vec2(k.width() / 2, k.height() / 2);
const FISHSPEED = 50;

export function createFishScene() {
	k.scene("fish", (room) => {
		const fishSound = k.play("fishScene", {
			loop: false,
			paused: false,
			volume: 0.05,
		});
		k.setBackground(rgb(90, 108, 230));
		const muteButton = createMuteButton();

		k.onClick("mute", () => {
			if (fishSound.paused === false) {
				fishSound.paused = true;
				muteButton.use(k.color(k.RED));
			} else {
				fishSound.paused = false;
				muteButton.unuse("color");
			}
		});

		const players = {};
		const killRoom = [];
		let startP = false;
		let startO = false;

		function fishKeyBackground() {
			const fishMoveRect = createTutorialRect(k.width() * 0.8, k.height() * 0.23, k.width() * 0.28, k.height() * 0.17, rgb(174, 226, 255), rgb(110, 144, 251), rgb(124, 169, 253), rgb(141, 197, 255));
			const dummyFish = fishMoveRect.add([k.sprite("sukomi"), k.pos(-fishMoveRect.width / 3.5, -fishMoveRect.height * 0.05), k.scale(1.5), k.animate(), k.anchor("center"), k.state("up", ["up", "down"]), "backgroundRect"]);
			dummyFish.animate("angle", [-30, 30], {
				duration: 1,
				direction: "ping-pong",
			});
			const keyUpUI = fishMoveRect.add([k.sprite("upKey"), k.pos(fishMoveRect.width / 8, -fishMoveRect.height * 0.23), k.opacity(), k.anchor("center"), k.animate(), "backgroundRect"]);
			const keyDownUI = fishMoveRect.add([k.sprite("downKey"), k.pos(fishMoveRect.width / 8, fishMoveRect.height * 0.23), k.opacity(), k.animate(), k.anchor("center"), "backgroundRect"]);
			const mouseLeftandRightUI = fishMoveRect.add([k.sprite("mouseLeftandRight"), k.pos(fishMoveRect.width * 0.35, -fishMoveRect.height * 0.27), k.opacity(), k.anchor("center"), k.animate(), "backgroundRect"]);
			const gamepadUpandDownUI = fishMoveRect.add([k.sprite("gamepadUpandDown"), k.pos(fishMoveRect.width * 0.35, fishMoveRect.height * 0.27), k.opacity(), k.anchor("center"), k.animate(), "backgroundRect"]);

			dummyFish.onStateEnter("up", () => {
				keyUpUI.play("upKeyPressed");
				keyDownUI.play("downKey");
				mouseLeftandRightUI.play("emptyMouse");
				mouseLeftandRightUI.play("mouseLeftPressed");
				gamepadUpandDownUI.play("gamepadUp");
			});

			dummyFish.onStateEnter("down", () => {
				keyDownUI.play("downKeyPressed");
				keyUpUI.play("upKey");
				mouseLeftandRightUI.play("emptyMouse");
				mouseLeftandRightUI.play("mouseRightPressed");
				gamepadUpandDownUI.play("gamepadDown");
			});

			fishMoveRect.onUpdate(() => {
				if (dummyFish.angle > 0 && dummyFish.state !== "down") {
					dummyFish.enterState("down");
				} else if (dummyFish.angle < 0 && dummyFish.state !== "up") {
					dummyFish.enterState("up");
				}
			});
		}
		fishKeyBackground();

		function fishTutorialBackground() {
			const fishObstacleRect = createTutorialRect(k.width() * 0.8, k.height() * 0.78, k.width() * 0.28, k.height() * 0.17, rgb(174, 226, 255), rgb(110, 144, 251), rgb(124, 169, 253), rgb(141, 197, 255));
			const boboExample = fishObstacleRect.add([k.sprite("bobo", { flipX: true }), k.animate(), k.pos(fishObstacleRect.width / 3.6, 0), k.anchor("center"), k.rotate(), k.timer(), k.scale(1.5), "boboExample"]);
			const fishExample = fishObstacleRect.add([k.sprite("sukomi"), k.pos(-fishObstacleRect.width / 3.5, 0), k.scale(1.5), k.animate(), k.anchor("center"), k.body(), k.area(), k.rotate(), k.timer(), "fishExample"]);
			boboExample.animate("angle", [340, 350], {
				duration: 0.5,
				direction: "ping-pong",
			});

			k.loop(2, async () => {
				await tweenFunc(fishExample, "pos", k.vec2(-fishObstacleRect.width / 3.5, 0), k.vec2(fishObstacleRect.width * 0.1, 0), 0.5, 1);
				tweenFunc(boboExample, "scale", k.vec2(1.5, 1.5), k.vec2(0, 0), 0.5, 1);
				tweenFunc(fishExample, "angle", 0, 360, 0.5, 1);
				tweenFunc(fishExample, "pos", k.vec2(fishObstacleRect.width * 0.1, 0), k.vec2(-fishObstacleRect.width / 3.5, 0), 0.5, 1);
				await tweenFunc(fishExample, "opacity", 1, 0, 0.25, 2);
				tweenFunc(fishExample, "opacity", 0, 1, 0.25, 2);
				tweenFunc(boboExample, "scale", k.vec2(0, 0), k.vec2(1.5, 1.5), 0.2, 1);
			});
		}
		fishTutorialBackground();

		killRoom.push(
			room.state.players.onAdd((player, sessionId) => {
				if (!startO) {
					if (sessionId !== room.sessionId) {
						players[0] = k.add([k.sprite("sukomi"), k.pos(startPos), k.opacity(1), k.anchor("center"), k.rotate(), k.timer(), overlay(rgb(90, 108, 230), 0.4)]);
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
				createLeaveScene();
				fishSound.stop();
				if (players[0]) {
					k.destroy(players[0]);
				}
				k.go("leave");
			}),
		);

		const cPlayer = k.add([k.sprite("sukomi"), k.pos(startPos), k.body(), k.anchor("center"), k.rotate(), k.z(2), k.area(), k.timer(), k.opacity(1), "player"]);

		createCoolText(cPlayer, room.state.players.get(room.sessionId).name, 0, -cPlayer.height, 15);

		let upPressed = false;
		let downPressed = false;
		k.onGamepadButtonPress("dpad-down", () => (downPressed = true));
		k.onGamepadButtonRelease("dpad-down", () => (downPressed = false));
		k.onGamepadButtonPress("dpad-up", () => (upPressed = true));
		k.onGamepadButtonRelease("dpad-up", () => (upPressed = false));
		k.onMousePress("left", () => (upPressed = true));
		k.onMouseRelease("left", () => (upPressed = false));
		k.onMousePress("right", () => (downPressed = true));
		k.onMouseRelease("right", () => (downPressed = false));
		k.onKeyPress(["up", "w"], () => (upPressed = true));
		k.onKeyRelease(["up", "w"], () => (upPressed = false));
		k.onKeyPress(["down", "s"], () => (downPressed = true));
		k.onKeyRelease(["down", "s"], () => (downPressed = false));

		const readyText = createCoolText(k, "Press space to get ready", k.width() * 0.85, k.height() / 2, 50);

		const readyKey = k.onKeyPress("space", () => {
			readyKey.cancel();
			readyText.text = "Ready";
			room.send("ready");
			k.destroyAll("backgroundRect");
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

		k.loop(0.05, () => {
			if (startP) {
				k.add([
					k.sprite("bubble"),
					k.color(rgb(255, 255, 255)),
					k.pos(cPlayer.pos.x - cPlayer.width / 2, k.rand(cPlayer.pos.y, cPlayer.pos.y + cPlayer.height / 2)),
					k.anchor("center"),
					k.scale(k.rand(0.1, 0.7)),
					k.lifespan(0.5, { fade: 0.25 }),
					k.opacity(k.rand(0.9, 1)),
					k.move(k.randi(120, 240), k.rand(120, 240)),
				]);
			}
			if (startO) {
				k.add([
					k.sprite("bubble"),
					k.color(rgb(255, 255, 255)),
					k.pos(players[0].pos.x - players[0].width / 2, k.rand(players[0].pos.y, players[0].pos.y + players[0].height / 2)),
					k.anchor("center"),
					k.scale(k.rand(0.1, 0.7)),
					k.lifespan(0.5, { fade: 0.25 }),
					k.opacity(k.rand(0.9, 1)),
					k.move(k.randi(140, 240), k.rand(120, 240)),
				]);
			}
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
			room.onMessage("spawnObstacle", (message) => {
				if (!isEnding) {
					k.randSeed(message.data);
					const obstacle = k.add([
						k.sprite("bobo", { flipX: true }),
						k.pos(k.rand(lastPos, lastPos + k.width() / 8), k.rand(20, k.height() - 20)),
						k.area(),
						k.rotate(),
						k.timer(),
						k.opacity(),
						k.animate(),
						k.scale(k.rand(0.5, 1.5)),
						{ obstacleID: message.obstacleID },
						"obstacle",
					]);
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
			volume: 0.5,
		});

		const wonMusic = k.play("wonSound", {
			loop: false,
			paused: true,
			volume: 0.2,
		});

		killRoom.push(
			room.onMessage("won", (message) => {
				createRatScene();
				if (message.winner.sessionId !== room.sessionId) {
					fishSound.stop();
					loseMusic.paused = false;

					k.scene("lost", async () => {
						const tiledBackground = createTiledBackground("#E07A7A", "#C25A5A");
						const mText = createCoolText(k, "You've lost!", k.width() / 2, k.height() * 0.15, 72);
						mText.letterSpacing = 15;
						mText.font = "Iosevka-Heavy";
						const score = createNormalText(k, `${message.loser.name} : ${message.loser.score}		-		${message.winner.name} : ${message.winner.score}`, k.width() / 2, k.height() * 0.4, 48);
						score.font = "Iosevka-Heavy";

						const next = createCoolText(k, "Get ready to reborn as a rat!", k.width() / 2, k.height() * 0.7, 40);
						next.font = "Iosevka-Heavy";
						next.letterSpacing = 0;
						const timer = createCoolText(k, "5", k.width() / 2, k.height() * 0.85, 56);
						timer.font = "Iosevka-Heavy";
						k.play("count");

						for (let t = 4; t > 0; t--) {
							await k.wait(1);
							k.play("count");
							timer.text = t;
						}

						k.wait(1, () => {
							k.play("go");
							k.destroy(tiledBackground);
							k.go("rat", room);
						});
					});
					room.send("ended");
					k.go("lost");
				} else {
					k.scene("won", async () => {
						const tiledBackground = createTiledBackground("#6FCF97", "#4CAF71");
						fishSound.stop();
						wonMusic.paused = false;
						const mText = createCoolText(k, "You've won!", k.width() / 2, k.height() * 0.15, 72);
						mText.letterSpacing = 15;
						mText.font = "Iosevka-Heavy";
						const score = createNormalText(k, `${message.winner.name} : ${message.winner.score}		-		${message.loser.name} : ${message.loser.score}`, k.width() / 2, k.height() * 0.4, 48);
						score.font = "Iosevka-Heavy";
						const next = createCoolText(k, "Get ready to reborn as a rat!", k.width() / 2, k.height() * 0.7, 40);
						next.font = "Iosevka-Heavy";
						next.letterSpacing = 0;
						const timer = createCoolText(k, "5", k.width() / 2, k.height() * 0.85, 56);
						timer.font = "Iosevka-Heavy";
						k.play("count");

						for (let t = 4; t > 0; t--) {
							await k.wait(1);
							k.play("count");
							timer.text = t;
						}

						k.wait(1, () => {
							k.play("go");
							k.destroy(tiledBackground);

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
			volume: 0.3,
		});

		k.onCollide("finish", "player", () => {
			if (opponentStunTime === stunTime) {
				createRatScene();
				const me = room.state.players.get(room.sessionId);
				const opponent = players[1];
				k.scene("DRAW", async () => {
					const tiledBackground = createTiledBackground("#89C3E0", "#6FAFD4");

					drawSound.paused = false;
					fishSound.stop();

					const mText = createCoolText(k, "It's a draw!", k.width() / 2, k.height() * 0.15, 72);
					mText.letterSpacing = 15;

					mText.font = "Iosevka-Heavy";
					const score = createNormalText(k, `${me.name} : ${me.score}		-		${opponent.name} : ${opponent.score}`, k.width() / 2, k.height() * 0.4, 48);
					score.font = "Iosevka-Heavy";
					const next = createCoolText(k, "Get ready to reborn as a rat!", k.width() / 2, k.height() * 0.7, 40);
					next.font = "Iosevka-Heavy";
					next.letterSpacing = 0;
					const timer = createCoolText(k, "5", k.width() / 2, k.height() * 0.85, 56);
					timer.font = "Iosevka-Heavy";
					k.play("count");

					for (let t = 4; t > 0; t--) {
						await k.wait(1);
						k.play("count");
						timer.text = t;
					}
					k.wait(1, () => {
						k.play("go");
						k.destroy(tiledBackground);

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

		killRoom.push(
			room.onMessage("opponentCollided", (message) => {
				if (message.sessionId !== room.sessionId) {
					if (!stunTimerO) {
						opponentStunTime += 1;
						k.play("fishHit", {
							volume: 0.3,
						});
						startO = false;
						stunTimerO = true;
						k.wait(1, () => {
							stunTimerO = false;
							startO = true;
						});
						tweenFunc(players[0], "angle", 360, 0, 0.25, 1);
						tweenFunc(players[0], "opacity", 0, 1, 0.25, 4);
						const target = obstacles.find((obj) => obj.obstacleID === message.collideID);

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
				k.play("fishHit", {});
				startP = false;
				stunTimerP = true;
				k.wait(1, () => {
					stunTimerP = false;
					startP = true;
				});
				tweenFunc(cPlayer, "angle", 360, 0, 0.25, 1);
				tweenFunc(cPlayer, "opacity", 0, 1, 0.25, 4);
				tweenFunc(collidedObstacle, "scale", collidedObstacle.scale, k.vec2(0, 0), 0.5, 1);

				k.wait(0.5, () => {
					if (collidedObstacle) {
						k.destroy(collidedObstacle);
					}
				});

				room.send("collide", collidedObstacle.obstacleID);
			}
		});
		k.onSceneLeave(() => {
			killRoom.forEach((kill) => kill());
		});
	});
}

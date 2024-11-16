import { k } from "../init";
import { createCoolText, overlay, tweenFunc, createTiledBackground, createNormalText, createTutorialRect } from "../utils";
import { createEndScene } from "./end";

export const startPos = k.vec2(k.width() / 2, k.height() - 120);

const BUTTERFLYSPEED = 75;

export function createButterflyScene() {
	k.scene("butterfly", (room) => {
		const butterflySound = k.play("butterflyScene",{
			loop: false,
			paused: false,
			volume: 0.05,
		});
		k.setGravity(0);
		const killRoom = [];
		let opponent = null;
		let opponentP = null;
		k.setBackground(rgb(91, 166, 117));

		function butterflyKeyBackground() {
			const butterflyMoveRect = createTutorialRect(k.width() * 0.8, k.height() * 0.25, k.width() * 0.28, k.height() * 0.23, rgb(165, 225, 183), rgb(104, 178, 129), rgb(117, 190, 141), rgb(137, 204, 158));
			const dummyButterfly = butterflyMoveRect.add([k.sprite("butterfly"), k.pos(-butterflyMoveRect.width / 4, butterflyMoveRect.height / 3), k.scale(1.2), k.animate(), k.timer(), k.rotate(), k.anchor("center"), "backgroundRect"]);
			const butterflykeyUpUI = butterflyMoveRect.add([k.sprite("upKey"), k.pos(butterflyMoveRect.width / 8, 0), k.opacity(), k.anchor("center"), k.animate(), "backgroundRect"]);
			const butterflymouseLeftandRightUI = butterflyMoveRect.add([k.sprite("mouseLeftandRight"), k.pos(butterflyMoveRect.width * 0.35, -butterflyMoveRect.height * 0.27), k.opacity(), k.anchor("center"), k.animate(), "backgroundRect"]);
			const butterflygamepadUpandDownUI = butterflyMoveRect.add([k.sprite("gamepadUpandDown"), k.pos(butterflyMoveRect.width * 0.35, butterflyMoveRect.height * 0.27), k.opacity(), k.anchor("center"), k.animate(), "backgroundRect"]);

			k.loop(2, async () => {
				butterflykeyUpUI.play("upKeyPressed");
				butterflymouseLeftandRightUI.play("mouseLeftPressed");
				butterflygamepadUpandDownUI.play("gamepadDown");

				await k.wait(0.1);
				butterflymouseLeftandRightUI.play("emptyMouse");
				butterflygamepadUpandDownUI.play("emptyGamepad");
				butterflykeyUpUI.play("upKey");

				tweenFunc(dummyButterfly, "angle", -5, 175, 0.6, 1);

				await tweenFunc(dummyButterfly, "pos", k.vec2(-butterflyMoveRect.width / 4, butterflyMoveRect.height / 3), k.vec2(-butterflyMoveRect.width / 4, -butterflyMoveRect.height * 0.35), 0.6, 1);

				butterflykeyUpUI.play("upKeyPressed");
				butterflymouseLeftandRightUI.play("mouseLeftPressed");
				butterflygamepadUpandDownUI.play("gamepadDown");

				await k.wait(0.1);
				butterflymouseLeftandRightUI.play("emptyMouse");
				butterflygamepadUpandDownUI.play("emptyGamepad");
				butterflykeyUpUI.play("upKey");

				tweenFunc(dummyButterfly, "angle", 175, -5, 0.6, 1);

				await tweenFunc(dummyButterfly, "pos", k.vec2(-butterflyMoveRect.width / 4, -butterflyMoveRect.height * 0.35), k.vec2(-butterflyMoveRect.width / 4, butterflyMoveRect.height / 3), 0.6, 1);
			});
		}
		butterflyKeyBackground();

		function butterflyTutorialBackground() {
			const butterflyObstacleRectangle = createTutorialRect(k.width() * 0.8, k.height() * 0.74, k.width() * 0.28, k.height() * 0.23, rgb(165, 225, 183), rgb(104, 178, 129), rgb(117, 190, 141), rgb(137, 204, 158));
			const dummyTutorialButterfly = butterflyObstacleRectangle.add([
				k.sprite("butterfly"),
				k.pos(-butterflyObstacleRectangle.width / 4, butterflyObstacleRectangle.height / 3),
				k.scale(1.2),
				k.animate(),
				k.timer(),
				k.rotate(),
				k.anchor("center"),
				"backgroundRect",
			]);
			dummyTutorialButterfly.animate("angle", [10, -10], {
				duration: 0.2,
				direction: "ping-pong",
			});
			const obstacleButterflyExample = butterflyObstacleRectangle.add([
				k.sprite("ghosty"),
				k.animate(),
				k.pos(butterflyObstacleRectangle.width / 4 + 30, butterflyObstacleRectangle.height / 4 - 25),
				k.anchor("center"),
				k.rotate(),
				k.timer(),
				k.scale(1.5),
				"boboExample",
			]);
			obstacleButterflyExample.animate("angle", [-5, 5], {
				duration: 0.2,
				direction: "ping-pong",
			});
			k.loop(2, async () => {
				await tweenFunc(
					dummyTutorialButterfly,
					"pos",
					k.vec2(-butterflyObstacleRectangle.width / 4 - 20, butterflyObstacleRectangle.height / 4 - 25),
					k.vec2(-butterflyObstacleRectangle.width / 4 + 120, butterflyObstacleRectangle.height / 4 - 25),
					0.25,
					1,
				);
				tweenFunc(obstacleButterflyExample, "scale", k.vec2(1.5, 1.5), k.vec2(0, 0), 0.25, 1);
				tweenFunc(
					dummyTutorialButterfly,
					"pos",
					k.vec2(-butterflyObstacleRectangle.width / 4 + 120, butterflyObstacleRectangle.height / 4 - 25),
					k.vec2(-butterflyObstacleRectangle.width / 4 - 20, butterflyObstacleRectangle.height / 4 - 25),
					0.25,
					1,
				);
				await tweenFunc(dummyTutorialButterfly, "opacity", 1, 0, 0.25, 1);
				tweenFunc(dummyTutorialButterfly, "opacity", 0, 1, 0.25, 3);
				tweenFunc(obstacleButterflyExample, "scale", k.vec2(0, 0), k.vec2(1.5, 1.5), 0.25, 1);
			});
		}
		butterflyTutorialBackground();

		const loseMusic = k.play("loseSound", {
			loop: false,
			paused: true,
			volume: 0.8,
		});

		const wonMusic = k.play("wonSound", {
			loop: false,
			paused: true,
		});

		const drawSound = k.play("drawSound", {
			loop: false,
			paused: true,
		});

		const hurtSound = k.play("butterflyHit", {
			loop: false,
			paused: true,
			volume: 0.8,
		});

		function addGround() {
			let lastGroundPos = k.width() * -1;
			const tiles = [];
			for (let i = 0; i < 150; i++) {
				tiles.push(k.add([k.sprite("grass"), k.pos(lastGroundPos, k.height()), k.anchor("bot"), k.z(1), k.offscreen()]));
				lastGroundPos += 55;
			}

			k.onUpdate(() => {
				if (tiles[0].isOffScreen()) {
					const tile = tiles.shift();
					tile.pos.x = lastGroundPos;
					lastGroundPos += 55;
					tiles.push(tile);
				}
			});
		}

		function addCeiling() {
			let lastGroundPos = k.width() * -1;
			const tiles = [];
			for (let i = 0; i < 150; i++) {
				tiles.push(k.add([k.sprite("grass"), k.pos(lastGroundPos, 0), k.anchor("bot"), k.rotate(180), k.z(1), k.offscreen()]));
				lastGroundPos += 55;
			}

			k.onUpdate(() => {
				if (tiles[0].isOffScreen()) {
					const tile = tiles.shift();
					tile.pos.x = lastGroundPos;
					lastGroundPos += 55;
					tiles.push(tile);
				}
			});
		}

		addGround();
		addCeiling();

		killRoom.push(
			room.state.players.onAdd((player, sessionId) => {
				if (opponent === null) {
					if (sessionId !== room.sessionId) {
						opponentP = player;
						opponent = k.add([
							k.sprite("butterfly"),
							k.pos(startPos),
							k.opacity(1),
							k.anchor("center"),
							k.rotate(),
							k.timer(),
							k.animate(),
							k.state("start", ["start", "stun", "move"]),
							overlay(rgb(252, 239, 141), 0.4),
							k.z(2),
							{ stuntime: 0 },
							"player",
						]);

						createCoolText(opponent, player.name, 0, opponent.height, 15);

						opponent.onUpdate(() => {
							opponent.pos.y += (player.y - opponent.pos.y) * 12 * k.dt();
							opponent.angle += (player.angle - opponent.angle) * 12 * k.dt();
						});

						opponent.onStateEnter("stun", () => {
							tweenFunc(opponent, "opacity", 0, 1, 0.25, 4);
							k.wait(1, () => {
								opponent.enterState("move");
							});
						});

						k.loop(0.05, () => {
							if (opponent.state === "move") {
								k.add([
									k.sprite("white"),
									k.pos(k.rand(opponent.pos.x - opponent.width / 2, opponent.pos.x + opponent.width * 0.4), k.rand(opponent.pos.y - opponent.height * 0.5, opponent.pos.y + opponent.height * 0.5)),
									k.anchor("center"),
									k.scale(k.rand(0.01, 0.1)),
									k.lifespan(0.2, { fade: 0.1 }),
									k.opacity(k.rand(0.3, 1)),
									k.move(k.randi(140, 250), k.rand(200, 400)),
								]);
							}
						});

						opponent.onStateUpdate("move", () => {
							opponent.pos.x += (opponent.pos.x + BUTTERFLYSPEED - opponent.pos.x) * 12 * k.dt();
						});
					}
				}
			}),
		);

		killRoom.push(
			room.state.players.onRemove((player, sessionId) => {
				if (opponent) {
					k.destroy(opponent);
				}
			}),
		);

		const cPlayer = k.add([
			k.sprite("butterfly"),
			k.pos(startPos),
			k.body(),
			k.anchor("center"),
			k.animate(),
			k.rotate(),
			k.z(3),
			k.area({ offset: k.vec2(0, -3) }),
			k.timer(),
			k.opacity(1),
			k.state("start", ["start", "stun", "move"]),
			{ stunTime: 0, onTransition: false, onWhere: "ground" },
			"player",
		]);
		createCoolText(cPlayer, room.state.players.get(room.sessionId).name, 0, -cPlayer.height, 15);

		k.onMousePress(["left", "right"], () => changeGravity());

		k.onKeyPress(["up", "w", "s", "down"], () => changeGravity());

		k.onGamepadButtonPress("south", () => changeGravity());

		k.loop(0.05, () => {
			if (cPlayer.state === "move" && cPlayer.onTransition === false) {
				k.add([
					k.sprite("white"),
					k.pos(k.rand(cPlayer.pos.x - cPlayer.width / 2, cPlayer.pos.x + cPlayer.width * 0.4), k.rand(cPlayer.pos.y - cPlayer.height * 0.5, cPlayer.pos.y + cPlayer.height * 0.5)),
					k.anchor("center"),
					k.scale(k.rand(0.01, 0.1)),
					k.lifespan(0.2, { fade: 0.1 }),
					k.opacity(k.rand(0.3, 1)),
					k.move(k.randi(140, 250), k.rand(200, 400)),
				]);
			} else if (cPlayer.state === "move" && cPlayer.onTransition === "down") {
				k.add([
					k.sprite("heart"),
					k.pos(k.rand(cPlayer.pos.x - cPlayer.width / 2, cPlayer.pos.x + cPlayer.width * 0.4), k.rand(cPlayer.pos.y - cPlayer.height * 0.5, cPlayer.pos.y + cPlayer.height * 0.5)),
					k.anchor("center"),
					k.scale(k.rand(0.1, 0.3)),
					k.lifespan(0.4, { fade: 0.2 }),
					k.opacity(k.rand(0.3, 1)),
					k.move(k.randi(220, 260), k.rand(200, 400)),
				]);
			} else if (cPlayer.state === "move" && cPlayer.onTransition === "up") {
				k.add([
					k.sprite("heart"),
					k.pos(k.rand(cPlayer.pos.x - cPlayer.width / 2, cPlayer.pos.x + cPlayer.width * 0.4), k.rand(cPlayer.pos.y - cPlayer.height * 0.5, cPlayer.pos.y + cPlayer.height * 0.5)),
					k.anchor("center"),
					k.scale(k.rand(0.1, 0.3)),
					k.lifespan(0.4, { fade: 0.2 }),
					k.opacity(k.rand(0.3, 1)),
					k.move(k.randi(70, 110), k.rand(200, 400)),
				]);
			}
		});

		async function changeGravity() {
			if (!cPlayer.onTransition) {
				cPlayer.unanimate("angle");

				if (cPlayer.onWhere === "ceiling") {
					cPlayer.onTransition = "down";

					cPlayer.onWhere = "ground";

					tweenFunc(cPlayer, "angle", cPlayer.angle, -5, 0.5, 1);
					await cPlayer.tween(cPlayer.pos.y, k.height() - 120, 0.5, (value) => (cPlayer.pos.y = value));

					cPlayer.onTransition = false;
					cPlayer.animate("angle", [-5, 5], { duration: 0.5, direction: "ping-pong" });
				} else {
					cPlayer.onTransition = "up";

					cPlayer.onWhere = "ceiling";

					tweenFunc(cPlayer, "angle", cPlayer.angle, 175, 0.5, 1);
					await cPlayer.tween(cPlayer.pos.y, 120, 0.5, (value) => (cPlayer.pos.y = value));

					cPlayer.onTransition = false;
					cPlayer.animate("angle", [175, 185], { duration: 0.5, direction: "ping-pong" });
				}
			}
		}

		cPlayer.onStateEnter("start", () => {
			cPlayer.animate("angle", [-5, 5], { duration: 0.5, direction: "ping-pong" });
		});

		cPlayer.onStateEnter("stun", () => {
			tweenFunc(cPlayer, "opacity", 0, 1, 0.25, 4);
			k.wait(1, () => {
				cPlayer.enterState("move");
			});
		});

		cPlayer.onStateUpdate("move", () => {
			cPlayer.pos.x += (cPlayer.pos.x + BUTTERFLYSPEED - cPlayer.pos.x) * 12 * k.dt();
		});

		cPlayer.onUpdate(() => {
			room.send("moveB", { pos: cPlayer.pos, angle: cPlayer.angle });
		});

		cPlayer.onUpdate(async () => {
			room.send("move", cPlayer.pos);
			const targetCamX = cPlayer.pos.x + k.width() * 0.3;
			const dampedCamX = k.lerp(k.camPos().x, targetCamX, 3 * k.dt());
			k.camPos(k.vec2(dampedCamX, k.height() / 2));
		});
		const readyText = createCoolText(k, "Press space to get ready", k.width() * 0.85, k.height() / 2, 50);

		const readyKey = k.onKeyPress("space", () => {
			k.destroyAll("backgroundRect");
			readyKey.cancel();
			readyText.text = "Ready";
			room.send("readyButterfly");
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
				readyText.font = "Iosevka-Heavy";
				readyText.pos = k.vec2(k.width() * 1.2, k.height() / 2, 50);
				readyText.use(move(k.LEFT, 400));
				cPlayer.enterState("move");
				opponent.enterState("move");
				readyKey.cancel();
				k.wait(5, () => {
					k.destroy(readyText);
				});
			});
		});

		let lastPos = k.width() * 2;

		const obstacles = [];
		killRoom.push(
			room.onMessage("spawnObstacle", (message) => {
				k.randSeed(message.data);
				const orientation = [k.height() - 55, 55];
				const sprites = [k.sprite("ghosty", { flipX: false }), k.sprite("goldfly", { flipX: true })];
				const orand = k.randi(2);
				const rand = k.randi(2);
				const obstacle = k.add([
					sprites[rand],
					k.pos(k.rand(lastPos, lastPos + k.width() * 0.4), orientation[orand]),
					k.area(),
					k.anchor("bot"),
					k.animate(),
					k.rotate(),
					k.timer(),
					k.scale(k.rand(0.8, 2)),
					{ obstacleID: message.obstacleID },
					"obstacle",
				]);

				if (rand === 1) {
					if (orand === 1) {
						obstacle.angle = 180;
						obstacle.flipX = false;
					}
				} else {
					obstacle.anchor = "center";
					obstacle.pos.y = k.rand(200, k.height() - 200);
					if (obstacle.pos.y < k.height() / 2) {
						obstacle.angle = 180;
						obstacle.flipX = true;
					}
				}
				obstacle.animate("angle", [obstacle.angle - 5, obstacle.angle + 5], { duration: 1, direction: "ping-pong" });

				obstacle.animate("scale", [k.vec2(obstacle.scale.x - 0.1, obstacle.scale.y - 0.1), obstacle.scale], { duration: 2, direction: "ping-pong" });

				lastPos = obstacle.pos.x;
				obstacle.use(move(k.LEFT, 20));
				obstacle.onUpdate(() => {
					if (obstacle.pos.x < camPos().x - k.width()) {
						k.destroy(obstacle);
					}
				});
				obstacles.push(obstacle);
			}),
		);

		killRoom.push(
			room.onMessage("opponentCollided", (message) => {
				if (message.sessionId !== room.sessionId) {
					opponent.stunTime += 1;
					opponent.enterState("stun");
					hurtSound.play();
					hurtSound.volume = 0.5;
					k.wait(0.5, () => {
						hurtSound.stop();
					});
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
			}),
		);

		k.onCollide("obstacle", "player", (collidedObstacle) => {
			if (cPlayer.state !== "stun") {
				cPlayer.stunTime += 1;
				cPlayer.enterState("stun");
				room.send("collide", collidedObstacle.obstacleID);
				tweenFunc(collidedObstacle, "scale", collidedObstacle.scale, k.vec2(0, 0), 0.5, 1);
				hurtSound.play();
				k.wait(0.5, () => {
					hurtSound.stop();
				});
				k.wait(0.5, () => {
					if (collidedObstacle) {
						k.destroy(collidedObstacle);
					}
				});
			}
		});

		killRoom.push(
			room.onMessage("won", (message) => {
				createEndScene();
				if (message.winner.sessionId !== room.sessionId) {
					butterflySound.stop();
					loseMusic.paused = false;

					k.scene("lost", async () => {
						const tiledBackground = createTiledBackground("#E07A7A", "#C25A5A");
						const mText = createCoolText(k, "You've lost!", k.width() / 2, k.height() * 0.15, 72);
						mText.letterSpacing = 15;

						mText.font = "Iosevka-Heavy";
						const score = createNormalText(k, `${message.loser.name} : ${message.loser.score}		-		${message.winner.name} : ${message.winner.score}`, k.width() / 2, k.height() * 0.4, 48);
						score.font = "Iosevka-Heavy";
						const next = createCoolText(k, "Race has ended", k.width() / 2, k.height() * 0.7, 40);
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
							k.go("end", message.loser, message.winner, room);
						});
					});
					room.send("ended");
					k.go("lost");
				} else {
					k.scene("won", async () => {
						const tiledBackground = createTiledBackground("#6FCF97", "#4CAF71");
						butterflySound.stop();
						wonMusic.paused = false;
						const mText = createCoolText(k, "You've won!", k.width() / 2, k.height() * 0.15, 72);
						mText.letterSpacing = 15;

						mText.font = "Iosevka-Heavy";
						const score = createNormalText(k, `${message.winner.name} : ${message.winner.score}		-		${message.loser.name} : ${message.loser.score}`, k.width() / 2, k.height() * 0.4, 48);
						score.font = "Iosevka-Heavy";
						const next = createCoolText(k, "Race has ended", k.width() / 2, k.height() * 0.7, 40);
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
							k.go("end", message.winner, message.loser, room);
						});
					});
					k.go("won");
				}
			}),
		);

		k.onCollide("finish", "player", () => {
			if (cPlayer.stunTime === opponent.stunTime) {
				createEndScene();
				const me = room.state.players.get(room.sessionId);
				const opponent = opponentP;
				k.scene("DRAW", async () => {
					const tiledBackground = createTiledBackground("#D7A8C9", "#C48BB2");
					butterflySound.stop();
					drawSound.paused = false;

					const mText = createCoolText(k, "It's a draw!", k.width() / 2, k.height() * 0.15, 72);
					mText.letterSpacing = 15;

					mText.font = "Iosevka-Heavy";
					const score = createNormalText(k, `${me.name} : ${me.score}		-		${opponent.name} : ${opponent.score}`, k.width() / 2, k.height() * 0.4, 48);
					score.font = "Iosevka-Heavy";
					const next = createCoolText(k, "Race has ended", k.width() / 2, k.height() * 0.7, 40);
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
						k.go("end", me, opponent, room);
					});
				});
				room.send("ended");
				k.go("DRAW");
			} else {
				room.send("won");
			}
		});

		let isEnding = false;
		killRoom.push(
			room.onMessage("end", (message) => {
				isEnding = true;
				k.add([k.sprite("portal"), k.pos(lastPos + k.width(), k.height() / 2), k.area(), k.anchor("center"), k.z(3), k.scale(k.vec2(10, 10)), "finish"]);
			}),
		);
		k.onSceneLeave(() => {
			killRoom.forEach((kill) => kill());
		});
	});
}

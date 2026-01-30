import { k } from "../init";
import { bindPlayers, createCoolText, createMuteButton, createNormalText, createTiledBackground, createTutorialRect, getPlayer, getPlayersSnapshot, goScene, overlay, playSound, registerLoopSound, tweenFunc } from "../utils";
import { createEndScene } from "./end";
import { createLeaveScene } from "./leave";

export const startPos = k.vec2(k.width() / 2, k.height() - 120);

const BUTTERFLYSPEED = 75;
const MOVE_SEND_HZ = 20;

export function createButterflyScene() {
	k.scene("butterfly", (room) => {
		const butterflySound = registerLoopSound(
			k.play("butterflyScene", {
				loop: false,
				paused: false,
				volume: 0.05,
			}),
			0.05,
		);
		k.setGravity(0);
		const killRoom = [];
		const rectLoops = [];
		const sceneLoops = [];
		let opponent = null;
		let opponentP = null;
		let hasStarted = false;
		k.setBackground(rgb(91, 166, 117));

		createMuteButton();
		const waitForSelf = createNormalText(k, "Syncing player...", k.width() / 2, k.height() * 0.15, 24, "waitForSelf", k.fixed(), k.z(120));
		waitForSelf.font = "Iosevka-Heavy";

		function butterflyKeyBackground() {
			const butterflyMoveRect = createTutorialRect(k.width() * 0.8, k.height() * 0.25, k.width() * 0.28, k.height() * 0.23, rgb(165, 225, 183), rgb(104, 178, 129), rgb(117, 190, 141), rgb(137, 204, 158));
			const dummyButterfly = butterflyMoveRect.add([k.sprite("butterfly"), k.pos(-butterflyMoveRect.width / 4, butterflyMoveRect.height / 3), k.scale(1.2), k.animate(), k.timer(), k.rotate(), k.anchor("center"), "backgroundRect"]);
			const butterflykeyUpUI = butterflyMoveRect.add([k.sprite("upKey"), k.pos(butterflyMoveRect.width / 8, 0), k.opacity(), k.anchor("center"), k.animate(), "backgroundRect"]);
			const butterflymouseLeftandRightUI = butterflyMoveRect.add([k.sprite("mouseLeftandRight"), k.pos(butterflyMoveRect.width * 0.35, -butterflyMoveRect.height * 0.27), k.opacity(), k.anchor("center"), k.animate(), "backgroundRect"]);
			const butterflygamepadUpandDownUI = butterflyMoveRect.add([k.sprite("gamepadUpandDown"), k.pos(butterflyMoveRect.width * 0.35, butterflyMoveRect.height * 0.27), k.opacity(), k.anchor("center"), k.animate(), "backgroundRect"]);

			rectLoops.push(
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
				}),
			);
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
			rectLoops.push(
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
				}),
			);
		}
		butterflyTutorialBackground();

		const playLoseSound = () => playSound("loseSound", { volume: 0.8 });
		const playWonSound = () => playSound("wonSound", { volume: 0.8 });
		const playDrawSound = () => playSound("drawSound", { volume: 0.8 });

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

		let nameText = null;
		killRoom.push(
			bindPlayers(room, {
				onAdd: (player, sessionId) => {
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
								{ stunTime: 0 },
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

							sceneLoops.push(
								k.loop(0.1, () => {
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
								}),
							);

							opponent.onStateUpdate("move", () => {
								opponent.pos.x += (opponent.pos.x + BUTTERFLYSPEED - opponent.pos.x) * 12 * k.dt();
							});
						} else if (player?.name && nameText) {
							nameText.text = player.name;
						}
					}
					if (sessionId === room.sessionId && waitForSelf) {
						k.destroy(waitForSelf);
					}
				},
				onRemove: () => {
					createLeaveScene();
					butterflySound.stop();
					if (opponent) {
						k.destroy(opponent);
					}
					goScene("leave", room);
				},
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
		const me = getPlayer(room, room.sessionId);
		nameText = createCoolText(cPlayer, me?.name || "You", 0, -cPlayer.height, 15);
		if (me && waitForSelf) {
			k.destroy(waitForSelf);
		}

		const moveSendInterval = 1 / MOVE_SEND_HZ;
		let moveSendElapsed = 0;
		let lastSentX = cPlayer.pos.x;
		let lastSentY = cPlayer.pos.y;
		let lastSentAngle = cPlayer.angle;

		k.onMousePress(["left", "right"], () => changeGravity());

		k.onKeyPress(["up", "w", "s", "down"], () => changeGravity());

		k.onGamepadButtonPress("south", () => changeGravity());

		sceneLoops.push(
			k.loop(0.1, () => {
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
			}),
		);

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
			moveSendElapsed += k.dt();
			if (moveSendElapsed >= moveSendInterval) {
				const x = cPlayer.pos.x;
				const y = cPlayer.pos.y;
				const angle = cPlayer.angle;
				if (Math.abs(x - lastSentX) > 0.5 || Math.abs(y - lastSentY) > 0.5 || Math.abs(angle - lastSentAngle) > 0.5) {
					room.send("moveB", { pos: { x, y }, angle });
					lastSentX = x;
					lastSentY = y;
					lastSentAngle = angle;
				}
				moveSendElapsed = 0;
			}

			const targetCamX = cPlayer.pos.x + k.width() * 0.3;
			const dampedCamX = k.lerp(k.camPos().x, targetCamX, 3 * k.dt());
			k.camPos(k.vec2(dampedCamX, k.height() / 2));
		});
		const readyText = createCoolText(k, "Press space to get ready", k.width() / 2, k.height() / 2, 50);
		const updateReadyStatus = () => {
			if (hasStarted) return;
			const me = getPlayer(room, room.sessionId);
			const players = getPlayersSnapshot(room);
			let opponentPlayer = null;
			for (const [id, player] of players) {
				if (id !== room.sessionId) {
					opponentPlayer = player;
					break;
				}
			}
			if (me?.ready) {
				readyText.text = "You are ready";
			} else if (opponentPlayer?.ready) {
				readyText.text = "Opponent is ready";
			} else {
				readyText.text = "Press space to get ready";
			}
		};
		sceneLoops.push(k.loop(0.2, updateReadyStatus));

		const startCountdown = async (startAt) => {
			let remaining = 3;
			if (Number.isFinite(startAt)) {
				const diff = Math.ceil((startAt - Date.now()) / 1000);
				remaining = Math.max(0, diff);
			}
			readyText.font = "Iosevka-Heavy";
			for (let i = remaining; i > 0; i--) {
				readyText.text = i;
				playSound("count", { volume: 0.08 });
				await k.wait(1);
			}
			playSound("go", { volume: 0.1 });

			readyText.text = "Go";
			readyText.textSize = 128;
			readyText.font = "Iosevka-Heavy";
			readyText.pos = k.vec2(k.width() * 1.2, k.height() / 2, 50);
			readyText.use(move(k.LEFT, 400));
			cPlayer.enterState("move");
			if (opponent) opponent.enterState("move");
			k.wait(5, () => {
				k.destroy(readyText);
			});
		};

		const handleStart = async (payload) => {
			if (hasStarted) return;
			hasStarted = true;
			k.destroyAll("backgroundRect");
			rectLoops.forEach((loop) => loop.cancel());
			await startCountdown(payload?.startAt);
		};

		const readyKey = k.onKeyPress("space", () => {
			if (hasStarted) return;
			readyKey.cancel();
			room.send("readyButterfly");
		});

		killRoom.push(
			room.onMessage("start", async (payload) => {
				await handleStart(payload);
			}),
		);

		if (room.state?.mode === "butterfly" && room.state?.phase !== "lobby") {
			handleStart({ startAt: room.state.startAt });
		}

		let lastPos = k.width() * 2;

		const obstacles = new Map();
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
				obstacles.set(message.obstacleID, obstacle);

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
						obstacles.delete(obstacle.obstacleID);
						k.destroy(obstacle);
					}
				});
			}),
		);

		killRoom.push(
			room.onMessage("opponentCollided", (message) => {
				if (message.sessionId !== room.sessionId) {
					opponent.stunTime += 1;
					opponent.enterState("stun");
					playSound("butterflyHit", { volume: 0.08 });
					const target = obstacles.get(message.collideID);

					if (target) {
						obstacles.delete(message.collideID);
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
				obstacles.delete(collidedObstacle.obstacleID);
				tweenFunc(collidedObstacle, "scale", collidedObstacle.scale, k.vec2(0, 0), 0.5, 1);
				playSound("butterflyHit", { volume: 0.08 });
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
					playLoseSound();

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
						playSound("count", { volume: 0.08 });

						for (let t = 4; t > 0; t--) {
							await k.wait(1);
							playSound("count", { volume: 0.08 });
							timer.text = t;
						}

						k.wait(1, () => {
							playSound("go", { volume: 0.1 });
							k.destroy(tiledBackground);
							goScene("end", message.loser, message.winner, room);
						});
					});
					room.send("ended");
					goScene("lost");
				} else {
					k.scene("won", async () => {
						const tiledBackground = createTiledBackground("#6FCF97", "#4CAF71");
						butterflySound.stop();
						playWonSound();
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
						playSound("count", { volume: 0.08 });

						for (let t = 4; t > 0; t--) {
							await k.wait(1);
							playSound("count", { volume: 0.08 });
							timer.text = t;
						}

						k.wait(1, () => {
							playSound("go", { volume: 0.1 });
							k.destroy(tiledBackground);
							goScene("end", message.winner, message.loser, room);
						});
					});
					goScene("won");
				}
			}),
		);

		k.onCollide("finish", "player", () => {
			if (cPlayer.stunTime === opponent.stunTime) {
				createEndScene();
				const me = getPlayer(room, room.sessionId);
				if (!me) return;
				const opponent = opponentP;
				k.scene("DRAW", async () => {
					const tiledBackground = createTiledBackground("#D7A8C9", "#C48BB2");
					butterflySound.stop();
					playDrawSound();

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
					playSound("count", { volume: 0.08 });

					for (let t = 4; t > 0; t--) {
						await k.wait(1);
						playSound("count", { volume: 0.08 });
						timer.text = t;
					}
					k.wait(1, () => {
						playSound("go", { volume: 0.1 });
						k.destroy(tiledBackground);
						goScene("end", me, opponent, room);
					});
				});
				room.send("ended");
				goScene("DRAW");
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
			rectLoops.forEach((loop) => loop.cancel());
			sceneLoops.forEach((loop) => loop.cancel());
			killRoom.forEach((kill) => kill());
		});
	});
}

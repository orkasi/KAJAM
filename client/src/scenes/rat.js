import { k } from "../init";
import { createCoolText, overlay, tweenFunc, createTiledBackground, createNormalText, createTutorialRect, createMuteButton } from "../utils";
import { createButterflyScene } from "./butterfly";

export const startPos = k.vec2(k.width() / 2, k.height() - 77.5);

const RATSPEED = 75;

export function createRatScene() {
	k.scene("rat", (room) => {
		const ratSound = k.play("ratScene", {
			loop: false,
			paused: false,
			volume: 0.01,
		});
		const killRoom = [];
		let opponent = null;
		let opponentP = null;
		k.setBackground(rgb(78, 24, 124));
		k.setGravity(1750);
		const muteButton = createMuteButton();

		k.onClick("mute", () => {
			if (ratSound.paused === false) {
				ratSound.paused = true;
				muteButton.use(k.color(k.RED));
			} else {
				ratSound.paused = false;
				muteButton.unuse("color");
			}
		});

		function ratKeyBackground() {
			const ratMoveRect = createTutorialRect(k.width() * 0.8, k.height() * 0.25, k.width() * 0.28, k.height() * 0.27, rgb(144, 129, 214), rgb(89, 47, 146), rgb(100, 72, 169), rgb(118, 100, 192));
			const dummyRat = ratMoveRect.add([k.sprite("karat"), k.pos(-ratMoveRect.width / 4, ratMoveRect.height / 2.8), k.scale(1.2), k.animate(), k.timer(), k.rotate(), k.state("jump", ["jump", "idle"]), k.anchor("center"), "backgroundRect"]);
			dummyRat.animate("angle", [10, -10], {
				duration: 0.2,
				direction: "ping-pong",
			});

			const ratkeyUpUI = ratMoveRect.add([k.sprite("upKey"), k.pos(ratMoveRect.width / 8, -ratMoveRect.height * 0.23), k.opacity(), k.anchor("center"), k.animate(), "backgroundRect"]);
			const ratmouseLeftandRightUI = ratMoveRect.add([k.sprite("mouseLeftandRight"), k.pos(ratMoveRect.width * 0.35, -ratMoveRect.height * 0.27), k.opacity(), k.anchor("center"), k.animate(), "backgroundRect"]);
			const ratgamepadUpandDownUI = ratMoveRect.add([k.sprite("gamepadUpandDown"), k.pos(ratMoveRect.width / 8, ratMoveRect.height * 0.27), k.opacity(), k.anchor("center"), k.animate(), "backgroundRect"]);
			const ratmouseLeftUI = ratMoveRect.add([k.sprite("mouseLeftandRight"), k.pos(ratMoveRect.width * 0.35, ratMoveRect.height * 0.27), k.opacity(), k.anchor("center"), k.animate(), "backgroundRect"]);

			k.loop(1.5, async () => {
				ratkeyUpUI.play("upKeyPressed");
				ratmouseLeftandRightUI.play("mouseRightPressed");
				ratmouseLeftUI.play("mouseLeftPressed");
				ratgamepadUpandDownUI.play("gamepadUp");
				await tweenFunc(dummyRat, "pos", k.vec2(-ratMoveRect.width / 4, ratMoveRect.height / 2.8), k.vec2(-ratMoveRect.width / 3.5, -ratMoveRect.height * 0.35), 0.6, 1);
				ratkeyUpUI.play("upKey");
				ratmouseLeftandRightUI.play("emptyMouse");
				ratmouseLeftUI.play("emptyMouse");
				ratgamepadUpandDownUI.play("emptyGamepad");
				await tweenFunc(dummyRat, "pos", k.vec2(-ratMoveRect.width / 3.5, -ratMoveRect.height * 0.35), k.vec2(-ratMoveRect.width / 4, ratMoveRect.height / 2.8), 0.6, 1);
			});
		}
		ratKeyBackground();

		function ratTutorialBackground() {
			const ratObstacleRectangle = createTutorialRect(k.width() * 0.8, k.height() * 0.74, k.width() * 0.28, k.height() * 0.18, rgb(144, 129, 214), rgb(89, 47, 146), rgb(100, 72, 169), rgb(118, 100, 192));
			const dummyRat = ratObstacleRectangle.add([
				k.sprite("karat"),
				k.pos(-ratObstacleRectangle.width / 4 - 20, ratObstacleRectangle.height / 4 - 25),
				k.scale(1.2),
				k.animate(),
				k.timer(),
				k.rotate(),
				k.state("jump", ["jump", "idle"]),
				k.anchor("center"),
				"backgroundRect",
			]);
			dummyRat.animate("angle", [10, -10], {
				duration: 0.2,
				direction: "ping-pong",
			});

			const obstacleExample = ratObstacleRectangle.add([
				k.sprite("bag", { flipX: true }),
				k.animate(),
				k.pos(ratObstacleRectangle.width / 4 + 30, ratObstacleRectangle.height / 4 - 25),
				k.anchor("center"),
				k.rotate(),
				k.timer(),
				k.scale(1.5),
				"boboExample",
			]);
			obstacleExample.animate("angle", [-5, 5], {
				duration: 0.2,
				direction: "ping-pong",
			});

			k.loop(2, async () => {
				await tweenFunc(dummyRat, "pos", k.vec2(-ratObstacleRectangle.width / 4 - 20, ratObstacleRectangle.height / 4 - 25), k.vec2(-ratObstacleRectangle.width / 4 + 120, ratObstacleRectangle.height / 4 - 25), 0.25, 1);
				tweenFunc(obstacleExample, "scale", k.vec2(1.5, 1.5), k.vec2(0, 0), 0.25, 1);
				tweenFunc(dummyRat, "pos", k.vec2(-ratObstacleRectangle.width / 4 + 120, ratObstacleRectangle.height / 4 - 25), k.vec2(-ratObstacleRectangle.width / 4 - 20, ratObstacleRectangle.height / 4 - 25), 0.25, 1);
				await tweenFunc(dummyRat, "opacity", 1, 0, 0.25, 1);
				tweenFunc(dummyRat, "opacity", 0, 1, 0.25, 3);
				tweenFunc(obstacleExample, "scale", k.vec2(0, 0), k.vec2(1.5, 1.5), 0.25, 1);
			});
		}
		ratTutorialBackground();

		const loseMusic = k.play("loseSound", {
			loop: false,
			paused: true,
			volume: 0.3,
		});

		const wonMusic = k.play("wonSound", {
			loop: false,
			paused: true,
			volume: 0.3,
		});

		const drawSound = k.play("drawSound", {
			loop: false,
			paused: true,
			volume: 0.3,
		});

		const moon = k.add([k.sprite("moon"), k.pos(k.width() * 0.85, k.height() * 0.1), k.scale(1), k.fixed(), k.animate()]);
		moon.animate("angle", [-15, 15], {
			duration: 1,
			direction: "ping-pong",
		});
		let lastCPos = k.width() + 100;
		k.loop(0.05, () => {
			if (lastCPos < camPos().x + k.width()) {
				const cloud = k.add([k.sprite("cloud"), k.pos(k.rand(lastCPos, lastCPos + k.width() / 6), k.rand(k.height() * 0.01, k.height() * 0.4)), k.scale(k.rand(0.5, 2.5)), k.animate()]);
				const mirror = k.randi();
				if (mirror === 1) {
					cloud.flipX = true;
				}
				cloud.animate("angle", [k.rand(-5, 0), k.rand(0, 5)], {
					duration: k.rand(1, 2),
					direction: "ping-pong",
				});
				lastCPos = cloud.pos.x;
				cloud.onUpdate(() => {
					if (cloud.pos.x < camPos().x - k.width()) {
						k.destroy(cloud);
					}
				});
			}
		});
		function addGround() {
			let lastGroundPos = k.width() * -1;
			const tiles = [];
			for (let i = 0; i < 100; i++) {
				tiles.push(k.add([k.sprite("grass"), k.pos(lastGroundPos, k.height()), k.area(), k.body({ isStatic: true }), k.anchor("bot"), k.z(1), k.offscreen()]));
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

		killRoom.push(
			room.state.players.onAdd((player, sessionId) => {
				if (opponent === null) {
					if (sessionId !== room.sessionId) {
						opponentP = player;
						opponent = k.add([k.sprite("karat"), k.pos(startPos), k.opacity(1), k.anchor("center"), k.rotate(), k.timer(), k.state("start", ["start", "stun", "move"]), overlay(rgb(78, 24, 124), 0.4), k.z(2), { stunTime: 0 }, "player"]);

						createCoolText(opponent, player.name, 0, opponent.height, 15);

						opponent.onUpdate(() => {
							opponent.pos.y += (player.y - opponent.pos.y) * 12 * k.dt();
						});

						let oPTween = null;
						let oPTween2 = null;
						let oPTweenL = null;

						opponent.onStateEnter("stun", () => {
							if (oPTween || oPTween2 || oPTweenL) {
								if (oPTween) oPTween.finish();
								if (oPTween2) oPTween2.finish();
								if (oPTweenL) oPTweenL.cancel();
							}
							tweenFunc(opponent, "opacity", 0, 1, 0.25, 4);
							k.wait(1, () => {
								opponent.enterState("move");
							});
						});

						opponent.onStateEnter("move", () => {
							oPTweenL = k.loop(0.5, async () => {
								oPTween = await opponent.tween(10, -10, 0.25, (value) => (opponent.angle = value));
								oPTween2 = await opponent.tween(-10, 10, 0.25, (value) => (opponent.angle = value));
							});
						});

						opponent.onStateUpdate("move", () => {
							opponent.pos.x += RATSPEED * 12 * k.dt();
						});
						k.loop(0.1, () => {
							if (opponent.state === "move" && opponent.pos.y > k.height() - (60 + opponent.height / 2)) {
								k.add([
									k.sprite("green"),
									k.pos(k.rand(opponent.pos.x - opponent.width / 2, opponent.pos.x + opponent.width * 0.4), k.rand(opponent.pos.y + opponent.height * 0.5, opponent.pos.y + opponent.height * 0.6)),
									k.anchor("center"),
									k.scale(k.rand(0.05, 0.1)),
									k.lifespan(0.3, { fade: 0.25 }),
									k.opacity(k.rand(0.3, 1)),
									k.move(k.randi(180, 260), k.rand(60, 100)),
								]);
							}
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
			k.sprite("karat"),
			k.pos(startPos),
			k.body(),
			k.anchor("center"),
			k.rotate(),
			k.z(3),
			k.area({ offset: k.vec2(0, -3) }),
			k.timer(),
			k.opacity(1),
			k.state("start", ["start", "stun", "move"]),
			{ stunTime: 0 },
			"player",
		]);
		createCoolText(cPlayer, room.state.players.get(room.sessionId).name, 0, -cPlayer.height, 15);

		k.onGamepadButtonPress("south", () => cPlayer.isGrounded() && cPlayer.jump(800));
		k.onMousePress(["left", "right"], () => cPlayer.isGrounded() && cPlayer.jump(800));
		k.onKeyPress(["up", "w"], () => cPlayer.isGrounded() && cPlayer.jump(800));

		let cPTween = null;
		let cPTween2 = null;
		let cPTweenL = null;

		cPlayer.onStateEnter("stun", () => {
			if (cPTween || cPTween2 || cPTweenL) {
				if (cPTween) cPTween.finish();
				if (cPTween2) cPTween2.finish();
				if (cPTweenL) cPTweenL.cancel();
			}
			tweenFunc(cPlayer, "opacity", 0, 1, 0.25, 4);
			k.wait(1, () => {
				cPlayer.enterState("move");
			});
		});

		k.loop(0.1, () => {
			if (cPlayer.state === "move" && cPlayer.isGrounded()) {
				k.add([
					k.sprite("green"),
					k.pos(k.rand(cPlayer.pos.x - cPlayer.width / 2, cPlayer.pos.x + cPlayer.width * 0.4), k.rand(cPlayer.pos.y + cPlayer.height * 0.5, cPlayer.pos.y + cPlayer.height * 0.6)),
					k.anchor("center"),
					k.scale(k.rand(0.05, 0.1)),
					k.lifespan(0.3, { fade: 0.25 }),
					k.opacity(k.rand(0.3, 1)),
					k.move(k.randi(180, 260), k.rand(60, 100)),
				]);
			}
		});
		cPlayer.onStateEnter("move", () => {
			cPTweenL = k.loop(0.5, async () => {
				cPTween = await cPlayer.tween(-10, 10, 0.25, (value) => (cPlayer.angle = value));
				cPTween2 = await cPlayer.tween(10, -10, 0.25, (value) => (cPlayer.angle = value));
			});
		});

		cPlayer.onStateUpdate("move", () => {
			cPlayer.pos.x += RATSPEED * 12 * k.dt();
			room.send("move", cPlayer.pos);
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
			room.send("readyRat");
			room.onMessage("start", async () => {
				readyText.font = "Iosevka-Heavy";

				for (let i = 3; i > 0; i--) {
					readyText.text = i;
					k.play("count");
					await k.wait(1);
				}
				opponent.enterState("move");
				cPlayer.enterState("move");

				k.play("go");

				readyText.text = "Go";
				readyText.textSize = 128;
				readyText.font = "Iosevka-Heavy";
				readyText.pos = k.vec2(k.width() * 1.2, k.height() / 2, 50);
				readyText.use(move(k.LEFT, 400));
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
				const sprites = [k.sprite("bag", { flipX: true }), k.sprite("gigagantrum"), k.sprite("money_bag", { flipX: true })];
				const rand = k.randi(3);
				const obstacle = k.add([
					sprites[rand],
					k.pos(k.rand(lastPos + k.width() / 2, lastPos + k.width()), k.height() - 55),
					k.area(),
					k.anchor("bot"),
					k.rotate(),
					k.timer(),
					k.animate(),
					k.scale(),
					{ obstacleID: message.obstacleID },
					"obstacle",
				]);
				if (rand === 2) {
					obstacle.scale = k.vec2(2, 2);
				}
				lastPos = obstacle.pos.x;
				obstacle.use(move(k.LEFT, 20));
				obstacle.animate("angle", [-5, 5], {
					duration: 0.4,
					direction: "ping-pong",
				});
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
					opponent.enterState("stun");
					opponent.stunTime += 1;

					k.play("ratHurt", { volume: 0.3 });
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
				cPlayer.enterState("stun");
				cPlayer.stunTime += 1;
				room.send("collide", collidedObstacle.obstacleID);
				tweenFunc(collidedObstacle, "scale", collidedObstacle.scale, k.vec2(0, 0), 0.5, 1);
				k.play("ratHurt");
				k.wait(0.5, () => {
					if (collidedObstacle) {
						k.destroy(collidedObstacle);
					}
				});
			}
		});

		killRoom.push(
			room.onMessage("won", (message) => {
				if (message.winner.sessionId !== room.sessionId) {
					ratSound.stop();
					loseMusic.paused = false;

					k.scene("lost", async () => {
						const tiledBackground = createTiledBackground("#E07A7A", "#C25A5A");

						const mText = createCoolText(k, "You've lost!", k.width() / 2, k.height() * 0.15, 72);
						mText.letterSpacing = 15;

						mText.font = "Iosevka-Heavy";
						const score = createNormalText(k, `${message.loser.name} : ${message.loser.score}		-		${message.winner.name} : ${message.winner.score}`, k.width() / 2, k.height() * 0.4, 48);
						score.font = "Iosevka-Heavy";

						const next = createCoolText(k, "Get ready to reborn as a butterfly!", k.width() / 2, k.height() * 0.7, 40);
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

						createButterflyScene();
						k.wait(1, () => {
							k.play("go");
							k.destroy(tiledBackground);
							k.go("butterfly", room);
						});
					});
					room.send("ended");
					k.go("lost");
				} else {
					k.scene("won", async () => {
						const tiledBackground = createTiledBackground("#6FCF97", "#4CAF71");
						ratSound.stop();
						wonMusic.paused = false;
						const mText = createCoolText(k, "You've won!", k.width() / 2, k.height() * 0.15, 72);
						mText.letterSpacing = 15;

						mText.font = "Iosevka-Heavy";
						const score = createNormalText(k, `${message.winner.name} : ${message.winner.score}		-		${message.loser.name} : ${message.loser.score}`, k.width() / 2, k.height() * 0.4, 48);
						score.font = "Iosevka-Heavy";

						const next = createCoolText(k, "Get ready to reborn as a butterfly!", k.width() / 2, k.height() * 0.7, 40);
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
						createButterflyScene();
						k.wait(1, () => {
							k.play("go");
							k.destroy(tiledBackground);
							k.go("butterfly", room);
						});
					});
					k.go("won");
				}
			}),
		);

		k.onCollide("finish", "player", () => {
			console.log(cPlayer.stunTime, opponent.stunTime);
			if (cPlayer.stunTime === opponent.stunTime) {
				const me = room.state.players.get(room.sessionId);
				const opponent = opponentP;
				k.scene("DRAW", async () => {
					const tiledBackground = createTiledBackground("#A98BC7", "#8F76B8");
					ratSound.stop();
					drawSound.paused = false;

					const mText = createCoolText(k, "It's a draw!", k.width() / 2, k.height() * 0.15, 72);
					mText.letterSpacing = 15;

					mText.font = "Iosevka-Heavy";
					const score = createNormalText(k, `${me.name} : ${me.score}		-		${opponent.name} : ${opponent.score}`, k.width() / 2, k.height() * 0.4, 48);
					score.font = "Iosevka-Heavy";

					const next = createCoolText(k, "Get ready to reborn as a butterfly!", k.width() / 2, k.height() * 0.7, 40);
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
					createButterflyScene();
					k.wait(1, () => {
						k.play("go");
						k.destroy(tiledBackground);
						k.go("butterfly", room);
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
				k.add([k.sprite("portal"), k.pos(lastPos + k.width(), k.height() - 55), k.area(), k.anchor("bot"), k.z(3), k.scale(k.vec2(3, 3)), "finish"]);
			}),
		);
		k.onSceneLeave(() => {
			killRoom.forEach((kill) => kill());
		});
	});
}

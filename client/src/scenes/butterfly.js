import { k } from "../init";
import { createCoolText, overlay, tweenFunc, createTiledBackground } from "../utils";

export const startPos = k.vec2(k.width() / 2, k.height() - 120);

const BUTTERFLYSPEED = 50;

export function createButterflyScene() {
	k.scene("butterfly", (room) => {
		k.setGravity(0);
		const killRoom = [];
		let opponent = null;
		let opponentP = null;
		k.setBackground(rgb(252, 239, 141));
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

		const hurtSound = k.play("hitHurt", {
			loop: false,
			paused: true,
			volume: 0.8,
		});

		function addGround() {
			let lastGroundPos = k.width() * -5;
			const tiles = [];
			for (let i = 0; i < 150; i++) {
				tiles.push(k.add([k.sprite("grass"), k.pos(lastGroundPos, k.height()), k.anchor("bot"), k.z(1), k.offscreen()]));
				lastGroundPos += 55;
			}

			k.loop(0.1, () => {
				if (tiles[0].isOffScreen()) {
					const tile = tiles.shift();
					tile.pos.x = lastGroundPos;
					lastGroundPos += 55;
					tiles.push(tile);
				}
			});
		}

		function addCeiling() {
			let lastGroundPos = k.width() * -5;
			const tiles = [];
			for (let i = 0; i < 150; i++) {
				tiles.push(k.add([k.sprite("grass"), k.pos(lastGroundPos, 0), k.anchor("bot"), k.rotate(180), k.z(1), k.offscreen()]));
				lastGroundPos += 55;
			}

			k.loop(0.1, () => {
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
						opponent = k.add([k.sprite("butterfly"), k.pos(startPos), k.opacity(1), k.anchor("center"), k.rotate(), k.timer(), k.animate(), k.state("start", ["start", "stun", "move"]), overlay(rgb(252, 239, 141), 0.4), k.z(2), { stuntime: 0 }, "player"]);

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

		const cPlayer = k.add([k.sprite("butterfly"), k.pos(startPos), k.body(), k.anchor("center"), k.animate(), k.rotate(), k.z(3), k.area({ offset: k.vec2(0, -3) }), k.timer(), k.opacity(1), k.state("start", ["start", "stun", "move"]), { stunTime: 0, onTransition: false, onWhere: "ground" }, "player"]);
		createCoolText(cPlayer, room.state.players.get(room.sessionId).name, 0, -cPlayer.height, 15);

		k.onKeyPress(["up", "w", "s", "down"], async () => {
			if (!cPlayer.onTransition) {
				cPlayer.onTransition = true;
				cPlayer.unanimate("angle");

				if (cPlayer.onWhere === "ceiling") {
					cPlayer.onWhere = "ground";

					tweenFunc(cPlayer, "angle", cPlayer.angle, -5, 0.5, 1);
					await cPlayer.tween(cPlayer.pos.y, k.height() - 120, 0.5, (value) => (cPlayer.pos.y = value));

					cPlayer.onTransition = false;
					cPlayer.animate("angle", [-5, 5], { duration: 0.5, direction: "ping-pong" });
				} else {
					cPlayer.onWhere = "ceiling";

					tweenFunc(cPlayer, "angle", cPlayer.angle, 175, 0.5, 1);
					await cPlayer.tween(cPlayer.pos.y, 120, 0.5, (value) => (cPlayer.pos.y = value));

					cPlayer.onTransition = false;
					cPlayer.animate("angle", [175, 185], { duration: 0.5, direction: "ping-pong" });
				}
			}
		});

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
			room.onMessage("spawnObstacle", (data) => {
				k.randSeed(data);
				const orientation = [k.height() - 55, 55];
				const sprites = [k.sprite("ghosty", { flipX: false }), k.sprite("goldfly", { flipX: true })];
				const orand = k.randi(2);
				const rand = k.randi(2);
				const obstacle = k.add([sprites[rand], k.pos(k.rand(lastPos + k.width() / 4, lastPos + k.width() * 1.5), orientation[orand]), k.area(), k.anchor("bot"), k.rotate(), k.timer(), k.scale(k.rand(0.8, 1.5)), "obstacle"]);

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
			}),
		);

		k.onCollide("obstacle", "player", (collidedObstacle) => {
			if (cPlayer.state !== "stun") {
				cPlayer.stunTime += 1;
				cPlayer.enterState("stun");
				room.send("collide", collidedObstacle.id);
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
				if (message.winner.sessionId !== room.sessionId) {
					loseMusic.paused = false;

					k.scene("lost", async () => {
						const tiledBackground = createTiledBackground("#d9bdc8", "#ffffff");

						const mText = createCoolText(k, "You have lost!", k.width() / 2, k.height() / 3, 64);
						mText.font = "Iosevka-Heavy";
						createCoolText(k, `${message.loser.name} : ${message.loser.score}		-		${message.winner.name} : ${message.winner.score}`, k.width() / 2, k.height() * 0.15, 32);
						createCoolText(k, "Get ready to reborn as a what!", k.width() / 2, k.height() * 0.6, 32);
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
							k.destroy(tiledBackground);

							//
						});
					});
					room.send("ended");
					k.go("lost");
				} else {
					k.scene("won", async () => {
						const tiledBackground = createTiledBackground("#d9bdc8", "#ffffff");

						wonMusic.paused = false;
						const mText = createCoolText(k, "You have won!", k.width() / 2, k.height() / 3, 64);
						mText.font = "Iosevka-Heavy";
						createCoolText(k, `${message.winner.name} : ${message.winner.score}		-		${message.loser.name} : ${message.loser.score}`, k.width() / 2, k.height() * 0.15, 32);
						createCoolText(k, "Get ready to reborn as a what!", k.width() / 2, k.height() * 0.6, 32);
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
							k.destroy(tiledBackground);

							//
						});
					});
					k.go("won");
				}
			}),
		);

		k.onCollide("finish", "player", () => {
			if (cPlayer.stunTime === opponent.stunTime) {
				const me = room.state.players.get(room.sessionId);
				const opponent = opponentP;
				k.scene("DRAW", async () => {
					const tiledBackground = createTiledBackground("#d9bdc8", "#ffffff");

					drawSound.paused = false;

					const mText = createCoolText(k, "DRAW", k.width() / 2, k.height() / 3, 64);
					mText.font = "Iosevka-Heavy";
					createCoolText(k, `${me.name} : ${me.score}		-		${opponent.name} : ${opponent.score}`, k.width() / 2, k.height() * 0.15, 32);
					createCoolText(k, "Get ready to reborn as a what!", k.width() / 2, k.height() * 0.6, 32);
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
						k.destroy(tiledBackground);

						//
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

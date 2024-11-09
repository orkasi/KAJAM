import { k } from "../init";
import { createCoolText, overlay, tweenFunc } from "../utils";

import * as Colyseus from "colyseus.js";

function loadStuff() {
	k.loadRoot("/"); // Set the root folder for assets
	k.loadFont("Iosevka", "fonts/IosevkaNerdFontPropo-Regular.ttf", { filter: "linear" });
	k.loadFont("Iosevka-Heavy", "fonts/IosevkaNerdFontPropo-Heavy.ttf", { outline: 3, filter: "linear" });
	k.loadSprite("karat", "sprites/karat.png");
	k.loadSprite("bag", "sprites/bag.png");
	k.loadSprite("goldfly", "sprites/goldfly.png");
	k.loadSprite("sun", "sprites/sun.png");
	k.loadSprite("grass", "sprites/grass.png");
}
loadStuff();
const testPlayerName = `player${k.randi(0, 1000)}`;
export const startPos = k.vec2(k.width() / 2, k.height() * 0.8);

const client = new Colyseus.Client("ws://localhost:2567");
main(testPlayerName);
async function main(name) {
	createRatScene();
	const lobbyText = createCoolText(k, "Connecting...", k.width() / 2, k.height() / 2, 48);
	await client
		.joinOrCreate("my_room", { playerName: name, playerPos: startPos })
		.then((room) => {
			lobbyText.text = "Connected!";
			k.wait(1, async () => {
				k.go("rat", room);
			});
		})
		.catch((e) => {
			lobbyText.text = `Connection failed!\n${e.message || "No Error Code"}`;
			console.log(e);
			k.wait(5, async () => {
				await k.destroy(lobbyText);
				main();
			});
		});
}

const RATSPEED = 50;

export function createRatScene() {
	k.scene("rat", (room) => {
		let opponent = null;
		let opponentSID = null;
		k.setBackground(rgb(255, 195, 242));
		k.setGravity(2000);

		function addGround() {
			// let lastGroundPos = 0;
			// k.loop(1, () => {
			// 	const ground = k.add([k.rect(k.width(), 50), k.pos(lastGroundPos + k.width(), k.height() - 50), k.scale(2), k.anchor("center"), k.body({ isStatic: true }), k.area(), k.color(rgb(79, 165, 22)), k.z(1)]);
			// 	lastGroundPos = ground.pos.x;
			// });
			let lastGroundPos = k.width() * -5;
			const tiles = [];
			for (let i = 0; i < 150; i++) {
				tiles.push(k.add([k.sprite("grass"), k.pos(lastGroundPos, k.height()), k.area(), k.body({ isStatic: true }), k.anchor("bot"), k.z(1), k.offscreen()]));
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

		room.state.players.onAdd((player, sessionId) => {
			if (sessionId !== room.sessionId) {
				opponentSID = sessionId;
				opponent = k.add([k.sprite("karat"), k.pos(startPos), k.opacity(1), k.anchor("center"), k.rotate(), k.timer(), k.state("start", ["start", "stun", "move"]), overlay(rgb(255, 195, 242), 0.4), k.z(2), "player"]);

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
					opponent.pos.x += (opponent.pos.x + RATSPEED - opponent.pos.x) * 12 * k.dt();
				});
			}
		});

		room.state.players.onRemove((player, sessionId) => {
			if (opponent) {
				k.destroy(opponent);
			}
		});

		const cPlayer = k.add([k.sprite("karat"), k.pos(startPos), k.body(), k.anchor("center"), k.rotate(), k.z(3), k.area(), k.timer(), k.opacity(1), k.state("start", ["start", "stun", "move"]), "player"]);
		createCoolText(cPlayer, room.state.players.get(room.sessionId).name, 0, -cPlayer.height, 15);

		k.onKeyPress(["up", "w"], () => !cPlayer.isJumping() && !cPlayer.isFalling() && cPlayer.jump());

		// k.onKeyPress(["down", "s"], () => ());

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

		cPlayer.onStateEnter("move", () => {
			cPTweenL = k.loop(0.5, async () => {
				cPTween = await cPlayer.tween(-10, 10, 0.25, (value) => (cPlayer.angle = value));
				cPTween2 = await cPlayer.tween(10, -10, 0.25, (value) => (cPlayer.angle = value));
			});
		});

		cPlayer.onStateUpdate("move", () => {
			cPlayer.pos.x += (cPlayer.pos.x + RATSPEED - cPlayer.pos.x) * 12 * k.dt();
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
			readyText.text = "Ready";
			room.send("readyRat");
			room.onMessage("start", () => {
				k.wait(1, () => {
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
		});

		let lastPos = k.width() * 2;

		room.onMessage("spawnObstacle", (data) => {
			k.randSeed(data);
			const obstacle = k.add([k.sprite("bag", { flipX: true }), k.pos(k.rand(lastPos + 300, lastPos + k.width()), k.height() - 105), k.area(), k.anchor("bot"), k.rotate(), k.animate(), "obstacle"]);
			lastPos = obstacle.pos.x;
			obstacle.use(move(k.LEFT, 20));
			obstacle.animate("angle", [k.rand(-25, -15), k.rand(-10, 0)], {
				duration: k.rand(0.3, 0.6),
				direction: "ping-pong",
			});
		});

		room.onMessage("opponentCollided", (message) => {
			if (message.sessionId !== room.sessionId) {
				opponent.enterState("stun");
				k.destroy(get("*", { recursive: true }).filter((obj) => obj.id === message.collideID)[0]);
			}
		});

		k.onCollide("obstacle", "player", (collidedObstacle) => {
			cPlayer.enterState("stun");
			room.send("collide", collidedObstacle.id);
			k.destroy(collidedObstacle);
		});
	});
}

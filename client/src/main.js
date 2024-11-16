import { k } from "./init";
import * as Colyseus from "colyseus.js";
import { createTiledBackground, createCoolText, createNormalText } from "./utils";

import { createFishScene, startPos } from "./scenes/fish";

window.addEventListener("keydown", (e) => {
	if (e.key === "F1") {
		e.preventDefault();
	}
});

const client = new Colyseus.Client("ws://localhost:2567");

async function loadStuff() {
	k.loadRoot("/");

	//Shaders
	await k.loadShaderURL("tiledPattern", null, "shaders/tiledPattern.frag");

	//Butterfly Game Sprites
	k.loadSprite("butterfly", "sprites/butterfly.png");
	k.loadSprite("goldfly", "sprites/goldfly.png");
	k.loadSprite("ghosty", "sprites/ghosty.png");
	k.loadSprite("white", "sprites/white.png");
	k.loadSprite("heart", "sprites/heart.png");

	//Rat Game Sprites
	k.loadSprite("gigagantrum", "sprites/gigagantrum.png");
	k.loadSprite("karat", "sprites/karat.png");
	k.loadSprite("bag", "sprites/bag.png");
	k.loadSprite("money_bag", "sprites/money_bag.png");
	k.loadSprite("grass", "sprites/grass.png");
	k.loadSprite("portal", "sprites/portal.png");
	k.loadSprite("moon", "sprites/moon.png");
	k.loadSprite("cloud", "sprites/cloud.png");
	k.loadSprite("green", "sprites/green.png");

	//Fish Game Sprites
	await k.loadSprite("sukomi", "sprites/sukomi.png");
	await k.loadSprite("bobo", "sprites/bobo.png");
	await k.loadSprite("bubble", "sprites/particles/bubble.png");

	//Icons
	await k.loadSprite("play-o", "sprites/icons/play-o.png");
	await k.loadSprite("kaplay", "sprites/icons/kaplay.png");
	await k.loadSprite("kajam", "sprites/icons/kajam.png");

	//Sounds
	await k.loadSound("loseSound", "sounds/synth.ogg");
	await k.loadSound("hitHurt", "sounds/hitHurt.ogg");
	await k.loadSound("wonSound", "sounds/won.ogg");
	await k.loadSound("drawSound", "sounds/draw.ogg");
	await k.loadSound("wrongName", "sounds/wrongName.ogg");
	await k.loadSound("count", "sounds/count.ogg");
	await k.loadSound("go", "sounds/go.ogg");
	await k.loadSound("ratHurt", "sounds/ratHurt.ogg");

	//Fonts
	await k.loadFont("Iosevka", "fonts/Iosevka-Regular.woff2", { outline: 1, filter: "linear" });
	await k.loadFont("Iosevka-Heavy", "fonts/Iosevka-Heavy.woff2", { outline: 3, filter: "linear" });

	//Key sprites
	await k.loadSprite("gamepadUpandDown", "sprites/icons/gamepadUpandDown.png", {
		sliceX: 3,
		anims: {
			emptyGamepad: {
				from: 0,
				to: 0,
				loop: true,
			},
			gamepadUp: {
				from: 1,
				to: 1,
				loop: true,
			},
			gamepadDown: {
				from: 2,
				to: 2,
				loop: true,
			},
		},
	});

	await k.loadSprite("mouseLeftandRight", "sprites/icons/mouseLeftandRight.png", {
		sliceX: 3,
		anims: {
			emptyMouse: {
				from: 0,
				to: 0,
				loop: true,
			},

			mouseRightPressed: {
				from: 1,
				to: 1,
				loop: true,
			},

			mouseLeftPressed: {
				from: 2,
				to: 2,
				loop: true,
			},
		},
	});

	await k.loadSprite("upKey", "sprites/icons/upKey.png", {
		sliceX: 2,
		anims: {
			upKey: {
				from: 0,
				to: 0,
				loop: true,
			},

			upKeyPressed: {
				from: 1,
				to: 1,
				loop: true,
			},
		},
	});

	await k.loadSprite("downKey", "sprites/icons/downKey.png", {
		sliceX: 2,
		anims: {
			downKey: {
				from: 0,
				to: 0,
				loop: true,
			},

			downKeyPressed: {
				from: 1,
				to: 1,
				loop: true,
			},
		},
	});
}
await loadStuff();
createFishScene();

const tiledBackground = createTiledBackground("#9982e8", "#8465ec");

function isAlphanumeric(str) {
	const regex = /^[a-z0-9]+$/i;
	return regex.test(str);
}

async function name() {
	const askName = createCoolText(k, "Please enter your name", k.width() / 2, k.height() * 0.2, 48, "destroyN", k.timer(), k.rotate());
	askName.font = "Iosevka-Heavy";
	const name = createCoolText(k, "", k.width() / 2, k.height() / 2, 48, k.textInput(true, 10), "destroyN");

	const keyPress = k.onKeyPress("enter", async () => {
		name.text = name.text.trim();
		if (name.text.length > 1 && isAlphanumeric(name.text)) {
			keyPress.cancel();

			k.destroyAll("destroyN");
			roomName(name);
		} else {
			await k.play("wrongName", {
				loop: false,
				volume: 0.1,
			});
			await askName.tween(-10, 10, 0.1, (value) => (askName.angle = value));
			await askName.tween(10, 0, 0.1, (value) => (askName.angle = value));
			const warning = createNormalText(k, "Do not use special characters. Name must be longer than 1 characters and shorter than 10 characters.", k.width() / 2, k.height() * 0.3, 32, "destroyN");
			warning.font = "Iosevka-Heavy";

			k.wait(5, () => {
				destroy(warning);
			});
		}
	});
}

async function roomName(nameT) {
	const askCode = createCoolText(k, "You can optionally enter a room code", k.width() / 2, k.height() * 0.2, 48, "destroyR", k.timer(), k.rotate());
	askCode.font = "Iosevka-Heavy";
	const roomCode = createCoolText(k, "", k.width() / 2, k.height() / 2, 48, k.textInput(true, 10), "destroyR");
	k.wait(0.5, () => {
		const keyPress2 = k.onKeyPress("enter", async () => {
			if (roomCode.text.length < 1) {
				main(nameT.text);
				keyPress2.cancel();
				destroyAll("destroyR");
			} else if (roomCode.text.length > 1 && isAlphanumeric(roomCode.text)) {
				main(nameT.text, roomCode.text);
				keyPress2.cancel();
				destroyAll("destroyR");
			} else {
				await k.play("wrongName", {
					loop: false,
				});
				await askCode.tween(-10, 10, 0.1, (value) => (askCode.angle = value));
				await askCode.tween(10, 0, 0.1, (value) => (askCode.angle = value));
				const warning = createNormalText(k, "Do not use special characters", k.width() / 2, k.height() * 0.3, 32, "destroyR");
				warning.font = "Iosevka-Heavy";
				k.wait(3, () => {
					destroy(warning);
				});
			}
		});
	});
}

async function main(name, roomCode = "nocode") {
	const lobbyText = createCoolText(k, "Connecting...", k.width() / 2, k.height() / 2, 48);
	await client
		.joinOrCreate("my_room", { playerName: name, playerPos: startPos, code: roomCode })
		.then((room) => {
			lobbyText.text = "Connected!";

			k.wait(1, async () => {
				k.destroy(tiledBackground);
				k.go("fish", room, name);
			});
		})
		.catch((e) => {
			lobbyText.text = `Connection failed!\n${e.message || "No Error Code"}`;
			console.log(e);
			k.wait(5, async () => {
				await k.destroy(lobbyText);
				main(name, roomCode);
			});
		});
}

function titleScreen() {
	const tiledBackground = createTiledBackground("#000000", "#686767");

	const sText = createCoolText(k, "Reincarnation Racing", k.width() / 2, k.height() * 0.2, 80, "title");

	sText.font = "Iosevka-Heavy";
	const hText = createNormalText(k, "Made by Orkun Kaan Şimşek & -REDACTED-", k.width() / 2, k.height() * 0.05, 16, "title");
	hText.letterSpacing = 4;

	const rText = createNormalText(k, "A race where you reincarnate continuously", k.width() / 2, k.height() * 0.85, 32, "title");
	rText.letterSpacing = 0;
	rText.font = "Iosevka-Heavy";
	const pText = createNormalText(k, "(it's a two player game)", k.width() / 2, k.height() * 0.9, 16, "title");
	pText.letterSpacing = 2;

	k.add([k.sprite("kaplay"), k.pos(k.getSprite("kaplay").data.width * 1.2, k.height() - k.getSprite("kaplay").data.height * 1.2), k.anchor("topright"), k.scale(1.2), "title"]);
	k.add([k.sprite("kajam"), k.scale(0.15), k.pos(k.width() - k.getSprite("kajam").data.width * 0.15, k.height() - k.getSprite("kajam").data.height * 0.15), k.anchor("topleft"), "title"]);
	const replayButton = k.add([k.sprite("play-o"), k.pos(k.width() / 2, k.height() * 0.5), k.anchor("center"), k.scale(2), k.area(), k.animate(), k.rotate(), "replay", "title"]);
	replayButton.animate("scale", [k.vec2(2, 2), k.vec2(2.1, 2.1)], { duration: 1.5, direction: "ping-pong" });

	replayButton.animate("angle", [2, -2], { duration: 0.5, direction: "ping-pong" });
	replayButton.animate("pos", [k.vec2(k.width() * 0.49, k.height() * 0.6), k.vec2(k.width() * 0.51, k.height() * 0.6)], { duration: 1, direction: "ping-pong" });
	k.onClick("replay", async () => {
		k.camFlash("#000000", 1);

		destroy(tiledBackground);
		destroyAll("title");
		name();
	});
}

titleScreen();

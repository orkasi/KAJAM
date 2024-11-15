import { k } from "./init";
import * as Colyseus from "colyseus.js";
import { createTiledBackground, createCoolText } from "./utils";

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
	await k.loadSprite("butterfly", "sprites/butterfly.png");
	await k.loadSprite("goldfly", "sprites/goldfly.png");
	await k.loadSprite("ghosty", "sprites/ghosty.png");
	await k.loadSprite("white", "sprites/white.png");
	await k.loadSprite("heart", "sprites/heart.png");

	//Rat Game Sprites
	await k.loadSprite("gigagantrum", "sprites/gigagantrum.png");
	await k.loadSprite("karat", "sprites/karat.png");
	await k.loadSprite("bag", "sprites/bag.png");
	await k.loadSprite("money_bag", "sprites/money_bag.png");
	await k.loadSprite("grass", "sprites/grass.png");
	await k.loadSprite("portal", "sprites/portal.png");
	await k.loadSprite("moon", "sprites/moon.png");
	await k.loadSprite("cloud", "sprites/cloud.png");
	await k.loadSprite("green", "sprites/green.png");

	//Fish Game Sprites
	await k.loadSprite("sukomi", "sprites/sukomi.png");
	await k.loadSprite("bobo", "sprites/bobo.png");
	await k.loadSprite("bubble", "sprites/particles/bubble.png");

	//Sounds
	await k.loadSound("loseSound", "sounds/synth.ogg");
	await k.loadSound("hitHurt", "sounds/hitHurt.ogg");
	await k.loadSound("wonSound", "sounds/won.ogg");
	await k.loadSound("drawSound", "sounds/draw.ogg");
	await k.loadSound("wrongName", "sounds/wrongName.ogg");
	await k.loadSound("count", "sounds/count.ogg");
	await k.loadSound("go", "sounds/go.ogg");

	//Fonts
	await k.loadFont("Iosevka", "fonts/IosevkaNerdFontPropo-Regular.woff2", { outline: 1, filter: "linear" });
	await k.loadFont("Iosevka-Heavy", "fonts/IosevkaNerdFontPropo-Heavy.woff2", { outline: 3, filter: "linear" });

	//Key sprites
	await k.loadSprite("gamepadUpandDown", "sprites/icons/gamepadUpandDown.png", {
		sliceX: 3,
		anims: {
			"emptyGamepad": {
				from: 0,
				to: 0,
				loop: true,
			},
			"gamepadUp": {
				from: 1,
				to: 1,
				loop: true,
			},
			"gamepadDown": {
				from: 2,
				to: 2,
				loop: true,
			},
		}
	})

	await k.loadSprite("mouseLeftandRight", "sprites/icons/mouseLeftandRight.png", {
		sliceX: 3,
		anims: {
			"emptyMouse": {
				from: 0,
				to: 0,
				loop: true,
			},

			"mouseRightPressed": {
				from: 1,
				to: 1,
				loop: true,
			},

			"mouseLeftPressed": {
				from: 2,
				to: 2,
				loop: true,
			},
		},
	});

	await k.loadSprite("upKey", "sprites/icons/upKey.png", {
		sliceX: 2,
		anims: {
			"upKey": {
				from: 0,
				to: 0,
				loop: true,
			},

			"upKeyPressed": {
				from: 1,
				to: 1,
				loop: true,
			},

			"upKeys": {
				from: 0,
				to: 1,
				duration: 1,
			}
		},
	});

	await k.loadSprite("downKey", "sprites/icons/downKey.png", {
		sliceX: 2,
		anims: {
			"downKey": {
				from: 0,
				to: 0,
				loop: true,
			},

			"downKeyPressed": {
				from: 1,
				to: 1,
				loop: true,
			}
		},
	});
}
await loadStuff();
createFishScene();

const tiledBackground = createTiledBackground("#d9bdc8", "#ffffff");

async function name() {
	const askName = createCoolText(k, "Please enter your name", k.width() / 2, k.height() * 0.2, 48, "destroyN", k.timer(), k.rotate());
	const name = createCoolText(k, "", k.width() / 2, k.height() / 2, 48, k.textInput(true, 10), "destroyN");

	const keyPress = k.onKeyPress("enter", async () => {
		name.text = name.text.trim();
		if (name.text.length > 1) {
			keyPress.cancel();

			k.destroyAll("destroyN");
			roomName(name);
		} else {
			await k.play("wrongName", {
				loop: false,
			});
			await askName.tween(-10, 10, 0.1, (value) => (askName.angle = value));
			await askName.tween(10, 0, 0.1, (value) => (askName.angle = value));
		}
	});
}

async function roomName(nameT) {
	createCoolText(k, "You can optionally enter a room code", k.width() / 2, k.height() * 0.2, 48, "destroyR", k.timer(), k.rotate());
	const roomCode = createCoolText(k, "", k.width() / 2, k.height() / 2, 48, k.textInput(true, 10), "destroyR");
	k.wait(0.5, () => {
		const keyPress2 = k.onKeyPress("enter", async () => {
			keyPress2.cancel();
			destroyAll("destroyR");
			if (roomCode.text.length < 1) {
				main(nameT.text);
			} else {
				main(nameT.text, roomCode.text);
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
				k.go("fish", room);
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

name();

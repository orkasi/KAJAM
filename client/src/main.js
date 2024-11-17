import { k } from "./init";
import * as Colyseus from "colyseus.js";
import { createTiledBackground, createCoolText, createNormalText, createMuteButton } from "./utils";

import { createFishScene, startPos } from "./scenes/fish";

window.addEventListener("keydown", (e) => {
	if (e.key === "F1") {
		e.preventDefault();
	}
});

const client = new Colyseus.Client("https://de-fra-1cb3f4c6.colyseus.cloud/");

async function loadStuff() {
	k.loadRoot("/");

	//Shaders
	await k.loadShaderURL("tiledPattern", null, "shaders/tiledPattern.frag");

	//Fish Game Sprites
	k.loadSprite("sukomi", "sprites/sukomi.png");
	k.loadSprite("bobo", "sprites/bobo.png");
	k.loadSprite("bubble", "sprites/particles/bubble.png");

	//Sounds
	k.loadSound("loseSound", "sounds/lost.ogg");
	k.loadSound("fishHit", "sounds/fishHit.ogg");
	k.loadSound("wonSound", "sounds/won.ogg");
	k.loadSound("drawSound", "sounds/draw.ogg");
	await k.loadSound("wrongName", "sounds/wrongName.ogg");
	await k.loadSound("count", "sounds/count.ogg");
	await k.loadSound("go", "sounds/go.ogg");
	k.loadSound("ratHurt", "sounds/ratHurt.ogg");
	await k.loadSound("lobbyScene", "sounds/lobbyScene.ogg");
	k.loadSound("fishScene", "sounds/fishScene.ogg");
	k.loadSound("ratScene", "sounds/ratScene.ogg");
	k.loadSound("butterflyScene", "sounds/butterflyScene.ogg");
	k.loadSound("butterflyHit", "sounds/butterflyHit.ogg");

	//Butterfly Game Sprites
	k.loadSprite("butterfly", "sprites/butterfly.png");
	k.loadSprite("goldfly", "sprites/goldfly.png");
	k.loadSprite("ghosty", "sprites/ghosty.png");
	k.loadSprite("white", "sprites/particles/white.png");
	k.loadSprite("heart", "sprites/particles/heart.png");

	//Rat Game Sprites
	k.loadSprite("gigagantrum", "sprites/gigagantrum.png");
	k.loadSprite("karat", "sprites/karat.png");
	k.loadSprite("bag", "sprites/bag.png");
	k.loadSprite("money_bag", "sprites/money_bag.png");
	k.loadSprite("grass", "sprites/grass.png");
	k.loadSprite("portal", "sprites/portal.png");
	k.loadSprite("moon", "sprites/moon.png");
	k.loadSprite("cloud", "sprites/cloud.png");
	k.loadSprite("green", "sprites/particles/green.png");

	//Icons
	await k.loadSprite("play-o", "sprites/icons/play-o.png");
	await k.loadSprite("kaplay", "sprites/icons/kaplay.png");
	await k.loadSprite("kajam", "sprites/icons/kajam.png");
	await k.loadSprite("colyseus", "sprites/icons/colyseus.png");
	await k.loadSprite("mute", "sprites/icons/mute.png");
	await k.loadSprite("enterButton", "sprites/icons/enterButton.png");
	await k.loadSprite("space", "sprites/icons/spaceKey.png");

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

const lobbySound = k.play("lobbyScene", {
	loop: true,
	paused: true,
	volume: 0.05,
});

const playOnClick = k.onClick(() => {
	lobbySound.paused = false;
	playOnClick.cancel();
});

let muteButton;

k.onClick("mute", () => {
	if (lobbySound.paused === false) {
		lobbySound.paused = true;
		muteButton.use(k.color(k.RED));
	} else {
		lobbySound.paused = false;
		muteButton.unuse("color");
	}
});

function isAlphanumeric(str) {
	const regex = /^[a-z0-9]+$/i;
	return regex.test(str);
}
let tiledBackgroundN;
async function name() {
	tiledBackgroundN = createTiledBackground("#9982e8", "#8465ec");

	const askName = createCoolText(k, "Please enter your name", k.width() / 2, k.height() * 0.2, 48, "destroyN", k.timer(), k.rotate());
	askName.font = "Iosevka-Heavy";
	const name = createCoolText(k, "", k.width() / 2, k.height() / 2, 48, "destroyN");
	const enterButton = name.add([k.sprite("enterButton"), k.anchor("center"), k.pos(name.width * 0.2, 0), k.scale(1)]);
	const kInput = k.onCharInput(async (ch) => {
		if (ch === "\\") {
			return;
		} else if (name.text.length <= 10) {
			name.text += ch;
		} else {
			const warning = createNormalText(k, "Name must be at most 10 characters.", k.width() / 2, k.height() * 0.3, 32, "destroyN");
			warning.font = "Iosevka-Heavy";

			k.wait(5, () => {
				destroy(warning);
			});
		}
	});
	const bInput = k.onKeyPressRepeat("backspace", () => {
		name.text = name.text.slice(0, -1);
	});
	const keyPress = k.onKeyPress("enter", async () => {
		name.text = name.text.trim();
		if (name.text.length > 1 && isAlphanumeric(name.text)) {
			keyPress.cancel();
			kInput.cancel();
			bInput.cancel();
			k.destroyAll("destroyN");
			roomName(name);
		} else {
			await k.play("wrongName", {
				loop: false,
				volume: 0.1,
			});
			await askName.tween(-10, 10, 0.1, (value) => (askName.angle = value));
			await askName.tween(10, 0, 0.1, (value) => (askName.angle = value));
			const warning = createNormalText(k, "Do not use special characters. Name must be longer than 1 characters and at most 10 characters.", k.width() / 2, k.height() * 0.3, 32, "destroyN");
			warning.font = "Iosevka-Heavy";

			k.wait(3, () => {
				destroy(warning);
			});
		}
	});
}

async function roomName(nameT) {
	const askCode = createCoolText(k, "You can optionally enter a room code", k.width() / 2, k.height() * 0.2, 48, "destroyR", k.timer(), k.rotate());
	askCode.font = "Iosevka-Heavy";
	const roomCode = createCoolText(k, "", k.width() / 2, k.height() / 2, 48, "destroyR");
	const enterButton = roomCode.add([k.sprite("enterButton"), k.anchor("center"), k.pos(roomCode.width * 0.2, 0), k.scale(1)]);

	const kInput = k.onCharInput(async (ch) => {
		if (ch === "\\") {
			return;
		} else if (roomCode.text.length <= 10) {
			roomCode.text += ch;
			const warning = createNormalText(k, "Code must be at most 10 characters.", k.width() / 2, k.height() * 0.3, 32, "destroyN");
			warning.font = "Iosevka-Heavy";

			k.wait(3, () => {
				destroy(warning);
			});
		}
	});
	const bInput = k.onKeyPressRepeat("backspace", () => {
		roomCode.text = roomCode.text.slice(0, -1);
	});

	k.wait(0.5, () => {
		const keyPress2 = k.onKeyPress("enter", async () => {
			if (roomCode.text.length < 1) {
				main(nameT.text);
				keyPress2.cancel();
				kInput.cancel();
				bInput.cancel();
				destroyAll("destroyR");
			} else if (roomCode.text.length > 1 && isAlphanumeric(roomCode.text)) {
				main(nameT.text, roomCode.text);
				keyPress2.cancel();
				kInput.cancel();
				bInput.cancel();
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
				k.destroy(tiledBackgroundN);
				lobbySound.stop();
				destroy(muteButton);
				k.go("fish", room);
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

export function titleScreen() {
	const tiledBackground = createTiledBackground("#000000", "#686767");
	muteButton = createMuteButton();

	const hText = createNormalText(k, "Made by Orkun Kaan & Irem", k.width() / 2, k.height() * 0.05, 16, "title");
	hText.letterSpacing = 2;

	const sText = createCoolText(k, "Reincarnation Racing", k.width() / 2, k.height() * 0.2, 80, "title");

	sText.font = "Iosevka-Heavy";
	const kajam = k.add([k.sprite("kajam"), k.rotate(10), k.scale(0.04), k.pos(k.width() * 0.879, k.height() * 0.12), k.animate(), "title"]);
	kajam.animate("scale", [k.vec2(0.04, 0.04), k.vec2(0.05, 0.05)], { duration: 1, direction: "ping-pong" });
	kajam.animate("angle", [0, 10], { duration: 1.5, direction: "ping-pong" });

	const rText = createNormalText(k, "A race where you reincarnate continuously", k.width() / 2, k.height() * 0.85, 32, "title");
	rText.letterSpacing = 0;
	rText.font = "Iosevka-Heavy";
	const pText = createNormalText(k, "(it's a two player game)", k.width() / 2, k.height() * 0.9, 16, "title");
	pText.letterSpacing = 2;

	k.add([k.sprite("kaplay"), k.pos(k.getSprite("kaplay").data.width * 0.8, k.height() - k.getSprite("kaplay").data.height * 0.8), k.anchor("topright"), k.scale(0.8), "title"]);
	k.add([k.sprite("colyseus"), k.scale(0.05), k.pos(k.width() - k.getSprite("colyseus").data.width * 0.054, k.height() - k.getSprite("colyseus").data.height * 0.06), k.anchor("topleft"), "title"]);

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

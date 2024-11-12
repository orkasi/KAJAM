import { k } from "./init";
import { createFishScene, startPos } from "./scenes/fish";
import * as Colyseus from "colyseus.js";
import { createTiledBackground, createCoolText } from "./utils";

window.addEventListener("keydown", (e) => {
	if (e.key === "F1") {
		e.preventDefault();
	}
});

const client = new Colyseus.Client("ws://localhost:2567");

async function loadStuff() {
	await k.loadRoot("/");

	//Rat Game Sprites
	await k.loadSprite("gigagantrum", "sprites/gigagantrum.png");
	await k.loadSprite("karat", "sprites/karat.png");
	await k.loadSprite("bag", "sprites/bag.png");
	await k.loadSprite("money_bag", "sprites/money_bag.png");
	await k.loadSprite("grass", "sprites/grass.png");
	await k.loadSprite("portal", "sprites/portal.png");
	await k.loadSprite("moon", "sprites/moon.png");
	await k.loadSprite("cloud", "sprites/cloud.png");

	//Fish Game Sprites
	await k.loadSprite("sukomi", "sprites/sukomi.png");
	await k.loadSprite("bobo", "sprites/bobo.png");

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

	//Shaders
	await k.loadShaderURL("tiledPattern", null, "shaders/tiledPattern.frag");
}

const tiledBackground = createTiledBackground("#d9bdc8", "#ffffff");
createFishScene();

async function name() {
	await loadStuff();
	const askName = createCoolText(k, "Please enter your name", k.width() / 2, k.height() * 0.2, 48, "destroyN", k.timer(), k.rotate());
	const name = createCoolText(k, " ", k.width() / 2, k.height() / 2, 48, k.textInput(true, 10), "destroyN");
	const keyPress = k.onKeyPress("enter", async () => {
		name.text = name.text.trim();
		if (name.text.length > 1) {
			k.destroyAll("destroyN");
			main(name.text);
			keyPress.cancel();
		} else {
			await k.play("wrongName", {
				loop: false,
			});
			await askName.tween(-10, 10, 0.1, (value) => (askName.angle = value));
			await askName.tween(10, 0, 0.1, (value) => (askName.angle = value));
		}
	});
}

async function main(name) {
	const lobbyText = createCoolText(k, "Connecting...", k.width() / 2, k.height() / 2, 48);
	await client
		.joinOrCreate("my_room", { playerName: name, playerPos: startPos })
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

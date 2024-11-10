import { k } from "./init";
import { createFishScene, startPos } from "./scenes/fish";
import * as Colyseus from "colyseus.js";
import { createCoolText } from "./utils";

window.addEventListener("keydown", (e) => {
	if (e.key === "F1") {
		e.preventDefault();
	}
});

const client = new Colyseus.Client("ws://localhost:2567");

async function loadStuff() {
	await k.loadSprite("sukomi", "sprites/sukomi.png");
	await k.loadSprite("bobo", "sprites/bobo.png");
	await k.loadSound("loseSound", "sounds/synth.wav");
	await k.loadSound("hitHurt", "sounds/hitHurt.wav");
	await k.loadSound("wonSound", "sounds/won.wav");
	await k.loadSound("drawSound", "sounds/draw.wav");
	await k.loadSound("wrongName", "sounds/wrongName.wav");
	await k.loadFont("Iosevka", "fonts/IosevkaNerdFontPropo-Regular.ttf", { filter: "linear" });
	await k.loadFont("Iosevka-Heavy", "fonts/IosevkaNerdFontPropo-Heavy.ttf", { outline: 3, filter: "linear" });
}

k.setBackground(rgb(166, 85, 95));

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

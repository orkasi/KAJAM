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

k.loadFont("Iosevka", "fonts/IosevkaNerdFontPropo-Regular.ttf", { filter: "linear" });
k.loadFont("Iosevka-Heavy", "fonts/IosevkaNerdFontPropo-Heavy.ttf", { outline: 3, filter: "linear" });
k.setBackground(rgb(166, 85, 95));

createFishScene();

function name() {
	const askName = createCoolText(k, "Please enter your name", k.width() / 2, k.height() * 0.2, 48, "destroyN");
	const name = createCoolText(k, " ", k.width() / 2, k.height() / 2, 48, k.textInput(true, 10), "destroyN");
	const keyPress = k.onKeyPress("enter", () => {
		k.destroyAll("destroyN");
		main(name.text);
		keyPress.cancel();
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

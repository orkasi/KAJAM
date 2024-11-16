import { k } from "../init";
import { createNormalText, createCoolText, createTiledBackground, createMuteButton } from "../utils";
import { createFishScene } from "./fish";

export function createEndScene() {
	k.scene("end", (player, opponent, room) => {
		const lobbySound = k.play("lobbyScene", {
			loop: true,
			paused: false,
			volume: 0.05,
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

		muteButton = createMuteButton();
		createFishScene();
		let sText;
		const tiledBackground = createTiledBackground("#000000", "#686767");
		if (player.score > opponent.score) {
			sText = createCoolText(k, "You've Won!", k.width() / 2, k.height() * 0.3, 80);
		} else if (player.score < opponent.score) {
			sText = createCoolText(k, "You've Lost!", k.width() / 2, k.height() * 0.3, 80);
		} else {
			sText = createCoolText(k, "Draw!", k.width() / 2, k.height() * 0.3, 80);
		}
		sText.font = "Iosevka-Heavy";
		const hText = createNormalText(k, "RESULTS", k.width() / 2, k.height() * 0.1, 48);
		hText.font = "Iosevka-Heavy";
		hText.letterSpacing = 10;

		const mText = createNormalText(k, `${player.name} : ${player.score}		-		${opponent.name} : ${opponent.score}`, k.width() / 2, k.height() * 0.5, 48);
		mText.font = "Iosevka-Heavy";
		mText.letterSpacing = 2;

		const rText = createNormalText(k, "Want to born again?", k.width() / 2, k.height() * 0.9, 32);
		rText.letterSpacing = 0;
		rText.font = "Iosevka-Heavy";
		const pText = createNormalText(k, "(continue against the same opponent with persistent scores)", k.width() / 2, k.height() * 0.95, 16);
		pText.letterSpacing = 2;

		const replayButton = k.add([k.sprite("play-o"), k.pos(k.width() / 2, k.height() * 0.75), k.anchor("center"), k.scale(2), k.area(), k.animate(), k.rotate(), "replay"]);
		replayButton.animate("scale", [k.vec2(2, 2), k.vec2(2.1, 2.1)], { duration: 1.5, direction: "ping-pong" });

		replayButton.animate("angle", [2, -2], { duration: 0.5, direction: "ping-pong" });
		replayButton.animate("pos", [k.vec2(k.width() * 0.49, k.height() * 0.75), k.vec2(k.width() * 0.51, k.height() * 0.75)], { duration: 1, direction: "ping-pong" });
		k.onClick("replay", () => {
			destroy(tiledBackground);
			lobbySound.stop();
			k.go("fish", room);
		});
	});
}

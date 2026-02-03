import { k } from "../init";
import { titleScreen } from "../main";
import { createCoolText, createNormalText, createTiledBackground, setReconnectEnabled } from "../utils";

export function createLeaveScene({ titleText = "Your opponent has left the game!", subtitleText = "Want to play again?" } = {}) {
	k.scene("leave", (room) => {
		const tiledBackground = createTiledBackground("#000000", "#686767");

		const sText = createCoolText(k, titleText, k.width() / 2, k.height() * 0.3, 80, "leave");

		sText.font = "Iosevka-Heavy";

		const rText = createNormalText(k, subtitleText, k.width() / 2, k.height() * 0.9, 32, "leave");
		rText.letterSpacing = 0;
		rText.font = "Iosevka-Heavy";

		const replayButton = k.add([k.sprite("play-o"), k.pos(k.width() / 2, k.height() * 0.75), k.anchor("center"), k.scale(2), k.area(), k.animate(), k.rotate(), "replay", "leave"]);
		replayButton.animate("scale", [k.vec2(2, 2), k.vec2(2.1, 2.1)], { duration: 1.5, direction: "ping-pong" });

		replayButton.animate("angle", [2, -2], { duration: 0.5, direction: "ping-pong" });
		replayButton.animate("pos", [k.vec2(k.width() * 0.49, k.height() * 0.75), k.vec2(k.width() * 0.51, k.height() * 0.75)], { duration: 1, direction: "ping-pong" });
		k.onClick("replay", async () => {
			destroy(tiledBackground);
			destroyAll("leave");
			setReconnectEnabled(false);
			if (room && typeof room.leave === "function") {
				room.leave();
			}
			k.camFlash(k.BLACK, 1);

			titleScreen();
		});
	});
}

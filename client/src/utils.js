import { k } from "./init.js";

export const overlay = ($color = WHITE, $opacity = 1) => ({
	async add() {
		const overlay = this.add([sprite(this.sprite), mask(), this?.anchor && anchor(this.anchor)]);

		const { width, height } = await getSprite(this.sprite);

		overlay.add([pos(0), rect(width, height), color($color), opacity($opacity), this?.anchor && anchor(this.anchor)]);
	},
});

export async function tweenFunc(gameObject, propertyToTween, startValue, endValue, duration, loopCount) {
	for (let i = 0; i < loopCount; i++) {
		await gameObject.tween(startValue, endValue, duration, (value) => (gameObject[propertyToTween] = value));
	}
}

export function createCoolText(gameObject, text, x, y, size, ...extraComps) {
	return gameObject.add([
		k.text(text, {
			font: "Iosevka",
			width: k.width() - 24 * 2,
			size: size,
			align: "center",
			lineSpacing: 8,
			letterSpacing: 4,
			transform: (idx, ch) => ({
				color: hsl2rgb((time() * 0.2 + idx * 0.1) % 1, 0.7, 0.8),
				pos: vec2(0, wave(-4, 4, time() * 4 + idx * 0.5)),
				scale: wave(1, 1.2, time() * 3 + idx),
				angle: wave(-9, 9, time() * 3 + idx),
			}),
		}),
		k.pos(x, y),
		k.anchor("center"),
		...extraComps,
	]);
}

export const COLORS = {
	color1: "#ffffff",
	color2: "#d9bdc8",
};

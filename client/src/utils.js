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

export function createNormalText(gameObject, text, x, y, size, ...extraComps) {
	return gameObject.add([
		k.text(text, {
			font: "Iosevka",
			width: k.width() - 24 * 2,
			size: size,
			align: "center",
			lineSpacing: 8,
			letterSpacing: 4,
		}),
		k.pos(x, y),
		k.anchor("center"),
		...extraComps,
	]);
}

export function createTiledBackground(color1, color2) {
	return k.add([
		k.uvquad(k.width(), k.height()) /* surface for the shader */,
		k.shader("tiledPattern", () => ({
			u_time: k.time() / 20,
			u_color1: k.Color.fromHex(color1),
			u_color2: k.Color.fromHex(color2),
			u_speed: k.vec2(1, -1),
			u_aspect: k.width() / k.height(),
			u_size: 5,
		})),
		k.pos(0),
		k.fixed(),
	]);
}

// This function will create the main tutorial rectangle and the ones with the outlines beneath them.
// Yes sir!
// It will allow you to set their colors and size.
// It will return the main background rect

export function createTutorialRect(x, y, size_x, size_y, color, outlinecolor, outlinecolor1, outlinecolor2) {
	const rect = k.add([k.pos(k.width() * x, k.height() * y), k.rect(size_x, size_y), k.scale(), k.opacity(1), k.outline(20, color, 1, "round"), k.color(color), "backgroundRect"]);

	rect.outlineColors = [outlinecolor, outlinecolor1, outlinecolor2];
	rect.onUpdate(() => {
		k.drawRect({
			width: rect.width,
			height: rect.height,
			pos: k.vec2(rect.pos.x, rect.pos.y),
			outline: { color: outlinecolor, width: 80, join: "round" },
		});
		k.drawRect({
			width: rect.width,
			height: rect.height,
			pos: k.vec2(rect.pos.x, rect.pos.y),
			outline: { color: outlinecolor1, width: 60, join: "round" },
		});
		k.drawRect({
			width: rect.width,
			height: rect.height,
			pos: k.vec2(rect.pos.x, rect.pos.y),
			outline: { color: outlinecolor2, width: 40, join: "round" },
		});
	});
	return rect;
}

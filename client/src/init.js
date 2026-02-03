import kaplay from "kaplay";

const pixelDensity = Math.min(2, devicePixelRatio || 1);

export const k = kaplay({
	width: 1280,
	height: 720,
	texFilter: "nearest",
	maxFPS: 60,
	pixelDensity,
	debug: false,
});

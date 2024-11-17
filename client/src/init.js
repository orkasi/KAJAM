import kaplay from "kaplay";

export const k = kaplay({
	width: 1280,
	height: 720,
	texFilter: "nearest",
	maxFPS: 60,
	pixelDensity: devicePixelRatio,
	debug: false,
});

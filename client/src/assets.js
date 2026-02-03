import { k } from "./init";

const assetGroups = {
	core: [
		() => k.loadShaderURL("tiledPattern", null, "/shaders/tiledPattern.frag"),
		() =>
			k.loadSpriteAtlas("/sprites/icons/ui-atlas.png", {
				kaplay: { x: 103, y: 0, width: 154, height: 50 },
				"play-o": { x: 0, y: 0, width: 52, height: 60 },
				mute: { x: 54, y: 0, width: 47, height: 52 },
				enterButton: { x: 259, y: 0, width: 64, height: 48 },
				space: { x: 325, y: 0, width: 64, height: 48 },
			}),
		() => k.loadSprite("kajam", "/sprites/icons/kajam.png"),
		() => k.loadSprite("colyseus", "/sprites/icons/colyseus.png"),
		() => k.loadFont("Iosevka", "/fonts/Iosevka-Regular.woff2", { outline: 1, filter: "linear" }),
		() => k.loadFont("Iosevka-Heavy", "/fonts/Iosevka-Heavy.woff2", { outline: 3, filter: "linear" }),
	],
	uiControls: [
		() =>
			k.loadSprite("gamepadUpandDown", "/sprites/icons/gamepadUpandDown.png", {
				sliceX: 3,
				anims: {
					emptyGamepad: { from: 0, to: 0, loop: true },
					gamepadUp: { from: 1, to: 1, loop: true },
					gamepadDown: { from: 2, to: 2, loop: true },
				},
			}),
		() =>
			k.loadSprite("mouseLeftandRight", "/sprites/icons/mouseLeftandRight.png", {
				sliceX: 3,
				anims: {
					emptyMouse: { from: 0, to: 0, loop: true },
					mouseRightPressed: { from: 1, to: 1, loop: true },
					mouseLeftPressed: { from: 2, to: 2, loop: true },
				},
			}),
		() =>
			k.loadSprite("upKey", "/sprites/icons/upKey.png", {
				sliceX: 2,
				anims: {
					upKey: { from: 0, to: 0, loop: true },
					upKeyPressed: { from: 1, to: 1, loop: true },
				},
			}),
		() =>
			k.loadSprite("downKey", "/sprites/icons/downKey.png", {
				sliceX: 2,
				anims: {
					downKey: { from: 0, to: 0, loop: true },
					downKeyPressed: { from: 1, to: 1, loop: true },
				},
			}),
	],
	fish: [
		() => k.loadSprite("sukomi", "/sprites/sukomi.png"),
		() => k.loadSprite("bobo", "/sprites/bobo.png"),
		() => k.loadSprite("bubble", "/sprites/particles/bubble.png"),
	],
	rat: [
		() => k.loadSprite("gigagantrum", "/sprites/gigagantrum.png"),
		() => k.loadSprite("karat", "/sprites/karat.png"),
		() => k.loadSprite("bag", "/sprites/bag.png"),
		() => k.loadSprite("money_bag", "/sprites/money_bag.png"),
		() => k.loadSprite("grass", "/sprites/grass.png"),
		() => k.loadSprite("portal", "/sprites/portal.png"),
		() => k.loadSprite("moon", "/sprites/moon.png"),
		() => k.loadSprite("cloud", "/sprites/cloud.png"),
		() => k.loadSprite("green", "/sprites/particles/green.png"),
	],
	butterfly: [
		() => k.loadSprite("butterfly", "/sprites/butterfly.png"),
		() => k.loadSprite("goldfly", "/sprites/goldfly.png"),
		() => k.loadSprite("ghosty", "/sprites/ghosty.png"),
		() => k.loadSprite("white", "/sprites/particles/white.png"),
		() => k.loadSprite("heart", "/sprites/particles/heart.png"),
	],
	sounds: [
		() => k.loadSound("loseSound", "/sounds/lost.ogg"),
		() => k.loadSound("fishHit", "/sounds/fishHit.ogg"),
		() => k.loadSound("wonSound", "/sounds/won.ogg"),
		() => k.loadSound("drawSound", "/sounds/draw.ogg"),
		() => k.loadSound("wrongName", "/sounds/wrongName.ogg"),
		() => k.loadSound("count", "/sounds/count.ogg"),
		() => k.loadSound("go", "/sounds/go.ogg"),
		() => k.loadSound("ratHurt", "/sounds/ratHurt.ogg"),
		() => k.loadSound("lobbyScene", "/sounds/lobbyScene.ogg"),
		() => k.loadSound("fishScene", "/sounds/fishScene.ogg"),
		() => k.loadSound("ratScene", "/sounds/ratScene.ogg"),
		() => k.loadSound("butterflyScene", "/sounds/butterflyScene.ogg"),
		() => k.loadSound("butterflyHit", "/sounds/butterflyHit.ogg"),
	],
};

const loadedGroups = new Set();
const loadingGroups = new Map();
const loadedSounds = new Set();

export function getAssetGroupSize(name) {
	return assetGroups[name]?.length ?? 0;
}

export function isAssetGroupLoaded(name) {
	return loadedGroups.has(name);
}

export function isSoundLoaded(name) {
	return loadedSounds.has(name);
}

export function isSoundGroupLoaded() {
	return loadedGroups.has("sounds");
}

export function loadAssetGroup(name, { onProgress } = {}) {
	if (loadedGroups.has(name)) return Promise.resolve();
	if (loadingGroups.has(name)) return loadingGroups.get(name);
	const tasks = assetGroups[name] ?? [];
	let completed = 0;
	const promise = Promise.all(
		tasks.map((task) =>
			Promise.resolve()
				.then(task)
				.finally(() => {
					completed += 1;
					onProgress?.(completed, tasks.length);
				}),
		),
	)
		.then(() => {
			loadedGroups.add(name);
			if (name === "sounds") {
				const soundNames = [
					"loseSound",
					"fishHit",
					"wonSound",
					"drawSound",
					"wrongName",
					"count",
					"go",
					"ratHurt",
					"lobbyScene",
					"fishScene",
					"ratScene",
					"butterflyScene",
					"butterflyHit",
				];
				soundNames.forEach((soundName) => loadedSounds.add(soundName));
			}
		})
		.finally(() => {
			loadingGroups.delete(name);
		});
	loadingGroups.set(name, promise);
	return promise;
}

export async function loadAssetGroups(names, { onProgress } = {}) {
	const unique = Array.from(new Set(names));
	const total = unique.reduce((sum, name) => sum + getAssetGroupSize(name), 0);
	let done = unique.reduce((sum, name) => sum + (loadedGroups.has(name) ? getAssetGroupSize(name) : 0), 0);
	if (total > 0) {
		onProgress?.(done, total);
	}
	for (const name of unique) {
		if (loadedGroups.has(name)) continue;
		await loadAssetGroup(name, {
			onProgress: () => {
				done += 1;
				onProgress?.(done, total);
			},
		});
	}
}

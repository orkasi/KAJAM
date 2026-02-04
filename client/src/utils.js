import { k } from "./init.js";
import { isSoundLoaded } from "./assets.js";

const muteStorageKey = "kajam:muted";
let muted = false;
const loopSounds = new Set();
const loopSoundVolumes = new WeakMap();
let reconnectEnabled = true;
let currentScene = null;
let matchContext = { roomCode: "nocode" };

const readStoredMute = () => {
	try {
		return localStorage.getItem(muteStorageKey) === "true";
	} catch {
		return false;
	}
};

const storeMute = (value) => {
	try {
		localStorage.setItem(muteStorageKey, value ? "true" : "false");
	} catch {
		// ignore storage errors
	}
};

muted = readStoredMute();

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
	// Kaplay calls `transform()` for every glyph, every frame.
	// Doing per-glyph math in that hot path can tank FPS on some GPUs/CPUs.
	// Instead, we compute the per-letter transforms at a fixed rate (30Hz) and reuse them.
	const state = {
		cache: /** @type {Array<{color:any, pos:any, scale:number, angle:number}>} */ ([]),
		acc: 0,
	};

	const textObj = gameObject.add([
		k.text(text, {
			font: "Iosevka",
			width: k.width() - 24 * 2,
			size: size,
			align: "center",
			lineSpacing: 8,
			letterSpacing: 4,
			transform: (idx) => state.cache[idx] ?? { color: hsl2rgb(0, 0, 1), pos: vec2(0, 0), scale: 1, angle: 0 },
		}),
		k.pos(x, y),
		k.anchor("center"),
		...extraComps,
	]);

	const ensureCacheSize = () => {
		const currentText = typeof textObj.text === "string" ? textObj.text : String(text ?? "");
		const len = currentText.length;
		if (state.cache.length !== len) {
			state.cache.length = len;
			for (let i = 0; i < len; i++) {
				state.cache[i] ??= { color: hsl2rgb(0, 0, 1), pos: vec2(0, 0), scale: 1, angle: 0 };
			}
		}
	};

	const recompute = () => {
		ensureCacheSize();
		const now = time();
		for (let i = 0; i < state.cache.length; i++) {
			const entry = state.cache[i];
			entry.color = hsl2rgb((now * 0.2 + i * 0.1) % 1, 0.7, 0.8);
			entry.pos = vec2(0, wave(-4, 4, now * 4 + i * 0.5));
			entry.scale = wave(1, 1.2, now * 3 + i);
			entry.angle = wave(-9, 9, now * 3 + i);
		}
	};

	// Initialize so the first render has data.
	recompute();
	textObj.onUpdate(() => {
		state.acc += dt();
		if (state.acc < 1 / 30) return;
		state.acc = 0;
		recompute();
	});

	return textObj;
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
		k.uvquad(k.width(), k.height()),
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

export function createTutorialRect(x, y, size_x, size_y, color, outlinecolor, outlinecolor1, outlinecolor2) {
	// The original look is “layered borders” (three colored bands).
	// We can preserve that look without per-frame `k.drawRect()` by stacking a few
	// slightly larger filled rounded-rects behind the main rect.
	const radius = 20;
	const rect = k.add([
		k.pos(x, y),
		k.rect(size_x, size_y, { radius }),
		k.scale(),
		k.opacity(1),
		k.color(color),
		k.anchor("center"),
		"backgroundRect",
	]);

	const addLayer = (pad, layerColor, z) => {
		rect.add([
			k.rect(size_x + pad * 2, size_y + pad * 2, { radius: radius + pad }),
			k.color(layerColor),
			k.anchor("center"),
			k.z(z),
		]);
	};

	// Keep exact pad values so the “rings” match the old draw order (80 → 60 → 40).
	addLayer(80, outlinecolor, -3);
	addLayer(60, outlinecolor1, -2);
	addLayer(40, outlinecolor2, -1);

	// The original version also had a rounded outline on the main rect.
	rect.use(k.outline(20, color, 1, "round"));

	return rect;
}

export function isMuted() {
	return muted;
}

export function setMuted(value) {
	muted = Boolean(value);
	storeMute(muted);
	loopSounds.forEach((sound) => {
		const baseVolume = loopSoundVolumes.get(sound) ?? 1;
		sound.volume = muted ? 0 : baseVolume;
	});
}

export function toggleMuted() {
	setMuted(!muted);
}

export function registerLoopSound(sound, baseVolume) {
	if (!sound) return sound;
	loopSounds.add(sound);
	loopSoundVolumes.set(sound, baseVolume ?? sound.volume ?? 1);
	sound.volume = muted ? 0 : loopSoundVolumes.get(sound);
	return sound;
}

export function playSound(name, options = {}) {
	if (!isSoundLoaded(name)) return null;
	const volume = options.volume ?? 1;
	return k.play(name, {
		...options,
		volume: muted ? 0 : volume,
	});
}

export function createMuteButton() {
	const button = k.add([k.sprite("mute"), k.pos(k.width(), 0), k.scale(0.5), k.area(), k.opacity(0.5), k.fixed(), k.anchor("topright"), "mute"]);
	const updateColor = () => {
		if (muted) {
			button.use(k.color(k.RED));
		} else {
			button.unuse("color");
		}
	};
	updateColor();
	button.onClick(() => {
		toggleMuted();
		updateColor();
	});
	return button;
}

export function createMatchHud(room, { roomCode = "nocode" } = {}) {
	const container = k.add([k.pos(20, 20), k.fixed(), k.z(100)]);

	const roomLabel = roomCode && roomCode !== "nocode" ? `Room: ${roomCode}` : "Room: Public";
	const roomText = container.add([k.text(roomLabel, { size: 20, font: "Iosevka-Heavy" }), k.pos(0, 0), k.anchor("topleft")]);

	const copyButton = container.add([k.text("Copy", { size: 16, font: "Iosevka-Heavy" }), k.pos(0, 24), k.anchor("topleft"), k.area(), k.color(k.rgb(255, 255, 255))]);

	const copyStatus = container.add([k.text("", { size: 14, font: "Iosevka" }), k.pos(60, 24), k.anchor("topleft")]);

	const youText = container.add([k.text("You: Not Ready", { size: 16, font: "Iosevka" }), k.pos(0, 48), k.anchor("topleft")]);
	const oppText = container.add([k.text("Opponent: Waiting...", { size: 16, font: "Iosevka" }), k.pos(0, 68), k.anchor("topleft")]);

	if (!roomCode || roomCode === "nocode") {
		copyButton.hidden = true;
	}

	copyButton.onClick(async () => {
		if (!roomCode || roomCode === "nocode") return;
		try {
			await navigator.clipboard.writeText(roomCode);
			copyStatus.text = "Copied!";
			k.wait(2, () => {
				copyStatus.text = "";
			});
		} catch {
			copyStatus.text = "Copy failed";
			k.wait(2, () => {
				copyStatus.text = "";
			});
		}
	});

	const updateLoop = k.loop(0.2, () => {
		const playersState = getPlayersSnapshot(room);
		if (playersState.size === 0) return;
		const me = playersState.get(room.sessionId);
		if (me) {
			youText.text = `You: ${me.ready ? "Ready" : "Not Ready"}`;
		}
		const opponent = Array.from(playersState.values()).find((player) => player.sessionId !== room.sessionId);
		if (opponent) {
			oppText.text = `${opponent.name}: ${opponent.ready ? "Ready" : "Not Ready"}`;
		} else {
			oppText.text = "Opponent: Waiting...";
		}
	});

	let destroyed = false;
	let leaveHandle = null;
	const cleanup = () => {
		if (destroyed) return;
		destroyed = true;
		updateLoop.cancel();
		if (leaveHandle && typeof leaveHandle.cancel === "function") {
			leaveHandle.cancel();
		}
		k.destroy(container);
	};
	leaveHandle = k.onSceneLeave(cleanup);

	return {
		updateRoomCode: (value) => {
			const label = value && value !== "nocode" ? `Room: ${value}` : "Room: Public";
			roomText.text = label;
			copyButton.hidden = !value || value === "nocode";
		},
		destroy: () => {
			cleanup();
		},
	};
}

export function getPlayersSnapshot(room) {
	const map = new Map();
	const players = room?.state?.players;
	if (!players) return map;
	if (typeof players.forEach === "function") {
		players.forEach((value, key) => {
			map.set(key, value);
		});
		return map;
	}
	if (typeof players.values === "function" && typeof players.get === "function") {
		for (const value of players.values()) {
			const key = value?.sessionId || `${map.size}`;
			map.set(key, value);
		}
		return map;
	}
	if (typeof players === "object") {
		for (const [key, value] of Object.entries(players)) {
			map.set(key, value);
		}
	}
	return map;
}

export function getPlayer(room, sessionId) {
	if (!sessionId) return null;
	const players = room?.state?.players;
	if (!players) return null;
	if (typeof players.get === "function") {
		return players.get(sessionId);
	}
	if (typeof players === "object" && sessionId in players) {
		return players[sessionId];
	}
	return null;
}

export function bindPlayers(room, { onAdd, onRemove }) {
	const players = room?.state?.players;
	if (players && typeof players.onAdd === "function" && typeof players.onRemove === "function") {
		const offAdd = players.onAdd(onAdd);
		const offRemove = players.onRemove(onRemove);
		return () => {
			if (typeof offAdd === "function") offAdd();
			if (typeof offRemove === "function") offRemove();
		};
	}

	let previous = new Map();
	const diff = () => {
		const next = getPlayersSnapshot(room);
		for (const [key, value] of next) {
			if (!previous.has(key)) {
				onAdd?.(value, key);
			}
		}
		for (const [key, value] of previous) {
			if (!next.has(key)) {
				onRemove?.(value, key);
			}
		}
		previous = next;
	};

	diff();
	if (typeof room?.onStateChange !== "function") {
		return () => {};
	}
	const off = room.onStateChange(diff);
	return () => {
		if (typeof off === "function") off();
	};
}

export function createMoveInterpolator({ delayMs = 50, maxBuffer = 10, maxExtrapolateMs = 100 } = {}) {
	const buffer = [];
	let lastReceivedAt = 0;
	let lastTimestamp = 0;

	const toNumber = (value) => (Number.isFinite(value) ? value : null);

	return {
		push(sample) {
			if (!sample) return;
			const now = Date.now();
			const t = Number.isFinite(sample.t) ? sample.t : now;
			if (t < lastTimestamp) return;
			lastTimestamp = t;
			const x = toNumber(sample.x);
			const y = toNumber(sample.y);
			const angle = toNumber(sample.angle);
			if (x === null || y === null) return;
			buffer.push({ x, y, angle, t });
			if (buffer.length > maxBuffer) buffer.shift();
			lastReceivedAt = now;
		},
		sample(now = Date.now()) {
			if (buffer.length === 0) return null;
			const renderTime = now - delayMs;
			while (buffer.length >= 2 && buffer[1].t <= renderTime) {
				buffer.shift();
			}
			if (buffer.length >= 2 && buffer[0].t <= renderTime) {
				const a = buffer[0];
				const b = buffer[1];
				const span = b.t - a.t;
				const alpha = span > 0 ? Math.min(1, Math.max(0, (renderTime - a.t) / span)) : 0;
				return {
					x: k.lerp(a.x, b.x, alpha),
					y: k.lerp(a.y, b.y, alpha),
					angle: a.angle !== null || b.angle !== null ? k.lerp(a.angle ?? 0, b.angle ?? 0, alpha) : null,
				};
			}
			if (buffer.length >= 2) {
				const latest = buffer[buffer.length - 1];
				if (renderTime > latest.t) {
					const prev = buffer[buffer.length - 2];
					const span = latest.t - prev.t;
					if (span > 0) {
						const ahead = Math.min(renderTime - latest.t, maxExtrapolateMs);
						const vx = (latest.x - prev.x) / span;
						const vy = (latest.y - prev.y) / span;
						const va = latest.angle !== null && prev.angle !== null ? (latest.angle - prev.angle) / span : 0;
						return {
							x: latest.x + vx * ahead,
							y: latest.y + vy * ahead,
							angle: latest.angle !== null && prev.angle !== null ? latest.angle + va * ahead : latest.angle,
						};
					}
				}
			}
			return buffer[0];
		},
		shouldFallback(now = Date.now(), timeoutMs = 500) {
			return buffer.length === 0 || now - lastReceivedAt > timeoutMs;
		},
		clear() {
			buffer.length = 0;
			lastReceivedAt = 0;
			lastTimestamp = 0;
		},
	};
}

export function hasPlayersState(room) {
	return Boolean(room?.state?.players);
}

export function setMatchContext({ roomCode = "nocode" } = {}) {
	matchContext = { roomCode };
}

export function getMatchContext() {
	return matchContext;
}

export function goScene(sceneName, ...args) {
	currentScene = sceneName;
	k.go(sceneName, ...args);
}

export function getCurrentScene() {
	return currentScene;
}

export function setReconnectEnabled(value) {
	reconnectEnabled = Boolean(value);
}

export function getReconnectEnabled() {
	return reconnectEnabled;
}

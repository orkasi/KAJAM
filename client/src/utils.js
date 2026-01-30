import { k } from "./init.js";

const muteStorageKey = "kajam:muted";
let muted = false;
const loopSounds = new Set();
const loopSoundVolumes = new WeakMap();
let reconnectEnabled = true;
let currentScene = null;
let matchContext = { roomCode: "nocode", difficulty: "casual" };

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
	const rect = k.add([k.pos(x, y), k.rect(size_x, size_y), k.scale(), k.opacity(1), k.outline(20, color, 1, "round"), k.color(color), k.anchor("center"), "backgroundRect"]);

	rect.outlineColors = [outlinecolor, outlinecolor1, outlinecolor2];
	rect.onUpdate(() => {
		k.drawRect({
			width: rect.width,
			height: rect.height,
			pos: k.vec2(rect.pos.x - rect.width / 2, rect.pos.y - rect.height / 2),
			outline: { color: outlinecolor, width: 80, join: "round" },
		});
		k.drawRect({
			width: rect.width,
			height: rect.height,
			pos: k.vec2(rect.pos.x - rect.width / 2, rect.pos.y - rect.height / 2),
			outline: { color: outlinecolor1, width: 60, join: "round" },
		});
		k.drawRect({
			width: rect.width,
			height: rect.height,
			pos: k.vec2(rect.pos.x - rect.width / 2, rect.pos.y - rect.height / 2),
			outline: { color: outlinecolor2, width: 40, join: "round" },
		});
	});
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

export function createMatchHud(room, { roomCode = "nocode", difficulty = "casual" } = {}) {
	const container = k.add([k.pos(20, 20), k.fixed(), k.z(100)]);

	const roomLabel = roomCode && roomCode !== "nocode" ? `Room: ${roomCode}` : "Room: Public";
	const roomText = container.add([k.text(roomLabel, { size: 20, font: "Iosevka-Heavy" }), k.pos(0, 0), k.anchor("topleft")]);

	const copyButton = container.add([k.text("Copy", { size: 16, font: "Iosevka-Heavy" }), k.pos(0, 24), k.anchor("topleft"), k.area(), k.color(k.rgb(255, 255, 255))]);

	const copyStatus = container.add([k.text("", { size: 14, font: "Iosevka" }), k.pos(60, 24), k.anchor("topleft")]);

	const formatDifficulty = (value) => {
		if (value === "casual") return "Casual";
		if (value === "competitive") return "Competitive";
		return "Casual";
	};

	let lastDifficulty = difficulty;
	const difficultyText = container.add([k.text(`Difficulty: ${formatDifficulty(difficulty)}`, { size: 16, font: "Iosevka-Heavy" }), k.pos(0, 48), k.anchor("topleft")]);

	const youText = container.add([k.text("You: Not Ready", { size: 16, font: "Iosevka" }), k.pos(0, 72), k.anchor("topleft")]);
	const oppText = container.add([k.text("Opponent: Waiting...", { size: 16, font: "Iosevka" }), k.pos(0, 92), k.anchor("topleft")]);

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
		const effectiveDifficulty = room?.state?.difficulty || lastDifficulty;
		if (effectiveDifficulty !== lastDifficulty) {
			lastDifficulty = effectiveDifficulty;
			difficultyText.text = `Difficulty: ${formatDifficulty(effectiveDifficulty)}`;
		}
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

	return {
		updateDifficulty: (value) => {
			lastDifficulty = value;
			difficultyText.text = `Difficulty: ${formatDifficulty(value)}`;
		},
		updateRoomCode: (value) => {
			const label = value && value !== "nocode" ? `Room: ${value}` : "Room: Public";
			roomText.text = label;
			copyButton.hidden = !value || value === "nocode";
		},
		destroy: () => {
			updateLoop.cancel();
			k.destroy(container);
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

export function hasPlayersState(room) {
	return Boolean(room?.state?.players);
}

export function setMatchContext({ roomCode = "nocode", difficulty = "casual" } = {}) {
	matchContext = { roomCode, difficulty: difficulty === "competitive" ? "competitive" : "casual" };
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

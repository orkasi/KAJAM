import * as Colyseus from "colyseus.js";
import { k } from "./init";
import { createCoolText, createMuteButton, createNormalText, createTiledBackground, getCurrentScene, getReconnectEnabled, goScene, hasPlayersState, playSound, registerLoopSound, setMatchContext, setReconnectEnabled } from "./utils";
import { isAssetGroupLoaded, isSoundGroupLoaded, loadAssetGroup, loadAssetGroups } from "./assets";

import { createFishScene, startPos } from "./scenes/fish";
import { createLeaveScene } from "./scenes/leave";

function normalizeSeatReservation(reservation) {
	if (!reservation || reservation.room) return reservation;
	if (!reservation.roomId || !reservation.name) return reservation;
	return {
		room: {
			roomId: reservation.roomId,
			name: reservation.name,
			processId: reservation.processId,
			publicAddress: reservation.publicAddress,
		},
		sessionId: reservation.sessionId,
		reconnectionToken: reservation.reconnectionToken,
	};
}

const originalConsumeSeatReservation = Colyseus.Client.prototype.consumeSeatReservation;
Colyseus.Client.prototype.consumeSeatReservation = function consumeSeatReservation(reservation, rootSchema) {
	return originalConsumeSeatReservation.call(this, normalizeSeatReservation(reservation), rootSchema);
};

async function loadRuntimeConfig() {
	try {
		const res = await fetch("./config.json", { cache: "no-store" });
		if (!res.ok) return {};
		const json = await res.json();
		if (!json || typeof json !== "object") return {};
		return json;
	} catch {
		return {};
	}
}

function resolveColyseusEndpoint(runtimeConfig) {
	const fromRuntimeConfig = typeof runtimeConfig?.colyseusEndpoint === "string" ? runtimeConfig.colyseusEndpoint.trim() : "";
	if (fromRuntimeConfig) return fromRuntimeConfig;

	const fromBuild = typeof import.meta.env?.VITE_COLYSEUS_ENDPOINT === "string" ? import.meta.env.VITE_COLYSEUS_ENDPOINT.trim() : "";
	if (fromBuild) return fromBuild;

	const wsProto = window.location.protocol === "https:" ? "wss:" : "ws:";
	return `${wsProto}//${window.location.host}`;
}

window.addEventListener("keydown", (e) => {
	if (e.key === "F1") {
		e.preventDefault();
	}
});

let colyseusClient;
let colyseusEndpoint = "";
let currentRoomCode = "nocode";
let reconnecting = false;
let reconnectOverlay = null;
let enteredScene = false;
let stateOverlay = null;

let assetStatusText = null;
let backgroundProgress = null;
let soundProgress = null;
let backgroundLoadPromise = null;
let soundLoadPromise = null;

function showBootLoader() {
	const overlay = k.add([k.rect(k.width(), k.height()), k.color(0, 0, 0), k.opacity(0.85), k.fixed(), k.z(500)]);
	const text = k.add([k.text("Loading...", { size: 28, align: "center" }), k.pos(k.width() / 2, k.height() / 2), k.anchor("center"), k.fixed(), k.z(501)]);
	return {
		update(loaded, total) {
			if (!total) return;
			const pct = Math.round((loaded / total) * 100);
			text.text = `Loading... ${pct}%`;
		},
		destroy() {
			k.destroy(overlay);
			k.destroy(text);
		},
	};
}

function refreshAssetStatus() {
	const active = soundProgress ?? backgroundProgress;
	if (!active) {
		if (assetStatusText) k.destroy(assetStatusText);
		assetStatusText = null;
		return;
	}
	const pct = active.total ? Math.round((active.done / active.total) * 100) : 0;
	const label = soundProgress ? `Loading audio... ${pct}%` : `Loading assets... ${pct}%`;
	if (!assetStatusText) {
		assetStatusText = k.add([
			k.text(label, { size: 16, font: "Iosevka" }),
			k.pos(16, 16),
			k.anchor("topleft"),
			k.fixed(),
			k.z(200),
		]);
	} else {
		assetStatusText.text = label;
	}
}

async function loadCoreAssets() {
	const boot = showBootLoader();
	k.loadRoot(".");
	await loadAssetGroups(["core"], {
		onProgress: (done, total) => boot.update(done, total),
	});
	boot.destroy();
}

function startBackgroundAssetStreaming() {
	if (backgroundLoadPromise) return backgroundLoadPromise;
	const groups = ["uiControls", "fish", "rat", "butterfly"];
	backgroundLoadPromise = loadAssetGroups(groups, {
		onProgress: (done, total) => {
			backgroundProgress = { done, total };
			refreshAssetStatus();
		},
	}).finally(() => {
		backgroundProgress = null;
		refreshAssetStatus();
	});
	return backgroundLoadPromise;
}

function ensureSoundAssets() {
	if (isSoundGroupLoaded()) return Promise.resolve();
	if (soundLoadPromise) return soundLoadPromise;
	soundLoadPromise = loadAssetGroup("sounds", {
		onProgress: (done, total) => {
			soundProgress = { done, total };
			refreshAssetStatus();
		},
	}).finally(() => {
		soundProgress = null;
		refreshAssetStatus();
	});
	return soundLoadPromise;
}

let muteButton;
let lobbySound;

function isAlphanumeric(str) {
	const regex = /^[a-z0-9]+$/i;
	return regex.test(str);
}
let tiledBackgroundN;
let safariWarningShown = false;

function showReconnectOverlay(text) {
	hideReconnectOverlay();
	reconnectOverlay = createNormalText(k, text, k.width() / 2, k.height() / 2, 32, "reconnectOverlay", k.fixed(), k.z(100));
	reconnectOverlay.font = "Iosevka-Heavy";
}

function hideReconnectOverlay() {
	if (reconnectOverlay) {
		k.destroy(reconnectOverlay);
		reconnectOverlay = null;
	}
	k.destroyAll("reconnectOverlay");
}

function showFatalOverlay(text) {
	const overlayText = createNormalText(k, text, k.width() / 2, k.height() / 2, 24, "fatalOverlay", k.fixed(), k.z(200));
	overlayText.font = "Iosevka-Heavy";
}

function showStateOverlay(text) {
	if (stateOverlay) {
		k.destroy(stateOverlay);
		stateOverlay = null;
	}
	stateOverlay = createNormalText(k, text, k.width() / 2, k.height() * 0.2, 24, "stateOverlay", k.fixed(), k.z(150));
	stateOverlay.font = "Iosevka-Heavy";
}

function hideStateOverlay() {
	if (stateOverlay) {
		k.destroy(stateOverlay);
		stateOverlay = null;
	}
	k.destroyAll("stateOverlay");
}
async function name() {
	tiledBackgroundN = createTiledBackground("#9982e8", "#8465ec");

	const askName = createCoolText(k, "Please enter your name", k.width() / 2, k.height() * 0.2, 48, "destroyN", k.timer(), k.rotate());
	askName.font = "Iosevka-Heavy";
	const name = createCoolText(k, "", k.width() / 2, k.height() / 2, 48, "destroyN");
	const enterButton = name.add([k.sprite("enterButton"), k.anchor("center"), k.pos(name.width * 0.2, 0), k.scale(1)]);
	const kInput = k.onCharInput(async (ch) => {
		if (ch === "\\") {
			return;
		} else if (name.text.length < 10) {
			name.text += ch;
		} else {
			const warning = createNormalText(k, "Name must be at most 10 characters.", k.width() / 2, k.height() * 0.3, 32, "destroyN");
			warning.font = "Iosevka-Heavy";

			k.wait(5, () => {
				destroy(warning);
			});
		}
	});
	const bInput = k.onKeyPressRepeat("backspace", () => {
		name.text = name.text.slice(0, -1);
	});
	const keyPress = k.onKeyPress("enter", async () => {
		name.text = name.text.trim();
		if (name.text.length > 1 && isAlphanumeric(name.text)) {
			keyPress.cancel();
			kInput.cancel();
			bInput.cancel();
			k.destroyAll("destroyN");
			roomName(name);
		} else {
			playSound("wrongName", { loop: false, volume: 0.1 });
			await askName.tween(-10, 10, 0.1, (value) => (askName.angle = value));
			await askName.tween(10, 0, 0.1, (value) => (askName.angle = value));
			const warning = createNormalText(k, "Do not use special characters. Name must be longer than 1 characters and at most 10 characters.", k.width() / 2, k.height() * 0.3, 32, "destroyN");
			warning.font = "Iosevka-Heavy";

			k.wait(3, () => {
				destroy(warning);
			});
		}
	});
}

async function roomName(nameT) {
	const askCode = createCoolText(k, "You can optionally enter a room code", k.width() / 2, k.height() * 0.2, 48, "destroyR", k.timer(), k.rotate());
	askCode.font = "Iosevka-Heavy";
	const roomCode = createCoolText(k, "", k.width() / 2, k.height() / 2, 48, "destroyR");
	const enterButton = roomCode.add([k.sprite("enterButton"), k.anchor("center"), k.pos(roomCode.width * 0.2, 0), k.scale(1)]);

	const kInput = k.onCharInput(async (ch) => {
		if (ch === "\\") {
			return;
		} else if (roomCode.text.length < 10) {
			roomCode.text += ch;
		} else {
			const warning = createNormalText(k, "Code must be at most 10 characters.", k.width() / 2, k.height() * 0.3, 32, "destroyR");
			warning.font = "Iosevka-Heavy";

			k.wait(3, () => {
				destroy(warning);
			});
		}
	});
	const bInput = k.onKeyPressRepeat("backspace", () => {
		roomCode.text = roomCode.text.slice(0, -1);
	});

	k.wait(0.5, () => {
		const keyPress2 = k.onKeyPress("enter", async () => {
			if (roomCode.text.length < 1) {
				keyPress2.cancel();
				kInput.cancel();
				bInput.cancel();
				destroyAll("destroyR");
				main(nameT.text, "nocode");
			} else if (roomCode.text.length > 1 && isAlphanumeric(roomCode.text)) {
				keyPress2.cancel();
				kInput.cancel();
				bInput.cancel();
				destroyAll("destroyR");
				main(nameT.text, roomCode.text);
			} else {
				playSound("wrongName", { loop: false });
				await askCode.tween(-10, 10, 0.1, (value) => (askCode.angle = value));
				await askCode.tween(10, 0, 0.1, (value) => (askCode.angle = value));
				const warning = createNormalText(k, "Do not use special characters", k.width() / 2, k.height() * 0.3, 32, "destroyR");
				warning.font = "Iosevka-Heavy";
				k.wait(3, () => {
					destroy(warning);
				});
			}
		});
	});
}

async function ensureAssetsForMode(mode) {
	const groups = [];
	if (mode === "fish") {
		groups.push("fish", "uiControls");
	} else if (mode === "rat") {
		groups.push("rat");
	} else if (mode === "butterfly") {
		groups.push("butterfly");
	}
	if (!isSoundGroupLoaded()) {
		groups.push("sounds");
	}
	const needsLoad = groups.some((group) => !isAssetGroupLoaded(group));
	if (!needsLoad) return;
	showStateOverlay("Loading assets...");
	await loadAssetGroups(groups, {
		onProgress: (done, total) => {
			const pct = total ? Math.round((done / total) * 100) : 0;
			showStateOverlay(`Loading assets... ${pct}%`);
		},
	});
	hideStateOverlay();
}

async function moveToSceneForRoom(room) {
	if (!hasPlayersState(room)) {
		showStateOverlay("Syncing state...");
		if (typeof room?.onStateChange === "function") {
			room.onStateChange.once(() => {
				hideStateOverlay();
				void moveToSceneForRoom(room);
			});
		}
		return;
	}
	hideStateOverlay();
	const mode = room.state?.mode;
	await ensureAssetsForMode(mode);
	if (mode === "rat") {
		goScene("rat", room);
	} else if (mode === "butterfly") {
		goScene("butterfly", room);
	} else {
		goScene("fish", room);
	}
}

function attachRoomHandlers(room) {
	let opponentEverPresent = false;
	let offAdd = null;
	let offRemove = null;
	const players = room?.state?.players;
	if (players && typeof players.onAdd === "function" && typeof players.onRemove === "function") {
		offAdd = players.onAdd((player, sessionId) => {
			if (sessionId !== room.sessionId) opponentEverPresent = true;
		});
		offRemove = players.onRemove((player, sessionId) => {
			if (sessionId === room.sessionId) return;
			if (!opponentEverPresent) return;
			if (getCurrentScene() === "leave") return;
			createLeaveScene();
			goScene("leave", room);
		});
	}
	room.onLeave(() => {
		if (!enteredScene) return;
		if (!getReconnectEnabled()) return;
		if (typeof offAdd === "function") offAdd();
		if (typeof offRemove === "function") offRemove();
		void attemptReconnect(room);
	});
}

async function attemptReconnect(previousRoom) {
	if (reconnecting || !getReconnectEnabled()) return;
	const token = previousRoom?.reconnectionToken;
	if (!token) return;
	reconnecting = true;
	showReconnectOverlay("Reconnecting...");
	try {
		const reconnected = await colyseusClient.reconnect(token);
		reconnecting = false;
		hideReconnectOverlay();
		setReconnectEnabled(true);
		attachRoomHandlers(reconnected);
		setMatchContext({ roomCode: currentRoomCode });
		enteredScene = true;
		void moveToSceneForRoom(reconnected);
	} catch (err) {
		reconnecting = false;
		showReconnectOverlay("Reconnect failed. Press R to retry");
		const retry = k.onKeyPress("r", () => {
			retry.cancel();
			void attemptReconnect(previousRoom);
		});
	}
}

async function main(name, roomCode = "nocode") {
	if (!colyseusClient) {
		colyseusEndpoint = resolveColyseusEndpoint(await loadRuntimeConfig());
		colyseusClient = new Colyseus.Client(colyseusEndpoint);
	}
	enteredScene = false;

	const lobbyText = createCoolText(k, "Connecting...", k.width() / 2, k.height() / 2, 48);
	await colyseusClient
		.joinOrCreate("my_room", { playerName: name, playerPos: startPos, code: roomCode })
		.then((room) => {
			lobbyText.text = "Connected!";

			setTimeout(() => {
				const enterRoom = () => {
					currentRoomCode = roomCode;
					setMatchContext({ roomCode });
					setReconnectEnabled(true);
					attachRoomHandlers(room);
					k.destroy(lobbyText);
					k.destroy(tiledBackgroundN);
					if (lobbySound) lobbySound.stop();
					if (muteButton) destroy(muteButton);
					try {
						enteredScene = true;
						void moveToSceneForRoom(room);
					} catch (err) {
						console.error("Scene init failed", err);
						showFatalOverlay(`Scene init failed: ${err?.message || err}`);
					}
				};

				enterRoom();
			}, 0);
		})
		.catch((e) => {
			lobbyText.text = `Connection failed!\n${e.message || "No Error Code"}\n\nServer: ${colyseusEndpoint}\n\nPress R to retry`;
			console.log(e);

			const retry = k.onKeyPress("r", async () => {
				retry.cancel();
				await k.destroy(lobbyText);
				main(name, roomCode);
			});
		});
}

export function titleScreen() {
	const tiledBackground = createTiledBackground("#000000", "#686767");
	muteButton = createMuteButton();

	let hasStarted = false;
	const startGame = () => {
		if (hasStarted) return;
		hasStarted = true;
		ensureSoundAssets().then(() => {
			if (!lobbySound) {
				lobbySound = registerLoopSound(
					k.play("lobbyScene", {
						loop: true,
						paused: false,
						volume: 0.05,
					}),
					0.05,
				);
			} else {
				lobbySound.paused = false;
			}
		});
		k.camFlash("#000000", 1);
		destroy(tiledBackground);
		destroyAll("title");
		name();
	};

	const hText = createNormalText(k, "Made by Jelibon", k.width() / 2, k.height() * 0.05, 16, "title");
	hText.letterSpacing = 2;

	const sText = createCoolText(k, "Reincarnation Racing", k.width() / 2, k.height() * 0.2, 80, "title");

	sText.font = "Iosevka-Heavy";
	const kajam = k.add([k.sprite("kajam"), k.rotate(10), k.scale(0.04), k.pos(k.width() * 0.879, k.height() * 0.12), k.animate(), "title"]);
	kajam.animate("scale", [k.vec2(0.04, 0.04), k.vec2(0.05, 0.05)], { duration: 1, direction: "ping-pong" });
	kajam.animate("angle", [0, 10], { duration: 1.5, direction: "ping-pong" });

	const rText = createNormalText(k, "A race where you reincarnate continuously", k.width() / 2, k.height() * 0.85, 32, "title");
	rText.letterSpacing = 0;
	rText.font = "Iosevka-Heavy";
	const pText = createNormalText(k, "(it's a two player game)", k.width() / 2, k.height() * 0.9, 16, "title");
	pText.letterSpacing = 2;

	k.add([k.sprite("kaplay"), k.pos(k.getSprite("kaplay").data.width * 0.8, k.height() - k.getSprite("kaplay").data.height * 0.8), k.anchor("topright"), k.scale(0.8), "title"]);
	k.add([k.sprite("colyseus"), k.scale(0.05), k.pos(k.width() - k.getSprite("colyseus").data.width * 0.054, k.height() - k.getSprite("colyseus").data.height * 0.06), k.anchor("topleft"), "title"]);

	const replayButton = k.add([k.sprite("play-o"), k.pos(k.width() / 2, k.height() * 0.5), k.anchor("center"), k.scale(2), k.area(), k.animate(), k.rotate(), "replay", "title"]);
	replayButton.animate("scale", [k.vec2(2, 2), k.vec2(2.1, 2.1)], { duration: 1.5, direction: "ping-pong" });

	replayButton.animate("angle", [2, -2], { duration: 0.5, direction: "ping-pong" });
	replayButton.animate("pos", [k.vec2(k.width() * 0.49, k.height() * 0.6), k.vec2(k.width() * 0.51, k.height() * 0.6)], { duration: 1, direction: "ping-pong" });
	k.onClick("replay", async () => {
		startGame();
	});
	k.onKeyPress("enter", () => {
		startGame();
	});

	if (!safariWarningShown && isSafariBrowser()) {
		safariWarningShown = true;
		showSafariWarning();
	}
}

async function bootstrap() {
	const [runtimeConfig] = await Promise.all([loadRuntimeConfig(), loadCoreAssets()]);

	colyseusEndpoint = resolveColyseusEndpoint(runtimeConfig);
	colyseusClient = new Colyseus.Client(colyseusEndpoint);

	createFishScene();
	createLeaveScene();
	titleScreen();
	startBackgroundAssetStreaming();
}

bootstrap();

function isSafariBrowser() {
	const ua = navigator.userAgent;
	return /Safari/.test(ua) && !/Chrome|Chromium|Edg|OPR|Brave|CriOS/.test(ua);
}

function showSafariWarning() {
	const overlay = k.add([k.rect(k.width(), k.height()), k.color(0, 0, 0), k.opacity(0.7), k.fixed(), k.z(300)]);
	const panel = k.add([k.rect(980, 440, { radius: 20 }), k.pos(k.width() / 2, k.height() / 2), k.anchor("center"), k.color(24, 24, 30), k.fixed(), k.z(310), "safariWarning"]);
	panel.add([k.outline(2, k.rgb(95, 95, 115))]);

	const headline = createCoolText(k, "Looks like you are using Safari.", panel.pos.x, panel.pos.y - 150, 36, "safariWarning", k.fixed(), k.z(311));
	headline.font = "Iosevka-Heavy";
	headline.color = k.rgb(255, 255, 255);

	const lineSpacing = 12;
	const lineFontSize = 22;
	const bodyLines = [
		"The game engine used in this game is not recommended",
		"to be used with Safari.",
		"For the best experience, please use Chromium browsers",
		"like Edge and Chrome or Firefox.",
	];
	bodyLines.forEach((line, index) => {
		const lineText = createNormalText(
			k,
			line,
			panel.pos.x,
			panel.pos.y - 40 + index * (lineFontSize + lineSpacing),
			lineFontSize,
			"safariWarning",
			k.fixed(),
			k.z(311),
		);
		lineText.font = "Iosevka";
		lineText.color = k.rgb(245, 245, 250);
		lineText.align = "center";
	});
	body.font = "Iosevka";
	body.color = k.rgb(245, 245, 250);
	body.align = "center";

	const close = k.add([k.rect(240, 60, { radius: 14 }), k.pos(panel.pos.x, panel.pos.y + 150), k.anchor("center"), k.area(), k.color(70, 70, 78), k.fixed(), k.z(312), "safariWarning"]);
	const closeText = createNormalText(k, "OK", close.pos.x, close.pos.y, 24, "safariWarning", k.fixed(), k.z(313));
	closeText.font = "Iosevka-Heavy";
	closeText.color = k.rgb(245, 245, 245);
	close.onClick(() => {
		k.destroy(overlay);
		k.destroyAll("safariWarning");
	});
}

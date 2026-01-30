import * as Colyseus from "colyseus.js";
import { k } from "./init";
import { createCoolText, createMuteButton, createNormalText, createTiledBackground, getReconnectEnabled, goScene, hasPlayersState, playSound, registerLoopSound, setMatchContext, setReconnectEnabled } from "./utils";

import { createFishScene, startPos } from "./scenes/fish";

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
let currentDifficulty = "casual";
let reconnecting = false;
let reconnectOverlay = null;
let enteredScene = false;
let stateOverlay = null;

function normalizeDifficulty(value) {
	if (value === "competitive" || value === "casual") return value;
	return "casual";
}

async function loadAssets() {
	k.loadRoot(".");

	const assets = [];

	// Shaders
	assets.push(k.loadShaderURL("tiledPattern", null, "/shaders/tiledPattern.frag"));

	// Fish Game Sprites
	assets.push(k.loadSprite("sukomi", "/sprites/sukomi.png"));
	assets.push(k.loadSprite("bobo", "/sprites/bobo.png"));
	assets.push(k.loadSprite("bubble", "/sprites/particles/bubble.png"));

	// Sounds
	assets.push(k.loadSound("loseSound", "/sounds/lost.ogg"));
	assets.push(k.loadSound("fishHit", "/sounds/fishHit.ogg"));
	assets.push(k.loadSound("wonSound", "/sounds/won.ogg"));
	assets.push(k.loadSound("drawSound", "/sounds/draw.ogg"));
	assets.push(k.loadSound("wrongName", "/sounds/wrongName.ogg"));
	assets.push(k.loadSound("count", "/sounds/count.ogg"));
	assets.push(k.loadSound("go", "/sounds/go.ogg"));
	assets.push(k.loadSound("ratHurt", "/sounds/ratHurt.ogg"));
	assets.push(k.loadSound("lobbyScene", "/sounds/lobbyScene.ogg"));
	assets.push(k.loadSound("fishScene", "/sounds/fishScene.ogg"));
	assets.push(k.loadSound("ratScene", "/sounds/ratScene.ogg"));
	assets.push(k.loadSound("butterflyScene", "/sounds/butterflyScene.ogg"));
	assets.push(k.loadSound("butterflyHit", "/sounds/butterflyHit.ogg"));

	// Butterfly Game Sprites
	assets.push(k.loadSprite("butterfly", "/sprites/butterfly.png"));
	assets.push(k.loadSprite("goldfly", "/sprites/goldfly.png"));
	assets.push(k.loadSprite("ghosty", "/sprites/ghosty.png"));
	assets.push(k.loadSprite("white", "/sprites/particles/white.png"));
	assets.push(k.loadSprite("heart", "/sprites/particles/heart.png"));

	// Rat Game Sprites
	assets.push(k.loadSprite("gigagantrum", "/sprites/gigagantrum.png"));
	assets.push(k.loadSprite("karat", "/sprites/karat.png"));
	assets.push(k.loadSprite("bag", "/sprites/bag.png"));
	assets.push(k.loadSprite("money_bag", "/sprites/money_bag.png"));
	assets.push(k.loadSprite("grass", "/sprites/grass.png"));
	assets.push(k.loadSprite("portal", "/sprites/portal.png"));
	assets.push(k.loadSprite("moon", "/sprites/moon.png"));
	assets.push(k.loadSprite("cloud", "/sprites/cloud.png"));
	assets.push(k.loadSprite("green", "/sprites/particles/green.png"));

	// Icons
	assets.push(k.loadSprite("play-o", "/sprites/icons/play-o.png"));
	assets.push(k.loadSprite("kaplay", "/sprites/icons/kaplay.png"));
	assets.push(k.loadSprite("kajam", "/sprites/icons/kajam.png"));
	assets.push(k.loadSprite("colyseus", "/sprites/icons/colyseus.png"));
	assets.push(k.loadSprite("mute", "/sprites/icons/mute.png"));
	assets.push(k.loadSprite("enterButton", "/sprites/icons/enterButton.png"));
	assets.push(k.loadSprite("space", "/sprites/icons/spaceKey.png"));

	// Fonts
	assets.push(k.loadFont("Iosevka", "/fonts/Iosevka-Regular.woff2", { outline: 1, filter: "linear" }));
	assets.push(k.loadFont("Iosevka-Heavy", "/fonts/Iosevka-Heavy.woff2", { outline: 3, filter: "linear" }));

	// Key sprites
	assets.push(
		k.loadSprite("gamepadUpandDown", "/sprites/icons/gamepadUpandDown.png", {
			sliceX: 3,
			anims: {
				emptyGamepad: {
					from: 0,
					to: 0,
					loop: true,
				},
				gamepadUp: {
					from: 1,
					to: 1,
					loop: true,
				},
				gamepadDown: {
					from: 2,
					to: 2,
					loop: true,
				},
			},
		}),
	);

	assets.push(
		k.loadSprite("mouseLeftandRight", "/sprites/icons/mouseLeftandRight.png", {
			sliceX: 3,
			anims: {
				emptyMouse: {
					from: 0,
					to: 0,
					loop: true,
				},

				mouseRightPressed: {
					from: 1,
					to: 1,
					loop: true,
				},

				mouseLeftPressed: {
					from: 2,
					to: 2,
					loop: true,
				},
			},
		}),
	);

	assets.push(
		k.loadSprite("upKey", "/sprites/icons/upKey.png", {
			sliceX: 2,
			anims: {
				upKey: {
					from: 0,
					to: 0,
					loop: true,
				},

				upKeyPressed: {
					from: 1,
					to: 1,
					loop: true,
				},
			},
		}),
	);

	assets.push(
		k.loadSprite("downKey", "/sprites/icons/downKey.png", {
			sliceX: 2,
			anims: {
				downKey: {
					from: 0,
					to: 0,
					loop: true,
				},

				downKeyPressed: {
					from: 1,
					to: 1,
					loop: true,
				},
			},
		}),
	);

	await Promise.all(assets);
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
				selectDifficulty(nameT, "nocode");
				keyPress2.cancel();
				kInput.cancel();
				bInput.cancel();
				destroyAll("destroyR");
			} else if (roomCode.text.length > 1 && isAlphanumeric(roomCode.text)) {
				selectDifficulty(nameT, roomCode.text);
				keyPress2.cancel();
				kInput.cancel();
				bInput.cancel();
				destroyAll("destroyR");
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

async function selectDifficulty(nameT, roomCode) {
	const askDifficulty = createCoolText(k, "Select difficulty", k.width() / 2, k.height() * 0.2, 48, "destroyD", k.timer(), k.rotate());
	askDifficulty.font = "Iosevka-Heavy";
	const casualText = createNormalText(k, "1 - Casual", k.width() / 2, k.height() * 0.45, 40, "destroyD");
	casualText.font = "Iosevka-Heavy";
	const competitiveText = createNormalText(k, "2 - Competitive", k.width() / 2, k.height() * 0.6, 40, "destroyD");
	competitiveText.font = "Iosevka-Heavy";

	const choose = (difficulty) => {
		destroyAll("destroyD");
		main(nameT.text, roomCode, difficulty);
	};

	const pickCasual = k.onKeyPress(["1", "c"], () => {
		pickCasual.cancel();
		pickSweaty.cancel();
		choose("casual");
	});

	const pickSweaty = k.onKeyPress(["2", "p", "s"], () => {
		pickCasual.cancel();
		pickSweaty.cancel();
		choose("competitive");
	});
}

function moveToSceneForRoom(room) {
	if (!hasPlayersState(room)) {
		showStateOverlay("Syncing state...");
		if (typeof room?.onStateChange === "function") {
			room.onStateChange.once(() => {
				hideStateOverlay();
				moveToSceneForRoom(room);
			});
		}
		return;
	}
	hideStateOverlay();
	const mode = room.state?.mode;
	if (mode === "rat") {
		goScene("rat", room);
	} else if (mode === "butterfly") {
		goScene("butterfly", room);
	} else {
		goScene("fish", room);
	}
}

function attachRoomHandlers(room) {
	room.onMessage("difficulty", (difficulty) => {
		if (typeof difficulty === "string") {
			currentDifficulty = normalizeDifficulty(difficulty);
			setMatchContext({ roomCode: currentRoomCode, difficulty: currentDifficulty });
		}
	});

	room.onLeave(() => {
		if (!enteredScene) return;
		if (!getReconnectEnabled()) return;
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
		setMatchContext({ roomCode: currentRoomCode, difficulty: currentDifficulty });
		enteredScene = true;
		moveToSceneForRoom(reconnected);
	} catch (err) {
		reconnecting = false;
		showReconnectOverlay("Reconnect failed. Press R to retry");
		const retry = k.onKeyPress("r", () => {
			retry.cancel();
			void attemptReconnect(previousRoom);
		});
	}
}

async function main(name, roomCode = "nocode", difficulty = "casual") {
	if (!colyseusClient) {
		colyseusEndpoint = resolveColyseusEndpoint(await loadRuntimeConfig());
		colyseusClient = new Colyseus.Client(colyseusEndpoint);
	}
	enteredScene = false;

	const lobbyText = createCoolText(k, "Connecting...", k.width() / 2, k.height() / 2, 48);
	await colyseusClient
		.joinOrCreate("my_room", { playerName: name, playerPos: startPos, code: roomCode, difficulty })
		.then((room) => {
			lobbyText.text = "Connected!";

			setTimeout(() => {
				const enterRoom = () => {
					currentRoomCode = roomCode;
					currentDifficulty = normalizeDifficulty(room.state?.difficulty || difficulty);
					setMatchContext({ roomCode, difficulty: currentDifficulty });
					setReconnectEnabled(true);
					attachRoomHandlers(room);
					k.destroy(lobbyText);
					k.destroy(tiledBackgroundN);
					if (lobbySound) lobbySound.stop();
					if (muteButton) destroy(muteButton);
					try {
						enteredScene = true;
						moveToSceneForRoom(room);
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
				main(name, roomCode, difficulty);
			});
		});
}

export function titleScreen() {
	const tiledBackground = createTiledBackground("#000000", "#686767");
	lobbySound = registerLoopSound(
		k.play("lobbyScene", {
			loop: true,
			paused: true,
			volume: 0.05,
		}),
		0.05,
	);
	muteButton = createMuteButton();

	const playOnClick = k.onClick(() => {
		lobbySound.paused = false;
		playOnClick.cancel();
	});

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
		k.camFlash("#000000", 1);

		destroy(tiledBackground);
		destroyAll("title");
		name();
	});

	if (!safariWarningShown && isSafariBrowser()) {
		safariWarningShown = true;
		showSafariWarning();
	}
}

async function bootstrap() {
	await loadAssets();

	colyseusEndpoint = resolveColyseusEndpoint(await loadRuntimeConfig());
	colyseusClient = new Colyseus.Client(colyseusEndpoint);

	createFishScene();
	titleScreen();
}

bootstrap();

function isSafariBrowser() {
	const ua = navigator.userAgent;
	return /Safari/.test(ua) && !/Chrome|Chromium|Edg|OPR|Brave|CriOS/.test(ua);
}

function showSafariWarning() {
	const overlay = k.add([k.rect(k.width(), k.height()), k.color(0, 0, 0), k.opacity(0.7), k.fixed(), k.z(300)]);
	const panel = k.add([k.rect(520, 280, { radius: 16 }), k.pos(k.width() / 2, k.height() / 2), k.anchor("center"), k.color(18, 18, 22), k.fixed(), k.z(310), "safariWarning"]);
	panel.add([k.outline(2, k.rgb(80, 80, 90))]);

	const title = createCoolText(k, "Safari Notice", panel.pos.x, panel.pos.y - 90, 40, "safariWarning", k.fixed(), k.z(311));
	title.font = "Iosevka-Heavy";
	title.color = k.rgb(255, 203, 82);

	const body = createNormalText(
		k,
		"Looks like you are using Safari.\nThe game engine used in this game is not recommended to be used with Safari.\nFor the best experience, please use Chromium browsers like Edge and Chrome or Firefox.",
		panel.pos.x,
		panel.pos.y - 10,
		18,
		"safariWarning",
		k.fixed(),
		k.z(311),
	);
	body.font = "Iosevka-Heavy";
	body.color = k.rgb(230, 230, 235);
	body.align = "center";

	const close = k.add([k.rect(180, 48, { radius: 10 }), k.pos(panel.pos.x, panel.pos.y + 85), k.anchor("center"), k.area(), k.color(60, 60, 60), k.fixed(), k.z(312), "safariWarning"]);
	const closeText = createNormalText(k, "OK", close.pos.x, close.pos.y, 20, "safariWarning", k.fixed(), k.z(313));
	closeText.font = "Iosevka-Heavy";
	closeText.color = k.rgb(245, 245, 245);
	close.onClick(() => {
		k.destroy(overlay);
		k.destroyAll("safariWarning");
	});
}

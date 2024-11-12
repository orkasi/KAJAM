import * as schema from "@colyseus/schema";

export class Player extends schema.Schema {
	constructor() {
		super();
		this.sessionId = "";
		this.name = "";
		this.x;
		this.y;
		this.angle;
		this.score = 0;
		this.ready = false;
	}
}

schema.defineTypes(Player, {
	sessionId: "string",
	name: "string",
	x: "number",
	y: "number",
	angle: "number",
	score: "number",
	ready: "boolean",
});

export class MyRoomState extends schema.Schema {
	constructor() {
		super();
		this.players = new schema.MapSchema();
	}
}

schema.defineTypes(MyRoomState, {
	players: { map: Player },
});

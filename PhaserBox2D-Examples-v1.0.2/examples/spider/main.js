import {
	b2DefaultWorldDef,
	b2BodyType,
	b2HexColor,
	b2Body_GetPosition,
	b2DistanceJointDef,
	b2CreateDistanceJoint,
	b2DestroyJoint,
	b2DestroyBody,
	b2Distance,
	ConvertScreenToWorld,
	b2Body_SetUserData,
	b2Body_GetUserData,
	b2Vec2,
	b2World_Draw,
	CreateDebugDraw,
	CreateWorld,
	CreateBoxPolygon,
	WorldStep,
	RAF,
	b2World_GetContactEvents,
	b2Shape_GetBody,
	b2Body_IsValid,
	b2Body_ApplyLinearImpulseToCenter,
	ConvertWorldToScreen,
	b2CreateBody,
	b2DefaultShapeDef,
	b2Sub,
	b2Abs,
	b2Normalize,
	b2Mul
} from "../lib/PhaserBox2D.js";

function spawnAnchor(x, y) {

	anchor = CreateBoxPolygon({
		worldId: world.worldId,
		type: b2BodyType.b2_staticBody,
		position: new b2Vec2(x, y),
		size: 0.1,
		color: b2HexColor.b2_colorAliceBlue
	});

	const def = new b2DistanceJointDef();

	let distance = b2Distance(b2Body_GetPosition(spider.bodyId), b2Body_GetPosition(anchor.bodyId));
	distance = Math.min(30, distance);

	def.bodyIdA = anchor.bodyId;
	def.bodyIdB = spider.bodyId;
	def.localAnchorA = new b2Vec2(0, 0);
	def.localAnchorB = new b2Vec2(0, 0);
	def.length = distance;
	def.dampingRatio = 0.1;

	jointId = b2CreateDistanceJoint(world.worldId, def);
}

function update(deltaTime, currentTime, currentFps) {

	WorldStep({ worldId: world.worldId, deltaTime: deltaTime });

	checkCollisions();

	renderCanvas();
}

function renderCanvas() {

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// render message

	ctx.fillStyle = "white";
	ctx.font = "16px monospace";
	ctx.fillText(`Use keys 'J' to jump and 'K' to release the web.`, 25, 25);
	ctx.fillText(`Click to set the anchor.`, 25, 50);

	// render web
	if (anchor) {

		let anchorPoint = b2Body_GetPosition(anchor.bodyId);
		let spiderPoint = b2Body_GetPosition(spider.bodyId);

		// fix Y direction for screen coordinates
		const a = new b2Vec2(anchorPoint.x, -anchorPoint.y);
		const b = new b2Vec2(spiderPoint.x, -spiderPoint.y);

		const p1 = ConvertWorldToScreen(canvas, m_drawScale, a);
		const p2 = ConvertWorldToScreen(canvas, m_drawScale, b);

		ctx.strokeStyle = "white";
		ctx.beginPath();
		ctx.moveTo(p1.x, p1.y);
		ctx.lineTo(p2.x, p2.y);
		ctx.stroke();
	}

	// debug
	b2World_Draw(world.worldId, m_draw);
}

function createItems() {

	for (let i = 0; i < 30; i++) {

		const x = Math.random() * 60 - 30;
		const y = Math.random() * 60 - 30;

		const box = CreateBoxPolygon({
			worldId: world.worldId,
			type: b2BodyType.b2_staticBody,
			position: new b2Vec2(x, y),
			size: 0.2,
			color: b2HexColor.b2_colorRed
		});

		b2Body_SetUserData(box.bodyId, "item");
	}
}

function destroyAnchor() {

	b2DestroyJoint(jointId);
	b2DestroyBody(anchor.bodyId);

	anchor = null;
	jointId = null;
}

function registerInputListeners() {

	document.addEventListener("keydown", e => {

		switch (e.code) {

			case "KeyJ":

				if (anchor) {

					const p1 = b2Body_GetPosition(spider.bodyId);
					const p2 = b2Body_GetPosition(anchor.bodyId);
					
					const direction = b2Normalize(b2Sub(p2, p1));

					const impulseFactor = 50;

					const impulse = new b2Vec2(direction.x * impulseFactor, direction.y * impulseFactor);

					b2Body_ApplyLinearImpulseToCenter(spider.bodyId, impulse);

					destroyAnchor();
				}

				break;

			case "KeyK":

				if (anchor) {

					destroyAnchor();
				}

				break;
		}
	});

	canvas.addEventListener("mousedown", e => {

		const x = e.offsetX;
		const y = e.offsetY;

		const screenPoint = new b2Vec2(x, y);

		const worldPoint = ConvertScreenToWorld(canvas, m_drawScale, screenPoint);

		if (anchor) {

			destroyAnchor();
		}

		spawnAnchor(worldPoint.x, worldPoint.y);
	});
}

function pickItemIfValid(bodyId) {

	if (b2Body_IsValid(bodyId)) {

		const userData = b2Body_GetUserData(bodyId);

		if (userData === "item") {

			b2DestroyBody(bodyId);
		}
	}
}

function checkCollisions() {

	const contactEvents = b2World_GetContactEvents(world.worldId);

	if (contactEvents.beginCount > 0) {

		const events = contactEvents.beginEvents;

		for (let i = 0; i < contactEvents.beginCount; i++) {

			const event = events[i];

			if (event) {

				const bodyIdA = b2Shape_GetBody(event.shapeIdA);
				const bodyIdB = b2Shape_GetBody(event.shapeIdB);

				pickItemIfValid(bodyIdA);
				pickItemIfValid(bodyIdB);
			}
		}
	}
}

// set the scale at which you want the world to be drawn

const m_drawScale = 15.0;

// get the canvas element from the web page

const canvas = document.getElementById("myCanvas");

/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext("2d");

// create the debug drawing system

const m_draw = CreateDebugDraw(canvas, ctx, m_drawScale);

// physics world

let worldDef = b2DefaultWorldDef();
worldDef.gravity = new b2Vec2(0, -10);

let world = CreateWorld({ worldDef: worldDef });

// create the spider

let anchor;
let spider;
let jointId;

spider = CreateBoxPolygon({
	worldId: world.worldId,
	type: b2BodyType.b2_dynamicBody,
	position: new b2Vec2(0, 10),
	size: 1,
	density: 1.0,
	friction: 0.2,
	restitution: 0.2,
	color: b2HexColor.b2_colorGold
});

// create first anchor

spawnAnchor(10, 10);

// create items

createItems();

// register mouse and keyboard listeners

registerInputListeners();

// start the update loop

RAF(update);


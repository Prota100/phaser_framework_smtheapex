// Import Library Functions
import { b2DefaultWorldDef, b2BodyType, b2HexColor, b2DefaultBodyDef, CreateCapsule, b2Capsule, b2CreateCapsuleShape, b2Body_ApplyForceToCenter, b2Body_SetAwake, b2Body_ApplyLinearImpulse, b2Body_ApplyLinearImpulseToCenter, b2Body_SetUserData, b2Body_GetUserData, b2DestroyBody, b2Body_GetPosition, b2World_GetContactEvents, b2Shape_GetBody } from "../lib/PhaserBox2D.js";
import { b2Rot, b2Vec2 } from "../lib/PhaserBox2D.js";
import { b2World_Draw } from "../lib/PhaserBox2D.js";

import { CreateDebugDraw, RAF } from "../lib/PhaserBox2D.js";
import { CreateWorld, CreateBoxPolygon, CreateCircle, WorldStep } from "../lib/PhaserBox2D.js";

// ** Debug Drawing **

// set the scale at which you want the world to be drawn
const m_drawScale = 15.0;

// get the canvas element from the web page
/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("myCanvas");
/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext("2d");

// create the debug drawing system
const m_draw = CreateDebugDraw(canvas, ctx, m_drawScale);

// ** Physics World Creation **

// create a definition for a world using the default values
let worldDef = b2DefaultWorldDef();

// change some of the default values
worldDef.gravity = new b2Vec2(0, -20);

// create a world object and save the ID which will access it
let world = CreateWorld({ worldDef: worldDef });

// ** Physics Object Creation **


const fieldHeight = 20;
const fieldWidth = 20;

// ground
const ground = CreateBoxPolygon(
	{
		worldId: world.worldId,
		type: b2BodyType.b2_staticBody,
		position: new b2Vec2(0, 0),
		size: new b2Vec2(fieldHeight, 0.1),
		density: 1.0,
		friction: 0.5,
		color: b2HexColor.b2_colorLawnGreen
	});

b2Body_SetUserData(ground.bodyId, "ground");

// left bar
CreateBoxPolygon(
	{
		worldId: world.worldId,
		type: b2BodyType.b2_staticBody,
		position: new b2Vec2(-fieldWidth, fieldWidth / 2),
		size: new b2Vec2(0.1, fieldHeight / 2),
		density: 1.0,
		friction: 0.5,
		color: b2HexColor.b2_colorLawnGreen
	});

// right bar
CreateBoxPolygon(
	{
		worldId: world.worldId,
		type: b2BodyType.b2_staticBody,
		position: new b2Vec2(fieldWidth, fieldHeight / 2),
		size: new b2Vec2(0.1, fieldHeight / 2),
		density: 1.0,
		friction: 0.5,
		color: b2HexColor.b2_colorLawnGreen
	});

// center bar
CreateBoxPolygon(
	{
		worldId: world.worldId,
		type: b2BodyType.b2_staticBody,
		position: new b2Vec2(0, fieldHeight / 4),
		size: new b2Vec2(0.1, fieldHeight / 4),
		density: 1.0,
		friction: 0.5,
		color: b2HexColor.b2_colorLawnGreen
	});

// roof
CreateBoxPolygon(
	{
		worldId: world.worldId,
		type: b2BodyType.b2_staticBody,
		position: new b2Vec2(0, fieldHeight),
		size: new b2Vec2(fieldWidth, 0.1),
		density: 1.0,
		friction: 0.5,
		color: b2HexColor.b2_colorLawnGreen
	});

const player1 = CreateCapsule({
	type: b2BodyType.b2_dynamicBody,
	worldId: world.worldId,
	position: new b2Vec2(-fieldWidth / 2, 4),
	center1: new b2Vec2(0, 1),
	center2: new b2Vec2(0, 0),
	radius: 2,
	color: b2HexColor.b2_colorRed,
	fixedRotation: true
});

b2Body_SetUserData(player1.bodyId, "player1");

const player2 = CreateCapsule({
	type: b2BodyType.b2_dynamicBody,
	worldId: world.worldId,
	position: new b2Vec2(fieldWidth / 2, 4),
	center1: new b2Vec2(0, 1),
	center2: new b2Vec2(0, 0),
	radius: 2,
	color: b2HexColor.b2_colorBlue,
	fixedRotation: true
});

b2Body_SetUserData(player2.bodyId, "player2");

let player1Points = 0;
let player2Points = 0;

let ball;

function spawnBall(x) {

	ball = CreateCircle({
		worldId: world.worldId,
		type: b2BodyType.b2_dynamicBody,
		position: new b2Vec2(x < 0.5 ? -fieldWidth * 0.7 : fieldWidth * 0.7, 10),
		radius: 1.5,
		density: 1.0,
		friction: 0.5,
		restitution: 1,
		color: b2HexColor.b2_colorWhite
	});

	b2Body_SetUserData(ball.bodyId, "ball");
	b2Body_SetAwake(ball.bodyId, false);
}

spawnBall(Math.random());

let keyboard = {
	ArrowLeft: false,
	ArrowRight: false,
	ArrowUp: false,
	KeyA: false,
	KeyD: false,
	KeyW: false,
}

document.addEventListener("keydown", (event) => {

	keyboard[event.code] = true;
});

document.addEventListener("keyup", (event) => {

	keyboard[event.code] = false;
});

// ** Define the RAF Update Function **
function update(deltaTime, currentTime, currentFps) {

	// ** Step the Physics **
	WorldStep({ worldId: world.worldId, deltaTime: deltaTime });

	// ** Debug Drawing **
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	b2World_Draw(world.worldId, m_draw);

	ctx.font = "20px Arial";
	ctx.fillStyle = "green";
	ctx.fillText("Player 1 keys: AWD", 20, 20);
	ctx.fillText("Player 2 keys: ARROWS", 20, 50);

	ctx.font = "30px Arial";
	ctx.fillStyle = "white";
	ctx.fillText(`${player1Points}`, 450, 450);
	ctx.fillText(`${player2Points}`, 780, 450);

	// check input

	const impulse = 30;
	const jumpImpulse = 50;

	if (keyboard.ArrowLeft) {

		b2Body_ApplyLinearImpulseToCenter(player2.bodyId, new b2Vec2(-impulse, 0), true);
	}

	if (keyboard.ArrowRight) {

		b2Body_ApplyLinearImpulseToCenter(player2.bodyId, new b2Vec2(impulse, 0), true);
	}

	if (keyboard.ArrowUp) {

		b2Body_ApplyLinearImpulseToCenter(player2.bodyId, new b2Vec2(0, jumpImpulse), true);
	}

	if (keyboard.KeyA) {

		b2Body_ApplyLinearImpulseToCenter(player1.bodyId, new b2Vec2(-impulse, 0), true);
	}

	if (keyboard.KeyD) {

		b2Body_ApplyLinearImpulseToCenter(player1.bodyId, new b2Vec2(impulse, 0), true);
	}

	if (keyboard.KeyW) {

		b2Body_ApplyLinearImpulseToCenter(player1.bodyId, new b2Vec2(0, jumpImpulse), true);
	}

	// check collision

	const contactEvents = b2World_GetContactEvents(world.worldId);

	if (contactEvents.beginCount > 0) {

		const events = contactEvents.beginEvents;

		for (let i = 0; i < contactEvents.beginCount; i++) {

			const event = events[i];

			if (event && ball) {

				const bodyIdA = b2Shape_GetBody(event.shapeIdA);
				const bodyIdB = b2Shape_GetBody(event.shapeIdB);

				const userDataA = b2Body_GetUserData(bodyIdA);
				const userDataB = b2Body_GetUserData(bodyIdB);

				if (userDataA === "ball" && userDataB === "ground"
					|| userDataA === "ground" && userDataB === "ball") {

					/** @type {b2Vec2} */
					const { x } = b2Body_GetPosition(ball.bodyId);

					b2DestroyBody(ball.bodyId);
					ball = null;

					if (x > 0) {

						player1Points++;
						console.log("Player 1 wins!");
						spawnBall(0);

					} else {

						player2Points++;
						console.log("Player 2 wins!");
						spawnBall(1);
					}

				}
			}
		}
	}
}

// ** Trigger the RAF Update Calls **
RAF(update);

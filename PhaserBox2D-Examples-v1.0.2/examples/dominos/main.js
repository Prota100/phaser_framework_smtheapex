// Import Library Functions
import { b2DefaultWorldDef, b2BodyType, b2HexColor, b2DefaultBodyDef } from '../lib/PhaserBox2D.js';
import { b2Rot, b2Vec2 } from '../lib/PhaserBox2D.js';
import { b2World_Draw } from '../lib/PhaserBox2D.js';

import { CreateDebugDraw, RAF } from '../lib/PhaserBox2D.js';
import { CreateWorld, CreateBoxPolygon, CreateCircle, WorldStep } from '../lib/PhaserBox2D.js';

// ** Debug Drawing **

// set the scale at which you want the world to be drawn
const m_drawScale = 25.0;

// get the canvas element from the web page
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

// create the debug drawing system
const m_draw = CreateDebugDraw(canvas, ctx, m_drawScale);

// ** Physics World Creation **

// create a definition for a world using the default values
let worldDef = b2DefaultWorldDef();

// change some of the default values
worldDef.gravity = new b2Vec2(0, -10);

// create a world object and save the ID which will access it
let world = CreateWorld({ worldDef: worldDef });

// ** Physics Object Creation **

const DOMINOS_COUNT = 25;

for (let i = 0; i < DOMINOS_COUNT; i++)
{
	const domino = CreateBoxPolygon({
		worldId: world.worldId,
		type: b2BodyType.b2_dynamicBody,
		position: new b2Vec2(i - (DOMINOS_COUNT * .5), -1),
		size: new b2Vec2(0.1, 1),
		density: 1.0,
		friction: 0.1,
		color: b2HexColor.b2_colorLawnGreen
	});
}

const ball = CreateCircle({ worldId: world.worldId, type: b2BodyType.b2_dynamicBody, position: new b2Vec2(-20,10), radius: 0.5, density: 0.5, friction: 0.001, color: b2HexColor.b2_colorRed });

// a static ground which is sloped up to the right
const ground = CreateBoxPolygon({ worldId: world.worldId, type: b2BodyType.b2_staticBody, position: new b2Vec2(0, -2), size: new b2Vec2(15, 0.1), density: 1.0, friction: 0.5, color: b2HexColor.b2_colorLawnGreen });

// a static ground which is sloped up to the right
const slopeBody = b2DefaultBodyDef();
slopeBody.rotation = new b2Rot(Math.cos(-Math.PI * .2), Math.sin(-Math.PI * .2));

const slope = CreateBoxPolygon({ worldId: world.worldId, type: b2BodyType.b2_staticBody, bodyDef: slopeBody, position: new b2Vec2(-18, 3), size: new b2Vec2(5, .1), density: 1.0, friction: 0.5, color: b2HexColor.b2_colorLawnGreen });

// ** Define the RAF Update Function **
function update (deltaTime, currentTime, currentFps)
{
	// ** Step the Physics **
	WorldStep({ worldId: world.worldId, deltaTime: deltaTime });

	// ** Debug Drawing **
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	b2World_Draw(world.worldId, m_draw);
}

// ** Trigger the RAF Update Calls **
RAF(update);

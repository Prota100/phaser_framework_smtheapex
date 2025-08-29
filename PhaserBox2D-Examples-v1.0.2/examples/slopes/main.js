// Import Library Functions
import { b2DefaultWorldDef, b2BodyType, b2HexColor, b2DefaultBodyDef } from '../lib/PhaserBox2D.js';
import { b2Rot, b2Vec2 } from '../lib/PhaserBox2D.js';
import { b2World_Draw } from '../lib/PhaserBox2D.js';

import { CreateDebugDraw, RAF } from '../lib/PhaserBox2D.js';
import { CreateWorld, CreateBoxPolygon, CreateCircle, WorldStep } from '../lib/PhaserBox2D.js';


// ** Debug Drawing **

// set the scale at which you want the world to be drawn
const m_drawScale = 30.0;

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

for (let i = -8; i <= 26; i++)
{
	for (let j = -2; j <= 2; j++)
	{
		let x = i;
		let y = 12 + j;
		let size = (Math.random() * 0.4) + 0.2;

		const ball = CreateCircle({ worldId: world.worldId, type: b2BodyType.b2_dynamicBody, position: new b2Vec2(x, y), radius: size, density: 1.0, friction: 0.001, color: b2HexColor.b2_colorRed });
	}
}

// a static ground which is sloped up to the right
const slope1 = b2DefaultBodyDef();
slope1.rotation = new b2Rot(Math.cos(-Math.PI * .06), Math.sin(-Math.PI * .06));

const slope2 = b2DefaultBodyDef();
slope2.rotation = new b2Rot(Math.cos(Math.PI * .06), Math.sin(Math.PI * .06));

const slope3 = b2DefaultBodyDef();
slope3.rotation = new b2Rot(Math.cos(-Math.PI * .04), Math.sin(-Math.PI * .04));

const ground1 = CreateBoxPolygon({ worldId: world.worldId, type: b2BodyType.b2_staticBody, bodyDef: slope1, position: new b2Vec2(0, 3), size: new b2Vec2(10, .2), density: 1.0, friction: 0.5, color: b2HexColor.b2_colorLawnGreen });

const ground2 = CreateBoxPolygon({ worldId: world.worldId, type: b2BodyType.b2_staticBody, bodyDef: slope2, position: new b2Vec2(14, -2), size: new b2Vec2(10, .2), density: 1.0, friction: 0.5, color: b2HexColor.b2_colorLawnGreen });

const ground3 = CreateBoxPolygon({ worldId: world.worldId, type: b2BodyType.b2_staticBody, bodyDef: slope3, position: new b2Vec2(2, -7), size: new b2Vec2(10, .2), density: 1.0, friction: 0.5, color: b2HexColor.b2_colorLawnGreen });

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

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

// falling boxes
for (let i = -2; i <= 2; i++)
{
	for (let j = -2; j <= 2; j++)
	{
		const box = CreateBoxPolygon({ worldId: world.worldId, type: b2BodyType.b2_dynamicBody, position: new b2Vec2(i * 1, -j * 1 + 20), size: 0.5, density: 1.0, friction: 0.2, color: b2HexColor.b2_colorGold });
	}
}

// a static ground which is sloped up to the right
const groundBodyDef = b2DefaultBodyDef();
groundBodyDef.rotation = new b2Rot(Math.cos(Math.PI * .03), Math.sin(Math.PI * .03));
const ground = CreateBoxPolygon({ worldId: world.worldId, type: b2BodyType.b2_staticBody, bodyDef: groundBodyDef, position: new b2Vec2(0, 0), size: new b2Vec2(15, 0.1), density: 1.0, friction: 0.5, color: b2HexColor.b2_colorLawnGreen });

// ** Define the RAF Update Function **
function update (deltaTime, currentTime, currentFps)
{
	// ** Step the Physics **
	WorldStep({ worldId: world.worldId, deltaTime: deltaTime });

	// ** Debug Drawing **
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	b2World_Draw(world.worldId, m_draw);

	if (ctx)
	{
		ctx.fillStyle = 'white';
		ctx.font = '20px Arial';
		ctx.fillText(`Boxes`, 10, 25);
	}
}

// ** Trigger the RAF Update Calls **
RAF(update);

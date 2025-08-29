// Import Library Functions
import { b2DefaultWorldDef, b2BodyType, b2HexColor, b2DefaultBodyDef } from '../lib/PhaserBox2D.js';
import { b2Rot, b2Vec2 } from '../lib/PhaserBox2D.js';
import { b2World_Draw } from '../lib/PhaserBox2D.js';

import { CreateDebugDraw, RAF } from '../lib/PhaserBox2D.js';
import { CreateWorld, CreateBoxPolygon, CreateRevoluteJoint, CreateCircle, WorldStep } from '../lib/PhaserBox2D.js';

// ** Debug Drawing **

// set the scale at which you want the world to be drawn
const m_drawScale = 30.0;
const BRIDGE_COUNT = 30;

// get the canvas element from the web page
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

// create the debug drawing system
const m_draw = CreateDebugDraw(canvas, ctx, m_drawScale);

// ** Physics World Creation **

// create a definition for a world using the default values
const worldDef = b2DefaultWorldDef();

// change some of the default values
worldDef.gravity = new b2Vec2(0, -10);

// create a world object and save the ID which will access it
const world = CreateWorld({ worldDef: worldDef });

// ** Physics Object Creation **

const ground = CreateBoxPolygon({ worldId: world.worldId, type: b2BodyType.b2_staticBody, position: new b2Vec2(0, -10), size: new b2Vec2(20, 0.1), density: 1.0, friction: 0.5, color: b2HexColor.b2_colorLawnGreen });

// ** Create Bridge Segments **
const numSegments = 30;
const segmentWidth = 0.5;
const segmentHeight = 0.125;
const startX = -10 - (numSegments * segmentWidth / 2);
const startY = 0;
const anchorY = 10;

const anchorStart = new b2Vec2(startX, anchorY);
const anchorEnd = new b2Vec2(startX + (numSegments * (segmentWidth * 2)) + segmentWidth, anchorY);

let prevSegment;

for (let i = 0; i < numSegments; i++)
{
	const x = startX + i * (segmentWidth * 2);
	const segment = CreateBoxPolygon({
		worldId: world.worldId,
		type: b2BodyType.b2_dynamicBody,
		position: new b2Vec2(x, startY),
		size: new b2Vec2(segmentWidth, segmentHeight),
		density: 50.0,
		friction: 1,
		color: b2HexColor.b2_colorLawnGreen
	});

	if (i == 0)
	{
		// anchor the first segment
		CreateRevoluteJoint({
			worldId: world.worldId,
			bodyIdA: ground.bodyId,
			bodyIdB: segment.bodyId,
			anchorA: anchorStart,
			anchorB: new b2Vec2(-segmentWidth / 2, startY),
		});
	}
	else
	{
		// connect each segment to the previous one
		CreateRevoluteJoint({
			worldId: world.worldId,
			bodyIdA: prevSegment.bodyId,
			bodyIdB: segment.bodyId,
			collideConnected: false,
			dampingRatio: 0.1,
			anchorA: new b2Vec2(segmentWidth / 2, 0),
			anchorB: new b2Vec2(-segmentWidth / 2, 0),
		});
	}

	prevSegment = segment;
}

// anchor the last segment
CreateRevoluteJoint({
	worldId: world.worldId,
	bodyIdA: ground.bodyId,
	bodyIdB: prevSegment.bodyId,
	anchorA: anchorEnd,
	anchorB: new b2Vec2(segmentWidth / 2, 0),
});

// Create Objects to Drop
for (let i = -5; i <= 5; i++)
{
	const randomDensity = (Math.random() * 20.0) + 10;

	const box = CreateBoxPolygon({ worldId: world.worldId, type: b2BodyType.b2_dynamicBody, position: new b2Vec2(i, 20), size: 0.25, density: randomDensity, friction: 1, color: b2HexColor.b2_colorGold });

	let radius = (Math.random() * 0.4) + 0.2;

	const ball = CreateCircle({ worldId: world.worldId, type: b2BodyType.b2_dynamicBody, position: new b2Vec2(i, 25), radius: radius, density: randomDensity, friction: 1, color: b2HexColor.b2_colorRed });
}

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
		ctx.fillText(`Bridge`, 10, 25);
	}
}

// ** Trigger the RAF Update Calls **
RAF(update);

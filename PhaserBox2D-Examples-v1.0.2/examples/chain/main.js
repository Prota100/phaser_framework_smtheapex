// Import Library Functions

import { CreateBoxPolygon, CreateChain, CreateCircle, CreateWorld, WorldStep } from '../lib/PhaserBox2D.js';
import { CreateDebugDraw, RAF } from '../lib/PhaserBox2D.js';
import { b2BodyType, b2DefaultBodyDef, b2DefaultWorldDef, b2HexColor } from '../lib/PhaserBox2D.js';
import { b2Vec2 } from '../lib/PhaserBox2D.js';

import { b2World_Draw } from '../lib/PhaserBox2D.js';

// ** Debug Drawing **

// set the scale at which you want the world to be drawn
const m_drawScale = 20.0;

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

// a static ground
const groundBodyDef = b2DefaultBodyDef();
const ground = CreateBoxPolygon({ worldId: world.worldId, type: b2BodyType.b2_staticBody, bodyDef: groundBodyDef, position: new b2Vec2(0, -10), size: new b2Vec2(30, 1), density: 1.0, friction: 0.5, color: b2HexColor.b2_colorLawnGreen });


// build a chain
CreateChain({ worldId: world.worldId, groundId: ground.bodyId, type: b2BodyType.b2_dynamicBody, firstLinkPosition: new b2Vec2(-20, 16), lastLinkPosition: new b2Vec2(20, 16), chainLinks: 16, linkLength: 2.6, radius: 0.5, fixEnds: true });

const ballDelay = 2.0;
let nextBall = 4.0;

// ** Define the RAF Update Function **
function update (deltaTime, currentTime, currentFps)
{
    // ** Step the Physics **
    WorldStep({ worldId: world.worldId, deltaTime: deltaTime });

    // ** Debug Drawing **
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    b2World_Draw(world.worldId, m_draw);

    nextBall -= deltaTime;
    if (nextBall <= 0)
    {
        let radius = Math.random() * 1.5 + 0.5;
        CreateCircle({ position: new b2Vec2(0, 20), type: b2BodyType.b2_dynamicBody, radius: radius, density: 1.0, friction: 0.2, color: b2HexColor.b2_colorRed, worldId: world.worldId });
        nextBall += ballDelay;
    }

    if (ctx)
    {
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText(`Chain`, 10, 25);
    }
}

// ** Trigger the RAF Update Calls **
RAF(update);

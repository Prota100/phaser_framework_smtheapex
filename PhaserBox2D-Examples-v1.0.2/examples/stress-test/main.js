// Import Library Functions

import {
    b2DestroyBody, CreateBoxPolygon, CreateCircle, CreateWorld, WorldStep,
    CreateDebugDraw, RAF,
    b2BodyType, b2DefaultBodyDef, b2DefaultWorldDef, b2HexColor,
    b2Vec2,
    b2World_Draw
} from '../lib/PhaserBox2D.min.js';

// ** Debug Drawing **

// set the scale at which you want the world to be drawn
const m_drawScale = 20.0;

// get the canvas element from the web page
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

// the debug drawing system
let m_draw = null;

// ** Physics World Creation **

// create a definition for a world using the default values
let worldDef = b2DefaultWorldDef();

// change some of the default values
worldDef.gravity = new b2Vec2(0, -10);

// create a world object and save the ID which will access it
let world = CreateWorld({ worldDef:worldDef });

// ** Physics Object Creation **

// a static ground
const groundBodyDef = b2DefaultBodyDef();
const ground = CreateBoxPolygon({ worldId:world.worldId, type:b2BodyType.b2_staticBody, bodyDef: groundBodyDef, position:new b2Vec2(0, -19), size:new b2Vec2(33, 1), density:1.0, friction:0.5, color:b2HexColor.b2_colorLawnGreen });
CreateBoxPolygon({ worldId:world.worldId, type:b2BodyType.b2_staticBody, bodyDef: groundBodyDef, position:new b2Vec2(-33, 0), size:new b2Vec2(1, 20), density:1.0, friction:0.5, color:b2HexColor.b2_colorLawnGreen });
CreateBoxPolygon({ worldId:world.worldId, type:b2BodyType.b2_staticBody, bodyDef: groundBodyDef, position:new b2Vec2(33, 0), size:new b2Vec2(1, 20), density:1.0, friction:0.5, color:b2HexColor.b2_colorLawnGreen });
const shapes = [];
let highCount = 0;
const highRequired = 30;
let build = 1;
const maxBuild = 10;

const targetFPS = 58;
const margin = 1;

// ** Define the RAF Update Function **
function update(deltaTime, currentTime, currentFps)
{
    if (currentFps > targetFPS + margin)
    {
        // make sure it's stable to avoid pulses
        highCount++;
        if (highCount >= highRequired)
        {
            highCount = 0;
            for(let i = 0; i < build; i++)
            {
                // a box that will fall
                const box = CreateBoxPolygon({ worldId:world.worldId, type:b2BodyType.b2_dynamicBody, position:new b2Vec2((Math.random() * 2 - 1) * 30, 15), size:0.2, density:1.0, friction:0.2, color:b2HexColor.b2_colorGold });
                shapes.push(box);
                // a ball that will fall and land on the corner of the box
                const ball = CreateCircle({ worldId:world.worldId, type:b2BodyType.b2_dynamicBody, position:new b2Vec2((Math.random() * 2 - 1) * 30, 17), radius:0.2, density:1.0, friction:0.5, color:b2HexColor.b2_colorRed });
                shapes.push(ball);
            }
            build = Math.min(build + 1, maxBuild);
        }
    }
    else if (currentFps < targetFPS - margin)
    {
        if (shapes.length > 0)
        {
            const shape = shapes.pop();
            b2DestroyBody(shape.bodyId);
            build = 1;
        }
    }

	// ** Step the Physics **
	WorldStep({ worldId: world.worldId, deltaTime: deltaTime });

	// ** Debug Drawing **
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	b2World_Draw(world.worldId, m_draw);

    if (ctx) {
        // Draw FPS counter
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.fillText(`FPS: ${ currentFps }, SHAPES: ${ shapes.length }`, 10, 20);
    }    
}

function createExample()
{
    m_draw = CreateDebugDraw(canvas, ctx, m_drawScale);
    
    // ** Trigger the RAF Update Calls **
    RAF(update);
}

// ** Create the Example **
// the timeout allows Firefox to resolve the screen dimensions
// without this precaution, the canvas drawing will use an incorrect scale
setTimeout(createExample, 50);

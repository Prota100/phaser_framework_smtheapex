// Import Library Functions

import { b2DefaultBodyDef, b2HexColor, CreateBoxPolygon, CreatePhysicsEditorShape, CreateWorld, WorldStep } from '../lib/PhaserBox2D.js';
import { CreateDebugDraw, RAF } from '../lib/PhaserBox2D.js';
import { b2BodyType, b2DefaultWorldDef } from '../lib/PhaserBox2D.js';
import { b2Vec2 } from '../lib/PhaserBox2D.js';

import { b2World_Draw } from '../lib/PhaserBox2D.js';


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
const ground = CreateBoxPolygon({ worldId:world.worldId, type:b2BodyType.b2_staticBody, bodyDef: groundBodyDef, position:new b2Vec2(0, -6), size:new b2Vec2(30, 1), density:1.0, friction:0.5, restitution:0.0, color:b2HexColor.b2_colorLawnGreen });


const scale = 0.02;

const shapeInterval = 0.5;
let nextShape = 2;
let shapeCount = 0;

// ** Define the RAF Update Function **
function update(deltaTime, currentTime, currentFps)
{
    if (currentTime > nextShape)
    {
        nextShape += shapeInterval;

        let key = "pig";
        if (Math.random() < 0.5)
        {
            key = "mushroom2";
        }

        CreatePhysicsEditorShape({
            worldId: world.worldId,
            type: b2BodyType.b2_dynamicBody,
            key: key,
            url: "../resources/images/pig_physics.json.plist.xml",
            position: new b2Vec2((shapeCount % 3) * 5 - 5, 20),
            vertexOffset: new b2Vec2(0, 0),         // remove the vertex offset to center them
            vertexScale: new b2Vec2(scale, scale)   // scale the vertices to a suitable size for physics        
        });

        shapeCount++;
    }

	// ** Step the Physics **
	WorldStep({ worldId: world.worldId, deltaTime: deltaTime });

	// ** Debug Drawing **
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	b2World_Draw(world.worldId, m_draw);

    // Draw FPS counter
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText(`FPS: ${ currentFps } SHAPES: ${ shapeCount }`, 10, 20);    
}


function createExample()
{
    m_draw = CreateDebugDraw(canvas, ctx, m_drawScale);

    CreatePhysicsEditorShape({
        worldId: world.worldId,
        type: b2BodyType.b2_dynamicBody,
        key: "pig",
        url: "../resources/images/pig_physics.json.plist.xml",
        position: new b2Vec2(shapeCount * 5 - 5, 0),
        vertexOffset: new b2Vec2(0, 0),         // remove the vertex offset to center them
        vertexScale: new b2Vec2(scale, scale)   // scale the vertices to a suitable size for physics        
    });
    shapeCount++;

    CreatePhysicsEditorShape({
        worldId: world.worldId,
        type: b2BodyType.b2_dynamicBody,
        key: "mushroom2",
        url: "../resources/images/pig_physics.json.plist.xml",
        position: new b2Vec2(shapeCount * 5 - 5, 0),
        vertexOffset: new b2Vec2(0, 0),         // remove the vertex offset to center them
        vertexScale: new b2Vec2(scale, scale)   // scale the vertices to a suitable size for physics        
    });
    shapeCount++;

    // ** Trigger the RAF Update Calls **
    RAF(update);
}


// ** Create the Example **
// the timeout allows Firefox to resolve the screen dimensions
// without this precaution, the canvas drawing will use an incorrect scale
setTimeout(createExample, 50);

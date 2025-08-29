// Import Library Functions

import { b2Capsule, b2ChainDef, b2CreateBody, b2CreateCapsuleShape, b2CreateChain, b2DefaultShapeDef, CreateWorld, Spinner, WorldStep } from '../lib/PhaserBox2D.js';
import { CreateDebugDraw, RAF } from '../lib/PhaserBox2D.js';
import { b2BodyType, b2DefaultBodyDef, b2DefaultWorldDef, b2HexColor } from '../lib/PhaserBox2D.js';
import { b2Vec2 } from '../lib/PhaserBox2D.js';

import { b2World_Draw } from '../lib/PhaserBox2D.js';

// ** Debug Drawing **

// set the scale at which you want the world to be drawn
const m_drawScale = 6.0;

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


function createJar(groundId)
{
    const points = [];

    // jar definitions
    const containerHeight = 100;
    const containerWidth = 100;
    const neckHeight = containerHeight * 0.2;
    const neckWidth = containerWidth * 0.7;
    const bodyRadius = containerWidth / 2;
    const numPoints = 30; // Number of points to use for the curved part
    
    // Add top-left and top-right points of the neck
    points.push(new b2Vec2(-neckWidth / 2, containerHeight / 2));
    points.push(new b2Vec2(neckWidth / 2, containerHeight / 2));
    
    // Add right side of the neck
    points.push(new b2Vec2(neckWidth / 2, containerHeight / 2 - neckHeight));
    
    // Add curved part (right side)
    for (let i = 1; i < numPoints / 2; i++) {
        const angle = (i / numPoints) * Math.PI;
        const x = Math.cos(angle) * bodyRadius;
        const y = Math.sin(angle) * bodyRadius;
        points.push(new b2Vec2(x, -y));
    }
    
    // Add bottom point
    points.push(new b2Vec2(0, -bodyRadius));
    
    // Add curved part (left side)
    for (let i = numPoints / 2 + 1; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI;
        const x = Math.cos(angle) * bodyRadius;
        const y = Math.sin(angle) * bodyRadius;
        points.push(new b2Vec2(x, -y));
    }
    
    // Add left side of the neck
    points.push(new b2Vec2(-neckWidth / 2, containerHeight / 2 - neckHeight));

    // Create a Chain to represent the Jar walls
    const count = points.length;
    const chainDef = new b2ChainDef();
    chainDef.points = points;
    chainDef.count = count;
    chainDef.isLoop = true;
    chainDef.friction = 0.01;
    b2CreateChain(groundId, chainDef);

    return points;
}


// ** Define the RAF Update Function **
function update(deltaTime, currentTime, currentFps)
{
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


let shapeCount = 0;
function createExample()
{
    m_draw = CreateDebugDraw(canvas, ctx, m_drawScale);

    // world
    const groundBodyDef = b2DefaultBodyDef();
    const groundId = b2CreateBody(world.worldId, groundBodyDef);

    // make the jar
    const points = createJar(groundId);

    // add a stirrer
    const lftPosition = new b2Vec2(0, -28);
    const lftSpeed = 2.0;
    const lftTorque = 500000.0;
    new Spinner(lftPosition, lftTorque, lftSpeed, b2HexColor.b2_colorGold, 1.25, world.worldId);

    // create the pills in a vertical column
    const capsule = new b2Capsule();
    capsule.center1 = new b2Vec2(0.0, -0.5);
    capsule.center2 = new b2Vec2(0.0, 0.5);
    capsule.radius = 0.9;

    const spawnWide = 10;
    const spawnHigh = 40;
    const spacingX = capsule.radius * 2 + 0.1;
    const spacingY = capsule.radius * 2 + 1 + 0.1;
    var x = 0;
    var y = spawnHigh;
    const shapeDef = b2DefaultShapeDef();
    shapeDef.density = 0.2;
    shapeDef.friction = 0.01;
    shapeDef.customColor = b2HexColor.b2_colorDodgerBlue;
    for(let i = 0; i < 1200; i++)
    {
        // set the pill colour
        if (x == 0 || x + spacingX > spawnWide)
            shapeDef.customColor = b2HexColor.b2_colorWhite;
        else
            shapeDef.customColor = b2HexColor.b2_colorDodgerBlue;

        const bodyDef = b2DefaultBodyDef();
        bodyDef.type = b2BodyType.b2_dynamicBody;
        bodyDef.position = new b2Vec2(x - spawnWide / 2, y);
    
        const bodyId = b2CreateBody(world.worldId, bodyDef);
        b2CreateCapsuleShape(bodyId, shapeDef, capsule);
        
        x += spacingX;
        if (x > spawnWide) {
            x = 0;
            y += spacingY;
        }

        shapeCount++;
    }

    // ** Trigger the RAF Update Calls **
    RAF(update);
}

// ** Create the Example **
// the timeout allows Firefox to resolve the screen dimensions
// without this precaution, the canvas drawing will use an incorrect scale
setTimeout(createExample, 50);

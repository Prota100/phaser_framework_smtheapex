// Import Library Functions

import { b2CreateBody, b2CreatePolygonShape, b2DefaultShapeDef, b2DestroyBody, b2DestroyJoint, b2Joint_GetConstraintForce, b2LengthSquared, b2MakeBox, CreateBoxPolygon, CreateDistanceJoint, CreateWeldJoint, CreateWorld, WorldStep } from '../lib/PhaserBox2D.js';
import { CreateDebugDraw, RAF } from '../lib/PhaserBox2D.js';
import { b2BodyType, b2DefaultBodyDef, b2DefaultWorldDef, b2HexColor } from '../lib/PhaserBox2D.js';
import { b2Vec2 } from '../lib/PhaserBox2D.js';
import { b2World_Draw } from '../lib/PhaserBox2D.js';

// ** Debug Drawing **

// set the scale at which you want the world to be drawn
const m_drawScale = 80;

var m_draw;
var groundBodyDef;

const startBreakForce = 30.0;
const deltaBreakForce = 5.0;
const timePerTest = 5.0;

var breakForce;
var nextTestTime;

// get the canvas element from the web page
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

// ** Physics World Creation **

// create a definition for a world using the default values
let worldDef = b2DefaultWorldDef();

// change some of the default values
worldDef.gravity = new b2Vec2(0, -10);

// create a world object and save the ID which will access it
let world = CreateWorld({ worldDef:worldDef });

// ** Physics Object Creation **




function makeFrame(x, y, w, h, worldId)
{
    let groundY = y;

    groundBodyDef = b2DefaultBodyDef();
    groundBodyDef.position = new b2Vec2(0, groundY - 2 * 5);
    let groundId = b2CreateBody(worldId, groundBodyDef);
    const groundBox = b2MakeBox(w, 5);
    const groundShapeDef = b2DefaultShapeDef();
    groundShapeDef.customColor = b2HexColor.b2_colorGreen;
    b2CreatePolygonShape(groundId, groundShapeDef, groundBox);

    let bodyDef = b2DefaultBodyDef();

    bodyDef.position = new b2Vec2(-x, 0);
    const leftId = b2CreateBody(worldId, bodyDef);
    let box = b2MakeBox(5, h);
    let shapeDef = b2DefaultShapeDef();
    shapeDef.customColor = b2HexColor.b2_colorWhite;
    b2CreatePolygonShape(leftId, shapeDef, box);

    bodyDef = b2DefaultBodyDef();
    bodyDef.position.x = x;
    const rightId = b2CreateBody(worldId, bodyDef);
    box = b2MakeBox(5, h);
    shapeDef = b2DefaultShapeDef();
    shapeDef.customColor = b2HexColor.b2_colorWhite;
    b2CreatePolygonShape(rightId, shapeDef, box);

    bodyDef = b2DefaultBodyDef();
    bodyDef.position.y = -groundY + 2 * 5;
    const topId = b2CreateBody(worldId, bodyDef);
    box = b2MakeBox(w, 5);
    shapeDef = b2DefaultShapeDef();
    shapeDef.customColor = b2HexColor.b2_colorSkyBlue;
    b2CreatePolygonShape(topId, shapeDef, box);

    return groundId;
}

const high = 20;
const wide = 20;

const startY = 35;
const size = 0.1;
const weldJointConfigLeft = {
    worldId: world.worldId,
    hertz: 50.0,
    dampingRatio: 10.0,
    collideConnected: true
};
const weldJointConfigUp = {
    worldId: world.worldId,
    hertz: 50.0,
    dampingRatio: 10.0,
    collideConnected: true
};

var boxes = [];
var joints = [];
function makeObject(worldId)
{
    for(let y = -high / 2 + startY; y < high / 2 + startY; y++)
    {
        boxes.push([]);
        for(let x = -wide / 2; x < wide / 2; x++)
        {
            boxes[boxes.length - 1].push(CreateBoxPolygon({ worldId:worldId, type:b2BodyType.b2_dynamicBody, position:new b2Vec2(x * size, y * size), size:size/2, density:1.0, friction:0.2, color:b2HexColor.b2_colorGold }));
        }
    }

    for(let y = 0; y < high; y++)
    {
        for(let x = 0; x < wide; x++)
        {
            const box = boxes[y][x];
            if (x > 0)
            {
                const bl = boxes[y][x - 1];
                weldJointConfigLeft.bodyIdA = box.bodyId;
                weldJointConfigLeft.bodyIdB = bl.bodyId;
                weldJointConfigLeft.anchorA = new b2Vec2(-size/2,0);
                weldJointConfigLeft.anchorB = new b2Vec2(size/2,0);
                joints.push(CreateWeldJoint(weldJointConfigLeft).jointId);
            }
            if (y > 0)
            {
                const bu = boxes[y - 1][x];
                weldJointConfigUp.bodyIdA = box.bodyId;
                weldJointConfigUp.bodyIdB = bu.bodyId;
                weldJointConfigUp.anchorA = new b2Vec2(0,-size/2);
                weldJointConfigUp.anchorB = new b2Vec2(0,size/2);
                joints.push(CreateWeldJoint(weldJointConfigUp).jointId);
            }
        }
    }
}


function destroyObject()
{
    for(let i = 0; i < joints.length; i++)
        b2DestroyJoint(joints[i]);
    joints = [];
    for(let y = 0; y < high; y++)
    {
        for(let x = 0; x < wide; x++)
        {
            const box = boxes[y][x];
            b2DestroyBody(box.bodyId);
        }
    }
    boxes = [];
}


function breakJoints()
{
    for (let i = joints.length - 1; i >= 0; i--)
    {
        let force = b2Joint_GetConstraintForce(joints[i]);
        if (b2LengthSquared(force) > breakForce * breakForce)
        {
            b2DestroyJoint(joints[i]);
            joints.splice(i, 1);
        }
    }    
}


// ** The RAF Update Function **
function Update(deltaTime, currentTime, currentFps)
{
    if (currentTime > nextTestTime)
    {
        destroyObject();
        breakForce -= deltaBreakForce;
        if (breakForce <= 0)
            breakForce = startBreakForce + Math.floor(Math.random() * deltaBreakForce);
        makeObject(world.worldId);
        nextTestTime = currentTime + timePerTest;
    }

    // detect if the joints break due to too much force on them
    breakJoints();

    // ** Step the Physics **
    WorldStep({ worldId: world.worldId, deltaTime: deltaTime });

    // ** Debug Drawing **
    // clear screen then redraw content
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    b2World_Draw(world.worldId, m_draw);

    // on-screen stats
    if (ctx) {
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.fillText(`FPS: ${ currentFps }  BREAK FORCE: ${breakForce}`, 10, 20);
    }
}


function CreateGame()
{
    breakForce = startBreakForce;
    nextTestTime = timePerTest;

    // create the debug drawing system
    m_draw = CreateDebugDraw(canvas, ctx, m_drawScale);

    // make a frame to keep things in the screen area
    makeFrame(12, 1, 10, 4.0, world.worldId);

    // build the splitter object
    CreateBoxPolygon({ worldId:world.worldId, type:b2BodyType.b2_dynamicBody, position:new b2Vec2(0, -3), size:new b2Vec2(0.1, 1.0), density:250.0, friction:0.9, color:b2HexColor.b2_colorRed })

    // build the object with smashable joints
    makeObject(world.worldId);

    // ** Trigger the RAF Update Calls **
    RAF(Update);
}


// ** Create the Game **
setTimeout(CreateGame, 50);

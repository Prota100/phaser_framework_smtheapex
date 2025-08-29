// Import Library Functions

import { b2Add, b2Joint_WakeBodies, b2PrismaticJoint_SetMotorSpeed, CreateBoxPolygon, CreateCircle, CreatePrismaticJoint, CreateRevoluteJoint, CreateWorld, WorldStep } from '../lib/PhaserBox2D.js';
import { CreateDebugDraw, RAF } from '../lib/PhaserBox2D.js';
import { b2BodyType, b2DefaultWorldDef, b2HexColor } from '../lib/PhaserBox2D.js';
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
let world = CreateWorld({ worldDef:worldDef });

// ** Physics Object Creation **

// a piston holder
const sleeveLength = 10;
const sleevePosition = new b2Vec2(-sleeveLength, 0);
const pistonSleeve = CreateBoxPolygon({ worldId:world.worldId, type:b2BodyType.b2_staticBody, position:sleevePosition, size:new b2Vec2(sleeveLength / 2, 1), density:1.0, friction:0.5, groupIndex:-1, color:b2HexColor.b2_colorLawnGreen });

// a piston shaft
const shaftLength = 14;
const shaftPosition = b2Add(sleevePosition, new b2Vec2((shaftLength - sleeveLength) / 2, 0));
const pistonShaft = CreateBoxPolygon({ worldId:world.worldId, type:b2BodyType.b2_dynamicBody, position:shaftPosition, size:new b2Vec2(shaftLength / 2, 0.75), density:1.0, friction:0.2, groupIndex:-1, color:b2HexColor.b2_colorGold });
const pistonForce = 75000;

// a prismatic joint connecting the piston sleeve to the piston shaft
const pistonJoint = CreatePrismaticJoint({
    worldId:world.worldId,
    bodyIdA:pistonSleeve.bodyId,
    bodyIdB:pistonShaft.bodyId,
    axis:new b2Vec2(1,0),
    anchorA:new b2Vec2(-sleeveLength / 2,0),        // the back of the piston sleeve
    anchorB:new b2Vec2(-shaftLength / 2,0),         // the left end of the piston shaft
    enableLimit:true, lowerTranslation:0, upperTranslation:sleeveLength,
    enableMotor:true, maxMotorForce:pistonForce, motorSpeed:0,
    enableSpring:false, hertz:1.0, dampingRatio:0.5
});

// a connecting rod
const rodLength = 14;
const rodOverlap = 1.0;
const rodPosition = b2Add(shaftPosition, new b2Vec2(shaftLength / 2 + rodLength / 2 - rodOverlap, 0));
const connectingRod = CreateBoxPolygon({ worldId:world.worldId, type:b2BodyType.b2_dynamicBody, position:rodPosition, size:new b2Vec2(rodLength / 2, 0.75), density:1.0, friction:0.2, groupIndex:-1, color:b2HexColor.b2_colorGold });

// a revolute joint connecting the piston shaft to the connecting rod
const connectingJoint = CreateRevoluteJoint({
    worldId:world.worldId,
    bodyIdA:pistonShaft.bodyId,
    bodyIdB:connectingRod.bodyId,
    anchorA:new b2Vec2(shaftLength / 2,0),
    anchorB:new b2Vec2(-(rodLength / 2 - rodOverlap / 2),0)
});

// a driven wheel
const wheelPosition = new b2Vec2(18, 0);
const wheelRadius = 10;
const wheelPivot = 5.0;
const wheel = CreateCircle({ worldId:world.worldId, type:b2BodyType.b2_dynamicBody, position:wheelPosition, radius:wheelRadius, density:30.0, friction:0.01, groupIndex:-1, color:b2HexColor.b2_colorIndianRed });
//AttachImage(world.worldId, wheel.bodyId, "wheel.png");

// a revolute joint connecting the wheel to a static object
const slack = -1.0;
const wheelOffset = -sleeveLength / 2 + shaftLength + rodLength - rodOverlap + wheelRadius - wheelPivot - slack;
const axleJoint = CreateRevoluteJoint({
    worldId:world.worldId,
    bodyIdA:wheel.bodyId,
    bodyIdB:pistonSleeve.bodyId,
    anchorA:new b2Vec2(0,0),                // the middle of the wheel...
    anchorB:new b2Vec2(wheelOffset,0),      // ...rotates around an offset from the sleeve
    enableMotor:false, maxMotorForce:0, motorSpeed:0,
    enableSpring:false, hertz:1.0, dampingRatio:0.5
});

// a revolute joint connecting the wheel to the connecting rod
const wheelJoint = CreateRevoluteJoint({
    worldId:world.worldId,
    bodyIdA:wheel.bodyId,
    bodyIdB:connectingRod.bodyId,
    anchorA:new b2Vec2(-wheelPivot,0.1),
    anchorB:new b2Vec2(rodLength / 2 + 1,0),
});


const pistonSpeed = 10;
const pistonReverse = 3;
let pistonTime = 0;
let pistonMotion = 0;

// ** Define the RAF Update Function **
function update(deltaTime, currentTime, currentFps)
{
    // TODO: replace this with a sensor for shaft offset: push when it's in, pull when it's out
    pistonTime += deltaTime;
    if (pistonTime >= pistonReverse)
    {
        pistonTime -= pistonReverse;

        if (pistonMotion == 0)
            pistonMotion = pistonSpeed;
        else
            pistonMotion = -pistonMotion;

        b2PrismaticJoint_SetMotorSpeed(pistonJoint.jointId, pistonMotion);
        b2Joint_WakeBodies(pistonJoint.jointId);
    }

	// ** Step the Physics **
	WorldStep({ worldId: world.worldId, deltaTime: deltaTime });

	// ** Debug Drawing **
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	b2World_Draw(world.worldId, m_draw);
}

// ** Trigger the RAF Update Calls **
RAF(update);

// Import Library Functions

import { b2Add, b2Body_GetLocalPoint, b2Body_GetLocalVector, b2Body_GetPosition, b2Circle,
    b2ComputeHull, b2CreateBody, b2CreateChain, b2CreateCircleShape, b2CreatePolygonShape,
    b2DefaultChainDef, b2DefaultShapeDef, b2Joint_WakeBodies, b2MakePolygon,
    b2WheelJoint_SetMotorSpeed, ConvertWorldToScreen, CreateWheelJoint,
    CreateWorld, WorldStep } from '../lib/PhaserBox2D.js';
import { CreateDebugDraw, RAF } from '../lib/PhaserBox2D.js';
import { b2BodyType, b2DefaultBodyDef, b2DefaultWorldDef } from '../lib/PhaserBox2D.js';
import { b2Vec2 } from '../lib/PhaserBox2D.js';

import { b2World_Draw } from '../lib/PhaserBox2D.js';

// ** Debug Drawing **

// set the scale at which you want the world to be drawn
const m_drawScale = 30.0;

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

function makeChain(worldId) {
    const bodyDef = b2DefaultBodyDef();
    bodyDef.type = b2BodyType.b2_staticBody;
    const bodyId = b2CreateBody(worldId, bodyDef);

    // Generate terrain points
    const points = [];
    const width = 1000;
    const segmentSize = 5;
    let x = -width / 2;
    
    // Base terrain parameters
    const baseHeight = 0;
    const maxHeight = 40;
    
    let start = 3;

    while (x <= width / 2) {
        let height = baseHeight;
        
        if (start <= 0)
        {
            if (Math.abs(Math.sin(x * 0.02)) < 0.1)
            {
                // Create some flat sections for resting spots
                height = Math.round(height);
            }
            else
            {
                // Large rolling hills
                height += Math.sin(x * 0.03) * 2;
                
                // Medium hills
                height += Math.sin(x * 0.1) * 1;
                
                // Small bumps
                height += Math.sin(x * 0.37) * 0.5;
                
                // Add some random variation
                height += (Math.random() * 0.2) - 0.1;
            }
        }

        // Ensure height stays within bounds
        height = Math.max(-maxHeight, Math.min(maxHeight, height));
        
        points.push(new b2Vec2(x, height));
        x += segmentSize;

        start--;
    }

    const finalPoints = [
        // Start with the bottom corners
        new b2Vec2(-width / 2, -maxHeight),
        new b2Vec2(width / 2, -maxHeight),
        // Add the terrain points in reverse order (right to left)
        ...points.reverse(),
        // Close the loop by returning to the start
        new b2Vec2(-width / 2, -maxHeight)
    ];    

    console.log(`ground chain has ${points.length} points`);
    const chainDef = b2DefaultChainDef();
    chainDef.points = finalPoints;
    chainDef.count = finalPoints.length;
    chainDef.isLoop = true;
    
    b2CreateChain(bodyId, chainDef);

    return { x: -width / 2, y: baseHeight };
}


function makeCar(x, y, worldId)
{
    const torque = 10000;       // engine power
    const hertz = 3.0;          // suspension stiffness
    const dampingRatio = 0.3;   // suspension bounce damping

    const carScale = 1.0;
    const position = new b2Vec2(x, y);

    const vertices = [
        new b2Vec2(-1.5, -0.5), new b2Vec2(1.5, -0.5), new b2Vec2(1.5, 0.0), new b2Vec2(0.0, 0.9), new b2Vec2(-1.15, 0.9), new b2Vec2(-1.5, 0.2)
    ];

    for (let i = 0; i < vertices.length; ++i)
    {
        vertices[i].x *= 0.85 * carScale;
        vertices[i].y *= 0.85 * carScale;
    }

    const hull = b2ComputeHull(vertices, 6);
    const chassis = b2MakePolygon(hull, 0.15 * carScale);

    // body shape
    const shapeDef = b2DefaultShapeDef();
    shapeDef.density = 10.0 / carScale;
    shapeDef.friction = 0.2;

    const circle = new b2Circle();
    circle.center = new b2Vec2(0.0, 0.0);
    circle.radius = 0.4 * carScale;

    const bodyDef = b2DefaultBodyDef();
    bodyDef.type = b2BodyType.b2_dynamicBody;
    bodyDef.position = b2Add(new b2Vec2(0.0, 1.0 * carScale), position);
    const chassisId = b2CreateBody(worldId, bodyDef);
    b2CreatePolygonShape(chassisId, shapeDef, chassis);

    // wheel shapes
    shapeDef.density = 80.0 / carScale;
    shapeDef.friction = 0.9;

    bodyDef.position = b2Add(new b2Vec2(-0.8 * carScale, 0.4 * carScale), position);
    bodyDef.allowFastRotation = true;
    const rearWheelId = b2CreateBody(worldId, bodyDef);
    b2CreateCircleShape(rearWheelId, shapeDef, circle);

    bodyDef.position = b2Add(new b2Vec2(0.8 * carScale, 0.4 * carScale), position);
    bodyDef.allowFastRotation = true;
    const frontWheelId = b2CreateBody(worldId, bodyDef);
    b2CreateCircleShape(frontWheelId, shapeDef, circle);

    const axis = new b2Vec2(0.0, 1.0);

    let pivot = b2Body_GetPosition(rearWheelId);
    let m_rearAxle = CreateWheelJoint({
        worldId: worldId,
        bodyIdA: chassisId, bodyIdB: rearWheelId,
        anchorA: b2Body_GetLocalPoint(chassisId, pivot),
        anchorB: b2Body_GetLocalPoint(rearWheelId, pivot),
        motorSpeed: 0.0, maxMotorTorque: torque, enableMotor: true,
        axis: b2Body_GetLocalVector(chassisId, axis), hertz: hertz, dampingRatio: dampingRatio, enableSpring: true,
        enableLimit: true, lowerTranslation: -0.25 * carScale, upperTranslation: 0.25 * carScale,
    });
    pivot = b2Body_GetPosition(frontWheelId);
    let m_frontAxle = CreateWheelJoint({
        worldId: worldId,
        bodyIdA: chassisId, bodyIdB: frontWheelId,
        anchorA: b2Body_GetLocalPoint(chassisId, pivot),
        anchorB: b2Body_GetLocalPoint(frontWheelId, pivot),
        motorSpeed: 0.0, maxMotorTorque: torque, enableMotor: true,
        axis: b2Body_GetLocalVector(chassisId, axis), hertz: hertz, dampingRatio: dampingRatio, enableSpring: true,
        enableLimit: true, lowerTranslation: -0.25 * carScale, upperTranslation: 0.25 * carScale,
    });

    return { rear: m_rearAxle.jointId, front: m_frontAxle.jointId, bodyId: chassisId };
}

function driveCar(car, dt)
{
    const m = m_speed;

    if (m_key['Right']) m_speed = Math.min(m_speed + 5 * dt, 50);
    else if (m_key['Left']) m_speed = Math.max(m_speed - 5 * dt, -50);
    else if (m_key['Down']) m_speed *= 0.75;

    if (m_speed != m)
    {
        b2WheelJoint_SetMotorSpeed(car.rear, -m_speed);
        b2WheelJoint_SetMotorSpeed(car.front, -m_speed);
        b2Joint_WakeBodies(car.rear);
        b2Joint_WakeBodies(car.front);
    }
}


// ** Define the RAF Update Function **
function update(deltaTime, currentTime, currentFps)
{
    // ** Player control **
    driveCar(m_car, deltaTime);

	// ** Step the Physics **
	WorldStep({ worldId: world.worldId, deltaTime: deltaTime });

    // Focus the camera on the player location
    let wp = b2Body_GetPosition(m_car.bodyId);
    let sp = ConvertWorldToScreen(canvas, m_drawScale, wp);
    m_draw.SetPosition(sp.x, sp.y);
    
	// ** Debug Drawing **
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	b2World_Draw(world.worldId, m_draw);

    if (ctx) {
        // Draw FPS counter
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.fillText(`FPS: ${ currentFps }, THROTTLE: ${ Math.round(m_speed) }`, 10, 20);
    }    
}


let m_speed = 0;
let m_car = null;
function createExample()
{
    m_draw = CreateDebugDraw(canvas, ctx, m_drawScale);

    const { x, y } = makeChain(world.worldId);
    m_car = makeCar(x + 2, y + 1, world.worldId);

    // ** Trigger the RAF Update Calls **
    RAF(update);
}


// user input
let m_key = {
    'Up': false,
    'Down': false,
    'Left': false,
    'Right': false
};

document.addEventListener('keydown', function (event)
{
    if (event.code === 'ArrowUp' || event.code == 'KeyW')
    {
        m_key['Up'] = true;
    } else if (event.code === 'ArrowDown' || event.code == 'KeyS')
    {
        m_key['Down'] = true;
    } else if (event.code === 'ArrowLeft' || event.code == 'KeyA')
    {
        m_key['Left'] = true;
    } else if (event.code === 'ArrowRight' || event.code == 'KeyD')
    {
        m_key['Right'] = true;
    }
});
document.addEventListener('keyup', function (event)
{
    if (event.code === 'ArrowUp' || event.code == 'KeyW')
    {
        m_key['Up'] = false;
    } else if (event.code === 'ArrowDown' || event.code == 'KeyS')
    {
        m_key['Down'] = false;
    } else if (event.code === 'ArrowLeft' || event.code == 'KeyA')
    {
        m_key['Left'] = false;
    } else if (event.code === 'ArrowRight' || event.code == 'KeyD')
    {
        m_key['Right'] = false;
    }
});


// ** Create the Example **
// the timeout allows Firefox to resolve the screen dimensions
// without this precaution, the canvas drawing will use an incorrect scale
setTimeout(createExample, 50);

// Import Library Functions

import { AttachImage, b2Add, b2Body_ApplyForce, b2Body_ApplyLinearImpulse, b2Body_GetAngularVelocity, b2Body_GetLinearVelocity, b2Body_GetMass, b2Body_GetPosition, b2Body_GetTransform, b2Body_GetWorldPoint, b2Body_SetAngularDamping, b2Dot, b2MulSV, b2Rot_GetAngle, b2Sub, ConvertWorldToScreen, CreateBoxPolygon, CreateCircle, CreateWorld, WorldStep } from '../lib/PhaserBox2D.js';
import { CreateDebugDraw, RAF } from '../lib/PhaserBox2D.js';
import { b2BodyType, b2DefaultBodyDef, b2DefaultWorldDef, b2HexColor } from '../lib/PhaserBox2D.js';
import { b2Rot, b2Vec2 } from '../lib/PhaserBox2D.js';

import { b2World_Draw } from '../lib/PhaserBox2D.js';

// ** Debug Drawing **
var m_draw;

// set the scale at which you want the world to be drawn
const m_drawScale = 10.0;

// get the canvas element from the web page
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

// ** Physics World Creation **

// create a definition for a world using the default values
let worldDef = b2DefaultWorldDef();

// change some of the default values
worldDef.gravity = new b2Vec2(0, 0);

// create a world object and save the ID which will access it
let world = CreateWorld({ worldDef:worldDef });


var player;
const carProperties = {
    // static
    rearWheelDrive: true,
    angularDamping: 0.10,
    linearDamping: 0.5,
    driftDampingMultiplier: 4.0,
    density: 2.5,
    width: 2.0,
    length: 4.0,
    wheelBase: 3.0,
    maxSteeringAngle: 0.4,
    steeringSpeed: 0.30,
    steeringStraight: 0.85,
    maxEngineForce: 190.0,
    maxBrakeForce: 150.0,
    maxLateralImpulse: 4.8,
    frontGripMultiplier: 1.0,
    rearGripMultiplier: 0.985,
    massScaler: 0.25,

    // dynamic
    steeringAngle: 0,
    throttle: 0,
    brake: 0,
};

// Wheel positions relative to car center
// NOTE: car angle zero (straight) is facing to the right, so x offset moves along the length of the car, y offset moves across the 'width' of the car body
const wheelPositions = [
    new b2Vec2(-carProperties.wheelBase/2, -carProperties.width*.376),  // rear left
    new b2Vec2(-carProperties.wheelBase/2, carProperties.width*.376),   // rear right
    new b2Vec2(carProperties.wheelBase/2, -carProperties.width*.376),   // front left
    new b2Vec2(carProperties.wheelBase/2, carProperties.width*.376)     // front right
];

function UpdateFriction(wheelIndex) {
    const worldPos = b2Body_GetWorldPoint(player.bodyId, wheelPositions[wheelIndex]);

    const transform = b2Body_GetTransform(player.bodyId);

    const bodyVelocity = b2Body_GetLinearVelocity(player.bodyId);
    const angularVel = b2Body_GetAngularVelocity(player.bodyId);
    
    // Velocity at wheel point (local)
    const centerPos = transform.p;
    const rel_pos = b2Sub(worldPos, centerPos);

    // Add rotational velocity component
    const velocity = bodyVelocity;
    velocity.x -= angularVel * rel_pos.y;
    velocity.y += angularVel * rel_pos.x;
    
    // Get body angle from transform
    let angle = b2Rot_GetAngle(transform.q);

    if (wheelIndex >= 2) { // Front wheels do steering
        angle += carProperties.steeringAngle;
    }
    
    //const wheelForward = new b2Vec2(Math.cos(angle), Math.sin(angle));
    const wheelLateral = new b2Vec2(-Math.sin(angle), Math.cos(angle));
    const lateralVelMag = b2Dot(velocity, wheelLateral);
    
    // Calculate impulse to reduce lateral velocity
    const mass = b2Body_GetMass(player.bodyId) * carProperties.massScaler;
    let impulse = mass * -lateralVelMag;
    
    // Apply speed-based scaling to impulse
    let maxImpulse = carProperties.maxLateralImpulse;
    
    // Front vs Rear wheels have different grip characteristics
    if (wheelIndex >= 2) {
        maxImpulse *= carProperties.frontGripMultiplier;
    } else {
        maxImpulse *= carProperties.rearGripMultiplier;
    }
    
    // Clamp the impulse
    impulse = Math.max(-maxImpulse, Math.min(impulse, maxImpulse));
    
    const impulseVec = b2MulSV(impulse, wheelLateral);
    b2Body_ApplyLinearImpulse(player.bodyId, impulseVec, worldPos, true);
    
    // Visualize wheel
    // const wheelEnd = b2Add(worldPos, b2MulSV(0.5, wheelForward));
    // m_draw.DrawSegment(worldPos, wheelEnd, b2HexColor.b2_colorGold, ctx);
}

function UpdateDrive(wheelIndex) {
    // Only apply drive forces to rear wheels
    if (carProperties.rearWheelDrive)
    {
        if (wheelIndex >= 2)
            return;
    }
    else
    {
        if (wheelIndex < 2)
            return;
    }
    
    const worldPos = b2Body_GetWorldPoint(player.bodyId, wheelPositions[wheelIndex]);
    const transform = b2Body_GetTransform(player.bodyId);
    const angle = b2Rot_GetAngle(transform.q);
    const wheelForward = new b2Vec2(Math.cos(angle), Math.sin(angle));

    // Apply engine and brake forces
    let force = 0.0;
    if (carProperties.throttle !== 0.0) {
        force = carProperties.throttle * carProperties.maxEngineForce;
    }
    
    if (carProperties.brake !== 0.0) {
        const velocity = b2Body_GetLinearVelocity(player.bodyId);
        const forwardVel = b2Dot(velocity, wheelForward);
        
        if (forwardVel > 0) {
            force -= carProperties.brake * carProperties.maxBrakeForce;
        } else {
            force += carProperties.brake * carProperties.maxBrakeForce;
        }
    }
    
    const forceVec = b2MulSV(force, wheelForward);
    b2Body_ApplyForce(player.bodyId, forceVec, worldPos, true);
}

function HandleInput(deltaTime)
{
    carProperties.throttle = 0;
    carProperties.brake = 0;

    if (m_key['Right'])
        carProperties.steeringAngle = Math.max(carProperties.steeringAngle - carProperties.steeringSpeed * deltaTime, -carProperties.maxSteeringAngle);
    else if (m_key['Left'])
        carProperties.steeringAngle = Math.min(carProperties.steeringAngle + carProperties.steeringSpeed * deltaTime, carProperties.maxSteeringAngle);
    else
        carProperties.steeringAngle *= carProperties.steeringStraight;
    if (m_key['Down']) carProperties.brake = 1;
    if (m_key['Up']) carProperties.throttle = 1;

    // Increase angular damping if no throttle is applied
    if (carProperties.throttle === 0 && carProperties.brake === 0) {
        b2Body_SetAngularDamping(player.bodyId, carProperties.angularDamping * carProperties.driftDampingMultiplier);  // Apply higher damping
    } else {
        b2Body_SetAngularDamping(player.bodyId, carProperties.angularDamping);  // Reset to default damping
    }    
}

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

function CreateGame()
{
    // create the debug drawing system
    m_draw = CreateDebugDraw(canvas, ctx, m_drawScale);

    // create the car
    let bodyDef = b2DefaultBodyDef();
    bodyDef.type = b2BodyType.b2_dynamicBody;
    bodyDef.angularDamping = carProperties.angularDamping;
    bodyDef.linearDamping = carProperties.linearDamping;
    player = CreateBoxPolygon({ worldId:world.worldId, type:b2BodyType.b2_dynamicBody, bodyDef:bodyDef, position:new b2Vec2(0, 0), size:new b2Vec2(carProperties.length / 2.0, carProperties.width / 2.0), density:carProperties.density, color:b2HexColor.b2_colorGold });
    //playerShape = AttachImage(world.worldId, player.bodyId, "../resources/images", "car-yellow.png", null, new b2Vec2(1, 1), new b2Vec2(0, 0), new b2Vec2(132, 64));

    // scatter boxes all over the place
    for(let i = 0; i < 1000; i++)
    {
        let x = Math.random() * 2.0 - 1.0;
        let y = Math.random() * 2.0 - 1.0;
        CreateBoxPolygon({ worldId:world.worldId, type:b2BodyType.b2_dynamicBody, position:new b2Vec2(x * 400, y * 400), size:1.0, density:1.0, friction:0.5, linearDamping:3.0, angularDamping:4.0, color:b2HexColor.b2_colorBlack });
    }

    // Trigger the RAF Update Calls
    RAF(Update);
}

// ** Define the RAF Update Function **
function Update(deltaTime, currentTime, currentFps)
{
    HandleInput(deltaTime);

    // update each wheel individually
    for (let i = 0; i < wheelPositions.length; i++)
    {
        UpdateFriction(i);
        UpdateDrive(i, deltaTime);
    }

    // ** Step the Physics **
    WorldStep({ worldId: world.worldId, deltaTime: deltaTime });

    // focus the camera on the player location
    let wp = b2Body_GetPosition(player.bodyId);
    let sp = ConvertWorldToScreen(canvas, m_drawScale, wp);
    m_draw.SetPosition(sp.x, sp.y);
    
    // ** Debug Drawing **
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    b2World_Draw(world.worldId, m_draw);
}

// ** Create the Game **
setTimeout(CreateGame, 50);

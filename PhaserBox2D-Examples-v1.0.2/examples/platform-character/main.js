// Import Library Functions

import { B2_ID_EQUALS, b2Body_ApplyForceToCenter, b2Body_ApplyLinearImpulseToCenter, b2Body_GetContactCapacity, b2Body_GetContactData, b2Body_GetLinearVelocity, b2Body_IsValid, b2ContactData, b2Shape_GetBody, CreateBoxPolygon, CreateCapsule, CreateCircle, CreateWorld, WorldStep } from '../lib/PhaserBox2D.js';
import { CreateDebugDraw, RAF } from '../lib/PhaserBox2D.js';
import { b2BodyType, b2DefaultBodyDef, b2DefaultWorldDef, b2HexColor } from '../lib/PhaserBox2D.js';
import { b2Rot, b2Vec2 } from '../lib/PhaserBox2D.js';

import { b2World_Draw } from '../lib/PhaserBox2D.js';


// ** Debug Drawing **
var m_draw;

// set the scale at which you want the world to be drawn
const m_drawScale = 30.0;

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

// a box that will fall
const box = CreateBoxPolygon({ worldId:world.worldId, type:b2BodyType.b2_dynamicBody, position:new b2Vec2(-2, 8), size:1, density:1.0, friction:0.2, color:b2HexColor.b2_colorGold });

// a ball that will fall and land on the corner of the box
const ball = CreateCircle({ worldId:world.worldId, type:b2BodyType.b2_dynamicBody, position:new b2Vec2(2.5, 12), radius:1, density:1.0, friction:0.5, color:b2HexColor.b2_colorRed });

// a static ground
const groundBodyDef = b2DefaultBodyDef();
const ground = CreateBoxPolygon({ worldId:world.worldId, type:b2BodyType.b2_staticBody, bodyDef: groundBodyDef, position:new b2Vec2(0, -6), size:new b2Vec2(20, 1), density:1.0, friction:0.5, color:b2HexColor.b2_colorLawnGreen });


// ** Game Values **

const shotTiming = 0.1;
const bulletSpeed = 1.0;
const bulletRange = 40.0;

const jumpForce = 15.0;
const runForce = 30.0;
const jumpHigherForce = 3.0;
const airControlForce = 4.0;
const maxRunSpeed = 10.0;

const initLives = 3;
const playerRadius = 0.5;
const playerHeight = 2.0;
const playerCapsuleConfig = {
    worldId: world.worldId,
    type: b2BodyType.b2_dynamicBody,
    position: new b2Vec2(0, 0),
    center1: new b2Vec2(0, -0.5 * playerHeight + playerRadius),
    center2: new b2Vec2(0, 0.5 * playerHeight - playerRadius),
    radius: playerRadius,
    density: 1.0,
    friction: 0.8,
    color: b2HexColor.b2_colorGold,
    fixedRotation: true,
    linearDamping: 0.1,
};

var currentLives;
var player;
var canJump;
var bulletTime;


// ** User Input **
const keys = {};
document.addEventListener('keydown', (event) =>
{
    keys[ event.code ] = true;
});

document.addEventListener('keyup', (event) =>
{
    keys[ event.code ] = false;
});


function UserInput()
{
    if (!b2Body_IsValid(player.bodyId))
    {
        // The player died...
        if (keys[ 'Space' ] && currentLives <= 0)
        {
            RestartGame();
        }
        return;
    }

    const velocity = b2Body_GetLinearVelocity(player.bodyId);

    // user control changes when they're in mid-air
    if (canJump)
    {
        if (keys[ 'ArrowUp' ])
        {
            if (velocity.y < 0.05)
            {
                // Jump
                b2Body_ApplyLinearImpulseToCenter(player.bodyId, new b2Vec2(0, jumpForce), true);
            }
        }
        if (keys[ 'ArrowLeft' ])
        {
            if (velocity.x > -maxRunSpeed)
            {
                // Run left
                b2Body_ApplyForceToCenter(player.bodyId, new b2Vec2(-runForce, 0), true);
            }
        }
        if (keys[ 'ArrowRight' ])
        {
            if (velocity.x < maxRunSpeed)
            {
                // Run right
                b2Body_ApplyForceToCenter(player.bodyId, new b2Vec2(runForce, 0), true);
            }
        }
    }
    else
    {
        if (keys[ 'ArrowUp' ])
        {
            if (velocity.y > 0.0)
            {
                // Jump a bit higher, but don't slow the falling speed
                b2Body_ApplyForceToCenter(player.bodyId, new b2Vec2(0, jumpHigherForce), true);
            }
        }
        if (keys[ 'ArrowLeft' ])
        {
            // Run left
            b2Body_ApplyForceToCenter(player.bodyId, new b2Vec2(-airControlForce, 0), true);
        }
        if (keys[ 'ArrowRight' ])
        {
            // Run right
            b2Body_ApplyForceToCenter(player.bodyId, new b2Vec2(airControlForce, 0), true);
        }        
    }

    if (keys[ 'Space' ])
    {
        // Shoot
        if (bulletTime == 0)
        {
            bulletTime = shotTiming;

            // const rotation = b2Body_GetRotation(player.bodyId);
            // const position = b2Body_GetPosition(player.bodyId);
            // fireBullet(position, rotation);
        }
    }
}


// ** The Game Logic **
function GameUpdate(dt, currentTime)
{
    // update bullet timer
    bulletTime = Math.max(bulletTime - dt, 0);

    // test if player is on the ground
    canJump = CanPlayerJump();
}

function RestartGame()
{
    currentLives = initLives;
    bulletTime = 0;
    canJump = false;

    // reset player position to start
}

function CreateGame()
{
    // create the debug drawing system
    m_draw = CreateDebugDraw(canvas, ctx, m_drawScale);

    // create the player capsule
    player = CreateCapsule(playerCapsuleConfig);

    // initialise the game
    RestartGame();

    // Trigger the RAF Update Calls
    RAF(Update);
}

function CanPlayerJump()
{
    // check up to four contacts for the player to see if they're touching a platform
    // (four = one contact per cardinal direction?)
    let capacity = b2Body_GetContactCapacity(player.bodyId);
    capacity = Math.min(capacity, 4);
    const contactData = Array.from({length: capacity}, () => new b2ContactData());
    const count = b2Body_GetContactData(player.bodyId, contactData, capacity);
    for (let i = 0; i < count; i++) {
        const bodyIdA = b2Shape_GetBody(contactData[i].shapeIdA);

        // is shapeIdA the player, or the other shape?
        const sign = B2_ID_EQUALS(bodyIdA,player.bodyId) ? -1.0 : 1.0;
    
        if (sign * contactData[i].manifold.normalY > 0.7) {
            return true;
        }
    }
    return false;
}


// ** The RAF Update Function **
function Update(deltaTime, currentTime, currentFps)
{
    // ** User input **
    UserInput();

    // ** Game logic **
    GameUpdate(deltaTime, currentTime);

	// ** Step the Physics **
	WorldStep({ worldId: world.worldId, deltaTime: deltaTime });

	// ** Debug Drawing **
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	b2World_Draw(world.worldId, m_draw);
}

// ** Create the Game **
setTimeout(CreateGame, 50);


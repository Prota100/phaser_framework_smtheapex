import { CreateNGonPolygon, CreateWorld, WorldStep } from '../lib/PhaserBox2D.js';
import { b2Vec2 } from '../lib/PhaserBox2D.js';
import { b2BodyType, b2DefaultBodyDef, b2DefaultWorldDef, b2HexColor } from '../lib/PhaserBox2D.js';
import { b2World_Draw, b2Body_ApplyAngularImpulse, b2Body_ApplyForceToCenter, b2Body_GetRotation, b2Body_GetPosition, b2DefaultShapeDef, b2Body_SetTransform, b2Body_SetUserData, b2Body_IsValid } from '../lib/PhaserBox2D.js';
import { b2CreateBody } from '../lib/PhaserBox2D.js';
import { CreateDebugDraw, RAF } from '../lib/PhaserBox2D.js';

// Get the canvas element
const canvas = document.getElementById('myCanvas');
var ctx;
if (canvas)
{
    ctx = canvas.getContext('2d');
}

// Start the asteroids demo
let m_drawScale = 10;
let m_draw = null;
let timeTest = false;
m_draw = CreateDebugDraw(canvas, ctx, m_drawScale);

let worldDef = b2DefaultWorldDef();

// change some of the default values
worldDef.gravity = new b2Vec2(0, 0);
// create a world and save the ID which will access it
let world = CreateWorld({ worldDef:worldDef });

function getWorldSize ()
{
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    var ratio = w / h;
    var center = new b2Vec2(0, 0);
    var zoom = (h / 2) / m_drawScale;

    return new b2Vec2(zoom * ratio, zoom);
}

// world
const bodyDef = b2DefaultBodyDef();
const groundId = b2CreateBody(world.worldId, bodyDef);
const WORLD_WIDTH = getWorldSize().x;
const WORLD_HEIGHT = getWorldSize().y;

const SHIP_CATEGORY = 0x0001;
const SHIP_ANGULAR_IMPULSE = 1;
const SHIP_VELOCITY = SHIP_ANGULAR_IMPULSE * 500;

let ship = null;

const keys = {};
document.addEventListener('keydown', (event) =>
{
    keys[ event.code ] = true;
});

document.addEventListener('keyup', (event) =>
{
    keys[ event.code ] = false;
});

function handleInput (dt)
{
    if (keys[ 'ArrowUp' ])
    {
        const rotation = b2Body_GetRotation(ship.bodyId);
        b2Body_ApplyForceToCenter(ship.bodyId, new b2Vec2(rotation.c * SHIP_VELOCITY, rotation.s * SHIP_VELOCITY), true);
    }

    if (keys[ 'ArrowLeft' ])
    {
        b2Body_ApplyAngularImpulse(ship.bodyId, SHIP_ANGULAR_IMPULSE, true);
    }

    if (keys[ 'ArrowRight' ])
    {
        b2Body_ApplyAngularImpulse(ship.bodyId, -SHIP_ANGULAR_IMPULSE, true);
    }
}

function createShip ()
{
    const bodyDef = b2DefaultBodyDef();
    bodyDef.type = b2BodyType.b2_dynamicBody;
    bodyDef.angularDamping = 2;
    bodyDef.linearDamping = 0.5;

    const shipShapeDef = b2DefaultShapeDef();
    shipShapeDef.density = 10;
    shipShapeDef.friction = 0.3;
    shipShapeDef.customColor = b2HexColor.b2_colorBox2DYellow;

    const triConfig = {
        worldId: world.worldId,
        bodyDef: bodyDef,
        type: b2BodyType.b2_dynamicBody,
        position: new b2Vec2(0, 0),
        radius: 1.0,
        sides: 3,
        shapeDef: shipShapeDef,
        color: b2HexColor.b2_colorBox2DGreen
    };

    const polygon = CreateNGonPolygon(triConfig);
    b2Body_SetUserData(polygon.bodyId, { type: 'ship' });
    ship = polygon;
}

function wrap (bodyId)
{
    if (!b2Body_IsValid(bodyId)) return;

    const position = b2Body_GetPosition(bodyId);
    const rotation = b2Body_GetRotation(bodyId);
    position.x = wrapNumber(position.x, -WORLD_WIDTH / 2, WORLD_WIDTH / 2);
    position.y = wrapNumber(position.y, -WORLD_HEIGHT / 2, WORLD_HEIGHT / 2);

    b2Body_SetTransform(bodyId, position, rotation);
}

function wrapNumber (num, min, max)
{
    if (typeof min === 'undefined')
    {
        max = 1, min = 0;
    } else if (typeof max === 'undefined')
    {
        max = min, min = 0;
    }
    if (max > min)
    {
        num = (num - min) % (max - min);
        return num + (num < 0 ? max : min);
    } else
    {
        num = (num - max) % (min - max);
        return num + (num <= 0 ? min : max);
    }
}

function updatePositions (dt)
{
    wrap(ship.bodyId);
}

function game ()
{
    // Animation loop
    let frameCount = 0;
    let lastFpsUpdateTime = 0;
    let currentFps = 0;

    createShip();

    function update (deltaTime, currentTime, currentFps)
    {
        const stepTime = WorldStep({ worldId: world.worldId, deltaTime: deltaTime });

        if (!timeTest)
        {
            if (ctx && canvas)
            {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                b2World_Draw(world.worldId, m_draw);
            }

            frameCount++;
            if (currentTime - lastFpsUpdateTime >= 1000)
            {
                currentFps = Math.round((frameCount * 1000) / (currentTime - lastFpsUpdateTime));
                frameCount = 0;
                lastFpsUpdateTime = currentTime;
            }

            if (ctx)
            {
                ctx.fillStyle = 'white';
                ctx.font = '20px Arial';
                ctx.fillText(`Asteroids Movement`, 10, 25);
            }
        }

        handleInput(deltaTime);
        updatePositions(deltaTime);
    }

    RAF(update);
}

setTimeout(game, 50);

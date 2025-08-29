import { b2DefaultBodyDef, CreateWorld, WorldStep, CreateDebugDraw, RAF } from '../lib/PhaserBox2D.js';
import { b2Vec2, b2BodyType, b2DefaultWorldDef, b2World_Draw, b2ComputeHull, b2CreateBody, b2DefaultShapeDef, b2MakeBox, b2CreatePolygonShape, b2Body_ApplyForceToCenter, b2MakePolygon, b2Body_ApplyLinearImpulseToCenter, b2Body_SetTransform, b2CreateSegmentShape, b2Segment, b2Body_GetRotation, b2Body_GetWorldPoint, b2Body_ApplyForce, b2Body_SetAngularVelocity } from '../lib/PhaserBox2D.js';

// Get the canvas element
const canvas = document.getElementById('myCanvas');
var ctx;
if (canvas)
{
    ctx = canvas.getContext('2d');
}

// Constants
const DEGTORAD = 0.0174532925199432957; // which is PI / 180
const RADTODEG = 57.295779513082320876; // and this is 180 / PI
const GRAVITY = 0;

// Physics settings
const m_drawScale = 30;
const timeTest = false;
const m_draw = CreateDebugDraw(canvas, ctx, m_drawScale);

const worldDef = b2DefaultWorldDef();
worldDef.gravity = new b2Vec2(0, -GRAVITY);
// create a world and save the ID which will access it
const world = CreateWorld({ worldDef: worldDef });
const worldId = world.worldId;

const bodyIds = [];

const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
};

// Track one-shot actions
const oneShot = {
    ArrowUp: false,
    ArrowLeft: false
};

// Set up key listeners
window.addEventListener('keydown', (event) =>
{
    if (keys.hasOwnProperty(event.code))
    {
        keys[ event.code ] = true;
    }
});

window.addEventListener('keyup', (event) =>
{
    if (keys.hasOwnProperty(event.code))
    {
        keys[ event.code ] = false;
        // Reset one-shot flags when key is released
        if (oneShot.hasOwnProperty(event.code))
        {
            oneShot[ event.code ] = false;
        }
    }
});

function handleForces (dt)
{
    // Example bodies (ensure these exist in your world)
    const gradualBody = bodyIds[ 0 ];  // Force demo
    const impulseBody = bodyIds[ 1 ];  // Impulse demo
    const warpBody = bodyIds[ 2 ];     // Position demo
    const cornerBody = bodyIds[ 3 ];     // Point demo

    // 1. Gradual Force: Continuous upward force while Up is held
    if (keys.ArrowUp)
    {
        b2Body_ApplyForceToCenter(
            gradualBody,
            new b2Vec2(0, 50),
            true
        );
    }

    // 2. Impulse: One-time push when Left is first pressed
    if (keys.ArrowLeft && !oneShot.ArrowLeft)
    {
        b2Body_ApplyLinearImpulseToCenter(
            impulseBody,
            new b2Vec2(0, 50),
            true
        );
        oneShot.ArrowLeft = true;
    }

    // 3. Position Change: Teleport when Right is pressed
    if (keys.ArrowRight)
    {
        b2Body_SetTransform(
            warpBody,
            new b2Vec2(2, -4),
            b2Body_GetRotation(warpBody)
        );
    }

    // 4. Apply at a specific point
    if (keys.ArrowDown)
    {
        const localPoint = new b2Vec2(1, 1);  // Local coordinates
        const worldPoint = b2Body_GetWorldPoint(cornerBody, localPoint);
        b2Body_ApplyForce(
            cornerBody,
            new b2Vec2(0, 10),
            worldPoint,
            true
        );
    }
}

function createBody ()
{
    // Shape definition
    const vertices = [
        new b2Vec2(-1, -1),
        new b2Vec2(1, -1),
        new b2Vec2(1, 1),
        new b2Vec2(-1, 1)
    ];

    const bodyDef = b2DefaultBodyDef();
    bodyDef.type = b2BodyType.b2_dynamicBody;

    const hull = b2ComputeHull(vertices, vertices.length);
    const polygonShape = b2MakePolygon(hull, 0);

    // Fixture definition
    const shapeDef = b2DefaultShapeDef();
    shapeDef.density = 1;

    // Create identical bodies in different positions
    for (let i = 0; i < 4; i++)
    {
        bodyDef.position = new b2Vec2(-7.0 + i * 5.0, 1);
        const bodyId = b2CreateBody(worldId, bodyDef);
        bodyIds[ i ] = bodyId;
        b2CreatePolygonShape(bodyId, shapeDef, polygonShape);
    }

    // Create a static floor
    bodyDef.type = b2BodyType.b2_staticBody;
    bodyDef.position = new b2Vec2(0, 0);
    const floorId = b2CreateBody(worldId, bodyDef);
    const segment = new b2Segment();
    segment.point1 = new b2Vec2(-15, 0);
    segment.point2 = new b2Vec2(15, 0);
    b2CreateSegmentShape(floorId, shapeDef, segment);
}

function demo ()
{
    createBody();

    function update (deltaTime)
    {
        WorldStep({ worldId: worldId, deltaTime: deltaTime });

        if (!timeTest)
        {
            if (ctx && canvas)
            {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                b2World_Draw(worldId, m_draw);
            }

            if (ctx)
            {
                ctx.fillStyle = 'white';
                ctx.font = '20px Arial';
                ctx.fillText(`Bodies: Dynamic vs Static vs Kinematic`, 10, 25);
            }
        }

        handleForces(deltaTime);
    }

    RAF(update);
}

setTimeout(demo, 50);

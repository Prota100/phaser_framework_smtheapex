import { CreateBoxPolygon, CreateWorld, WorldStep, CreateDebugDraw, RAF } from '../lib/PhaserBox2D.js';
import { b2Vec2, b2BodyType, b2DefaultWorldDef, b2World_Draw, b2Shape_GetBody, b2Body_GetUserData, b2Body_IsValid, b2World_SetPreSolveCallback, b2Body_ApplyLinearImpulseToCenter, b2Body_GetLinearVelocity, b2Body_GetLocalVector, b2Sub, b2Body_GetLocalPoint } from '../lib/PhaserBox2D.js';

// Get the canvas element
const canvas = document.getElementById('myCanvas');
var ctx;
if (canvas)
{
    ctx = canvas.getContext('2d');
}

// Start the asteroids demo
let m_drawScale = 50;
let m_draw = null;
let timeTest = false;
m_draw = CreateDebugDraw(canvas, ctx, m_drawScale);

const worldDef = b2DefaultWorldDef();
worldDef.gravity = new b2Vec2(0, -10);
// create a world and save the ID which will access it
const world = CreateWorld({ worldDef: worldDef });
const worldId = world.worldId;

let player = null;
let onGround = true;
const jumpVelocity = 200;

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
    if (keys[ 'ArrowUp' ] && onGround)
    {
        onGround = false;
        b2Body_ApplyLinearImpulseToCenter(player.bodyId, new b2Vec2(0, jumpVelocity), true);
    }
}

function createPlatform ()
{
    const platform = CreateBoxPolygon({
        position: new b2Vec2(0, 0),
        type: b2BodyType.b2_kinematicBody,
        size: new b2Vec2(2, 0.2),
        density: 10,
        friction: 0.7,
        worldId: worldId,
        preSolve: true,
        userData: { type: 'platform' }
    });

    const ground = CreateBoxPolygon({
        position: new b2Vec2(0, -5),
        type: b2BodyType.b2_kinematicBody,
        size: new b2Vec2(5, 1),
        density: 10,
        friction: 0.7,
        worldId: worldId,
        preSolve: true,
        userData: { type: 'platform' }
    });
}

function createPlayer ()
{
    let player = CreateBoxPolygon({
        position: new b2Vec2(0, -3),
        type: b2BodyType.b2_dynamicBody,
        size: new b2Vec2(0.5, 1),
        density: 10,
        friction: 0.7,
        worldId: worldId,
        userData: { type: 'player' }
    });
    return player;
}

function beginContact (shapeIdA, shapeIdB, manifold)
{
    const bodyIdA = b2Shape_GetBody(shapeIdA);
    const bodyIdB = b2Shape_GetBody(shapeIdB);

    if (!b2Body_IsValid(bodyIdA) || !b2Body_IsValid(bodyIdB)) return;

    const userDataA = b2Body_GetUserData(bodyIdA);
    const userDataB = b2Body_GetUserData(bodyIdB);

    const platformBody = userDataA.type === 'platform' ? bodyIdA : userDataB.type === 'platform' ? bodyIdB : null;
    const otherBody = userDataA.type === 'player' ? bodyIdA : userDataB.type === 'player' ? bodyIdB : null;

    if (!otherBody) return false;

    const points = manifold.points;
    const totalPoints = points.length;

    for (let i = 0; i < totalPoints; i++)
    {
        const platformVelocity = b2Body_GetLinearVelocity(platformBody);
        const otherVelocity = b2Body_GetLinearVelocity(otherBody);
        const relativeVelocity = b2Body_GetLocalVector(platformBody, b2Sub(otherVelocity, platformVelocity));

    // 1. Basic Implementation ========================================

        // if (otherVelocity.y > 0)
        // {
        //     return false;
        // }

    // 2. General Use Case ========================================

        // if (relativeVelocity.y > 0) {
        //     return false;
        // }

    // 3. Improved Implementation ========================================

        if (relativeVelocity.y < -1)
        { // if moving down faster than 1 m/s, handle as before
            return true; // point is moving into platform, leave contact solid and exit
        }
        else if (relativeVelocity.y < 1)
        { // if moving slower than 1 m/s
            // borderline case, moving only slightly out of platform
            const relativePoint = b2Body_GetLocalPoint(platformBody, points[ i ]);
            const platformFaceY = 0.5; // front of platform, from shape definition :(

            if (relativePoint.y > platformFaceY - 0.05)
            {
                return true; // contact point is less than 5cm inside front face of platform
            }

        } 
        else
        {
            return false;
        }
    }

    onGround = true;
    return true;
}

function init ()
{
    createPlatform();
    player = createPlayer();

    b2World_SetPreSolveCallback(worldId, beginContact, this);
}

function game ()
{
    init();

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
                ctx.fillText(`Up key to jump`, 10, 25);
            }
        }

        handleInput(deltaTime);
    }

    RAF(update);
}

setTimeout(game, 50);

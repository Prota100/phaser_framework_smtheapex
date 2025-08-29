import { b2DefaultBodyDef, CreateWorld, WorldStep, CreateDebugDraw, RAF } from '../lib/PhaserBox2D.js';
import { b2Vec2, b2BodyType, b2DefaultWorldDef, b2World_Draw, b2MakeRot, b2CreateBody, b2DefaultShapeDef, b2MakeBox, b2CreatePolygonShape, b2Body_SetLinearVelocity, b2Body_SetAngularVelocity, b2Body_SetTransform, b2Body_GetLocalPoint } from '../lib/PhaserBox2D.js';

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

function dynamicBody ()
{
    const bodyDef = b2DefaultBodyDef();
    bodyDef.type = b2BodyType.b2_dynamicBody; // this will be a dynamic body
    bodyDef.position = new b2Vec2(0, 2); // set the starting position
    bodyDef.rotation = b2MakeRot(0); // set the starting rotation

    const bodyId = b2CreateBody(worldId, bodyDef);

    const shapeDef = b2DefaultShapeDef();
    shapeDef.density = 1;

    const boxShape = b2MakeBox(1, 1); // Create a 2x2 box
    const boxShapeId = b2CreatePolygonShape(bodyId, shapeDef, boxShape);

    // b2Body_SetTransform(bodyId, new b2Vec2(1, 2), b2MakeRot(1));
    // b2Body_SetTransform(bodyId, new b2Vec2(1, 2), b2MakeRot(45 * DEGTORAD)); // 45 degrees counter-clockwise
    // b2Body_SetLinearVelocity(bodyId, new b2Vec2(-5, 5)); // moving up and left 5 units per second
    // b2Body_SetAngularVelocity(bodyId, -90 * DEGTORAD); // 90 degrees per second clockwise
}

function staticBody ()
{
    const bodyDef = b2DefaultBodyDef();
    bodyDef.type = b2BodyType.b2_staticBody; // this will be a static body
    bodyDef.position = new b2Vec2(0, 0); // slightly lower position

    const bodyId = b2CreateBody(worldId, bodyDef);

    const shapeDef = b2DefaultShapeDef();
    shapeDef.density = 1;

    const boxShape = b2MakeBox(1, 1); // Create a 2x2 box
    const boxShapeId = b2CreatePolygonShape(bodyId, shapeDef, boxShape);

    return bodyId;
}

function kinematicBody ()
{
    const bodyDef = b2DefaultBodyDef();
    bodyDef.type = b2BodyType.b2_kinematicBody; // this will be a static body
    bodyDef.position = new b2Vec2(-5, 1); // slightly lower position

    const bodyId = b2CreateBody(worldId, bodyDef);

    const shapeDef = b2DefaultShapeDef();
    shapeDef.density = 1;

    const boxShape = b2MakeBox(1, 1); // Create a 2x2 box
    const boxShapeId = b2CreatePolygonShape(bodyId, shapeDef, boxShape);

    b2Body_SetLinearVelocity(bodyId, new b2Vec2(1, 0)); // move right 1 unit per second
    b2Body_SetAngularVelocity(bodyId, 360 * DEGTORAD); // 1 turn per second counter-clockwise
}

function demo ()
{
    dynamicBody();
    staticBody();
    kinematicBody();

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
    }

    RAF(update);
}

setTimeout(demo, 50);

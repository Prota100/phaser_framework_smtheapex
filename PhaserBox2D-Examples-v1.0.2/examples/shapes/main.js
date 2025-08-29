import { b2DefaultBodyDef, CreateWorld, WorldStep, CreateDebugDraw, RAF } from '../lib/PhaserBox2D.js';
import { b2Vec2, b2BodyType, b2DefaultWorldDef, b2World_Draw, b2ComputeHull, b2CreateBody, b2DefaultShapeDef, b2MakeBox, b2CreatePolygonShape, b2CreateCircleShape, b2MakePolygon, b2Capsule, b2CreateCapsuleShape, b2CreateSegmentShape, b2Segment, b2DefaultChainDef, b2CreateChain, b2MakeOffsetBox, b2Body_SetAngularVelocity } from '../lib/PhaserBox2D.js';

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

function createCircle ()
{
    const bodyDef = b2DefaultBodyDef();
    bodyDef.type = b2BodyType.b2_dynamicBody; // this will be a dynamic body
    bodyDef.position = new b2Vec2(0, 2); // set the starting position

    const bodyId = b2CreateBody(worldId, bodyDef);

    const circle = {
        center: new b2Vec2(0, 0), // position, relative to body position
        radius: 1 // radius
    };

    const shapeDef = b2DefaultShapeDef();
    const circleShape = b2CreateCircleShape(bodyId, shapeDef, circle);
}

function createPolygon ()
{
    const bodyDef = b2DefaultBodyDef();
    bodyDef.type = b2BodyType.b2_dynamicBody; // this will be a static body
    bodyDef.position = new b2Vec2(0, 0); // slightly lower position

    const bodyId = b2CreateBody(worldId, bodyDef);

    // Set vertices for polygon
    const vertices = [
        new b2Vec2(-1, 2),
        new b2Vec2(-1, 0),
        new b2Vec2(0, -3),
        new b2Vec2(1, 0),
        new b2Vec2(1, 1)
    ];

    // Create a hull
    const hull = b2ComputeHull(vertices, vertices.length);
    const polygon = b2MakePolygon(hull, 0);
    const shapeDef = b2DefaultShapeDef();
    const polygonShape = b2CreatePolygonShape(bodyId, shapeDef, polygon);
}

function createRectangle ()
{
    const bodyDef = b2DefaultBodyDef();
    bodyDef.type = b2BodyType.b2_dynamicBody; // this will be a static body
    bodyDef.position = new b2Vec2(-5, 1); // slightly lower position

    const bodyId = b2CreateBody(worldId, bodyDef);

    const box = b2MakeBox(2, 1); // a 4x2 rectangle
    const shapeDef = b2DefaultShapeDef();
    const boxShape = b2CreatePolygonShape(bodyId, shapeDef, box);
}

function createCapsule ()
{
    const bodyDef = b2DefaultBodyDef();
    bodyDef.type = b2BodyType.b2_dynamicBody; // this will be a static body
    bodyDef.position = new b2Vec2(-5, 5); // slightly lower position

    const bodyId = b2CreateBody(worldId, bodyDef);

    const capsule = new b2Capsule();
    capsule.center1 = new b2Vec2(-1, 0);
    capsule.center2 = new b2Vec2(1, 0);
    capsule.radius = 1.0;

    const shapeDef = b2DefaultShapeDef();
    const capsuleShape = b2CreateCapsuleShape(bodyId, shapeDef, capsule);
}

function createLine ()
{
    const bodyDef = b2DefaultBodyDef();
    bodyDef.type = b2BodyType.b2_staticBody; // this will be a static body
    bodyDef.position = new b2Vec2(5, 5); // slightly lower position

    const bodyId = b2CreateBody(worldId, bodyDef);

    const segment = new b2Segment();
    segment.point1 = new b2Vec2(-1, 0);
    segment.point2 = new b2Vec2(4, 4);

    const shapeDef = b2DefaultShapeDef();
    const segmentShape = b2CreateSegmentShape(bodyId, shapeDef, segment);
}

function createChain ()
{
    const bodyDef = b2DefaultBodyDef();
    bodyDef.type = b2BodyType.b2_dynamicBody; // this will be a static body
    bodyDef.position = new b2Vec2(2, 2); // slightly lower position

    const bodyId = b2CreateBody(worldId, bodyDef);

    const points = [
        new b2Vec2(-1.0, 0.0),
        new b2Vec2(1.0, 0.0),
        new b2Vec2(1.0, 4.0),
        new b2Vec2(8.0, 2.0),
        new b2Vec2(4.0, 4.0)
    ];

    const chainDef = b2DefaultChainDef();
    chainDef.points = points;
    chainDef.count = points.length;
    chainDef.isLoop = false;

    const chainShape = b2CreateChain(bodyId, chainDef);
}

function multipleShapes ()
{
    const bodyDef = b2DefaultBodyDef();
    bodyDef.type = b2BodyType.b2_dynamicBody; // this will be a static body
    bodyDef.position = new b2Vec2(5, 0); // slightly lower position

    const bodyId = b2CreateBody(worldId, bodyDef);

    const shapeDef = b2DefaultShapeDef();
    shapeDef.density = 1;

    // Create polygon shape and attach it to bodyId
    const vertices = [
        new b2Vec2(-1, 2),
        new b2Vec2(-1, 0),
        new b2Vec2(0, -3),
        new b2Vec2(1, 0),
        new b2Vec2(1, 1)
    ];
    
    const transformedVertices = vertices.map(v => new b2Vec2(v.x + 2, v.y - 2));
    const hull = b2ComputeHull(transformedVertices, transformedVertices.length);
    const polygon = b2MakePolygon(hull, 0);
    const polygonShape = b2CreatePolygonShape(bodyId, shapeDef, polygon);

    // Create box shape and attach it to the same body
    const box = b2MakeOffsetBox(2, 1, new b2Vec2(5, 0), 0);
    const boxShape = b2CreatePolygonShape(bodyId, shapeDef, box);

    b2Body_SetAngularVelocity(bodyId, -90 * DEGTORAD);
}

function demo ()
{
    createCircle();
    createPolygon();
    createRectangle();
    createCapsule();
    createLine();
    createChain();
    multipleShapes();

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
                ctx.fillText(`Various body shapes`, 10, 25);
            }
        }
    }

    RAF(update);
}

setTimeout(demo, 50);

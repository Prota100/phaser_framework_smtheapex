import { CreateBoxPolygon, CreateCapsule, CreateCircle, CreateNGonPolygon, CreateRevoluteJoint, CreateWorld, WorldStep } from '../lib/PhaserBox2D.js';
import { b2Vec2, b2MakeRot } from '../lib/PhaserBox2D.js';
import { b2BodyType, b2DefaultBodyDef, b2DefaultWorldDef, b2HexColor } from '../lib/PhaserBox2D.js';
import { b2CreateWorld, b2CreateWorldArray, b2World_Draw } from '../lib/PhaserBox2D.js';
import { b2CreateBody } from '../lib/PhaserBox2D.js';
import { CreateDebugDraw, RAF } from '../lib/PhaserBox2D.js';


// Get the canvas element
const canvas = document.getElementById('myCanvas');
var ctx;
if (canvas) {
    ctx = canvas.getContext('2d');
}

function makeTumbler(x, y, w, h, worldId, groundId) {
    const bodyDef = b2DefaultBodyDef();
    bodyDef.type = b2BodyType.b2_dynamicBody;
    const bodyId = b2CreateBody(worldId, bodyDef);

    const bodyLft = CreateBoxPolygon({
        worldId: worldId,
        bodyId: bodyId,
        position: new b2Vec2(-x, 0),
        type: b2BodyType.b2_dynamicBody,
        size: new b2Vec2(1, h),
        color: b2HexColor.b2_colorWhite
    });
    const bodyRgt = CreateBoxPolygon({
        worldId: worldId,
        bodyId: bodyId,
        position: new b2Vec2(x, 0),
        type: b2BodyType.b2_dynamicBody,
        size: new b2Vec2(1, h),
        color: b2HexColor.b2_colorWhite
    });
    const bodyTop = CreateBoxPolygon({
        worldId: worldId,
        bodyId: bodyId,
        position: new b2Vec2(0, y),
        type: b2BodyType.b2_dynamicBody,
        size: new b2Vec2(w, 1),
        color: b2HexColor.b2_colorWhite
    });
    const bodyBottom = CreateBoxPolygon({
        worldId: worldId,
        bodyId: bodyId,
        position: new b2Vec2(0, -y),
        type: b2BodyType.b2_dynamicBody,
        size: new b2Vec2(w, 1),
        color: b2HexColor.b2_colorWhite
    });

    const tlCircle = CreateCircle({
        worldId: worldId,
        bodyId: bodyId,
        position: new b2Vec2(0, 0),
        offset: new b2Vec2(-w * 0.5, h * 0.5),
        type: b2BodyType.b2_dynamicBody,
        radius: w * 0.15,
        color: b2HexColor.b2_colorWhite
    });
    const trCircle = CreateCircle({
        worldId: worldId,
        bodyId: bodyId,
        position: new b2Vec2(0, 0),
        offset: new b2Vec2(w * 0.5, h * 0.5),
        type: b2BodyType.b2_dynamicBody,
        radius: w * 0.15,
        color: b2HexColor.b2_colorWhite
    });
    const blCircle = CreateCircle({
        worldId: worldId,
        bodyId: bodyId,
        position: new b2Vec2(0, 0),
        offset: new b2Vec2(-w * 0.5, -h * 0.5),
        type: b2BodyType.b2_dynamicBody,
        radius: w * 0.15,
        color: b2HexColor.b2_colorWhite
    });
    const brCircle = CreateCircle({
        worldId: worldId,
        bodyId: bodyId,
        position: new b2Vec2(0, 0),
        offset: new b2Vec2(w * 0.5, -h * 0.5),
        type: b2BodyType.b2_dynamicBody,
        radius: w * 0.15,
        color: b2HexColor.b2_colorWhite
    });

    CreateRevoluteJoint({
        bodyIdA: groundId, bodyIdB: bodyId,
        anchorA: new b2Vec2(0, 0), anchorB: new b2Vec2(0, 0),
        worldId: worldId,
        motorSpeed: 0.15 * Math.PI,
        maxMotorTorque: 1e8,
        enableMotor: true,
    });
    return bodyId;
}

function tumble1250() {
    m_draw = CreateDebugDraw(canvas, ctx, m_drawScale);

    b2CreateWorldArray();
    const worldDef = b2DefaultWorldDef();
    worldDef.gravity = new b2Vec2(0, -10);
    const worldId = b2CreateWorld(worldDef);

    // world
    const bodyDef = b2DefaultBodyDef();
    const groundId = b2CreateBody(worldId, bodyDef);

    // tumbler
    const boxSize = 40;
    const tumblerId = makeTumbler(boxSize, boxSize, boxSize + 1, boxSize + 1, worldId, groundId);

    // falling shapes
    const size = 1.0;
    const gap = size * 0.2;
    const variety = 7;      // 1...7
    let contents = [];
    let c = 0;
    const w = 40, h = 25;
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const r = c % variety;
            var shape = null;
            switch (r) {
                case 0:
                    shape = CreateBoxPolygon({
                        position: new b2Vec2((x - w / 2) * size, (y - h / 2) * size), 
                        type: b2BodyType.b2_dynamicBody, 
                        size: size - gap, 
                        density: 1, 
                        friction: 0.2, 
                        worldId: worldId
                    });
                    break;
                case 1:
                    shape = CreateCircle({
                        position: new b2Vec2((x - w / 2) * size, (y - h / 2) * size), 
                        type: b2BodyType.b2_dynamicBody, 
                        radius: size, 
                        density: 1, 
                        friction: 0.2, 
                        worldId: worldId,
                        color: b2HexColor.b2_colorBlue
                    });
                    break;
                case 2:
                    const triConfig = {
                        worldId: worldId,
                        type: b2BodyType.b2_dynamicBody,
                        position: new b2Vec2((x - w / 2) * size, (y - h / 2) * size),
                        radius: 1.0,
                        sides: 3,
                        density: 1.0,
                        friction: 0.3,
                        color: b2HexColor.b2_colorBox2DGreen
                    };
                    shape = CreateNGonPolygon(triConfig);
                    break;
                case 3:
                    const capConfig = {
                        worldId: worldId,
                        type: b2BodyType.b2_dynamicBody,
                        position: new b2Vec2((x - w / 2) * size, (y - h / 2) * size),
                        center1: new b2Vec2(0, -0.5 * size),
                        center2: new b2Vec2(0, 0.5 * size),
                        radius: size * 0.8,
                        density: 1.0,
                        friction: 0.3,
                        color: b2HexColor.b2_colorPurple
                    };
                    shape = CreateCapsule(capConfig);
                    break;
                case 4:
                    const pentConfig = {
                        worldId: worldId,
                        type: b2BodyType.b2_dynamicBody,
                        position: new b2Vec2((x - w / 2) * size, (y - h / 2) * size),
                        radius: size * .8,
                        sides: 5,
                        density: 1.0,
                        friction: 0.3,
                        color: b2HexColor.b2_colorSkyBlue
                    };
                    shape = CreateNGonPolygon(pentConfig);
                    break;
                case 5:
                    const hexConfig = {
                        worldId: worldId,
                        type: b2BodyType.b2_dynamicBody,
                        position: new b2Vec2((x - w / 2) * size, (y - h / 2) * size),
                        radius: size * .8,
                        sides: 6,
                        density: 1.0,
                        friction: 0.3,
                        color: b2HexColor.b2_colorGreen
                    };
                    shape = CreateNGonPolygon(hexConfig);
                    break;
                case 6:
                    const octConfig = {
                        worldId: worldId,
                        type: b2BodyType.b2_dynamicBody,
                        position: new b2Vec2((x - w / 2) * size, (y - h / 2) * size),
                        radius: size * .8,
                        sides: 8,
                        density: 1.0,
                        friction: 0.3,
                        color: b2HexColor.b2_colorRed
                    };
                    shape = CreateNGonPolygon(octConfig);
                    break;
            }
            if (shape) {
                contents.push(shape.bodyId);
            }
            c++;
        }
    }

    // Animation loop
    let frameCount = 0;
    let lastFpsUpdateTime = 0;
    let currentFps = 0;

    function update(deltaTime, currentTime, currentFps) {
        const stepTime = WorldStep({ worldId: worldId, deltaTime: deltaTime });

        if (!timeTest) {
            if (ctx && canvas) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                b2World_Draw(worldId, m_draw);
            }

            frameCount++;
            if (currentTime - lastFpsUpdateTime >= 1000) {
                currentFps = Math.round((frameCount * 1000) / (currentTime - lastFpsUpdateTime));
                frameCount = 0;
                lastFpsUpdateTime = currentTime;
            }

            if (ctx) {
                ctx.fillStyle = 'white';
                ctx.font = '24px Arial';
                ctx.fillText(`FPS: ${currentFps} SHAPES: ${contents.length}`, 10, 24);
            }
        }
    }

    RAF(update);
}

// Start the tumbler demo
let m_drawScale = 5;
let m_draw = null;
let timeTest = false;

setTimeout(tumble1250, 50);

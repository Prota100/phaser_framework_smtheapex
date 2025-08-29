import { CreateBoxPolygon, CreateCircle, CreateWorld, WorldStep } from '../lib/PhaserBox2D.js';
import { b2Vec2, b2Rot } from '../lib/PhaserBox2D.js';
import { b2DefaultWorldDef, b2BodyType, b2DefaultBodyDef, b2DefaultShapeDef, b2HexColor } from '../lib/PhaserBox2D.js';
import { b2CreateBody } from '../lib/PhaserBox2D.js';
import { b2CreateWorld, b2CreateWorldArray, b2World_Draw } from '../lib/PhaserBox2D.js';
import { CreateDebugDraw, RAF } from '../lib/PhaserBox2D.js';
import { b2MakeBox } from '../lib/PhaserBox2D.js';
import { b2CreatePolygonShape } from '../lib/PhaserBox2D.js';


// Get the canvas element
const canvas = document.getElementById('myCanvas');
var ctx;
if (canvas) {
    ctx = canvas.getContext('2d');
}

let m_draw;
let m_drawScale;

function makeFrame(x, y, w, h, worldId, noSides)
{
    var box, bodyDef, shapeDef;
    let groundY = y;

    const groundBodyDef = b2DefaultBodyDef();
    groundBodyDef.position = new b2Vec2(0, groundY - 2 * 5);
    let groundId = b2CreateBody(worldId, groundBodyDef);
    const groundBox = b2MakeBox(w, 5);
    const groundShapeDef = b2DefaultShapeDef();
    groundShapeDef.customColor = b2HexColor.b2_colorGreen;
    b2CreatePolygonShape(groundId, groundShapeDef, groundBox);

    if (!noSides)
    {
        bodyDef = b2DefaultBodyDef();
        bodyDef.position = new b2Vec2(-x, 0);
        const leftId = b2CreateBody(worldId, bodyDef);
        box = b2MakeBox(5, h);
        shapeDef = b2DefaultShapeDef();
        shapeDef.customColor = b2HexColor.b2_colorWhite;
        b2CreatePolygonShape(leftId, shapeDef, box);
    
        bodyDef = b2DefaultBodyDef();
        bodyDef.position.x = x;
        const rightId = b2CreateBody(worldId, bodyDef);
        box = b2MakeBox(5, h);
        shapeDef = b2DefaultShapeDef();
        shapeDef.customColor = b2HexColor.b2_colorWhite;
        b2CreatePolygonShape(rightId, shapeDef, box);
    }

    bodyDef = b2DefaultBodyDef();
    bodyDef.position.y = -groundY + 2 * 5;
    const topId = b2CreateBody(worldId, bodyDef);
    box = b2MakeBox(w, 5);
    shapeDef = b2DefaultShapeDef();
    shapeDef.customColor = b2HexColor.b2_colorSkyBlue;
    b2CreatePolygonShape(topId, shapeDef, box);

    return groundY;
}

function dropBall(x, worldId, radius = 1.0)
{
    let ball = CreateCircle({ position: new b2Vec2(x, 100.0), type: b2BodyType.b2_dynamicBody, radius: radius, density: 2.0, friction: 0.2, color: b2HexColor.b2_colorRed, worldId: worldId });
    return ball.bodyId;
}


// dark to light vertically
// red to yellow to green horizontally
function getColor(x, y)
{
    const brightness = 0.3 + 0.7 * y;
    let r, g, b;
    if (x < 0.5) {
        r = 255;
        g = (x * 2) * 255;
        b = 0;
    } else {
        r = (1 - (x - 0.5) * 2) * 255;
        g = 255;
        b = 0;
    }

    // Apply brightness
    r *= brightness;
    g *= brightness;
    b *= brightness;
    return (r<<16)+(g<<8)+b;
}

function testStackingBoxes() {
    m_draw = CreateDebugDraw(canvas, ctx, m_drawScale);

    b2CreateWorldArray();
    const worldDef = b2DefaultWorldDef();
    worldDef.gravity = new b2Vec2(0, -10);
    worldDef.contactHertz = 60.0;           // higher frequency contact resolution for tall stack stability
    worldDef.enableSleep = false;           // disable sleep to show stacks maintain stability
    const worldId = b2CreateWorld(worldDef);

    let groundY = makeFrame(214, -107, 219, 112, worldId, true);
    groundY -= 4;

    // Create starter stack of 10 high
    let stack;
    const maxHeight = 36;
    
    for (let x = -150; x <= 150; x += 6) {
        stack = 0;
        const horizontalProgress = (x + 150) / 300;
        for (let i = 0; i < 10; i++) {
            const color = getColor(horizontalProgress, i / maxHeight);
            // Create the box with calculated color
            CreateBoxPolygon({ 
                position: new b2Vec2(x, groundY + stack * 5.01), 
                type: b2BodyType.b2_dynamicBody, 
                size: 2.5, 
                density: 0.25, 
                friction: 0.7, 
                worldId: worldId,
                color: color
            });
            stack++;
        }
    }
    let nextBoxTime = 0;
    let frameCount = 0;

    // milli-second time display value is smoothed
    let timeBuffer = [];
    const times = 10;
    let averageTime = 0;

    // RAF loop
    function update(deltaTime, currentTime, currentFps)
    {
        const stepTime = WorldStep({ worldId: worldId, deltaTime: deltaTime });

        timeBuffer.push(stepTime);
        while (timeBuffer.length > times)
            timeBuffer.shift();
        if (timeBuffer.length == times)
            averageTime = Math.round(timeBuffer.reduce((sum, time) => sum + time, 0) / timeBuffer.length * 1000);

        const interval = 0.5;
        nextBoxTime += deltaTime;
        if (nextBoxTime > interval && stack < 36) {
            nextBoxTime -= interval;

            for (let x = -150; x <= 150; x += 6) {
                const horizontalProgress = (x + 150) / 300;
                const color = getColor(horizontalProgress, stack / maxHeight);
                CreateBoxPolygon({ 
                    position: new b2Vec2(x, groundY + stack * 5.06), 
                    type: b2BodyType.b2_dynamicBody, 
                    size: 2.5, 
                    density: 0.15,
                    friction: 0.7,
                    worldId: worldId,
                    color: color
                });                
            }
            stack++;
        }

        if (stack >= 36 && currentFps > 30)
        {
            if (frameCount % 240 == 0)
                dropBall(0, worldId, 5.0);
        }
    
        if (ctx && canvas) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            b2World_Draw(worldId, m_draw);
        }

        if (ctx) {
            ctx.fillStyle = 'white';
            ctx.font = '24px Arial';
            ctx.fillText(`ms: ${ averageTime } FPS: ${ currentFps } HIGH: ${ stack }`, 10, 24);
        } else {
            if (frameCount%20 == 0)
                console.log(`ms: ${ averageTime } FPS: ${ currentFps } HIGH: ${ stack }`);
        }

        frameCount++;
    }

    // Start the animation loop
    RAF(update);
}

m_drawScale = 3.0;
setTimeout(testStackingBoxes, 50);

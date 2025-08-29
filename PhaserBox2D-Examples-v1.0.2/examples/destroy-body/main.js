import { CreateCircle, CreateWorld, WorldStep } from '../lib/PhaserBox2D.js';
import { b2Vec2 } from '../lib/PhaserBox2D.js';
import { b2BodyType, b2DefaultWorldDef, b2HexColor } from '../lib/PhaserBox2D.js';
import { b2World_Draw, b2Body_GetPosition, b2DestroyBody, b2Body_IsValid, ConvertScreenToWorld } from '../lib/PhaserBox2D.js';
import { CreateDebugDraw, RAF } from '../lib/PhaserBox2D.js';

// Get the canvas element
const canvas = document.getElementById('myCanvas');
const canvasSize = { width: 800, height: 600 };
var ctx;
if (canvas)
{
    ctx = canvas.getContext('2d');
}

// Start the asteroids demo
let m_drawScale = 5;
let m_draw = null;
let timeTest = false;
m_draw = CreateDebugDraw(canvas, ctx, m_drawScale);

let worldDef = b2DefaultWorldDef();

// change some of the default values
worldDef.gravity = new b2Vec2(0, 0);
// create a world and save the ID which will access it
let world = CreateWorld({ worldDef:worldDef });

document.addEventListener('mousemove', mouseMove);
document.addEventListener('mousedown', mouseDown);

const circles = [];

function addCircle ()
{
    const circle = CreateCircle({ worldId: world.worldId, type: b2BodyType.b2_dynamicBody, position: new b2Vec2(0, 0), radius: 1, density: 1.0, friction: 0.001, color: b2HexColor.b2_colorRed });
    circles.push(circle);
}

function checkCollisions ()
{
    
}

function mouseDown(event)
{
    const canvasWidth = canvas.style.width.substring(0, canvas.style.width.length - 2);
    const canvasHeight = canvas.style.height.substring(0, canvas.style.width.length - 2);
    canvasSize.width = canvasWidth;
    canvasSize.height = canvasHeight;
    const screenPoint = { x: event.clientX, y: event.clientY };
    const worldPoint = ConvertScreenToWorld(canvas, m_drawScale, screenPoint);
    console.log(worldPoint);
}

function mouseMove(event)
{
    const x = event.clientX;
    const y = event.clientY;
}

function destroyCircle (bodyId)
{
    if (!b2Body_IsValid(bodyId)) return;

    const asteroidBody = function (asteroid)
    {
        const found = asteroid.bodyId.index1 === bodyId.index1 && asteroid.bodyId.world0 === bodyId.world0 && asteroid.bodyId.revision === bodyId.revision;
        return found;
    };
    const index = asteroids.findIndex(asteroidBody);

    if (index != -1)
    {
        const asteroid = asteroids[ index ];
        const level = asteroid.level;
        const points = asteroid.points;
        const position = b2Body_GetPosition(bodyId).clone();

        currentScore += points;
        asteroids.splice(index, 1);
        b2DestroyBody(bodyId);

        for (let i = 0; i < ASTEROID_LEVEL_MAX - level + 1; i++)
        {
            createAsteroid(position.clone(), level + 1);
        }

        if (asteroids.length === 0)
        {
            endLevel();
        }
    }
}

// ** The RAF Update Function **    
function update(deltaTime, currentTime, currentFps)
{
    // ** Step the Physics **
	WorldStep({ worldId: world.worldId, deltaTime: deltaTime });

	// ** Debug Drawing **
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	b2World_Draw(world.worldId, m_draw);
}

RAF(update);

setInterval(addCircle, 1000);
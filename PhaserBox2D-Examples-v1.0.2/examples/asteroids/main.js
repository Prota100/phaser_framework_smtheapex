import { CreateCircle, CreateNGonPolygon, CreateWorld, WorldStep } from '../lib/PhaserBox2D.js';
import { b2Vec2, b2MakeRot } from '../lib/PhaserBox2D.js';
import { b2BodyType, b2DefaultBodyDef, b2DefaultWorldDef, b2HexColor } from '../lib/PhaserBox2D.js';
import { b2World_Draw, b2Body_ApplyAngularImpulse, b2Body_ApplyForceToCenter, b2Body_GetRotation, b2Body_GetPosition, b2DefaultShapeDef, b2DestroyBody, b2Body_SetTransform, b2Body_SetBullet, b2Body_EnableHitEvents, b2World_GetContactEvents, b2Shape_GetBody, b2Body_GetUserData, b2Body_SetUserData, b2Body_IsValid } from '../lib/PhaserBox2D.js';
import { b2CreateBody, b2ComputeHull, b2MakePolygon, b2CreatePolygonShape } from '../lib/PhaserBox2D.js';
import { CreateDebugDraw, RAF } from '../lib/PhaserBox2D.js';


// Get the canvas element
const canvas = document.getElementById('myCanvas');
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

let contents = [];

// Asteroid
const ASTEROID_CATEGORY = 0x0004;
const ASTEROID_SIZE = 1.5;
const ASTEROID_LEVEL_MAX = 3;
const ASTEROID_VELOCITY_MAX = 4000;
const ASTEROID_VELOCITY_MIN = 2000;
const ASTEROID_SCORES = [ 50, 20, 10 ];

const SHIP_CATEGORY = 0x0001;
const SHIP_ANGULAR_IMPULSE = 1;
const SHIP_VELOCITY = SHIP_ANGULAR_IMPULSE * 500;

const BULLET_CATEGORY = 0x0002;
const BULLET_VELOCITY = 1;
const BULLET_INVERVAL = 0.2;
const BULLET_LIFE = 2;

const LEVEL_RESTART_INTERVAL = 2000;
const LIVES_MAX = 3;

let ship = null;
const bullets = [];
const asteroids = [];

let bulletTime = 0;
let currentTime = 0;
let currentScore = 0;
let currentLevel = 1;
let currentLives = LIVES_MAX;

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
    if (bulletTime > 0) bulletTime -= dt;
    else bulletTime = 0;

    if (!b2Body_IsValid(ship.bodyId))
    {
        if (keys[ 'Space' ]  && currentLives <= 0)
        {
            restartGame();
        }
        return;
    }

    if (keys[ 'ArrowUp' ])
    {
        const rotation = b2Body_GetRotation(ship.bodyId);
        b2Body_ApplyForceToCenter(ship.bodyId, new b2Vec2(rotation.c * SHIP_VELOCITY, rotation.s * SHIP_VELOCITY), true);
    }

    if (keys[ 'ArrowDown' ])
    {

    }

    if (keys[ 'ArrowLeft' ])
    {
        b2Body_ApplyAngularImpulse(ship.bodyId, SHIP_ANGULAR_IMPULSE, true);
    }

    if (keys[ 'ArrowRight' ])
    {
        b2Body_ApplyAngularImpulse(ship.bodyId, -SHIP_ANGULAR_IMPULSE, true);
    }

    if (keys[ 'Space' ])
    {
        if (bulletTime <= 0)
        {
            bulletTime += BULLET_INVERVAL;

            const rotation = b2Body_GetRotation(ship.bodyId);
            const position = b2Body_GetPosition(ship.bodyId);
            fireBullet(position, rotation);
        }
    }
}

function updateBullets (dt)
{
    currentTime += dt;

    for (let i = 0; i < bullets.length; i++)
    {
        const bullet = bullets[ i ];
        const bodyId = bullet.bodyId;
        const time = bullet.time;

        if (currentTime - time >= BULLET_LIFE)
        {
            destroyBullet(bodyId);
        }
    }
}

function fireBullet (position, rotation, size)
{
    const bulletShapeDef = b2DefaultShapeDef();
    bulletShapeDef.density = 1;
    bulletShapeDef.friction = 0;
    bulletShapeDef.filter.categoryBits = BULLET_CATEGORY;
    bulletShapeDef.filter.maskBits = ASTEROID_CATEGORY;
    bulletShapeDef.customColor = b2HexColor.b2_colorBox2DYellow;

    const bullet = CreateCircle({
        worldId: world.worldId,
        // position: new b2Vec2(10,10),
        position: position.clone(),
        type: b2BodyType.b2_dynamicBody,
        radius: 0.2,
        shapeDef: bulletShapeDef
    });

    b2Body_SetUserData(bullet.bodyId, { type: 'bullet' });
    b2Body_SetBullet(bullet.bodyId, true);

    b2Body_ApplyForceToCenter(bullet.bodyId, new b2Vec2(rotation.c * SHIP_VELOCITY * BULLET_VELOCITY, rotation.s * SHIP_VELOCITY * BULLET_VELOCITY), true);

    bullets.push({ bodyId: bullet.bodyId, time: currentTime });
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
    shipShapeDef.filter.categoryBits = SHIP_CATEGORY;
    shipShapeDef.filter.maskBits = ASTEROID_CATEGORY;
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

function randomDistanceFromShip ()
{
    if (ship === null) return;
    
    const randomAngle = Math.random() * 2 * Math.PI;
    const randomDistance = (Math.random() * 50) + 20;
    const randomPosition = b2Body_GetPosition(ship.bodyId).clone();
    randomPosition.x += randomDistance * (Math.random() > 0.5 ? 1 : -1);
    randomPosition.y += randomDistance * (Math.random() > 0.5 ? 1 : -1);

    return randomPosition;
}

function createAsteroid (position, level)
{
    if (level > ASTEROID_LEVEL_MAX) return;


    level = level || 1;
    position = position || randomDistanceFromShip();

    const vertices = [];
    const n = Math.floor(Math.random() * 3) + 5;
    const radius = (ASTEROID_LEVEL_MAX - level + 1) * ASTEROID_SIZE;
    const offset = 0.7;
    for (let i = 0; i < n; i++)
    {
        const a = i * 2 * Math.PI / n;
        const x = radius * (Math.sin(a) + ((Math.random() - 0.5) * offset));
        const y = radius * (Math.cos(a) + ((Math.random() - 0.5) * offset));
        vertices.push(new b2Vec2(x, y));
    }

    const asteroidShapeDef = b2DefaultShapeDef();
    asteroidShapeDef.density = 1;
    asteroidShapeDef.friction = 0.3;
    asteroidShapeDef.filter.categoryBits = ASTEROID_CATEGORY;
    asteroidShapeDef.filter.maskBits = SHIP_CATEGORY | BULLET_CATEGORY;
    asteroidShapeDef.customColor = b2HexColor.b2_colorBox2DRed;

    const asteroidBodyDef = b2DefaultBodyDef();
    asteroidBodyDef.type = b2BodyType.b2_dynamicBody;
    asteroidBodyDef.position = position;

    const bodyId = b2CreateBody(world.worldId, asteroidBodyDef);
    const hullAsteroid = b2ComputeHull(vertices, n);
    const polygon = b2MakePolygon(hullAsteroid, 0);

    const asteroid = b2CreatePolygonShape(bodyId, asteroidShapeDef, polygon);
    const rotation = b2MakeRot(Math.random() * 2 * Math.PI);
    const velocity = Math.random() * (ASTEROID_VELOCITY_MAX - ASTEROID_VELOCITY_MIN) + ASTEROID_VELOCITY_MIN;

    b2Body_EnableHitEvents(bodyId, true);
    b2Body_ApplyForceToCenter(bodyId, new b2Vec2(rotation.c * velocity * level, rotation.s * velocity * level), true);
    b2Body_SetUserData(bodyId, { type: 'asteroid' });
    b2Body_SetTransform(bodyId, position, rotation);

    asteroids.push({ bodyId: bodyId, level: level, points: ASTEROID_SCORES[ ASTEROID_LEVEL_MAX - level ] });

    return asteroid;
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

function checkCollisions ()
{
    const contactEvents = b2World_GetContactEvents(world.worldId);

    if (contactEvents.beginCount > 0)
    {
        const events = contactEvents.hitEvents;

        for (let i = 0; i < contactEvents.beginCount; i++)
        {
            const event = events[ i ];
            if (!event) continue;
            
            const shapeIdA = event.shapeIdA;
            const shapeIdB = event.shapeIdB;
            const bodyIdA = b2Shape_GetBody(shapeIdA);
            const bodyIdB = b2Shape_GetBody(shapeIdB);

            if (!b2Body_IsValid(bodyIdA) || !b2Body_IsValid(bodyIdB)) return;

            const userDataA = b2Body_GetUserData(bodyIdA);
            const userDataB = b2Body_GetUserData(bodyIdB);

            if (userDataA && userDataB)
            {
                if (userDataA.type === 'asteroid')
                {
                    destroyAsteroid(bodyIdA);
                }
                else if (userDataA.type === 'bullet')
                {
                    destroyBullet(bodyIdA);
                }
                else
                {
                    destroyShip();
                }

                if (userDataB.type === 'asteroid')
                {
                    destroyAsteroid(bodyIdB);
                }
                else if (userDataB.type === 'bullet')
                {
                    destroyBullet(bodyIdB);
                }
                else
                {
                    destroyShip();
                }
            }


        }
    }
}

function destroyBullet (bodyId)
{
    const isValid = b2Body_IsValid(bodyId);
    if (!isValid) return;

    const bulletBody = function (bullet)
    {
        const found = bullet.bodyId.index1 === bodyId.index1 && bullet.bodyId.world0 === bodyId.world0 && bullet.bodyId.revision === bodyId.revision;
        return found;
    };
    const index = bullets.findIndex(bulletBody);

    if (index != -1)
    {
        bullets.splice(index, 1);
        b2DestroyBody(bodyId);
    }
}

function destroyAsteroid (bodyId)
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

function destroyShip ()
{
    if (!b2Body_IsValid(ship.bodyId)) return;

    currentLives--;
    b2DestroyBody(ship.bodyId);

    if (currentLives <= 0)
    {
        // ship = null;
    } else
    {
        setTimeout(createShip, LEVEL_RESTART_INTERVAL);
    }
}

function updatePositions (dt)
{
    wrap(ship.bodyId);
    for (let i = 0; i < bullets.length; i++)
    {
        const bullet = bullets[ i ];
        wrap(bullet.bodyId);
    }

    for (let i = 0; i < asteroids.length; i++)
    {
        const asteroid = asteroids[ i ];
        wrap(asteroid.bodyId);
    }
}

function startLevel ()
{
    for (let i = 0; i < currentLevel; i++)
    {
        createAsteroid();
    }
}

function endLevel ()
{
    currentLevel++;
    setTimeout(startLevel, LEVEL_RESTART_INTERVAL);
}

function restartGame ()
{
    currentScore = 0;
    currentLevel = 1;
    currentLives = LIVES_MAX;
    asteroids.forEach(asteroid => b2DestroyBody(asteroid.bodyId));
    asteroids.length = 0;
    createShip();
    startLevel();
}

function game ()
{
    // Animation loop
    let frameCount = 0;
    let lastFpsUpdateTime = 0;
    let currentFps = 0;

    createShip();
    startLevel();

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
                
                if (currentLives > 0)
                {    
                    ctx.font = '20px Arial';
                    ctx.fillText(`LIVES: ${currentLives}`, 10, 25);
                    ctx.fillText(`LEVEL: ${currentLevel}`, 10, 50);
                    ctx.fillText(`SCORE: ${currentScore}`, 10, 75);
                }
                else
                {
                    ctx.font = '48px Arial';
                    ctx.fillText(`GAME OVER!`, 480, 400);
                    ctx.font = '20px Arial';
                    ctx.fillText(`PRESS SPACE TO RESTART`, 500, 440);
                }
            }
        }

        handleInput(deltaTime);
        updateBullets(deltaTime);
        updatePositions(deltaTime);
        checkCollisions();
    }

    RAF(update);
}

setTimeout(game, 50);

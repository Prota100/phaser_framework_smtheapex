import { CreateBoxPolygon, CreateCircle, CreateWorld, WorldStep } from '../lib/PhaserBox2D.js';
import { b2Vec2 } from '../lib/PhaserBox2D.js';
import { b2BodyType, b2DefaultWorldDef, b2HexColor } from '../lib/PhaserBox2D.js';
import { ConvertScreenToWorld, ConvertWorldToScreen, b2Body_SetTransform } from '../lib/PhaserBox2D.js';
import
{
    b2World_Draw, b2Body_ApplyForceToCenter, b2DefaultShapeDef, b2DestroyBody, b2Body_SetBullet, b2World_GetContactEvents,
    b2Shape_GetBody, b2Body_GetUserData, b2Body_SetUserData, b2Body_IsValid, b2MakeRot, b2Body_EnableHitEvents, b2World_SetPreSolveCallback, AttachImage
} from '../lib/PhaserBox2D.js';
import { CreateDebugDraw, RAF } from '../lib/PhaserBox2D.js';


// Get the canvas element
const game = this;
const canvas = document.getElementById('myCanvas');
const canvasSize = { width: 800, height: 600 };
var ctx;
if (canvas)
{
    ctx = canvas.getContext('2d');
}

const gameConfig = {
    world: {
        scale: 5,
        devicePixelRatio: window.devicePixelRatio,
        gravity: new b2Vec2(0, -20),
    },
    gameArea: {
        width: 40,
        height: 40,
        dropY: 20,
        offsetScale: 1.5,
        fromBottom: 55,
        thickness: 1,
    },
    ballConfig: [
        { size: 1, color: 0x0078ff, particleSize: 1, score: 2, sprite: 'chick' },
        { size: 2, color: 0xbd00ff, particleSize: 2, score: 4, sprite: 'duck' },
        { size: 3, color: 0xff9a00, particleSize: 3, score: 6, sprite: 'parrot' },
        { size: 4, color: 0x01ff1f, particleSize: 4, score: 8, sprite: 'owl' },
        { size: 5, color: 0xe3ff00, particleSize: 5, score: 10, sprite: 'penguin' },
        { size: 6, color: 0xff0000, particleSize: 6, score: 12, sprite: 'snake' },
        { size: 7, color: 0xffffff, particleSize: 7, score: 14, sprite: 'sloth' },
        { size: 8, color: 0x00ecff, particleSize: 8, score: 16, sprite: 'pig' },
        { size: 9, color: 0xff00e7, particleSize: 9, score: 18, sprite: 'crocodile' },
        { size: 10, color: 0x888888, particleSize: 10, score: 20, sprite: 'gorilla' },
        { size: 11, color: 0x88ff88, particleSize: 11, score: 22, sprite: 'bombstar' }
    ],
    ballFriction: 0.3,
    startingBallSize: 3,
    maxBallSize: 11,
    delayBeforeNextBall: 1000,
    assetsFolder: '../resources/images',
}

const gameProperties = {
    score: 0,
    balls: [],
    currentBallSize: 1,
    currentMaxSize: 3,
    currentBall: null,
    dropPosition: new b2Vec2(0, 20),
    ballContacts: [],
}

const m_draw = CreateDebugDraw(canvas, ctx, gameConfig.world.scale);
let worldDef = b2DefaultWorldDef();
worldDef.gravity = new b2Vec2(0, -10);

const world = CreateWorld({ worldDef: worldDef });
// input controls
function initInput ()
{
    document.addEventListener('mousemove', mouseMove);
    document.addEventListener('mouseup', mouseUp);
}

function mouseMove (event)
{
    const canvasWidth = canvas.style.width.substring(0, canvas.style.width.length - 2);
    const canvasHeight = canvas.style.height.substring(0, canvas.style.width.length - 2);
    canvasSize.width = canvasWidth;
    canvasSize.height = canvasHeight;
    const screenPoint = { x: event.clientX, y: event.clientY };
    const worldPoint = ConvertScreenToWorld(canvas, gameConfig.world.scale, screenPoint);

    const ballConfig = gameConfig.ballConfig[ gameProperties.currentBallSize - 1 ];
    worldPoint.x = Math.min(worldPoint.x, (gameConfig.gameArea.width * 0.5) - (ballConfig.size * gameConfig.world.devicePixelRatio));
    worldPoint.x = Math.max(worldPoint.x, (-gameConfig.gameArea.width * 0.5) + (ballConfig.size * gameConfig.world.devicePixelRatio));

    gameProperties.dropPosition.x = worldPoint.x;
    gameProperties.dropPosition.y = gameConfig.gameArea.dropY;

    const rotation = b2MakeRot(Math.random() * 2 * Math.PI);

    if (gameProperties.currentBall)
    {
        b2Body_SetTransform(gameProperties.currentBall.bodyId, gameProperties.dropPosition.clone(), rotation);
    }
}

function mouseUp (event)
{
    if (!gameProperties.currentBall) return;

    b2DestroyBody(gameProperties.currentBall.bodyId);
    dropBall(gameProperties.dropPosition.clone());

    gameProperties.currentBall = null;

    setTimeout(createBall, gameConfig.delayBeforeNextBall);
}

// create game objects
function createWalls ()
{
    const leftWall = CreateBoxPolygon({ worldId: world.worldId, type: b2BodyType.b2_staticBody, position: new b2Vec2(-gameConfig.gameArea.width * 0.5, -gameConfig.gameArea.fromBottom * 0.5), size: new b2Vec2(gameConfig.gameArea.thickness, gameConfig.gameArea.height), density: 1.0, friction: 0.5, color: b2HexColor.b2_colorLawnGreen });

    const rightWall = CreateBoxPolygon({ worldId: world.worldId, type: b2BodyType.b2_staticBody, position: new b2Vec2(gameConfig.gameArea.width * 0.5, -gameConfig.gameArea.fromBottom * 0.5), size: new b2Vec2(gameConfig.gameArea.thickness, gameConfig.gameArea.height), density: 1.0, friction: 0.5, color: b2HexColor.b2_colorLawnGreen });

    const bottomWall = CreateBoxPolygon({ worldId: world.worldId, type: b2BodyType.b2_staticBody, position: new b2Vec2(0, -gameConfig.gameArea.fromBottom), size: new b2Vec2(gameConfig.gameArea.width * 0.5, gameConfig.gameArea.thickness), density: 1.0, friction: 0.5, color: b2HexColor.b2_colorLawnGreen });
}

function createBall ()
{
    gameProperties.currentBallSize = Math.floor(Math.random() * gameProperties.currentMaxSize) + 1;

    const ballConfig = gameConfig.ballConfig[ gameProperties.currentBallSize - 1 ];
    gameProperties.currentBall = CreateCircle({ worldId: world.worldId, type: b2BodyType.b2_dynamicBody, position: gameProperties.dropPosition.clone(), radius: ballConfig.size, density: 0, friction: 0.001, color: ballConfig.color });
    
    // const drawOffset = null;
    // const drawScale = new b2Vec2(1, 1);
    // const sourcePosition = new b2Vec2(0, 0)
    // const sourceSize = new b2Vec2(128, 128);
    // const image = AttachImage(world.worldId, gameProperties.currentBall.bodyId, gameConfig.assetsFolder, `${ballConfig.sprite}.png`, drawOffset, drawScale, sourcePosition, sourceSize);
}

function dropBall (position, size)
{
    const ballConfig = gameConfig.ballConfig[ (size || gameProperties.currentBallSize) - 1 ];
    const userData = {
        size: ballConfig.size,
        score: ballConfig.score,
        type: 'ball'
    }
    const ball = CreateCircle(
        {
            worldId: world.worldId,
            type: b2BodyType.b2_dynamicBody,
            position: position,
            radius: ballConfig.size,
            density: 1,
            enablePreSolveEvents: true,
            friction: gameConfig.ballFriction,
            restitution: 0.1,
            color: ballConfig.color,
            preSolve: true
        }
    );
    // const drawOffset = null;
    // const drawScale = new b2Vec2(1, 1);
    // const sourcePosition = new b2Vec2(0, 0)
    // const sourceSize = new b2Vec2(128, 128);
    // const image = AttachImage(world.worldId, ball.bodyId, gameConfig.assetsFolder, `${ballConfig.sprite}.png`, drawOffset, drawScale, sourcePosition, sourceSize);
    gameProperties.balls.push(ball);
    b2Body_SetUserData(ball.bodyId, userData);
}

function preSolve (shapeIdA, shapeIdB, manifold, context)
{
    const bodyIdA = b2Shape_GetBody(shapeIdA);
    const bodyIdB = b2Shape_GetBody(shapeIdB);

    if (!b2Body_IsValid(bodyIdA) || !b2Body_IsValid(bodyIdB)) return;

    const userDataA = b2Body_GetUserData(bodyIdA);
    const userDataB = b2Body_GetUserData(bodyIdB);

    if (userDataA && userDataB)
    {
        if (userDataA.type === 'ball' && userDataB.type === 'ball')
        {
            if (userDataA.size === userDataB.size)
            {
                gameProperties.score += userDataA.score;
                const collisionPoint = new b2Vec2(manifold.points[0].pointX, manifold.points[0].pointY);
                gameProperties.ballContacts.push(
                    {
                        point: collisionPoint,
                        bodyIdA: bodyIdA,
                        bodyIdB: bodyIdB,
                        size: userDataA.size
                    }
                );
            }
        }
    }
    return true;
}

function checkCollisions ()
{
    if (gameProperties.ballContacts.length > 0)
    {
        gameProperties.ballContacts.forEach((contact) => {
            const userDataA = b2Body_GetUserData(contact.bodyIdA);
            const userDataB = b2Body_GetUserData(contact.bodyIdB);

            if (userDataA && userDataB)
            {
                if (userDataA.type === 'ball' && userDataB.type === 'ball')
                {
                    if (userDataA.size === userDataB.size)
                    {
                        gameProperties.score += userDataA.score;
                        destroyBalls(contact.point, contact.bodyIdA, contact.bodyIdB, contact.size);
                    }
                }
            }
        });
    }

    gameProperties.ballContacts = [];
}

function destroyBalls (collisionPoint, ballIdA, ballIdB, size)
{
    if (size <= gameConfig.maxBallSize) 
    {
        dropBall(collisionPoint, size + 1);
    }

    b2DestroyBody(ballIdA);
    b2DestroyBody(ballIdB);
}

function startLevel ()
{
    initInput();
    createWalls();
    createBall();
    b2World_SetPreSolveCallback(world.worldId, preSolve, this);
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

function updateUi ()
{
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`SCORE: ${gameProperties.score}`, 10, 25);
}

function create ()
{
    // Animation loop
    let frameCount = 0;
    let lastFpsUpdateTime = 0;
    let currentFps = 0;

    startLevel();

    function update (deltaTime, currentTime, currentFps)
    {
        // ** Step the Physics **
        WorldStep({ worldId: world.worldId, deltaTime: deltaTime });

        // ** Debug Drawing **
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        b2World_Draw(world.worldId, m_draw);

        checkCollisions();
        updateUi();
    }

    RAF(update);
}

setTimeout(create, 50);

// Import Library Functions

import { AttachImage, B2_ID_EQUALS, b2Body_ApplyForceToCenter, b2Body_ApplyLinearImpulseToCenter, b2Body_GetContactCapacity,
    b2Body_GetContactData, b2Body_GetLinearVelocity, b2Body_GetPosition, b2Body_IsValid, b2Body_SetAwake, b2Body_SetBullet, b2Body_SetTransform,
    b2ContactData, b2CreateBody, b2DestroyBody, b2Body_GetTransform, b2MulSV, b2Normalize, b2Shape_GetBody, b2Sub, ConvertScreenToWorld,
    ConvertWorldToScreen, CreateBoxPolygon, CreateCapsule, CreateCircle, CreateWorld, WorldStep } from '../lib/PhaserBox2D.js';
import { CreateDebugDraw, RAF } from '../lib/PhaserBox2D.js';
import { b2BodyType, b2DefaultBodyDef, b2DefaultWorldDef, b2HexColor } from '../lib/PhaserBox2D.js';
import { b2Vec2 } from '../lib/PhaserBox2D.js';

import { b2World_Draw } from '../lib/PhaserBox2D.js';



// ** Physics World Creation **

// create a definition for a world using the default values
let worldDef = b2DefaultWorldDef();

// change some of the default values
worldDef.gravity = new b2Vec2(0, -10);

// create a world and save the ID which will access it
let world = CreateWorld({ worldDef:worldDef });


// ** Constants **

// collision categories
const staticCategory = 0x0001;      // the default category is 0x00000001, and mask is 0xffffffff
const mouseCategory = 0x0002;
const playerCategory = 0x0004;
const bulletCategory = 0x0008;
const objectsCategory = 0x0010;


const shotTiming = 0.1;
const bulletForce = 10.0;
const bulletLife = 10.0;
const bulletCircleConfig = {
    worldId: world.worldId,
    type: b2BodyType.b2_dynamicBody,
    position: new b2Vec2(0, 0),
    radius: 0.1,
    density: 10.0,
    friction: 0.0,
    categoryBits: bulletCategory,
    maskBits: staticCategory|objectsCategory|bulletCategory,
    color: b2HexColor.b2_colorRed
};

const jumpForce = 20.0;
const runForce = 30.0;
const jumpHigherForce = 3.0;
const airControlForce = 5.0;
const maxRunSpeed = 10.0;
const maxJumpSpeed = 6.0;

const initLives = 3;
const playerRadius = 0.75;
const playerHeight = 1.95;  // a little bit shorter than the map tile size
const playerCapsuleConfig = {
    worldId: world.worldId,
    type: b2BodyType.b2_dynamicBody,
    position: new b2Vec2(0, 0),
    center1: new b2Vec2(0, -0.5 * playerHeight + playerRadius),
    center2: new b2Vec2(0, 0.5 * playerHeight - playerRadius),
    radius: playerRadius,
    density: 1.0,
    friction: 0.8,
    categoryBits: playerCategory,
    maskBits: staticCategory|objectsCategory,
    color: b2HexColor.b2_colorGold,
    fixedRotation: true,
    linearDamping: 0.1,
};

const worldMap = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,3,2,3,2,3,2,3,2,3,2,3,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,0,0,0,0,0,0,1,1,1,0,0,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,1],
    [1,1,0,1,0,1,0,1,0,1,1,1,0,1,0,0,0,0,0,1],
    [1,3,0,2,0,3,0,2,0,3,3,3,0,2,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1],
    [1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// ** Game Values **

var currentLives;
var player;
var playerShape;
var playerFacingDir;
var canJump;
var shootDelay;
var bullets;
var mouseReticle;
var reticlePosition;



// ** Debug Drawing **
var m_draw;

// set the scale at which you want the world to be drawn
const m_drawScale = 30.0;

// get the canvas element from the web page
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

// ** Physics Object Creation **

// a static ground
const groundBodyDef = b2DefaultBodyDef();
const groundId = b2CreateBody(world.worldId, groundBodyDef);

function CreateWorldMap(map)
{
    let size = 2;
    let mapHigh = map.length;
    let mapWide = map[0].length;
    let mapCenter = new b2Vec2(mapWide * size / 2, mapHigh * size / 2);

    for(let y = 0; y < mapHigh; y++) {
        for(let x = 0; x < mapWide; x++) {
            let tile = map[y][x];
            switch(tile) {
                case 1:
                    // a static map tile
                    let mapTile = CreateBoxPolygon({ worldId:world.worldId, type:b2BodyType.b2_staticBody, position:new b2Vec2(x * size - mapCenter.x, (mapHigh - y - 1) * size - mapCenter.y), size:size/2, friction:0.3, categoryBits: staticCategory, maskBits: objectsCategory|bulletCategory|playerCategory, color:b2HexColor.b2_colorLawnGreen });
                    AttachImage(world.worldId, mapTile.bodyId, "../resources/sunnyland-ansimuz/environment", "tileset.png", new b2Vec2(0, 0.04), null, new b2Vec2(48, 160), new b2Vec2(32, 32));
                    break;
                case 2:
                    // a box that will fall
                    CreateBoxPolygon({ worldId:world.worldId, type:b2BodyType.b2_dynamicBody, position:new b2Vec2(x * size - mapCenter.x, (mapHigh - y - 1) * size - mapCenter.y), size:0.975, density:1.0, friction:0.5, categoryBits: objectsCategory, maskBits: staticCategory|objectsCategory|bulletCategory|playerCategory, color:b2HexColor.b2_colorBlue });
                    break;
                case 3:
                    // a ball that will fall
                    CreateCircle({ worldId:world.worldId, type:b2BodyType.b2_dynamicBody, position:new b2Vec2(x * size - mapCenter.x, (mapHigh - y - 1) * size - mapCenter.y), radius:0.975, density:1.0, friction:0.5, categoryBits: objectsCategory, maskBits: staticCategory|objectsCategory|bulletCategory|playerCategory, color:b2HexColor.b2_colorRed });
                    break;
            }
        }
    }
}


// ** User Input **
const keys = {};
document.addEventListener('keydown', (event) =>
{
    keys[ event.code ] = true;
});

document.addEventListener('keyup', (event) =>
{
    keys[ event.code ] = false;
});

let mouseClick = false;
document.addEventListener('mousedown', (event) =>
{
    mouseClick = true;
});

document.addEventListener('mouseup', (event) =>
{
    mouseClick = false;
});

document.addEventListener('mouseout', (event) =>
{
    mouseClick = false;
});

function UserInput(currentTime)
{
    if (!b2Body_IsValid(player.bodyId))
    {
        // The player died...
        if (keys[ 'Space' ] && currentLives <= 0)
        {
            RestartGame();
        }
        return;
    }

    const velocity = b2Body_GetLinearVelocity(player.bodyId);

    // user controls change when they're in mid-air
    // NOTE: facing direction is set as soon as there's an input, even if momentum is still taking the player in the opposite direction
    // (it makes controls 'snappier', which is why I don't use velocity.x for this)
    if (canJump)
    {
        if (keys[ 'ArrowUp' ] || keys[ 'KeyW' ])
        {
            if (velocity.y < 0.05)
            {
                // Jump
                b2Body_ApplyLinearImpulseToCenter(player.bodyId, new b2Vec2(0, jumpForce), true);
            }
        }
        if (keys[ 'ArrowLeft' ] || keys[ 'KeyA' ])
        {
            if (velocity.x > -maxRunSpeed)
            {
                // Run left
                b2Body_ApplyForceToCenter(player.bodyId, new b2Vec2(-runForce, 0), true);
                playerFacingDir = -1;
            }
        }
        if (keys[ 'ArrowRight' ] || keys[ 'KeyD' ])
        {
            if (velocity.x < maxRunSpeed)
            {
                // Run right
                b2Body_ApplyForceToCenter(player.bodyId, new b2Vec2(runForce, 0), true);
                playerFacingDir = 1;
            }
        }
    }
    else
    {
        if (keys[ 'ArrowUp' ] || keys[ 'KeyW' ])
        {
            if (velocity.y > 0.0)
            {
                // Jump a bit higher, but don't slow the falling speed
                b2Body_ApplyForceToCenter(player.bodyId, new b2Vec2(0, jumpHigherForce), true);
            }
        }
        if (keys[ 'ArrowLeft' ] || keys[ 'KeyA' ])
        {
            if (velocity.x > -maxJumpSpeed)
            {
                // Jump left
                b2Body_ApplyForceToCenter(player.bodyId, new b2Vec2(-airControlForce, 0), true);
                playerFacingDir = -1;
            }
        }
        if (keys[ 'ArrowRight' ] || keys[ 'KeyD' ])
        {
            if (velocity.x < maxJumpSpeed)
            {
                // Jump right
                b2Body_ApplyForceToCenter(player.bodyId, new b2Vec2(airControlForce, 0), true);
                playerFacingDir = 1;
            }
        }        
    }

    if (mouseClick)
    {
        // Shoot
        if (shootDelay == 0)
        {
            shootDelay = shotTiming;

            const target = b2Body_GetTransform(mouseReticle.bodyId).p;
            const position = b2Body_GetPosition(player.bodyId);
            FireBullet(position, target, currentTime);
        }
    }
}


// ** The Game Logic **
function GameUpdate(dt, currentTime)
{
    // kill old bullets
    UpdateBullets(currentTime);

    // update shooting delay
    shootDelay = Math.max(shootDelay - dt, 0);

    // test if player is on the ground
    canJump = CanPlayerJump();

    // set player image facing direction
    if (playerShape.imageScale) {
        playerShape.imageScale.x = Math.abs(playerShape.imageScale.x) * playerFacingDir;
    }
}

function RestartGame()
{
    currentLives = initLives;
    shootDelay = 0;
    canJump = false;
    bullets = [];

    // reset player position to start
    playerFacingDir = 1;
    b2Body_SetTransform(player.bodyId, new b2Vec2(0,0));
}

function CreateGame()
{
    // create the debug drawing system
    m_draw = CreateDebugDraw(canvas, ctx, m_drawScale);

    // create the world map
    CreateWorldMap(worldMap);

    // create the player capsule
    player = CreateCapsule(playerCapsuleConfig);
    playerShape = AttachImage(world.worldId, player.bodyId, "../resources/sunnyland-ansimuz/player", "idle.png", null, new b2Vec2(1, 1), new b2Vec2(2, 0), new b2Vec2(32, 32));

    // create the mouse event listener and target reticle
    MouseAimer();

    // initialise the game
    RestartGame();

    // Trigger the RAF Update Calls
    RAF(Update);
}

function CanPlayerJump()
{
    // check up to four contacts for the player to see if they're touching a platform
    // (four = one contact per cardinal direction?)
    let capacity = b2Body_GetContactCapacity(player.bodyId);
    capacity = Math.min(capacity, 4);
    const contactData = Array.from({length: capacity}, () => new b2ContactData());
    const count = b2Body_GetContactData(player.bodyId, contactData, capacity);
    for (let i = 0; i < count; i++) {
        const bodyIdA = b2Shape_GetBody(contactData[i].shapeIdA);

        // is shapeIdA the player, or the other shape?
        const sign = B2_ID_EQUALS(bodyIdA,player.bodyId) ? -1.0 : 1.0;
    
        if (sign * contactData[i].manifold.normalY > 0.7) {
            return true;
        }
    }
    return false;
}

// (x, y) are screen offsets in pixels on the canvas, scrolling will be added
function SetReticlePosition(x, y)
{
    const ps = new b2Vec2(x - m_draw.positionOffset.x, y - m_draw.positionOffset.y);
    // TODO: we could draw the reticle directly into the canvas instead of having a box2d object
    // however we'll still have to do a conversion to find the box2d world location to aim at...
    const pw = ConvertScreenToWorld(canvas, m_drawScale, ps);
    b2Body_SetTransform(mouseReticle.bodyId, pw.clone());
    b2Body_SetAwake(mouseReticle.bodyId, true);
}

function MouseAimer()
{
    // reticle is the mouse current position
    mouseReticle = CreateCircle({ worldId: world.worldId, position: new b2Vec2(0, 0), type: b2BodyType.b2_kinematicBody, radius: 0.5, categoryBits: mouseCategory, maskBits: mouseCategory, color: b2HexColor.b2_colorWhite });
    reticlePosition = new b2Vec2(0, 0);
    
    // mouse move listener
    document.addEventListener('mousemove', function (event)
    {
        // remember the actual mouse location on screen, it is used again if the world view scrolls
        reticlePosition.x = event.clientX;
        reticlePosition.y = event.clientY;
        SetReticlePosition(event.clientX, event.clientY);
    });
}

function FireBullet(position, target, currentTime)
{
    let v = b2MulSV(bulletForce, b2Normalize(b2Sub(target, position)));

    bulletCircleConfig.position = position.clone();

    const bullet = CreateCircle(bulletCircleConfig);
    b2Body_SetBullet(bullet.bodyId, true);
    b2Body_ApplyLinearImpulseToCenter(bullet.bodyId, v, true);
    bullet.bornTime = currentTime;

    bullets.push(bullet);
}

function UpdateBullets(currentTime)
{
    // kill them when they get too old
    for(let i = bullets.length - 1; i >= 0; --i)
    {
        const b = bullets[i];
        if (currentTime - b.bornTime >= bulletLife) {
            b2DestroyBody(b.bodyId);
            bullets.splice(i, 1);
        }
    }
}

// ** The RAF Update Function **
function Update(deltaTime, currentTime, currentFps)
{
    // ** User input **
    UserInput(currentTime);

    // ** Game logic **
    GameUpdate(deltaTime, currentTime);

    // ** Step the Physics **
    WorldStep({ worldId: world.worldId, deltaTime: deltaTime });

    // ** Debug Drawing **
    // focus the camera on the player location
    let wp = b2Body_GetPosition(player.bodyId);
    let sp = ConvertWorldToScreen(canvas, m_drawScale, wp);
    m_draw.SetPosition(sp.x, sp.y);

    // update the mouse reticle position to compensate for the new scroll offset
    SetReticlePosition(reticlePosition.x, reticlePosition.y);

    // clear screen then redraw content
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    b2World_Draw(world.worldId, m_draw);
}

// ** Create the Game **
setTimeout(CreateGame, 50);


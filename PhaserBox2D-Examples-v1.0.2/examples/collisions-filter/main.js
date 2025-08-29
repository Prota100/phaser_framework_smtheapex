import { CreateBoxPolygon, CreateWorld, WorldStep } from '../lib/PhaserBox2D.js';
import { b2Vec2 } from '../lib/PhaserBox2D.js';
import { b2BodyType, b2DefaultWorldDef, b2HexColor } from '../lib/PhaserBox2D.js';
import { b2World_Draw, b2Body_ApplyForceToCenter, b2Body_GetRotation } from '../lib/PhaserBox2D.js';
import { CreateDebugDraw, RAF } from '../lib/PhaserBox2D.js';

// collision categories
const GREEN_CATEGORY = 0x0001;      // the default category is 0x00000001, and mask is 0xffffffff
const BLUE_CATEGORY = 0x0002;
const RED_CATEGORY = 0x0004;

// Get the canvas element
const canvas = document.getElementById('myCanvas');
var ctx;
if (canvas)
{
    ctx = canvas.getContext('2d');
}

// Start the asteroids demo
let m_drawScale = 15;
let m_draw = null;
let timeTest = false;
m_draw = CreateDebugDraw(canvas, ctx, m_drawScale);

let worldDef = b2DefaultWorldDef();

// change some of the default values
worldDef.gravity = new b2Vec2(0, 0);
// create a world and save the ID which will access it
let world = CreateWorld({ worldDef:worldDef });

const WALL_WIDTH = 1;
const WALL_HEIGHT = 20;

// green box only collides with green wall
const greenWall = CreateBoxPolygon({ worldId:world.worldId, type:b2BodyType.b2_staticBody, position:new b2Vec2(-30, 0), size:new b2Vec2(WALL_WIDTH, WALL_HEIGHT), density:1.0, friction:0.5, categoryBits: GREEN_CATEGORY, maskBits: GREEN_CATEGORY, color:b2HexColor.b2_colorLawnGreen });

const greenBox = CreateBoxPolygon({ worldId:world.worldId, type:b2BodyType.b2_dynamicBody, position:new b2Vec2(-35, 15), size:new b2Vec2(2, 2), fixedRotation: true, density:1.0, friction:0.5, categoryBits: GREEN_CATEGORY, maskBits: GREEN_CATEGORY, color:b2HexColor.b2_colorLawnGreen });

// blue box only collides with blue wall
const blueWall = CreateBoxPolygon({ worldId:world.worldId, type:b2BodyType.b2_staticBody, position:new b2Vec2(0, 0),size:new b2Vec2(WALL_WIDTH, WALL_HEIGHT), density:1.0, friction:0.5, categoryBits: BLUE_CATEGORY, maskBits: BLUE_CATEGORY, color:b2HexColor.b2_colorBlue });

const blueBox = CreateBoxPolygon({ worldId:world.worldId, type:b2BodyType.b2_dynamicBody, position:new b2Vec2(-35, 0), fixedRotation: true, size:new b2Vec2(2, 2), density:1.0, friction:0.5, categoryBits: BLUE_CATEGORY, maskBits: BLUE_CATEGORY, color:b2HexColor.b2_colorBlue });

// red box only collides with red wall
const redWall = CreateBoxPolygon({ worldId:world.worldId, type:b2BodyType.b2_staticBody, position:new b2Vec2(30, 0), size:new b2Vec2(WALL_WIDTH, WALL_HEIGHT), density:1.0, friction:0.5, categoryBits: RED_CATEGORY, maskBits: RED_CATEGORY, color:b2HexColor.b2_colorRed });

const redBox = CreateBoxPolygon({ worldId:world.worldId, type:b2BodyType.b2_dynamicBody, position:new b2Vec2(-35, -15), fixedRotation: true, size:new b2Vec2(2, 2), density:1.0, friction:0.5, categoryBits: RED_CATEGORY, maskBits: RED_CATEGORY, color:b2HexColor.b2_colorRed });

function moveBoxes()
{
    const rotation = b2Body_GetRotation(greenBox.bodyId);
    b2Body_ApplyForceToCenter(greenBox.bodyId, new b2Vec2(20000, 0), true);
    b2Body_ApplyForceToCenter(blueBox.bodyId, new b2Vec2(20000, 0), true);
    b2Body_ApplyForceToCenter(redBox.bodyId, new b2Vec2(20000, 0), true);
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

setTimeout(moveBoxes, 1000);
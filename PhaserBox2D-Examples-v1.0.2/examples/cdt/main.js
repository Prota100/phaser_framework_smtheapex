/*
"Experience the power of Phaser Box2D v3 physics with this dynamic PHASER text demo!
Watch as the letters of 'PHASER' come alive, first dropping onto the scene as fully physics-enabled shapes, then raining down from above in a mesmerizing display of real-time physics simulation.
Each letter is precisely crafted using Constrained Delaunay Triangulation (CDT), allowing for perfect collision detection as they tumble and interact.
The demo showcases smooth performance while handling complex polygon shapes, with a handy counter showing both your current framerate and the number of physics bodies in the scene.
A perfect example of efficient physics simulation - who knew the alphabet could be so entertaining? Give it a try and watch those letters dance!"
*/

// Import Library Functions

import { b2DefaultBodyDef, b2HexColor, CreateBoxPolygon, CreatePolygonFromEarcut, CreateWorld, WorldStep } from '../lib/PhaserBox2D.js';
import { CreateDebugDraw, RAF } from '../lib/PhaserBox2D.js';
import { b2BodyType, b2DefaultWorldDef } from '../lib/PhaserBox2D.js';
import { b2Vec2 } from '../lib/PhaserBox2D.js';
import { b2World_Draw } from '../lib/PhaserBox2D.js';

import { earcut, flatten } from './earcut.js';




// ** Debug Drawing **

// set the scale at which you want the world to be drawn
const m_drawScale = 20.0;

// get the canvas element from the web page
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

// the debug drawing system
let m_draw = null;

// ** Physics World Creation **

// create a definition for a world using the default values
let worldDef = b2DefaultWorldDef();

// change some of the default values
worldDef.gravity = new b2Vec2(0, -10);

// create a world object and save the ID which will access it
let world = CreateWorld({ worldDef:worldDef });

// ** Physics Object Creation **

// a static ground
const groundBodyDef = b2DefaultBodyDef();
const ground = CreateBoxPolygon({ worldId:world.worldId, type:b2BodyType.b2_staticBody, bodyDef: groundBodyDef, position:new b2Vec2(0, -6), size:new b2Vec2(30, 1), density:1.0, friction:0.5, restitution:0.0, color:b2HexColor.b2_colorLawnGreen });


/*
 *
 * Define the Shapes we're going to CDT
 * 
 */

const scaleX = 0.02;
const scaleY = -0.02;
const offsetX = -95;

const letterP = [
    [[40,100], [40,0], [120,0], [150,20], [150,40], [120,60], [80,60], [80,100]],
    [[80,15], [118,15], [133,30], [133,35], [120,45], [80,45]]
];
const letterH = [[[40,100], [40,0], [80,0], [80,35], [110,35], [110,0], [150,0], [150,100], [110,100], [110,65], [80,65], [80,100]]];
const letterA = [
    [[20,100], [75,0], [130,100], [90,100], [82.5,80], [67.5,80], [60,100]],
    [[75,40], [85,65], [65,65]]
];
const letterS = [[[130,0], [40,0], [20,24], [20,35], [40,59], [100,59], [100,82], [40,82], [40,100], [130,100], [150,76], [150,65], [130,41], [70,41], [70,18], [130,18]]];
const letterE = [[[40,100], [40,0], [150,0], [150,20], [80,20], [80,40], [140,40], [140,60], [80,60], [80,80], [150,80], [150,100]]];
const letterR = [
    [[40,100], [40,0], [120,0], [150,20], [150,40], [120,60], [80,60], [150,100], [120,100], [80,60], [80,100]],
    [[80,45], [118,45], [135,35], [135,30], [118,15], [80,15]]
];
const letters = [
    letterP, letterH, letterA, letterS, letterE, letterR
];


const letterInterval = 0.5;
let nextLetter = 2;
let letterCount = 0;

// ** Define the RAF Update Function **
function update(deltaTime, currentTime, currentFps)
{
    if (currentTime > nextLetter)
    {
        nextLetter += letterInterval;

        let r = Math.floor(Math.random() * letters.length);

        CreatePolygonFromEarcut({
            worldId: world.worldId,
            type: b2BodyType.b2_dynamicBody,
            position: new b2Vec2((nextLetter % 6) * 5 - 15, 20),
            indices: [earcutIndices[r]],
            restitution: 0.0,
            vertices: flattenedLetters[r].vertices,
            vertexOffset: new b2Vec2(offsetX, 0),       // remove the vertex offset to center them
            vertexScale: new b2Vec2(scaleX, scaleY)     // scale the vertices to a suitable size for physics
        });
        letterCount++;
    }

	// ** Step the Physics **
	WorldStep({ worldId: world.worldId, deltaTime: deltaTime });

	// ** Debug Drawing **
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	b2World_Draw(world.worldId, m_draw);

    // Draw FPS counter
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText(`FPS: ${ currentFps } SHAPES: ${ letterCount }`, 10, 20);    
}


let flattenedLetters;
let earcutIndices;

function createExample()
{
    m_draw = CreateDebugDraw(canvas, ctx, m_drawScale);

    flattenedLetters = [];
    earcutIndices = [];

    // apply 'earcut' to convert the polygon vertex data into triangles
    letters.forEach((letter) => {

        // convert the data into earcut format
        flattenedLetters.push(flatten(letter));

        // perform the earcut CDT
        earcutIndices.push(earcut(flattenedLetters[letterCount].vertices, flattenedLetters[letterCount].holes, flattenedLetters[letterCount].dimensions));

        // [optional: create a polygon body from all of those triangles to spell the initial word]
        CreatePolygonFromEarcut({
            worldId: world.worldId,
            type: b2BodyType.b2_dynamicBody,
            position: new b2Vec2(letterCount * 2 - 5, 0),         // create each letter a little further to the right
            indices: [earcutIndices[letterCount]],
            vertices: flattenedLetters[letterCount].vertices,
            vertexOffset: new b2Vec2(offsetX, 0),       // remove the vertex offset to center them
            vertexScale: new b2Vec2(scaleX, scaleY)     // scale the vertices to a suitable size for physics
        });
        letterCount++;
    });

    // ** Trigger the RAF Update Calls **
    RAF(update);
}

// ** Create the Example **
// the timeout allows Firefox to resolve the screen dimensions
// without this precaution, the canvas drawing will use an incorrect scale
setTimeout(createExample, 50);

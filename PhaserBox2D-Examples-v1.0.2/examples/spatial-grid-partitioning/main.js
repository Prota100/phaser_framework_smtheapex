// Import Library Functions

import { b2Body_ApplyForceToCenter, b2Body_GetTransform, b2World_GetBodyEvents, CreateBoxPolygon, CreateCircle, CreateWorld, WorldStep } from '../lib/PhaserBox2D.js';
import { CreateDebugDraw, RAF } from '../lib/PhaserBox2D.js';
import { b2BodyType, b2DefaultWorldDef, b2HexColor } from '../lib/PhaserBox2D.js';
import { b2Vec2 } from '../lib/PhaserBox2D.js';

import { b2World_Draw } from '../lib/PhaserBox2D.js';

// ** Debug Drawing **
var m_draw, world;

// set the scale at which you want the world to be drawn
const m_drawScale = 2.7;

// get the canvas element from the web page
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

const POPULATION = 768;
const CIRCLE_RADIUS = 1.0;

const REGION_HALF_SIZE = 128;
const CREATE_RADIUS = REGION_HALF_SIZE * 0.1;

// specify the cell size in bits to ensure it will be a power-of-two value
const CELL_BITS = 5;        // smaller cells = more of them: fewer bodies per cell searched, but less cache coherency
const CELL_SIZE = 1 << CELL_BITS;
const GRID_SIZE = Math.ceil(REGION_HALF_SIZE * 2 / CELL_SIZE);

const ATTRACTION_RADIUS_CELLS = 3;
const ATTRACTION_RADIUS = ATTRACTION_RADIUS_CELLS * CELL_SIZE;
const ATTRACTION_SQUARED = ATTRACTION_RADIUS * ATTRACTION_RADIUS;
const ATTRACTION_STRENGTH = 2000.0;

const grid = [];            // contains bodyId values in a list for each grid cell
const bodies = [];          // indexed by the bodyId.index1 values, stores [grid x][grid y]


function boundaryWalls() {
    const walls = [
        { center: new b2Vec2(0, -REGION_HALF_SIZE+1), size: new b2Vec2(REGION_HALF_SIZE, 1) },    // bottom
        { center: new b2Vec2(0, REGION_HALF_SIZE-1), size: new b2Vec2(REGION_HALF_SIZE, 1) },     // top
        { center: new b2Vec2(-REGION_HALF_SIZE+1, 0), size: new b2Vec2(1, REGION_HALF_SIZE) },    // left
        { center: new b2Vec2(REGION_HALF_SIZE-1, 0), size: new b2Vec2(1, REGION_HALF_SIZE) },     // right
    ];
    walls.forEach(wall => {
        CreateBoxPolygon({ worldId:world.worldId, type:b2BodyType.b2_staticBody, position:wall.center, size:wall.size, friction: 0.1, restitution: 1.0, color:b2HexColor.b2_colorGold });
    });
}

const totalForce = new b2Vec2(0, 0);
function attractNeighbours(gx, gy, bodyId, px, py)
{
    // for the location specified (grid and physics), find all neighbours within range
    // apply an inverse square attraction, falling to 0 at maximum range
    totalForce.x = totalForce.y = 0;

    // Search each neighbouring cell for bodies within attraction range
    for (let dy = -ATTRACTION_RADIUS_CELLS; dy <= ATTRACTION_RADIUS_CELLS; dy++) {
        for (let dx = -ATTRACTION_RADIUS_CELLS; dx <= ATTRACTION_RADIUS_CELLS; dx++) {
            const ngx = gx + dx;
            const ngy = gy + dy;
            
            if (ngy < 0 || ngy >= GRID_SIZE || ngx < 0 || ngx >= GRID_SIZE) continue;
            const cells = grid[ngy][ngx];

            // For every body inside this cell
            for(let i = 0, l = cells.length; i < l; i++) {
                const neighborId = cells[i];
                const neighborIndex = neighborId.index1;
                if (neighborIndex === bodyId.index1) continue;
                
                // Use the cached transform: calling b2Body_GetTransform this many times is massively expensive
                const pos2 = bodies[neighborIndex][3].p;
                
                // Calculate distance and direction
                const dx = pos2.x - px;
                const dy = pos2.y - py;
                const distSq = dx * dx + dy * dy;
                if (distSq > ATTRACTION_SQUARED) continue;

                // Calculate attraction force (inverse square of distance)
                const dist = Math.sqrt(distSq);
                if (dist > 0) {
                    let force = ATTRACTION_STRENGTH / distSq;
                    const falloff = 1 - (dist / ATTRACTION_RADIUS);
                    force *= falloff;
                    const fx = (dx / dist) * force;
                    const fy = (dy / dist) * force;
                    
                    // Sum the force vectors
                    totalForce.x += fx;
                    totalForce.y += fy;
                }
            }
        }
    }

    // Apply the total force vector
    if (totalForce.x != 0 || totalForce.y != 0) {
        b2Body_ApplyForceToCenter(bodyId, totalForce, true);
    }
}

function calculateAttractionForces() {
    // iterate all bodies, find and attract neighbours within range
    for(let b in bodies) {
        let [gx, gy, bodyId, xf] = bodies[b];
        if (xf) {
            attractNeighbours(gx, gy, bodyId, xf.p.x, xf.p.y);
        }
    }
}

// ** Define the RAF Update Function **
function update(deltaTime, currentTime, currentFps)
{
    // Calculate and apply attraction forces after a short delay at the start
    if (currentTime > 5.0)
        calculateAttractionForces();

	// ** Step the Physics **
	WorldStep({ worldId: world.worldId, deltaTime: deltaTime });

    // update grid locations only for things that moved
    let moved = b2World_GetBodyEvents(world.worldId).moveEvents;
    for(let i = 0; i < moved.length; i++)
    {
        let bodyIndex = moved[i].bodyId.index1;
        let bodyId = bodies[bodyIndex][2];
        let xf = moved[i].transform;

        // cache the new transform for each body that moved: calling b2Body_GetTransform is quite expensive
        bodies[bodyIndex][3] = xf;
        
        let [ogx, ogy] = bodies[bodyIndex];
        let oldGridCell = grid[ogy][ogx];

        let gx = (xf.p.x + REGION_HALF_SIZE) >> CELL_BITS;
        let gy = (xf.p.y + REGION_HALF_SIZE) >> CELL_BITS;

        let newGridCell = grid[gy][gx];

        // if this body moved into a new cell, update the grid
        if (newGridCell != oldGridCell)
        {
            let index = oldGridCell.indexOf(bodyId);
            if (index == -1) {                  // should never happen
                console.warn("body has invalid grid location " + bodyIndex);
                continue;
            }

            oldGridCell.splice(index, 1);
            newGridCell.push(bodyId);

            bodies[bodyIndex][0] = gx;
            bodies[bodyIndex][1] = gy;
        }
    }

	// ** Debug Drawing **
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	b2World_Draw(world.worldId, m_draw);

    // Draw FPS counter
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText(`Spatial Grid Partitioning: Attract`, 10, 20);
    ctx.fillText(`FPS: ${ currentFps } BODIES: ${ POPULATION } RANGE: ${ ATTRACTION_RADIUS }`, 10, 40);
}

function CreateGame()
{
    // create the debug drawing system
    m_draw = CreateDebugDraw(canvas, ctx, m_drawScale);

    // ** Physics World Creation **

    // create a definition for a world using the default values
    let worldDef = b2DefaultWorldDef();

    // change some of the default values
    worldDef.gravity = new b2Vec2(0, 0);

    // create a world object and save the ID which will access it
    world = CreateWorld({ worldDef:worldDef });

    // ** Physics Object Creation **
    boundaryWalls();

    // create empty grid
    for(let gy = 0; gy < GRID_SIZE; gy++)
    {
        grid[gy] = [];
        for(let gx = 0; gx < GRID_SIZE; gx++)
            grid[gy][gx] = [];
    }

    // scatter bodies in a circle with even distribution
    // if the circle is smaller than the volume of bodies, they explode outwards
    // there is a one-way correspondence from the bodies list to their grid square
    for(let i = 0; i < POPULATION; i++) {
        // Generate random angle and radius using square root for even distribution
        let angle = Math.random() * 2 * Math.PI;
        let radius = Math.sqrt(Math.random()) * CREATE_RADIUS;
        
        // Convert polar to Cartesian coordinates
        let x = radius * Math.cos(angle);
        let y = radius * Math.sin(angle);
        
        let circle = CreateCircle({ 
            worldId: world.worldId, 
            type: b2BodyType.b2_dynamicBody, 
            position: new b2Vec2(x, y), 
            radius: CIRCLE_RADIUS, 
            density: 1.0, 
            restitution: 0.5,
            friction: 0.1,
            color: b2HexColor.b2_colorLawnGreen 
        });

        const gx = (x + REGION_HALF_SIZE) >> CELL_BITS;
        const gy = (y + REGION_HALF_SIZE) >> CELL_BITS;

        // bodies list for fast iteration
        bodies[circle.bodyId.index1] = [gx, gy, circle.bodyId, null];
        // spatial partition grid references the physics bodies only
        grid[gy][gx].push(circle.bodyId);
    }

    RAF(update);
}


// ** Trigger the RAF Update Calls **
setTimeout(CreateGame, 50);


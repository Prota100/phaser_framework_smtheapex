/*
Experience the mesmerizing world of physics with this dynamic ragdoll simulation!
Watch as colorful humanoid figures tumble through an intricate obstacle course, encountering spinning wheels of doom that send them twirling through the air.
Two spawners continuously create new ragdolls - one dropping front-view humans from the left and another dropping side-view humans from the right.
The ragdolls interact realistically with the environment thanks to the powerful physics engine: Phaser Box2D v3.
They fall bouncing, tumbling, and colliding their way down through the course until they reach the sensor at the bottom that cleanly removes them from the scene.
An endless parade of physics-driven chaos!
*/

import { RAF, WorldStep, b2Vec2 } from '../lib/PhaserBox2D.js';
import { b2ChainDef, b2HexColor, b2ShapeDef, b2DefaultWorldDef } from '../lib/PhaserBox2D.js';
import { B2_NULL_INDEX } from '../lib/PhaserBox2D.js';
import { b2Body_IsValid, b2CreateWorld, b2CreateWorldArray, b2World_Draw, b2World_GetSensorEvents } from '../lib/PhaserBox2D.js';
import { b2CreateBody, b2Body_GetUserData } from '../lib/PhaserBox2D.js';
import { b2Shape_GetBody, b2CreatePolygonShape, b2CreateChain } from '../lib/PhaserBox2D.js';
import { b2MakeOffsetBox } from '../lib/PhaserBox2D.js';
import { CreateDebugDraw } from '../lib/PhaserBox2D.js';
import { Spinner } from '../lib/PhaserBox2D.js';
import { Ragdoll, Skeletons } from '../lib/PhaserBox2D.js';
import { b2DefaultBodyDef } from '../lib/PhaserBox2D.js';

const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');


// Globals required
let m_draw;
let m_drawScale;

class Spawner {
    constructor(worldId, position, skeleton) {
        this.position = position;
        this.skeleton = skeleton;
        this.m_elements = [];
        this.id = 1;
    }

    createElement(worldId) {
        const center = this.position;
        const ragdoll = new Ragdoll(this.skeleton, center.x, center.y, worldId, this.id++, generateBrightColor(), 5);
        this.id = this.id % 8;
        this.m_elements.push(ragdoll);
    }

    destroyElement(element) {
        if (element) {
            const index = this.m_elements.indexOf(element);
            if (index != -1) {
                element.destroy();
                this.m_elements.splice(index, 1);
            }
        }
    }
}

function makeSensor(groundId, position, width, height) {
    let box = b2MakeOffsetBox(width / 2, height / 2, position, 0.0);
    let shapeDef = new b2ShapeDef();
    shapeDef.isSensor = true;
    shapeDef.customColor = b2HexColor.b2_colorGray;
    b2CreatePolygonShape(groundId, shapeDef, box);
}

function sensorDetect(worldId) {
    const detections = [];
    const sensorEvents = b2World_GetSensorEvents(worldId);
    for (let i = 0; i < sensorEvents.beginCount; ++i) {
        const event = sensorEvents.beginEvents[i];
        const visitorId = event.visitorShapeId;
        const bodyId = b2Shape_GetBody(visitorId);
        if (bodyId.index1 - 1 == B2_NULL_INDEX) {
            continue;
        }
        if (!b2Body_IsValid(bodyId)) {
            continue;
        }
        let element = b2Body_GetUserData(bodyId);
        if (element == null) {
            element = bodyId;
        }
        if (detections.indexOf(element) == -1) {
            detections.push(element);
        }
    }
    return detections;
}

function generateBrightColor() {
    const mainComponent = Math.floor(Math.random() * 36) + 220;
    const secondComponent = Math.floor(Math.random() * 81) + 100;
    const minComponent = Math.floor(Math.random() * 61);
    const components = [mainComponent, secondComponent, minComponent];
    const shuffled = components.sort(() => Math.random() - 0.5);
    return (shuffled[0] << 16) | (shuffled[1] << 8) | shuffled[2];
 }

function testSensors() {
    m_draw = CreateDebugDraw(canvas, ctx, m_drawScale);

    b2CreateWorldArray();
    const worldDef = b2DefaultWorldDef();
    worldDef.gravity = new b2Vec2(0, -10);
    const worldId = b2CreateWorld(worldDef);

    const points = [
        new b2Vec2(-16.8672504, 31.088623), new b2Vec2(16.8672485, 31.088623), new b2Vec2(16.8672485, 17.1978741),
        new b2Vec2(8.26824951, 11.906374), new b2Vec2(16.8672485, 11.906374), new b2Vec2(16.8672485, -0.661376953),
        new b2Vec2(8.26824951, -5.953125), new b2Vec2(16.8672485, -5.953125), new b2Vec2(16.8672485, -13.229126),
        new b2Vec2(3.63799858, -23.151123), new b2Vec2(3.63799858, -31.088623), new b2Vec2(-3.63800049, -31.088623),
        new b2Vec2(-3.63800049, -23.151123), new b2Vec2(-16.8672504, -13.229126), new b2Vec2(-16.8672504, -5.953125),
        new b2Vec2(-8.26825142, -5.953125), new b2Vec2(-16.8672504, -0.661376953), new b2Vec2(-16.8672504, 11.906374),
        new b2Vec2(-8.26825142, 11.906374), new b2Vec2(-16.8672504, 17.1978741),
    ];

    const chainDef = new b2ChainDef();
    chainDef.points = points;
    chainDef.count = points.length;
    chainDef.isLoop = true;
    chainDef.friction = 0.2;

    const groundBodyDef = b2DefaultBodyDef();
    const groundId = b2CreateBody(worldId, groundBodyDef);
    b2CreateChain(groundId, chainDef);

    {
        new Spinner(new b2Vec2(0, 47 - 52), 25000, -4, b2HexColor.b2_colorRed, 0.5, worldId);
        new Spinner(new b2Vec2(0, 60 - 52), 25000, 3, b2HexColor.b2_colorOrange, 0.45, worldId);
        new Spinner(new b2Vec2(0, 73 - 52), 25000, -2, b2HexColor.b2_colorYellow, 0.4, worldId);
    }

    makeSensor(groundId, new b2Vec2(0, -30.5), 7.3, 1.0);

    const spawnInterval = 2.0;
    const m_spawner_lft = new Spawner(worldId, new b2Vec2(-15, 29.5), Skeletons.frontViewHuman11);
    let nextLft = spawnInterval / 2;
    const m_spawner_rgt = new Spawner(worldId, new b2Vec2(15, 29.5), Skeletons.sideViewHuman11);
    let nextRgt = spawnInterval;

    let accumulator = 0;
    const fixedTimeStep = 1 / 60;

    function update(deltaTime, currentTime, currentFps) {

        accumulator += deltaTime;

        const deferredDestructions = sensorDetect(worldId);
        for (let i = 0; i < deferredDestructions.length; ++i) {
            let element = deferredDestructions[i];
            if (element) {
                m_spawner_lft.destroyElement(element);
                m_spawner_rgt.destroyElement(element);
            }
        }

        if (currentTime > nextLft) {
            m_spawner_lft.createElement(worldId);
            nextLft += spawnInterval;
        }
        if (currentTime > nextRgt) {
            m_spawner_rgt.createElement(worldId);
            nextRgt += spawnInterval;
        }

        while (accumulator >= fixedTimeStep) {
            WorldStep({ worldId: worldId, deltaTime: fixedTimeStep });
            accumulator -= fixedTimeStep;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        b2World_Draw(worldId, m_draw);

        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.fillText(`FPS: ${currentFps}`, 10, 20);
    }

    RAF(update);
}

m_drawScale = 11;
setTimeout(() => testSensors(), 50);

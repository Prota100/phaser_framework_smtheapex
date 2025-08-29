import { CreateBoxPolygon, CreateCircle, CreateRevoluteJoint, CreateWeldJoint, CreateDistanceJoint, CreatePrismaticJoint, WorldStep } from '../lib/PhaserBox2D.js';
import { b2Vec2, b2Add, b2MakeRot, b2Normalize } from '../lib/PhaserBox2D.js';
import { b2BodyType, b2DefaultBodyDef, b2DefaultShapeDef, b2DefaultWorldDef, b2HexColor, b2RevoluteJointDef, b2ShapeDef } from '../lib/PhaserBox2D.js';
import { b2CreateWorldArray, b2CreateWorld, b2World_Draw, b2Body_IsValid } from '../lib/PhaserBox2D.js';
import { b2Body_GetLocalPoint, b2Body_GetLocalVector, b2Body_SetUserData, b2CreateBody, b2DestroyBody } from '../lib/PhaserBox2D.js';
import { CreateDebugDraw, RAF } from '../lib/PhaserBox2D.js';
import { ActiveBall, Gun, Spinner } from '../lib/PhaserBox2D.js';
import { Ragdoll, Skeletons } from '../lib/PhaserBox2D.js';
import { B2_NULL_INDEX } from '../lib/PhaserBox2D.js';
import { b2Body_GetUserData } from '../lib/PhaserBox2D.js';
import { b2World_GetSensorEvents } from '../lib/PhaserBox2D.js';
import { b2CreateCapsuleShape, b2CreateCircleShape, b2CreatePolygonShape, b2Shape_GetBody } from '../lib/PhaserBox2D.js';
import { b2MakeBox, b2MakeOffsetBox, b2MakePolygon } from '../lib/PhaserBox2D.js';
import { b2Capsule, b2Circle } from '../lib/PhaserBox2D.js';
import { b2CreateRevoluteJoint, b2Joint_WakeBodies } from '../lib/PhaserBox2D.js';
import { b2ComputeHull } from '../lib/PhaserBox2D.js';
import { b2BodyId, b2JointId } from '../lib/PhaserBox2D.js';
import { b2PrismaticJoint_EnableMotor } from '../lib/PhaserBox2D.js';


const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
var groundBodyDef;      // TODO: remove globals

function makeFrame(x, y, w, h, worldId)
{
    let groundY = y;

    groundBodyDef = b2DefaultBodyDef();
    groundBodyDef.position = new b2Vec2(0, groundY - 2 * 5);
    let groundId = b2CreateBody(worldId, groundBodyDef);
    const groundBox = b2MakeBox(w, 5);
    const groundShapeDef = b2DefaultShapeDef();
    groundShapeDef.customColor = b2HexColor.b2_colorGreen;
    b2CreatePolygonShape(groundId, groundShapeDef, groundBox);

    let bodyDef = b2DefaultBodyDef();

    bodyDef.position = new b2Vec2(-x, 0);
    const leftId = b2CreateBody(worldId, bodyDef);
    let box = b2MakeBox(5, h);
    let shapeDef = b2DefaultShapeDef();
    shapeDef.customColor = b2HexColor.b2_colorWhite;
    b2CreatePolygonShape(leftId, shapeDef, box);

    bodyDef = b2DefaultBodyDef();
    bodyDef.position.x = x;
    const rightId = b2CreateBody(worldId, bodyDef);
    box = b2MakeBox(5, h);
    shapeDef = b2DefaultShapeDef();
    shapeDef.customColor = b2HexColor.b2_colorWhite;
    b2CreatePolygonShape(rightId, shapeDef, box);

    bodyDef = b2DefaultBodyDef();
    bodyDef.position.y = -groundY + 2 * 5;
    const topId = b2CreateBody(worldId, bodyDef);
    box = b2MakeBox(w, 5);
    shapeDef = b2DefaultShapeDef();
    shapeDef.customColor = b2HexColor.b2_colorSkyBlue;
    b2CreatePolygonShape(topId, shapeDef, box);

    return groundId;
}

function dropBox(x, worldId, size = 2, density = 10.0)
{
    let box = CreateBoxPolygon({ position: new b2Vec2(x, 5), type: b2BodyType.b2_dynamicBody, size: size, density: density, friction: 0.7, worldId: worldId });
    return box.bodyId;
}

// a sensor box
function makeSensor(position, width, height, groundId)
{
    let box = b2MakeOffsetBox(width / 2, height / 2, position, 0.0);
    let shapeDef = new b2ShapeDef();
    shapeDef.isSensor = true;
    shapeDef.customColor = b2HexColor.b2_colorGray;
    b2CreatePolygonShape(groundId, shapeDef, box);
}

// return a list of everything that touched a sensor
function sensorDetect(worldId)
{
    const detections = [];
    const sensorEvents = b2World_GetSensorEvents(worldId);
    for (let i = 0; i < sensorEvents.beginCount; ++i)
    {
        const event = sensorEvents.beginEvents[i];
        const visitorId = event.visitorShapeId;
        const bodyId = b2Shape_GetBody(visitorId);
        if (bodyId.index1 - 1 == B2_NULL_INDEX)
        {
            continue;
        }
        if (!b2Body_IsValid(bodyId))
        {
            continue;
        }
        let element = b2Body_GetUserData(bodyId);
        if (element == null)
        {
            element = bodyId;
        }
        if (detections.indexOf(element) == -1)
        {
            detections.push(element);
        }
    }
    return detections;
}

function attachPrismatic(bodyA_id, bodyB_id, posB, angle, axis, worldId)
{
    let m_enableSpring = false;
    let m_enableLimit = true;
    let m_enableMotor = true;
    let m_motorSpeed = 15.0;
    let m_motorForce = 5500.0;
    let m_hertz = 1.0;
    let m_dampingRatio = 0.5;

    const pivot = new b2Vec2(0, 2);
    const prismaticJoint = CreatePrismaticJoint({
        worldId: worldId,
        bodyIdA: bodyA_id, bodyIdB: bodyB_id,
        anchorA: b2Body_GetLocalPoint(bodyA_id, b2Add(pivot, posB)), anchorB: b2Body_GetLocalPoint(bodyB_id, pivot),
        axis: b2Body_GetLocalVector(bodyA_id, axis),
        referenceAngle: angle * Math.PI / 180,
        enableLimit: m_enableLimit, lowerTranslation: -41.0, upperTranslation: 16.5,
        enableSpring: m_enableSpring, hertz: m_hertz, dampingRatio: m_dampingRatio,
        enableMotor: m_enableMotor, maxMotorForce: m_motorForce, motorSpeed: m_motorSpeed
    });
    return prismaticJoint.jointId;
}

let donutCount = 0;         // TODO: remove globals
function makeDonutWeld(x, y, worldId, size, spring = 1.0, density = 0.1, color = b2HexColor.b2_colorAliceBlue)
{
    donutCount++;

    const donutScale = size;
    const e_sides = 7;

    const position = new b2Vec2(x, y);

    const m_bodyIds = [];
    const m_jointIds = [];

    for (let i = 0; i < e_sides; ++i)
    {
        m_bodyIds[i] = new b2BodyId();
        m_jointIds[i] = new b2JointId();
    }

    const radius = 1.0 * donutScale;
    const deltaAngle = 2.0 * Math.PI / e_sides;
    const length = 2.0 * Math.PI * radius / e_sides;

    // const capsule = new b2Capsule();
    // capsule.center1 = new b2Vec2(0.0, -0.5 * length);
    // capsule.center2 = new b2Vec2(0.0, 0.5 * length);
    // capsule.radius = 0.25 * donutScale;

    const center = position.clone();

    const bodyDef = b2DefaultBodyDef();
    bodyDef.type = b2BodyType.b2_dynamicBody;

    const shapeDef = b2DefaultShapeDef();
    shapeDef.density = 0.1;
    shapeDef.friction = 0.2;
    shapeDef.filter.groupIndex = -donutCount;
    shapeDef.filter.maskBits = 1;
    shapeDef.customColor = color;

    // Create bodies
    let angle = 0.0;
    for (let i = 0; i < e_sides; ++i)
    {
        bodyDef.position = new b2Vec2(radius * Math.cos(angle) + center.x, radius * Math.sin(angle) + center.y);
        bodyDef.rotation = b2MakeRot(angle);
        bodyDef.linearDamping = 0.0;

        m_bodyIds[i] = b2CreateBody(worldId, bodyDef);

        const capsule = new b2Capsule();
        capsule.center1 = new b2Vec2(0.0, -0.5 * length);
        capsule.center2 = new b2Vec2(0.0, 0.5 * length);
        capsule.radius = 0.25 * donutScale;

        b2CreateCapsuleShape(m_bodyIds[i], shapeDef, capsule);

        angle += deltaAngle;
    }

    // Create joints
    let prevBodyId = m_bodyIds[e_sides - 1];
    for (let i = 0; i < e_sides; ++i)
    {
        m_jointIds[i] = CreateWeldJoint({ worldId: worldId, bodyIdA: prevBodyId, bodyIdB: m_bodyIds[i], anchorA: new b2Vec2(0.0, 0.5 * length), anchorB: new b2Vec2(0.0, -0.5 * length), hertz: spring * 2.0, dampingRatio: 0.0 });
        prevBodyId = m_bodyIds[i];
    }

    // set the user data so the entire object can be destroyed when any part hits a sensor
    const element = { bodies: m_bodyIds, joints: m_jointIds };
    for (let i = 0; i < m_bodyIds.length; ++i)
    {
        b2Body_SetUserData(m_bodyIds[i], element);
    }
    return element;
}


class RevoluteWheel
{
    constructor(position, radius, torque, speed, color, worldId, groundId)
    {
        this.offsetPosition = position.clone();

        const bodyDefWheel = b2DefaultBodyDef();
        bodyDefWheel.type = b2BodyType.b2_dynamicBody;
        bodyDefWheel.position = this.offsetPosition;

        const wheelId = b2CreateBody(worldId, bodyDefWheel);
        const wheel = new b2Circle();
        wheel.center = new b2Vec2(0, 0);
        wheel.radius = radius;
        const shapeDefWheel = b2DefaultShapeDef();
        shapeDefWheel.density = 1.0;
        shapeDefWheel.friction = 0.1;
        shapeDefWheel.customColor = color;
        this.shapeId = b2CreateCircleShape(wheelId, shapeDefWheel, wheel);

        let pivot = this.offsetPosition.clone();
        const jointDef = new b2RevoluteJointDef();
        jointDef.bodyIdA = wheelId;
        jointDef.bodyIdB = groundId;
        jointDef.localAnchorA = b2Body_GetLocalPoint(jointDef.bodyIdA, pivot);
        jointDef.localAnchorB = b2Body_GetLocalPoint(jointDef.bodyIdB, pivot);
        jointDef.motorSpeed = speed;
        jointDef.maxMotorTorque = torque;
        jointDef.enableMotor = true;
        this.jointId = b2CreateRevoluteJoint(worldId, jointDef);

        this.id = wheelId;
    }
}

class Conveyor
{
    constructor(position, wide, tall, angle, worldId)
    {
        const bodyDef = b2DefaultBodyDef();
        bodyDef.position = position;
        bodyDef.rotation = b2MakeRot(angle * Math.PI / 180);
        this.bodyId = b2CreateBody(worldId, bodyDef);
        const box = b2MakeBox(wide, tall);
        const shapeDef = b2DefaultShapeDef();
        b2CreatePolygonShape(this.bodyId, shapeDef, box);
    }
}


function destroyAtSensor( worldId, guns, boxes )
{
    const detections = sensorDetect(worldId);
    for (let i = 0; i < detections.length; i++)
    {
        const destroy = detections[i];
        if (destroy instanceof ActiveBall)
        {
            // destroy balls which have touched the sensor in this frame
            if (!guns[0].destroyBall(detections[i]))
                if (!guns[1].destroyBall(detections[i]))
                    guns[2].destroyBall(detections[i]);
        }
        else
        {
            let boxIndex = boxes.indexOf(destroy);
            if (boxIndex != -1)
            {
                // kill the box that just hit the sensor
                b2DestroyBody(destroy);
                boxes.splice(boxIndex, 1);
            }
            else
            {
                // don't destroy anything else...
                //console.log("unhandled object type hit sensor: " + destroy.constructor.name);
            }
        }
    }
}


let m_draw;
let m_drawScale;

function testWorld() {
    m_draw = CreateDebugDraw(canvas, ctx, m_drawScale);

    b2CreateWorldArray();
    const worldDef = b2DefaultWorldDef();
    worldDef.gravity = new b2Vec2(0, -10);
    const worldId = b2CreateWorld(worldDef);

    // world
    let frameId = makeFrame(104, -50, 109, 55, worldId);
    makeSensor(new b2Vec2(0.0, 6.5), 204.0, 3.0, frameId);

    const bodyDef = b2DefaultBodyDef();
    const groundId = b2CreateBody(worldId, bodyDef);

    // guns
    const shotInterval = 0.1;
    const gunPosition = new b2Vec2(0, -50);
    const ballLife = 60.0;
    const gun = new Gun(gunPosition, new b2Vec2(0, 30000), shotInterval, ballLife, 1.0, 3.0, b2HexColor.b2_colorGreenYellow, worldId);
    let gunPan = 0;
    const gunLeft = new Gun(new b2Vec2(-70, -50), new b2Vec2(-1500, 14000), shotInterval, ballLife, 0.7, 2.5, b2HexColor.b2_colorPurple, worldId);
    const gunRight = new Gun(new b2Vec2(70, -50), new b2Vec2(1500, 12000), shotInterval, ballLife, 0.5, 2.0, b2HexColor.b2_colorPeachPuff, worldId);

    const lftPosition = new b2Vec2(-25, -5);
    const lftSpeed = -12.0;
    const lftTorque = 25000.0;
    const paddleLft = new Spinner(lftPosition, lftTorque, lftSpeed, b2HexColor.b2_colorSeashell, 1.0, worldId);

    const rgtPosition = new b2Vec2(25, -5);
    const rgtSpeed = 12.0;
    const rgtTorque = 25000.0;
    const paddleRgt = new Spinner(rgtPosition, rgtTorque, rgtSpeed, b2HexColor.b2_colorSeashell, 1.0, worldId);

    const llftPosition = new b2Vec2(-85, -25);
    const llftSpeed = 10.0;
    const llftTorque = 25000.0;
    const lpaddleLft = new Spinner(llftPosition, llftTorque, llftSpeed, b2HexColor.b2_colorGold, 0.9, worldId);

    const lrgtPosition = new b2Vec2(85, -25);
    const lrgtSpeed = -10.0;
    const lrgtTorque = 25000.0;
    const lpaddleRgt = new Spinner(lrgtPosition, lrgtTorque, lrgtSpeed, b2HexColor.b2_colorGold, 0.9, worldId);

    // left wheel with ragdolls
    {
        const whlPosition = new b2Vec2(-50, 90 + groundBodyDef.position.y);
        const bigWheel = new RevoluteWheel(whlPosition, 10.0, 250000, 1.0, b2HexColor.b2_colorRed, worldId, groundId);
        const dollPosition1 = new b2Vec2(bigWheel.offsetPosition.x - 11.0, bigWheel.offsetPosition.y - 8.0);
        const ragdoll1 = new Ragdoll(Skeletons.frontViewHuman11, dollPosition1.x, dollPosition1.y, worldId, 1, b2HexColor.b2_colorAntiqueWhite, 12);
        // pin two dolls to the wheel
        CreateRevoluteJoint({
            bodyIdA: ragdoll1.m_bones[Skeletons.HumanBones.e_lowerRightArm].bodyId, bodyIdB: bigWheel.id,
            anchorA: new b2Vec2(0, -2), anchorB: new b2Vec2(-9.0, 0.0),
            worldId: worldId
        });

        const dollPosition2 = new b2Vec2(bigWheel.offsetPosition.x + 11.0, bigWheel.offsetPosition.y + 8.0);
        const ragdoll2 = new Ragdoll(Skeletons.sideViewHuman11, dollPosition2.x, dollPosition2.y, worldId, 1, b2HexColor.b2_colorGold, 12);
        CreateRevoluteJoint({
            bodyIdA: ragdoll2.m_bones[Skeletons.HumanBones.e_lowerLeftLeg].bodyId, bodyIdB: bigWheel.id,
            anchorA: new b2Vec2(0, -2), anchorB: new b2Vec2(9.0, 0.0),
            worldId: worldId
        });
    }
    // right wheel with an elephant and ragdoll
    {
        const whlPosition = new b2Vec2(50, 90 + groundBodyDef.position.y);
        const bigWheel = new RevoluteWheel(whlPosition, 10.0, 250000, 0.5, b2HexColor.b2_colorBlueViolet, worldId, groundId);
        const dollPosition1 = new b2Vec2(bigWheel.offsetPosition.x + 11.0, bigWheel.offsetPosition.y - 8.0);
        const ragdoll1 = new Ragdoll(Skeletons.sideViewElephant, dollPosition1.x, dollPosition1.y, worldId, 1, b2HexColor.b2_colorGray, 5);
        CreateRevoluteJoint({
            bodyIdA: ragdoll1.m_bones[Skeletons.ElephantBones.e_trunkTip].bodyId, bodyIdB: bigWheel.id,
            anchorA: new b2Vec2(0, -2), anchorB: new b2Vec2(9.0, 0.0),
            worldId: worldId
        });

        const dollPosition2 = new b2Vec2(bigWheel.offsetPosition.x - 11.0, bigWheel.offsetPosition.y + 8.0);
        const ragdoll2 = new Ragdoll(Skeletons.frontViewHuman11, dollPosition2.x, dollPosition2.y, worldId, 1, b2HexColor.b2_colorAquamarine, 12);
        CreateRevoluteJoint({
            bodyIdA: ragdoll2.m_bones[Skeletons.HumanBones.e_lowerLeftLeg].bodyId, bodyIdB: bigWheel.id,
            anchorA: new b2Vec2(0, -2), anchorB: new b2Vec2(-9.0, 0.0),
            worldId: worldId
        });
    }


    // prismatic joints (slider-pushers)
    let cnvPrisLft, cnvPrisRgt;
    {
        // create a thin triangle to act as a pusher
        const triScale = 1.0;
        const vertices = [new b2Vec2(-1.0 * triScale, 0.0), new b2Vec2(1.0 * triScale, 0.0), new b2Vec2(0.0, 3.5 * triScale)];
        const bodyDefTri = b2DefaultBodyDef();
        bodyDefTri.position = new b2Vec2(0.0, 0.0);
        bodyDefTri.type = b2BodyType.b2_dynamicBody;
        const bodyIdTri = b2CreateBody(worldId, bodyDefTri);
        const shapeDefTri = b2DefaultShapeDef();
        const hullTri = b2ComputeHull(vertices, 3);
        const triangle = b2MakePolygon(hullTri, 0);
        b2CreatePolygonShape(bodyIdTri, shapeDefTri, triangle);
        const cnvPusherLft = bodyIdTri;

        // create a sloped rectangle (conveyor) for the pusher to move along
        const x = -15, y = 15;
        const cnvPosition2 = new b2Vec2(-45 + x, -32 + y);
        const conveyorLft = new Conveyor(b2Add(cnvPosition2, new b2Vec2(0, 0)), 30, 2, -45, worldId);

        // attach the pusher to the conveyor
        const axisLft = b2Normalize(new b2Vec2(-1, 1));
        cnvPrisLft = attachPrismatic(groundId, cnvPusherLft, new b2Vec2(-50.35 + x, -22.5 + y), -45, axisLft, worldId);
    }
    {
        // mirror to the other side
        const triScale = 1.0;
        const vertices = [new b2Vec2(-1.0 * triScale, 0.0), new b2Vec2(1.0 * triScale, 0.0), new b2Vec2(0.0, 3.5 * triScale)];
        const bodyDefTri = b2DefaultBodyDef();
        bodyDefTri.position = new b2Vec2(0.0, 0.0);
        bodyDefTri.type = b2BodyType.b2_dynamicBody;
        const bodyIdTri = b2CreateBody(worldId, bodyDefTri);
        const shapeDefTri = b2DefaultShapeDef();
        const hullTri = b2ComputeHull(vertices, 3);
        const triangle = b2MakePolygon(hullTri, 0);
        b2CreatePolygonShape(bodyIdTri, shapeDefTri, triangle);
        const cnvPusherRgt = bodyIdTri;

        const x = 15, y = 15;
        const cnvPosition2 = new b2Vec2(45 + x, -32 + y);
        const conveyorRgt = new Conveyor(b2Add(cnvPosition2, new b2Vec2(0, 0)), 30, 2, 45, worldId);
        const axisRgt = b2Normalize(new b2Vec2(1, 1));
        cnvPrisRgt = attachPrismatic(groundId, cnvPusherRgt, new b2Vec2(50.35 + x, -22.5 + y), 45, axisRgt, worldId);
    }


    // squidgy donuts
    makeDonutWeld(-25, 20, worldId, 5.0, 3.0, 0.1, b2HexColor.b2_colorOrange);
    makeDonutWeld(25, 20, worldId, 5.0, 3.0, 0.1, b2HexColor.b2_colorOrangeRed);
    makeDonutWeld(0, 30, worldId, 6.0, 4.5, 0.02, b2HexColor.b2_colorAzure);


    // falling boxes
    let boxes = [];
    for (let x = -50; x <= 50; x += 5)
    {
        let box = dropBox(x, worldId, 2.25, 0.25);
        b2Body_SetUserData(box, box);
        boxes.push(box);
    }


    // distance joints
    let ball0 = CreateCircle({ position: new b2Vec2(0, 50), type: b2BodyType.b2_dynamicBody, radius: 2.0, density: 1.0, friction: 0.2, color: b2HexColor.b2_colorRebeccaPurple, worldId: worldId });
    let ball1 = CreateCircle({ position: new b2Vec2(5, 50), type: b2BodyType.b2_dynamicBody, radius: 2.0, density: 1.0, friction: 0.2, color: b2HexColor.b2_colorMediumPurple, worldId: worldId });
    let ball2 = CreateCircle({ position: new b2Vec2(0, 55), type: b2BodyType.b2_dynamicBody, radius: 2.0, density: 1.0, friction: 0.2, color: b2HexColor.b2_colorMediumPurple, worldId: worldId });
    let ball3 = CreateCircle({ position: new b2Vec2(-5, 50), type: b2BodyType.b2_dynamicBody, radius: 2.0, density: 1.0, friction: 0.2, color: b2HexColor.b2_colorMediumPurple, worldId: worldId });
    let ball4 = CreateCircle({ position: new b2Vec2(0, 45), type: b2BodyType.b2_dynamicBody, radius: 2.0, density: 1.0, friction: 0.2, color: b2HexColor.b2_colorMediumPurple, worldId: worldId });
    CreateDistanceJoint({ worldId: worldId, bodyIdA: ball0.bodyId, bodyIdB: ball1.bodyId, length: 5.0, collideConnected: true });
    CreateDistanceJoint({ worldId: worldId, bodyIdA: ball0.bodyId, bodyIdB: ball2.bodyId, length: 5.0, collideConnected: true });
    CreateDistanceJoint({ worldId: worldId, bodyIdA: ball0.bodyId, bodyIdB: ball3.bodyId, length: 5.0, collideConnected: true });
    CreateDistanceJoint({ worldId: worldId, bodyIdA: ball0.bodyId, bodyIdB: ball4.bodyId, length: 5.0, collideConnected: true });


    // motor joint
    //let motorBox = CreateBoxPolygon({ worldId: worldId, position: new b2Vec2(-80, 15), type: b2BodyType.b2_dynamicBody, size: 6, density: 1.0, friction: 0.7, color: b2HexColor.b2_colorChartreuse });
    //CreateMotorJoint({ worldId: worldId, bodyIdA: groundId, bodyIdB: motorBox.bodyId, linearOffset: new b2Vec2(-80, 35), angularOffset: -Math.PI / 2, maxForce: 50000, maxTorque: 50000, correctionFactor: 0.01 });

    // tick
    let frameCount = 0;
    let lastBox = 0;

    function update(deltaTime, currentTime, currentFps) {

        // stepTime is how much time we spent processing physics alone
        const stepTime = WorldStep({ worldId: worldId, deltaTime: deltaTime });

        // destroy certain objects when they touch the sensor at the bottom
        destroyAtSensor(worldId, [gun, gunLeft, gunRight], boxes);

        // move the prismatic joint up or down
        b2PrismaticJoint_EnableMotor(cnvPrisLft, (currentTime % 10 < 5));
        b2PrismaticJoint_EnableMotor(cnvPrisRgt, (currentTime % 10 > 5));
        b2Joint_WakeBodies(cnvPrisLft);
        b2Joint_WakeBodies(cnvPrisRgt);

        // slide gun left and right
        gunPan = Math.sin(currentTime * 0.15) * 20;
        gun.position.x = gunPan;
        gun.color = Math.floor((Math.sin(currentTime * 0.1) + 1) / 2 * 0xffffff);
        gun.update(deltaTime);
        gunLeft.update(deltaTime);
        gunRight.update(deltaTime);

        if (boxes.length < 150 && currentTime - lastBox > 0.25)
        {
            if (currentFps > 60)
            {
                // make a new box at the top
                let newBox = dropBox(Math.random() * 200 - 100, worldId, Math.random() * 2.0 + 1.0, Math.random() * 3.0 + 0.1);
                b2Body_SetUserData(newBox, newBox);
                boxes.push(newBox);
            }
            // reset time for next box even if we skipped (don't spam the instant the fps falls in range)
            lastBox = currentTime;
        }

        // debug drawing
        if (ctx && canvas && stepTime > 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            b2World_Draw(worldId, m_draw);
        }

        // on-screen stats
        if (ctx) {
            ctx.fillStyle = 'white';
            ctx.font = '24px Arial';
            ctx.fillText(`FPS: ${ currentFps } BALLS: ${ gun.activeBalls.length } BOXES: ${ boxes.length }`, 10, 20);
        }

        frameCount++;
    }

    RAF(update);
}

m_drawScale = 6.4;
setTimeout(() => testWorld(), 50);

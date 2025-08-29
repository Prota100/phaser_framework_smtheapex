import * as Phaser from '../lib/phaser.esm.js';

import { CreateBoxPolygon, CreateCapsule, CreateWorld, GetWorldScale, SetWorldScale, WorldStep, b2World_Draw, pxm } from '../lib/PhaserBox2D.js';
import { DYNAMIC, STATIC, b2Vec2, pxmVec2 } from '../lib/PhaserBox2D.js';
import { b2DefaultBodyDef, b2DefaultShapeDef, b2DefaultWorldDef, b2HexColor } from '../lib/PhaserBox2D.js';

import { PhaserDebugDraw } from './PhaserDebugDraw.js';

class Example extends Phaser.Scene
{
    constructor ()
    {
        super();
    }

    create ()
    {
        SetWorldScale(40);

        const debug = this.add.graphics();

        const world = CreateWorld({ worldDef: b2DefaultWorldDef() });

        const worldId = world.worldId;

        CreateCapsule({
            worldId,
            type: DYNAMIC,
            position: pxmVec2(240, 0),
            width: pxm(32),
            height: pxm(128),
            density: 1.0,
            friction: 0.05,
            color: b2HexColor.b2_colorSpringGreen,
            linearDamping: 0.1,
        });

        CreateCapsule({
            worldId,
            type: DYNAMIC,
            position: pxmVec2(340, 0),
            width: pxm(64),
            height: pxm(256),
            density: 1.0,
            friction: 0.05,
            color: b2HexColor.b2_colorTurquoise,
            linearDamping: 0.1,
        });

        CreateCapsule({
            worldId,
            type: DYNAMIC,
            position: pxmVec2(480, 0),
            width: pxm(128),
            height: pxm(220),
            density: 1.0,
            friction: 0.05,
            color: b2HexColor.b2_colorYellowGreen,
            linearDamping: 0.1,
        });

        CreateCapsule({
            worldId,
            type: DYNAMIC,
            position: pxmVec2(570, 0),
            width: pxm(16),
            height: pxm(32),
            density: 1.0,
            friction: 0.05,
            color: b2HexColor.b2_colorSandyBrown,
            linearDamping: 0.1,
        });

        CreateBoxPolygon({ worldId, type: STATIC, bodyDef: b2DefaultBodyDef(), position: pxmVec2(640, -600), size: new b2Vec2(20, 1), density: 1.0, friction: 0.5, color: b2HexColor.b2_colorLawnGreen });

        this.world = world;
        this.debug = debug;

        this.worldDraw = new PhaserDebugDraw(debug, 1280, 720, GetWorldScale());
    }

    update (time, delta)
    {
        const worldId = this.world.worldId;

        WorldStep({ worldId, deltaTime: delta });

        this.debug.clear();

        b2World_Draw(worldId, this.worldDraw);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    scene: Example
};

const game = new Phaser.Game(config);

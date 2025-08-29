import * as Phaser from '../lib/phaser.esm.js';

import { CreateBoxPolygon, CreateCircle, CreateWorld, GetWorldScale, SetWorldScale, WorldStep, b2World_Draw } from '../lib/PhaserBox2D.js';
import { DYNAMIC, RotFromRad, STATIC, b2Rot, b2Vec2, pxm, pxmVec2 } from '../lib/PhaserBox2D.js';
import { b2BodyType, b2DefaultBodyDef, b2DefaultWorldDef, b2HexColor } from '../lib/PhaserBox2D.js';

import { PhaserDebugDraw } from './PhaserDebugDraw.js';

class Example extends Phaser.Scene
{
    constructor ()
    {
        super();
    }

    create ()
    {
        SetWorldScale(30);

        const debug = this.add.graphics();

        const world = CreateWorld({ worldDef: b2DefaultWorldDef() });

        const worldId = world.worldId;

        CreateBoxPolygon({ worldId, type: DYNAMIC, position: pxmVec2(630, 64), size: 1, density: 1.0, friction: 0.2, color: b2HexColor.b2_colorGold });

        CreateCircle({ worldId, type: DYNAMIC, position: pxmVec2(690, 0), radius: 1, density: 1.0, friction: 0.5, color: b2HexColor.b2_colorRed });

        const groundBodyDef = b2DefaultBodyDef();

        groundBodyDef.rotation = RotFromRad(-0.06);

        CreateBoxPolygon({ worldId, type: STATIC, bodyDef: groundBodyDef, position: pxmVec2(640, -600), size: new b2Vec2(20, 1), density: 1.0, friction: 0.5, color: b2HexColor.b2_colorLawnGreen });

        this.input.on('pointerdown', pointer => {

            CreateBoxPolygon({ worldId, type: DYNAMIC, position: pxmVec2(pointer.worldX, 0), size: pxm(Phaser.Math.Between(8, 32)), density: 1.0, friction: 0.25, color: b2HexColor.b2_colorBlue });

        });

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

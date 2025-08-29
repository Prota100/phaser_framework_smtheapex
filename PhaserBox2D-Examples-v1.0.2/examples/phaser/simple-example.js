import * as Phaser from '../lib/phaser.esm.js';

import { CreateBoxPolygon, CreateCapsule, CreateCircle, CreateWorld, GetWorldScale, SetWorldScale, WorldStep, b2World_Draw } from '../lib/PhaserBox2D.js';
import { DYNAMIC, RotFromRad, STATIC, b2Vec2, pxmVec2 } from '../lib/PhaserBox2D.js';
import { b2DefaultBodyDef, b2DefaultWorldDef, b2HexColor } from '../lib/PhaserBox2D.js';

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

        CreateBoxPolygon({ worldId, type: DYNAMIC, position: pxmVec2(630, 64), size: 1, density: 1.0, friction: 0.2, color: b2HexColor.b2_colorGold });

        CreateCircle({ worldId, type: DYNAMIC, position: pxmVec2(690, 0), radius: 1, density: 1.0, friction: 0.5, color: b2HexColor.b2_colorRed });

        const radius = 0.85;
        const height = 6.0;

        CreateCapsule({
            worldId,
            type: DYNAMIC,
            position: pxmVec2(400, 0),
            center1: new b2Vec2(0, -0.5 * height + radius),
            center2: new b2Vec2(0, 0.5 * height - radius),
            radius: radius,
            density: 1.0,
            friction: 0.05,
            color: b2HexColor.b2_colorSalmon,
            linearDamping: 0.1,
        });

        const groundBodyDef = b2DefaultBodyDef();

        groundBodyDef.rotation = RotFromRad(-0.06);

        CreateBoxPolygon({ worldId, type: STATIC, bodyDef: groundBodyDef, position: pxmVec2(640, -600), size: new b2Vec2(20, 1), density: 1.0, friction: 0.5, color: b2HexColor.b2_colorLawnGreen });

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

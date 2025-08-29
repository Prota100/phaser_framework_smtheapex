import * as Phaser from '../lib/phaser.esm.js';

import { CreateBoxPolygon, CreateCircle, CreateWorld, GetWorldScale, SetWorldScale, WorldStep, b2World_Draw, pxm } from '../lib/PhaserBox2D.js';
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

        const worldDef = b2DefaultWorldDef();

        const world = CreateWorld({ worldDef });

        const worldId = world.worldId;

        for (let i = 0; i < 16; i++)
        {
            const shapeDef = b2DefaultShapeDef();

            shapeDef.restitution = (i / 16);

            CreateCircle({
                worldId,
                shapeDef,
                type: DYNAMIC,
                position: pxmVec2(100 + i * 64, 64),
                radius: pxm(30),
                density: 1.0,
                friction: 0.5,
                color: b2HexColor.b2_colorRed
            });
        }

        const shapeDef = b2DefaultShapeDef();

        shapeDef.restitution = 0.50;
        
        CreateBoxPolygon({ worldId, shapeDef, type: STATIC, bodyDef: b2DefaultBodyDef(), position: pxmVec2(640, -600), size: new b2Vec2(20, 1), density: 1.0, friction: 0.5, color: b2HexColor.b2_colorLawnGreen });

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

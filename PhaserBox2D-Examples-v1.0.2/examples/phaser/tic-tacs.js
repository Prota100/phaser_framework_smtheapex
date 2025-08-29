import * as Phaser from '../lib/phaser.esm.js';

import { CreateBoxPolygon, CreateCapsule, CreateWorld, GetWorldScale, SetWorldScale, WorldStep, b2World_Draw, pxm } from '../lib/PhaserBox2D.js';
import { DYNAMIC, STATIC, b2Vec2, pxmVec2 } from '../lib/PhaserBox2D.js';
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

        const colors = [
            'b2_colorAliceBlue',
            'b2_colorAqua',
            'b2_colorAquamarine',
            'b2_colorAzure',
            'b2_colorBisque',
            'b2_colorBlanchedAlmond',
            'b2_colorBlue',
            'b2_colorBlueViolet',
            'b2_colorBrown',
            'b2_colorBurlywood',
            'b2_colorCadetBlue',
            'b2_colorChartreuse',
            'b2_colorChocolate',
            'b2_colorCoral',
            'b2_colorCornflowerBlue',
            'b2_colorCornsilk',
            'b2_colorCrimson',
            'b2_colorCyan',
            'b2_colorDodgerBlue',
            'b2_colorFirebrick',
            'b2_colorForestGreen',
            'b2_colorFuchsia',
            'b2_colorLavenderBlush',
            'b2_colorLawnGreen',
            'b2_colorLemonChiffon',
            'b2_colorLightBlue',
            'b2_colorLightCoral',
            'b2_colorLightCyan',
            'b2_colorLightGoldenrod',
            'b2_colorLightGoldenrodYellow',
            'b2_colorLightGreen',
            'b2_colorLightPink',
            'b2_colorLightSalmon',
            'b2_colorLightSeaGreen',
            'b2_colorLightSkyBlue',
            'b2_colorLightSlateBlue',
            'b2_colorLightSteelBlue',
            'b2_colorLightYellow'
        ];

        for (let i = 0; i < 200; i++)
        {
            CreateCapsule({
                worldId,
                type: DYNAMIC,
                position: pxmVec2(640 + Phaser.Math.Between(-300, 300), Phaser.Math.Between(0, 3000)),
                width: pxm(12),
                height: pxm(26),
                friction: 0.2,
                color: b2HexColor[colors[Phaser.Math.Between(0, colors.length - 1)]]
            });
        }

        CreateBoxPolygon({ worldId, type: STATIC, bodyDef: b2DefaultBodyDef(), position: pxmVec2(640, -650), size: new b2Vec2(20, 1), friction: 0.5, color: b2HexColor.b2_colorLawnGreen });

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

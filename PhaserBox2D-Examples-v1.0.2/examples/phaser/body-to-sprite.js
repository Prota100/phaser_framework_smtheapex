import * as Phaser from '../lib/phaser.esm.js';

import { BodyToSprite, GetWorldScale, RotFromRad, SetWorldScale, mpx, pxm, pxmVec2 } from '../lib/PhaserBox2D.js';
import { CreateBoxPolygon, CreateCircle, CreateWorld, DYNAMIC, STATIC, WorldStep, b2World_Draw } from '../lib/PhaserBox2D.js';
import { b2DefaultBodyDef, b2DefaultWorldDef, b2HexColor } from '../lib/PhaserBox2D.js';

import { PhaserDebugDraw } from './PhaserDebugDraw.js';

class Example extends Phaser.Scene
{
    constructor ()
    {
        super();
    }

    preload ()
    {
        this.load.image('sky', '../resources/images/sky.png');
        this.load.image('block', '../resources/images/crate.png');
        this.load.image('bomb', '../resources/images/bombstar.png');
        this.load.image('platform', '../resources/images/platform.png');
    }

    create ()
    {
        SetWorldScale(30);

        this.add.image(640, 360, 'sky');

        this.sprite1 = this.add.sprite(0, 0, 'block');
        this.sprite2 = this.add.sprite(0, 0, 'bomb').setScale(0.25);
        this.platform = this.add.sprite(640, 600, 'platform').setRotation(-0.06);

        const debug = this.add.graphics().setVisible(false);

        const world = CreateWorld({ worldDef: b2DefaultWorldDef() });

        const worldId = world.worldId;

        this.box = CreateBoxPolygon({ worldId, type: DYNAMIC, position: pxmVec2(630, 64), size: pxm(32), density: 1.0, friction: 0.25, color: b2HexColor.b2_colorGold });

        this.circle = CreateCircle({ worldId, type: DYNAMIC, position: pxmVec2(690, 0), radius: pxm(32), density: 1.2, friction: 0.5, color: b2HexColor.b2_colorRed });

        const groundBodyDef = b2DefaultBodyDef();

        groundBodyDef.rotation = RotFromRad(-0.06);

        CreateBoxPolygon({ worldId, type: STATIC, bodyDef: groundBodyDef, position: pxmVec2(640, -600), size: pxmVec2(256, 40), density: 1.0, friction: 0.5, color: b2HexColor.b2_colorLawnGreen });

        this.world = world;
        this.debug = debug;

        this.worldDraw = new PhaserDebugDraw(debug, 1280, 720, GetWorldScale());

        //  Press D to toggle debug draw
        this.input.keyboard.on('keydown-D', event => {
            debug.visible = !debug.visible;
        });
    }

    update (time, delta)
    {
        const worldId = this.world.worldId;

        WorldStep({ worldId, deltaTime: delta });

        if (this.debug.visible)
        {
            this.debug.clear();
            b2World_Draw(worldId, this.worldDraw);
        }

        BodyToSprite(this.box, this.sprite1);
        BodyToSprite(this.circle, this.sprite2);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    scene: Example
};

const game = new Phaser.Game(config);

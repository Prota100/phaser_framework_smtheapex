import * as Phaser from '../lib/phaser.esm.js';

import { AddSpriteToWorld, BodyToSprite, GetWorldScale, SetWorldScale, SpriteToBox, UpdateWorldSprites } from '../lib/PhaserBox2D.js';
import { CreateWorld, STATIC, WorldStep, b2World_Draw } from '../lib/PhaserBox2D.js';

import { PhaserDebugDraw } from './PhaserDebugDraw.js';
import { b2DefaultWorldDef } from '../lib/PhaserBox2D.js';

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

        const block = this.add.sprite(640, 90, 'block');
        const platform = this.add.sprite(640, 600, 'platform').setRotation(0.06).setScale(1.5);

        const debug = this.add.graphics().setVisible(false);

        const world = CreateWorld({ worldDef: b2DefaultWorldDef() });

        const worldId = world.worldId;

        const box = SpriteToBox(worldId, block, {
            restitution: 0.7,
            friction: 0.1
        });

        AddSpriteToWorld(worldId, block, box);

        SpriteToBox(worldId, platform, {
            type: STATIC,
            friction: 0.1
        });

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

        UpdateWorldSprites(worldId);

        if (this.debug.visible)
        {
            this.debug.clear();
            b2World_Draw(worldId, this.worldDraw);
        }
    }
}

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    scene: Example
};

const game = new Phaser.Game(config);

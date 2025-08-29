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
        this.load.image('floor', '../resources/images/metal-floor.png');
        this.load.atlas('blocks', '../resources/images/blocks.png', '../resources/images/blocks.json');
    }

    create ()
    {
        SetWorldScale(20);

        const worldDef = b2DefaultWorldDef();

        worldDef.gravity.y = -6;

        const world = CreateWorld({ worldDef });
        const worldId = world.worldId;

        this.add.image(640, 360, 'sky');

        const platform1 = this.add.image(300, 600, 'floor').setRotation(0.06);

        SpriteToBox(worldId, platform1, {
            type: STATIC,
            friction: 0.1
        });

        const platform2 = this.add.image(880, 620, 'floor').setRotation(-0.1);

        SpriteToBox(worldId, platform2, {
            type: STATIC,
            friction: 0.1
        });

        const frames = [ "metal", "redmonster", "yellowmonster", "wooden", "platform", "platform-round" ];

        for (let i = 0; i < 500; i++)
        {
            const block = this.add.image(Phaser.Math.Between(200, 1080), Phaser.Math.Between(-10000, 0), 'blocks', frames[i % frames.length]).setScale(0.25);

            const box = SpriteToBox(worldId, block, {
                restitution: 0.7,
                friction: 0.1
            });

            AddSpriteToWorld(worldId, block, box);
        }

        this.world = world;

        this.debug = this.add.graphics().setVisible(false);

        this.worldDraw = new PhaserDebugDraw(this.debug, 1280, 720, GetWorldScale());

        //  Press D to toggle debug draw
        this.input.keyboard.on('keydown-D', () => {
            this.debug.visible = !this.debug.visible;
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

import * as Phaser from '../lib/phaser.esm.js';

import { AddSpriteToWorld, BodyToSprite, CreateBoxPolygon, CreateCircle, CreateMouseJoint, GetWorldScale, SetWorldScale, SpriteToBox, UpdateWorldSprites, b2Body_GetTransform, b2Body_SetTransform, b2DestroyJoint, b2Joint_IsValid, b2MouseJoint_SetTarget } from '../lib/PhaserBox2D.js';
import { CreateWorld, STATIC, WorldStep, b2World_Draw } from '../lib/PhaserBox2D.js';
import { b2DefaultWorldDef, pxmVec2 } from '../lib/PhaserBox2D.js';

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

        // this.add.image(640, 360, 'sky');

        const platform1 = this.add.image(300, 650, 'floor');

        SpriteToBox(worldId, platform1, {
            type: STATIC,
            friction: 0.5
        });

        const platform2 = this.add.image(812, 650, 'floor');

        SpriteToBox(worldId, platform2, {
            type: STATIC,
            friction: 0.5
        });

        const block = this.add.image(640, 300, 'blocks', 'yellowmonster').setInteractive();

        const box = SpriteToBox(worldId, block, {
            restitution: 0.5,
            friction: 0.1
        });

        AddSpriteToWorld(worldId, block, box);

        const mouseBody = CreateCircle({ worldId, type: STATIC, radius: 0.3 });

        let mouseJoint = null;

        block.on('pointerdown', pointer => {

            mouseJoint = CreateMouseJoint({ worldId,
                bodyIdA: mouseBody.bodyId,
                bodyIdB: box.bodyId,
                collideConnected: false,
                maxForce: 35000,
                hertz: 5.0,
                dampingRatio: 0.9,
                target: pxmVec2(pointer.worldX, -pointer.worldY)
            });

            console.log('created', mouseJoint.jointId);

        });

        this.input.on('pointermove', pointer => {

            if (mouseJoint && b2Joint_IsValid(mouseJoint.jointId))
            {
                const xf = b2Body_GetTransform(mouseBody.bodyId);

                //  Optional, but a much better 'feel'
                b2Body_SetTransform(mouseBody.bodyId, pxmVec2(pointer.worldX, -pointer.worldY), xf.q);

                b2MouseJoint_SetTarget(mouseJoint.jointId, pxmVec2(pointer.worldX, -pointer.worldY));
            }

        });

        this.input.on('pointerup', pointer => {

            if (mouseJoint)
            {
                b2DestroyJoint(mouseJoint.jointId);
                mouseJoint = null;
                console.log('destroyed');
            }

        });

        this.world = world;

        this.debug = this.add.graphics().setVisible(true);

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

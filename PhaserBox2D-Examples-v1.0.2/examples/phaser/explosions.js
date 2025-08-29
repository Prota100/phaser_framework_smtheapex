/*
🎮 **Physics Chain Reaction**

Unleash chaos in this explosive physics playground!
Watch as 1,000 meticulously arranged objects - golden boxes and crimson spheres - dance to the laws of physics.
Click anywhere to trigger spectacular chain reactions, sending shockwaves that ripple through the confined space.
Every explosion creates a unique pattern of destruction, making each interaction a one-of-a-kind physics spectacle.

Perfect for physics enthusiasts and anyone who just wants to watch things go boom! 💥
*/

import * as Phaser from '../lib/phaser.esm.js';

import { CreateBoxPolygon, CreateCircle, CreateWorld, GetWorldScale, SetWorldScale, WorldStep, b2World_Draw, b2World_Explode } from '../lib/PhaserBox2D.js';
import { DYNAMIC, RotFromRad, STATIC, b2Vec2, pxm, pxmVec2 } from '../lib/PhaserBox2D.js';
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
        this.shapeCount = 0;

        SetWorldScale(30);

        const debug = this.add.graphics();

        const world = CreateWorld({ worldDef: b2DefaultWorldDef() });

        const worldId = world.worldId;

        const groundBodyDef = b2DefaultBodyDef();
        CreateBoxPolygon({ worldId, type: STATIC, bodyDef: groundBodyDef, position: pxmVec2(640, -700), size: new b2Vec2(22, 1), density: 1.0, friction: 0.5, restitution: 0.0, color: b2HexColor.b2_colorLawnGreen });
        CreateBoxPolygon({ worldId, type: STATIC, bodyDef: groundBodyDef, position: pxmVec2(640, 0), size: new b2Vec2(22, 1), density: 1.0, friction: 0.5, restitution: 0.0, color: b2HexColor.b2_colorLawnGreen });
        CreateBoxPolygon({ worldId, type: STATIC, bodyDef: groundBodyDef, position: pxmVec2(0, -350), size: new b2Vec2(1, 10.6), density: 1.0, friction: 0.5, restitution: 0.0, color: b2HexColor.b2_colorLawnGreen });
        CreateBoxPolygon({ worldId, type: STATIC, bodyDef: groundBodyDef, position: pxmVec2(1280, -350), size: new b2Vec2(1, 10.6), density: 1.0, friction: 0.5, restitution: 0.0, color: b2HexColor.b2_colorLawnGreen });

        // pixel y coordinates range from 0 to -700 ish... I don't know why they're negative...
        const num = 500;
        for(let i = 0; i < num; i++)
        {
            CreateBoxPolygon({ worldId, type: DYNAMIC, position: pxmVec2((1280 - num) / 2 + i, -350), size: 0.3, density: 1.0, friction: 0.2, restitution: 0.0, color: b2HexColor.b2_colorGold });
            this.shapeCount++;
            
            CreateCircle({ worldId, type: DYNAMIC, position: pxmVec2(640, -(700 - num) / 2 - i), radius: 0.3, density: 1.0, friction: 0.5, restitution: 0.0, color: b2HexColor.b2_colorRed });
            this.shapeCount++;
        }

        this.input.on('pointerdown', pointer => {

            b2World_Explode(worldId, pxmVec2(pointer.worldX, -pointer.worldY), pxm(100), 10.0);

        });

        this.world = world;
        this.debug = debug;

        this.worldDraw = new PhaserDebugDraw(debug, 1280, 720, GetWorldScale());

        this.helpLabel = this.add.text(10, 10, 'CLICK FOR BOOMS', { font: '32px Arial', fill: '#ffffff' });
        this.fpsLabel = this.add.text(10, 40, 'FPS: 0', { font: '32px Arial', fill: '#ffffff' });
    }

    update (time, delta)
    {
        const worldId = this.world.worldId;

        WorldStep({ worldId, deltaTime: delta });

        this.debug.clear();

        b2World_Draw(worldId, this.worldDraw);

        // Draw FPS counter
        this.fpsLabel.text = `FPS: ${Math.round(1000 / delta)}`;
    }
}

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    scene: Example
};

const game = new Phaser.Game(config);

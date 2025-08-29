import * as Phaser from '../lib/phaser.esm.js';
import { 
    CreateWorld, 
    SpriteToBox, 
    AddSpriteToWorld, 
    UpdateWorldSprites, 
    WorldStep, 
    SetWorldScale, 
    b2Vec2, 
    b2Body_ApplyLinearImpulseToCenter,
    GetWorldScale,
    b2World_Draw,
    SpriteToCircle,
    pxm,
    b2Body_GetMass,
    b2DefaultWorldDef
} from '../lib/PhaserBox2D.js';

import { PhaserDebugDraw } from './PhaserDebugDraw.js';

const calculateDensityFromMass = (mass, radius) => {
    const area = Math.PI * Math.pow(radius, 2);
    return mass / area;
}

class Example extends Phaser.Scene
{
    preload ()
    {
        this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image('block', 'https://labs.phaser.io/assets/sprites/block.png');
        this.load.image('ball', 'https://labs.phaser.io/assets/sprites/shinyball.png');
    }

    create ()
    {

        this.debug = this.add.graphics().setVisible(false);
        this.worldDraw = new PhaserDebugDraw(this.debug, 1280, 720, GetWorldScale());

        // Set up world scaling and create the Box2D world
        SetWorldScale(30);
        const worldDef = b2DefaultWorldDef();
        worldDef.gravity = new b2Vec2(0, 0);
        
        const world = CreateWorld({ worldDef });
        this.worldId = world.worldId;

        // Create blocks as static bodies
        const blocks = [];
        for (let i = 0; i < 5; i++)
        {
            const x = 400;
            const y = 100 + i * 100;
            const block = this.add.image(x, y, 'block');
            const blockBody = SpriteToBox(this.worldId, block, {
                restitution: 0.5,
                friction: 0.5
            });
            AddSpriteToWorld(this.worldId, block, blockBody);
            blocks.push({ sprite: block, body: blockBody });
        }

        // Create balls with varying masses
        const balls = [];
        const masses = [0.1, 0.5, 1, 5, 10];
        masses.forEach((mass, i) => {

            const x = 100;
            const y = 100 + i * 100;
            const ball = this.add.image(x, y, 'ball');

            // Scale the ball based on its mass
            const scale = Math.cbrt(mass);
            ball.setScale(scale);
            
            const ballBody = SpriteToCircle(this.worldId, ball, {
                radius: pxm(ball.displayWidth / 2),
                restitution: 0.7,
                friction: 0.2,
                density: calculateDensityFromMass(mass, pxm(ball.displayWidth / 2))
            });

            // Apply an impulse to the ball
            const massBody = b2Body_GetMass(ballBody.bodyId);
            const acceleration = 1;
            const impulse = new b2Vec2(acceleration * massBody, 0);
            b2Body_ApplyLinearImpulseToCenter(ballBody.bodyId, impulse, true); // Apply an impulse to the ball

            // Add the ball and its body to the physics world
            AddSpriteToWorld(this.worldId, ball, ballBody);
            balls.push({ sprite: ball, body: ballBody });
        });

        this.blocks = blocks;
        this.balls = balls;

        //  Press D to toggle debug draw
        this.input.keyboard.on('keydown-D', () => {
            this.debug.visible = !this.debug.visible;
        });
    }

    update (time, delta)
    {
        // Step the physics simulation
        WorldStep({ worldId: this.worldId, deltaTime: delta });
        UpdateWorldSprites(this.worldId);

        if (this.debug.visible)
        {
            this.debug.clear();
            b2World_Draw(this.worldId, this.worldDraw);
        }
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    scene: Example
};

new Phaser.Game(config);

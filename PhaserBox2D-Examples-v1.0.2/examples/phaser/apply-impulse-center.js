import * as Phaser from '../lib/phaser.esm.js';
import {
    b2Vec2,
    CreateWorld,
    SpriteToBox,
    b2Body_ApplyForceToCenter,
    WorldStep,
    UpdateWorldSprites,
    b2DefaultWorldDef,
    AddSpriteToWorld
} from '../lib/PhaserBox2D.js';

class Example extends Phaser.Scene
{
    preload ()
    {
        // Load the block image
        this.load.image('block', '../resources/images/block.png');

        // Load the explosion sprite sheet
        this.load.spritesheet('boom', '../resources/images/explosion.png', { frameWidth: 64, frameHeight: 64, endFrame: 23 });
    }

    create ()
    {
        // Create the physics world with no gravity
        const worldDef = b2DefaultWorldDef();
        worldDef.gravity = new b2Vec2(0, 0);
        this.world = CreateWorld({ worldDef });
        this.worldId = this.world.worldId;

        // Define an explosion animation
        this.anims.create({
            key: 'explode',
            frames: 'boom',
            frameRate: 20,
            showOnStart: true,
            hideOnComplete: true
        });

        // Create dynamic blocks
        this.blocks = [];
        for (let i = 0; i < 20; i++)
        {
            // Randomize block position within the screen bounds
            const x = Phaser.Math.Between(100, this.scale.width - 100);
            const y = Phaser.Math.Between(100, this.scale.height - 100);
            const block = this.add.image(x, y, 'block').setScale(1);

            // Assign random mass and physical properties
            const mass = Phaser.Math.Between(1, 2);
            const body = SpriteToBox(this.worldId, block, {
                restitution: 1,
                friction: 0.2,
                linearDamping: 0.5,
                angularDamping: 0.5
            });

            body.mass = mass;

            // Add the block and its body to the physics world
            AddSpriteToWorld(this.worldId, block, body);
            this.blocks.push({ sprite: block, body });
        }

        // Create the explosion sprite (hidden by default)
        const boom = this.add.sprite(0, 0, 'boom').setBlendMode('ADD').setScale(4).setVisible(false);

        // Handle mouse clicks to trigger explosions
        this.input.on('pointerdown', (pointer) =>
        {
            // Show and play the explosion animation at the pointer's position
            boom.copyPosition(pointer).play('explode');

            // Define the explosion's center point
            const explosionPoint = new b2Vec2(pointer.x, pointer.y);

            // Apply forces to each block based on their distance from the explosion
            for (const { sprite, body } of this.blocks)
            {
                const spritePosition = new Phaser.Math.Vector2(sprite.x, sprite.y);
                const distance = new Phaser.Math.Vector2(spritePosition.x - explosionPoint.x, spritePosition.y - explosionPoint.y);
                
                const length = distance.length();

                // Skip if the block is exactly at the explosion point
                if (length === 0) continue;

                // Calculate the force magnitude inversely proportional to the distance
                const magnitude = 50000 / length;
                let force = new Phaser.Math.Vector2(magnitude * distance.x / Math.sqrt(length), magnitude * distance.y / Math.sqrt(length));

                // Convert force to Box2D format and invert the Y-axis
                const forceVec2 = new b2Vec2(force.x, -1 * force.y);

                // Apply the calculated force to the block's body
                b2Body_ApplyForceToCenter(body.bodyId, forceVec2, true);
            }
        });
    }

    update (time, delta)
    {
        // Update the physics world and synchronize the sprites
        if (this.world)
        {
            WorldStep({ worldId: this.worldId, deltaTime: delta });
            UpdateWorldSprites(this.worldId);
        }
    }
}

// Game configuration
const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    scene: Example
};

// Create and start the Phaser game
new Phaser.Game(config);

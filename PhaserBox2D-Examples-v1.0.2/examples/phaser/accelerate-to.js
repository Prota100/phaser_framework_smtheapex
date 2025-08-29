import * as Phaser from '../lib/phaser.esm.js';
import
{
    AddSpriteToWorld,
    b2DefaultWorldDef,
    b2Vec2,
    CreateWorld,
    SpriteToBox,
    UpdateWorldSprites,
    WorldStep,
    b2Body_ApplyForceToCenter,
    b2MulSV,
    b2Normalize,
    b2Sub,
} from '../lib/PhaserBox2D.js';

export class Example extends Phaser.Scene 
{
    angularImpulse = 0;         // Current angular impulse applied to the wheel
    angularAcceleration = 100; // Rate of change for angular impulse
    maxAngularImpulse = 2000;  // Maximum allowable angular impulse

    constructor() 
    {
        super();
    }

    preload () 
    {
        this.load.image('flower', '../resources/images/flower-exo.png');
        this.load.image('cursor', '../resources/images/drawcursor.png');
    }

    create () 
    {
        // Configure the physics world with no gravity
        const worldDef = b2DefaultWorldDef();
        worldDef.gravity = new b2Vec2(0, 0);

        this.world = CreateWorld({ worldDef });
        this.worldId = this.world.worldId;

        this.flowerSprite = this.add.image(100, 300, 'flower');
        this.flowerBody = SpriteToBox(this.worldId, this.flowerSprite, {
            restitution: 0,
            friction: 0.5,
            angularDamping: 1,
        });

        this.flowerBodyId = this.flowerBody.bodyId;

        AddSpriteToWorld(this.worldId, this.flowerSprite, this.flowerBody);

        this.cursor = this.add.image(0, 0, 'cursor').setVisible(false);

        this.add.text(10, 10, 'Click to set target', { fill: '#00ff00' });

        this.input.on('pointerdown', this.setTarget, this);
    }

    setTarget (pointer)
    {
        this.cursor.copyPosition(pointer).setVisible(true);
    }

    accelerateTo ()
    {
        if (!this.cursor.visible) return;
        const force = 10;
        const targetPosition = { x: this.cursor.x, y: this.cursor.y };
        const spritePosition = { x: this.flowerSprite.x, y: this.flowerSprite.y };
        const normalized = b2Normalize(b2Sub(targetPosition, spritePosition));
        normalized.y *= -1;
        const forceToApply = b2MulSV(force, normalized);
        b2Body_ApplyForceToCenter(this.flowerBodyId, forceToApply);
    }

    update (time, delta) 
    {
        // Step the physics world and update sprite positions
        if (this.world) 
        {
            WorldStep({ worldId: this.worldId, deltaTime: delta });
            UpdateWorldSprites(this.worldId);

            this.accelerateTo();
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

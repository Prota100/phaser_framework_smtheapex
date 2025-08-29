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
    b2Body_SetLinearVelocity,
    b2Body_SetAngularVelocity,
    b2Body_ApplyAngularImpulse,
    b2Body_GetRotation,
    b2Body_ApplyForceToCenter
} from '../lib/PhaserBox2D.js';

export class Example extends Phaser.Scene 
{
    VELOCITY = 5;

    constructor() 
    {
        super();
    }

    preload () 
    {
        this.load.image('clouds', '../resources/images/clouds.png');
        this.load.image('plane', '../resources/images/ww2plane90.png');
    }

    create () 
    {
        // Configure the physics world with no gravity
        const worldDef = b2DefaultWorldDef();
        worldDef.gravity = new b2Vec2(0, 0);

        this.world = CreateWorld({ worldDef });
        this.worldId = this.world.worldId;
        this.worldBounds = new Phaser.Geom.Rectangle(0, 0, this.scale.width, this.scale.height)

        this.add.image(0, 0, 'clouds').setOrigin(0, 0).setDisplaySize(1280, 1280);

        this.planeSprite = this.add.image(this.scale.width * 0.5, this.scale.height * 0.5, 'plane');

        this.planeBody = SpriteToBox(this.worldId, this.planeSprite, {
            restitution: 1.03,
            friction: 0.5,
        });

        this.planeBodyId = this.planeBody.bodyId;

        AddSpriteToWorld(this.worldId, this.planeSprite, this.planeBody);
        this.cursors = this.input.keyboard.createCursorKeys();
    }

    handleInput ()
    {
        const { left, right, up } = this.cursors;

        if (left.isDown) 
        {
            const radians = Phaser.Math.DegToRad(60);
            b2Body_SetAngularVelocity(this.planeBodyId, radians);
        }
        else if (right.isDown) 
        {
            const radians = Phaser.Math.DegToRad(-60);
            b2Body_SetAngularVelocity(this.planeBodyId, radians);
        }
        else if (up.isDown) 
        {
            const radians = Phaser.Math.DegToRad(0);
            b2Body_SetAngularVelocity(this.planeBodyId, radians);
        }

        const rotation = b2Body_GetRotation(this.planeBodyId);
        b2Body_SetLinearVelocity(this.planeBodyId, new b2Vec2(rotation.c * this.VELOCITY, rotation.s * this.VELOCITY));
    }

    updateSprite ()
    {
        WrapInRectangle([ this.planeSprite ], this.worldBounds, 32);
    }

    update (time, delta) 
    {
        // Step the physics world and update sprite positions
        if (this.world) 
        {
            WorldStep({ worldId: this.worldId, deltaTime: delta });
            UpdateWorldSprites(this.worldId);
        }

        this.handleInput();
        this.updateSprite();
    }
}

var WrapInRectangle = function (items, rect, padding)
{
    if (padding === undefined)
    {
        padding = 0;
    }

    for (var i = 0; i < items.length; i++)
    {
        var item = items[ i ];

        item.x = Wrap(item.x, rect.left - padding, rect.right + padding);
        item.y = Wrap(item.y, rect.top - padding, rect.bottom + padding);
    }

    return items;
};

var Wrap = function (value, min, max)
{
    var range = max - min;

    return (min + ((((value - min) % range) + range) % range));
};

// Game configuration
const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    scene: Example
};

// Create and start the Phaser game
new Phaser.Game(config);

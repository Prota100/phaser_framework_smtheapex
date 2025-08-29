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
    b2DefaultShapeDef,
    STATIC,
    KINEMATIC,
    b2Body_IsValid,
    b2Body_GetUserData,
    b2Shape_GetBody,
    b2Body_GetLinearVelocity,
    b2Body_SetLinearVelocity,
    b2World_GetContactEvents,
    b2Body_SetUserData,
    b2Body_GetLocalVector,
    b2Sub,
    b2Body_GetContactCapacity,
    b2ContactData,
    b2Body_GetContactData,
    B2_ID_EQUALS,
    RemoveSpriteFromWorld
} from '../lib/PhaserBox2D.js';

export class Example extends Phaser.Scene 
{
    PLAYER_MOVE_VELOCITY = 5;
    PLAYER_JUMP_VELOCITY = 11;
    PLATFORM_VELOCITY = 2;
    PLATFORM_RANGE = 300;

    onGround = false;
    groundBody = null;
    groundBodyId = null;

    constructor() 
    {
        super();
    }

    preload () 
    {
        this.load.image('sky', '../resources/images/sky2.png');
        this.load.image('ground', '../resources/images/platform2.png');
        this.load.image('star', '../resources/images/star.png');
        this.load.spritesheet('dude', '../resources/images/dude.png', { frameWidth: 32, frameHeight: 48 });
    }

    create () 
    {
        // Configure the physics world with no gravity
        const worldDef = b2DefaultWorldDef();
        worldDef.gravity = new b2Vec2(0, -10);

        this.world = CreateWorld({ worldDef });
        this.worldId = this.world.worldId;

        this.add.image(0, 0, 'sky').setOrigin(0, 0).setDisplaySize(1280, 1280);

        this.platforms = this.add.group();

        const groundSprite = this.platforms.create(this.scale.width * 0.5, this.scale.height, 'ground').setScale(3.5);
        const groundBody = SpriteToBox(this.worldId, groundSprite, {
            friction: 0.5,
            type: STATIC
        });

        AddSpriteToWorld(this.worldId, groundSprite, groundBody);
        b2Body_SetUserData(groundBody.bodyId, { type: 'ground' });
        // platforms.create(600, 400, 'ground');
        // platforms.create(50, 250, 'ground');
        // platforms.create(750, 220, 'ground');

        this.movingPlatform = this.add.image(this.scale.width * 0.5, this.scale.height - 200, 'ground');
        this.movingPlatformBody = SpriteToBox(this.worldId, this.movingPlatform, {
            friction: 0.5,
            type: KINEMATIC
        });

        this.movingPlatformId = this.movingPlatformBody.bodyId;

        AddSpriteToWorld(this.worldId, this.movingPlatform, this.movingPlatformBody);
        const velocity = new b2Vec2(this.PLATFORM_VELOCITY, 0);
        b2Body_SetLinearVelocity(this.movingPlatformId, velocity);
        b2Body_SetUserData(this.movingPlatformId, { type: 'ground' });
        // this.movingPlatform.setImmovable(true);
        // this.movingPlatform.body.allowGravity = false;
        // this.movingPlatform.setVelocityX(50);

        this.playerSprite = this.add.sprite(100, 450, 'dude');
        this.playerBody = SpriteToBox(this.worldId, this.playerSprite, {
            restitution: 0.2,
            friction: 0.5,
            fixedRotation: true
        });

        this.playerBodyId = this.playerBody.bodyId;

        AddSpriteToWorld(this.worldId, this.playerSprite, this.playerBody);
        b2Body_SetUserData(this.playerBodyId, { type: 'player' });
        // this.playerSprite.setBounce(0.2);
        // this.playerSprite.setCollideWorldBounds(true);

        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'turn',
            frames: [ { key: 'dude', frame: 4 } ],
            frameRate: 20
        });

        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
            frameRate: 10,
            repeat: -1
        });

        this.cursors = this.input.keyboard.createCursorKeys();

        this.starGroup = this.add.group({
            key: 'star',
            repeat: 12,
            setXY: { x: 11, y: 0, stepX: 100 }
        });

        for (const star of this.starGroup.getChildren())
        {
            const starBody = SpriteToBox(this.worldId, star, {
                restitution: Phaser.Math.FloatBetween(0.4, 0.8),
                friction: 0.5,
                fixedRotation: true,
                // isSensor: true
            });

            star.body = starBody;

            const starBodyId = starBody.bodyId;

            AddSpriteToWorld(this.worldId, star, starBody);
            b2Body_SetUserData(starBodyId, { type: 'star' });
        }
    }

    handleInput ()
    {
        const { left, right, up } = this.cursors;
        const groundVelocity = this.groundBodyId ? b2Body_GetLinearVelocity(this.groundBodyId) : { x: 0, Y: 0 };

        const velocity = b2Body_GetLinearVelocity(this.playerBodyId);

        if (left.isDown)
        {
            velocity.x = -this.PLAYER_MOVE_VELOCITY + groundVelocity.x;
            b2Body_SetLinearVelocity(this.playerBodyId, velocity);
            this.playerSprite.anims.play('left', true);
        }
        else if (right.isDown)
        {
            velocity.x = this.PLAYER_MOVE_VELOCITY + groundVelocity.x;
            b2Body_SetLinearVelocity(this.playerBodyId, velocity);
            this.playerSprite.anims.play('right', true);
        }
        else
        {
            velocity.x = groundVelocity.x;
            b2Body_SetLinearVelocity(this.playerBodyId, velocity);
            this.playerSprite.anims.play('turn');
        }

        if (up.isDown && this.onGround)
        {
            this.onGround = false;
            velocity.y = this.PLAYER_JUMP_VELOCITY;
            b2Body_SetLinearVelocity(this.playerBodyId, velocity);
        }

        if (this.movingPlatform.x >= this.scale.width - this.PLATFORM_RANGE)
        {
            const velocity = new b2Vec2(-this.PLATFORM_VELOCITY, 0);
            b2Body_SetLinearVelocity(this.movingPlatformId, velocity);
        }
        else if (this.movingPlatform.x <= this.PLATFORM_RANGE)
        {
            const velocity = new b2Vec2(this.PLATFORM_VELOCITY, 0);
            b2Body_SetLinearVelocity(this.movingPlatformId, velocity);
        }
    }

    collectStar (bodyId)
    {
        for (const star of this.starGroup.getChildren())
        {
            const body = star.body;
            if (JSON.stringify(bodyId) === JSON.stringify(body.bodyId))
            {
                this.starGroup.remove(star, true);
                RemoveSpriteFromWorld(this.worldId, star, true);
            }
        }
    }

    checkCollisions ()
    {
        // check up to four contacts for the player to see if they're touching a platform
        // (four = one contact per cardinal direction?)
        let capacity = b2Body_GetContactCapacity(this.playerBodyId);
        capacity = Math.min(capacity, 4);
        const contactData = Array.from({ length: capacity }, () => new b2ContactData());
        const count = b2Body_GetContactData(this.playerBodyId, contactData, capacity);
        for (let i = 0; i < count; i++)
        {
            const bodyIdA = b2Shape_GetBody(contactData[ i ].shapeIdA);
            const bodyIdB = b2Shape_GetBody(contactData[ i ].shapeIdB);
            const userDataA = b2Body_GetUserData(bodyIdA);
            const userDataB = b2Body_GetUserData(bodyIdB);

            this.groundBodyId = userDataA.type === 'ground' ? bodyIdA : userDataB.type === 'ground' ? bodyIdB : null;

            const starBodyId = userDataA.type === 'star' ? bodyIdA : userDataB.type === 'star' ? bodyIdB : null;
            if (starBodyId) this.collectStar(starBodyId);

            // is shapeIdA the player, or the other shape?
            const sign = B2_ID_EQUALS(bodyIdA, this.playerBodyId) ? -1.0 : 1.0;

            if (sign * contactData[ i ].manifold.normalY > 0.7)
            {
                return true;
            }
        }
        return false;
    }

    update (time, delta)
    {
        // Step the physics world and update sprite positions
        if (this.world) 
        {
            WorldStep({ worldId: this.worldId, deltaTime: delta });
            UpdateWorldSprites(this.worldId);
        }

        // this.checkCollisions();
        this.handleInput();
        this.onGround = this.checkCollisions();
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

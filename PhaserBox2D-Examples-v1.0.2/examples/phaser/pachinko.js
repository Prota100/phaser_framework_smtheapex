import * as Phaser from '../lib/phaser.esm.js';

import { AddSpriteToWorld, RemoveSpriteFromWorld, GetWorldScale, SetWorldScale, SpriteToBox, SpriteToCircle, UpdateWorldSprites, b2Body_SetUserData, KINEMATIC } from '../lib/PhaserBox2D.js';
import { CreateWorld, STATIC, WorldStep, b2World_Draw } from '../lib/PhaserBox2D.js';

import { PhaserDebugDraw } from './PhaserDebugDraw.js';
import { b2DefaultWorldDef, b2Vec2, b2Body_SetLinearVelocity, pxm, b2World_GetContactEvents, b2Body_GetContactCapacity, b2ContactData, b2Body_GetContactData, b2Shape_GetBody, b2Body_GetUserData, b2DestroyBody, B2_ID_EQUALS, b2Body_IsValid } from '../lib/PhaserBox2D.js';

// Configuration settings for the stacking game.
const gameConfig = {
    gravityY: -10,
    balls: 100,
    worldScale: 20,
    points: 100,
    bucketVelocity: 5,
    bucketRange: 200,
    ballFriction: 0.05,
}

// State variables to track game progress.
const gameProperties = {
    score: 0,
    balls: gameConfig.balls,
    ballGroup: null,
    ballIds: [],
}

class Example extends Phaser.Scene
{
    constructor()
    {
        super({ key: 'Game' });
    }

    preload ()
    {
        this.load.image('ball', '../resources/images/red_ball.png');
    }

    create ()
    {
        this.initVariables();
        this.initializePhysicsWorld();
        this.initializeGameElements();
        this.initCamera();
        this.scene.launch('GameUi');
        this.GameUi = this.scene.get('GameUi');
    }

    initVariables ()
    {
        gameProperties.terrainSegments = [];
        gameProperties.segmentGroup = this.add.group();
    }

    initializePhysicsWorld ()
    {
        SetWorldScale(gameConfig.worldScale);

        const worldDef = b2DefaultWorldDef();
        worldDef.gravity.y = gameConfig.gravityY;
        this.world = CreateWorld({ worldDef });
        this.worldId = this.world.worldId;
        this.debug = this.add.graphics().setVisible(false);
        this.worldDraw = new PhaserDebugDraw(this.debug, 1280, 720, GetWorldScale());
    }

    initializeGameElements ()
    {
        gameProperties.ballGroup = this.add.group();
        this.addInput();
        this.generateTextures();
        this.createBoard();
        this.createBucket();
    }

    initCamera ()
    {
        this.cameras.main.setOrigin(0, 0.5);
    }

    addInput ()
    {
        this.input.on('pointerdown', this.createBall, this);
    }

    addGameUi ()
    {
        this.scoreLabel = this.add.text(10, 10, 'Score: 0', { font: '32px Arial', fill: '#ffffff' });
        this.ballsLabel = this.add.text(10, 40, 'Balls: 100', { font: '32px Arial', fill: '#ffffff' });
    }

    createBall (pointer)
    {
        const ballSprite = this.add.image(pointer.x, 50, 'ball');
        gameProperties.ballGroup.add(ballSprite);

        const ball = SpriteToCircle(this.worldId, ballSprite, {
            restitution: 1,
            friction: gameConfig.ballFriction,
            radius: pxm(8),
        });

        ballSprite.bodyId = ball.bodyId;

        AddSpriteToWorld(this.worldId, ballSprite, ball);
        b2Body_SetUserData(ball.bodyId, { sprite: ballSprite, type: 'ball' });

        this.GameUi.dropBall();
    }

    generateTextures ()
    {
        const color = 0x3d6728;
        const thickness = 2;
        const alpha = 1;
        const radius = 3;

        const pin = this.add.graphics().lineStyle(thickness, color, alpha).strokeCircle(radius + 1, radius + 1, radius);
        pin.generateTexture('pin', (radius * 2) + 2, (radius * 2) + 2);
        pin.destroy();

        const bucket = this.add.graphics().fillStyle(0xffffff).fillRect(0, 0, 200, 32);
        bucket.generateTexture('bucket', 200, 32);
        bucket.destroy();
    }

    createBoard ()
    {
        const startPositionX = 100;
        const maxPinsPerRow = 33;
        let startY = 150;

        for (let y = 0; y < 8; y++)
        {
            let startX = startPositionX;
            let max = maxPinsPerRow;

            if (y % 2 === 0)
            {
                startX = startPositionX + 16;
                max = maxPinsPerRow - 1;
            }

            for (let x = 0; x < max; x++)
            {
                const pinSprite = this.add.image(startX + x * 32, startY + y, 'pin');

                const pin = SpriteToCircle(this.worldId, pinSprite, {
                    restitution: 1,
                    friction: gameConfig.ballFriction,
                    radius: pxm(3),
                    type: STATIC,
                });

                pinSprite.bodyId = pin.bodyId;

                AddSpriteToWorld(this.worldId, pinSprite, pin);
            }

            startY += 38;
        }
    }

    createBucket ()
    {
        this.bucketSprite = this.add.image(200, 550, 'bucket');

        const bucket = SpriteToBox(this.worldId, this.bucketSprite, {
            restitution: 1,
            type: KINEMATIC,
        });

        this.bucketSprite.bodyId = bucket.bodyId;

        AddSpriteToWorld(this.worldId, this.bucketSprite, bucket);
        b2Body_SetUserData(bucket.bodyId, { type: 'bucket' });
        //  Use a tween to move the bucket in a set path
        this.tweens.add({
            targets: this.bucketSprite,
            x: this.scale.width - gameConfig.bucketRange,
            duration: 6000,
            yoyo: true,
            repeat: -1,
            ease: 'linear',
        });
    }

    moveBucket ()
    {
        if (this.bucketSprite.x >= this.scale.width - gameConfig.bucketRange)
        {
            const velocity = new b2Vec2(-gameConfig.bucketVelocity, 0);
            b2Body_SetLinearVelocity(this.bucketSprite.bodyId, velocity);
        }
        else if (this.bucketSprite.x <= gameConfig.bucketRange)
        {
            const velocity = new b2Vec2(gameConfig.bucketVelocity, 0);
            b2Body_SetLinearVelocity(this.bucketSprite.bodyId, velocity);
        }
    }

    checkCollisions ()
    {
        const contactEvents = b2World_GetContactEvents(this.worldId);

        if (contactEvents.beginCount > 0)
        {
            const events = contactEvents.beginEvents;

            for (let i = 0; i < events.length; i++)
            {
                const event = events[ i ];
                if (!event) continue;

                const shapeIdA = event.shapeIdA;
                const shapeIdB = event.shapeIdB;
                const bodyIdA = b2Shape_GetBody(shapeIdA);
                const bodyIdB = b2Shape_GetBody(shapeIdB);

                if (!b2Body_IsValid(bodyIdA) || !b2Body_IsValid(bodyIdB)) return;

                const userDataA = b2Body_GetUserData(bodyIdA);
                const userDataB = b2Body_GetUserData(bodyIdB);

                if (userDataA && userDataB)
                {
                    if (userDataA?.type === 'ball' && userDataB?.type === 'bucket')
                    {
                        gameProperties.ballIds.push(bodyIdA);
                    }
                    if (userDataA?.type === 'bucket' && userDataB?.type === 'ball')
                    {
                        gameProperties.ballIds.push(bodyIdB);
                    }
                }
            }
        }

        this.removeBall();
    }

    removeBall ()
    {
        // console.log(gameProperties.ballIds.length)
        for (let i = 0; i < gameProperties.ballIds.length; i++)
        {
            const ballId = gameProperties.ballIds[ i ];

            gameProperties.ballGroup.getChildren().forEach(function (sprite)
            {
                // console.log(ballId.index1, sprite.bodyId.index1);
                if (B2_ID_EQUALS(ballId, sprite.bodyId))
                {
                    gameProperties.ballGroup.remove(sprite, true, true);
                    RemoveSpriteFromWorld(this.worldId, sprite);
                    b2DestroyBody(ballId);
                    gameProperties.ballIds.splice(i, 1);
                    this.updateScore();
                    return;
                }

                if (sprite.y > this.scale.height)
                {
                    gameProperties.ballGroup.remove(sprite, true, true);
                    RemoveSpriteFromWorld(this.worldId, sprite);
                    b2DestroyBody(sprite.bodyId);
                    gameProperties.ballIds.splice(i, 1);
                    return;
                }
            }, this);
        }
    }

    updateScore ()
    {
        this.GameUi.updateScore();
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

        this.moveBucket();
        this.checkCollisions();
    }
}

class GameUi extends Phaser.Scene
{
    constructor()
    {
        super({ key: 'GameUi' });
    }

    preload ()
    {

    }

    create ()
    {
        this.score_label = this.add.text(10, 10, 'Score: 0', { font: '32px Arial', fill: '#ffffff' });
        this.balls_label = this.add.text(this.scale.width - 150, 10, 'Balls: 100', { font: '32px Arial', fill: '#ffffff' });
    }

    dropBall ()
    {
        gameProperties.balls--;
        this.balls_label.text = `Balls: ${gameProperties.balls}`;
    }

    updateScore ()
    {
        gameProperties.score += gameConfig.points;
        this.score_label.text = `Score: ${gameProperties.score}`;
    }
}

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    scene: [ Example, GameUi ]
};

const game = new Phaser.Game(config);

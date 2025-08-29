import * as Phaser from '../lib/phaser.esm.js';

import { AddSpriteToWorld, RemoveSpriteFromWorld, GetWorldScale, SetWorldScale, SpriteToBox, UpdateWorldSprites } from '../lib/PhaserBox2D.js';
import { CreateWorld, STATIC, WorldStep, b2World_Draw } from '../lib/PhaserBox2D.js';

import { PhaserDebugDraw } from './PhaserDebugDraw.js';
import { b2DefaultWorldDef, b2World_GetContactEvents, b2Body_SetUserData, b2Shape_GetBody, b2Body_IsValid, b2Body_GetUserData, GetBodyFromSprite } from '../lib/PhaserBox2D.js';

// Configuration settings for the stacking game.
const gameConfig = {
    gravityY: -10,
    cameraTransitionTime: 500,
    boxTweenSpeed: 1500,
    boxRangeMin: 200,
    boxRangeMax: 250,
    boxDropDistance: 2.5,
    boxHeight: 64,
    stackHeightMultiplier: 1.5,
    groundPositionY: 700,
}

// State variables to track game progress.
const gameProperties = {
    currentHeight: 0,
    currentStack: -1,
    maxHeightAchieved: 0,
}

const boxTextures = [ "metal", "redmonster", "yellowmonster", "wooden" ];

class Example extends Phaser.Scene
{
    constructor()
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
        this.initializePhysicsWorld();
        this.initializeCamera();
        this.initializeGameElements();
    }

    initializePhysicsWorld ()
    {
        SetWorldScale(20);

        const worldDef = b2DefaultWorldDef();
        worldDef.gravity.y = gameConfig.gravityY;
        this.world = CreateWorld({ worldDef });
        this.worldId = this.world.worldId;
        this.debug = this.add.graphics().setVisible(false);
        this.worldDraw = new PhaserDebugDraw(this.debug, 1280, 720, GetWorldScale());
    }

    initializeCamera ()
    {
        this.boxStackCamera = this.cameras.add(0, 0, game.config.width, game.config.height);
    }

    initializeGameElements ()
    {
        this.currentTween = null;
        
        this.addGameUi();
        this.addGround();
        this.boxGroup = this.add.group();
        this.getStackHeight();
        this.addBox();

        this.cameras.main.ignore([ this.ground ]);
        this.boxStackCamera.ignore([ this.sky, this.scoreLabel, this.maxLabel ]);
        this.input.on('pointerdown', this.dropBox, this);
    }

    addGameUi ()
    {
        this.sky = this.add.image(640, 360, 'sky');
        this.scoreLabel = this.add.text(10, 10, 'Stack: 0', { font: '32px Arial', fill: '#ffffff' });
        this.maxLabel = this.add.text(10, 40, 'Highest Stack: 0', { font: '32px Arial', fill: '#ffffff' });
    }

    addGround ()
    {
        this.ground = this.add.image(this.scale.width * 0.5, gameConfig.groundPositionY, 'floor');

        const ground = SpriteToBox(this.worldId, this.ground, {
            type: STATIC,
            friction: 1,
            restitution: 0,
        });

        const userData = {
            type: 'ground'
        };

        b2Body_SetUserData(ground.bodyId, userData);
    }

    addBox ()
    {
        const randomSide = Math.random() > 0.5 ? -1 : 1;
        const randomRange = randomSide * Phaser.Math.Between(gameConfig.boxRangeMin, gameConfig.boxRangeMax);
        const randomFrame = boxTextures[Phaser.Math.Between(0, boxTextures.length - 1)];
        this.currentBlock = this.add.image((this.scale.width * 0.5) + randomRange, gameProperties.currentHeight, 'blocks', randomFrame).setScale(0.5);

        this.currentTween = this.tweens.add({
            targets: this.currentBlock,
            x: (this.scale.width * 0.5) + (randomRange * -1),
            duration: gameConfig.boxTweenSpeed,
            yoyo: true,
            repeat: -1
        })

        this.cameras.main.ignore([ this.currentBlock ]);
    }

    dropBox ()
    {
        if (!this.currentBlock) return;

        this.currentTween.destroy();

        const box = SpriteToBox(this.worldId, this.currentBlock, {
            restitution: 0,
            friction: 0.5,
            angularDamping: 1,
        });

        const userData = {
            type: 'box',
            onGround: false
        };
        
        b2Body_SetUserData(box.bodyId, userData);
        AddSpriteToWorld(this.worldId, this.currentBlock, box);

        this.boxGroup.add(this.currentBlock);
        this.currentBlock = null;
    }

    checkCollision ()
    {
        const contactEvents = b2World_GetContactEvents(this.worldId);
        let updateHeight = false;
        let addBox = false;

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

                if (userDataA?.type === 'box' || userDataB?.type === 'box')
                {
                    updateHeight = true;
                }

                if (userDataA?.type === 'box' && !userDataA?.onGround)
                {
                    userDataA.onGround = true;
                    addBox = true;
                }
                if (userDataB?.type === 'box' && !userDataB?.onGround)
                {
                    userDataB.onGround = true;
                    addBox = true;
                }

            }
        }

        if (updateHeight)
        {
            this.getStackHeight();
        }

        if (addBox)
        {
            this.addBox();
        }
    }

    checkWorldBounds ()
    {
        this.boxGroup.getChildren().forEach(function (box)
        {
            if (box.y > this.scale.height + gameConfig.boxHeight)
            {
                this.boxGroup.remove(box, true, true);
                RemoveSpriteFromWorld(this.worldId, box, true);
            }
        }, this);
    }

    getStackHeight ()
    {
        let maxHeight = 0;

        this.boxGroup.getChildren().forEach(function (box)
        {
            const bodyId = GetBodyFromSprite(this.worldId, box).bodyId;
            const userData = b2Body_GetUserData(bodyId);
            if (userData.onGround)
            {
                const currentHeight = Math.round((this.ground.getBounds().top - box.getBounds().top) / box.displayWidth);
                maxHeight = Math.max(maxHeight, currentHeight);
            }
        }, this);

        if (gameProperties.currentStack != maxHeight)
        {
            gameProperties.currentStack = maxHeight;

            gameProperties.currentHeight = gameConfig.groundPositionY - ((gameProperties.currentStack + gameConfig.boxDropDistance) * gameConfig.boxHeight);
        }

        gameProperties.maxHeightAchieved = Math.max(gameProperties.maxHeightAchieved, gameProperties.currentStack);
        this.scoreLabel.text = `Stack: ${gameProperties.currentStack}`;
        this.maxLabel.text = `Highest Stack: ${gameProperties.maxHeightAchieved}`;

        this.updateCameraZoom();
    }

    updateCameraZoom ()
    {
        const stackHeight = (gameProperties.currentStack + gameConfig.boxDropDistance + gameConfig.stackHeightMultiplier) * gameConfig.boxHeight;
        const zoomFactor = this.scale.height / stackHeight;
        const centerY = this.scale.height - (stackHeight * 0.5);

        this.boxStackCamera.zoomTo(zoomFactor, gameConfig.cameraTransitionTime);
        this.boxStackCamera.pan(this.scale.width / 2, centerY, gameConfig.cameraTransitionTime);

        if (this.currentBlock)
        {
            this.tweens.add({
                targets: this.currentBlock,
                y: gameProperties.currentHeight,
                duration: gameConfig.cameraTransitionTime,
            })
        }
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

        this.checkCollision();
        this.checkWorldBounds();
    }
}

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    scene: Example
};

const game = new Phaser.Game(config);

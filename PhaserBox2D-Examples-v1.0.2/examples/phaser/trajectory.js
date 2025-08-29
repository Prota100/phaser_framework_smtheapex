import * as Phaser from '../lib/phaser.esm.js';

import { AddSpriteToWorld, RemoveSpriteFromWorld, GetWorldScale, SetWorldScale, SpriteToBox, UpdateWorldSprites, b2Body_ApplyLinearImpulseToCenter, SpriteToCircle, b2Vec2, DYNAMIC, b2DestroyBody } from '../lib/PhaserBox2D.js';
import { CreateWorld, STATIC, WorldStep, b2World_Draw } from '../lib/PhaserBox2D.js';

import { PhaserDebugDraw } from './PhaserDebugDraw.js';
import { b2DefaultWorldDef, b2World_GetContactEvents, b2Body_SetUserData, b2Shape_GetBody, b2Body_IsValid, b2Body_GetUserData, GetBodyFromSprite } from '../lib/PhaserBox2D.js';

const gameConfig = {
    gravity: -10,
    cameraDuration: 500,
    boxTweenSpeed: 1500,
    boxRangeMin: 200,
    boxRangeMax: 250,
    boxTop: 100,
    boxDropOffset: 2.5,
    boxY: 100,
    boxHeight: 64,
    boxStackTopMultiplier: 1.5,
    groundY: 700,
    zoomMin: 3,
    spriteScale: 0.25
}

const gameProperties = {
    currentHeight: 0,
    currentStack: -1,
    maxHeight: 0,
}

const frames = { 
    "brick": "platform",
    "bomb": "bomb",
    "catapult": "platform-round"
};

const FUSE_TIME = 2000;

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
        SetWorldScale(20);

        const worldDef = b2DefaultWorldDef();

        worldDef.gravity.y = gameConfig.gravity;

        this.bombImpact = 0;
        this.currentBomb = null;

        this.currentTween = null;
        this.world = CreateWorld({ worldDef });
        this.worldId = this.world.worldId;
        this.sky = this.add.image(640, 360, 'sky');
        this.bombsLabel = this.add.text(10, 10, 'Bombs: 0', { font: '32px Arial', fill: '#ffffff' });
        //this.maxLabel = this.add.text(10, 40, 'Highest Stack: 0', { font: '32px Arial', fill: '#ffffff' });

        this.debug = this.add.graphics().setVisible(true);

        this.worldDraw = new PhaserDebugDraw(this.debug, 1280, 720, GetWorldScale());

        this.input.on('pointerdown', this.fire, this);

        this.addGround();
        this.addBuilding();
        this.setupCameras();
        this.boxGroup = this.add.group();
        this.addCatapult();
        this.reload();
    }

    addGround ()
    {
        this.ground = this.add.image(this.scale.width * 0.75, gameConfig.groundY, 'floor');

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

    addBuilding ()
    {
        // add bricks to create a building to be knocked over
        const brickData = [
            // ground floor
            { x:1000, y:640, rotation:Math.PI / 2 },
            { x:1030, y:600, rotation:0 },
            { x:1060, y:640, rotation:Math.PI / 2 },

            { x:1070, y:640, rotation:Math.PI / 2 },
            { x:1100, y:600, rotation:0 },
            { x:1130, y:640, rotation:Math.PI / 2 },

            // first storey
            { x:1030, y:560, rotation:Math.PI / 2 },
            { x:1060, y:500, rotation:0 },
            { x:1090, y:560, rotation:Math.PI / 2 },
        ];
        this.building = [];
        brickData.forEach((b) => {

            let brickSprite = this.add.image(b.x, b.y, 'blocks', frames.brick).setScale(gameConfig.spriteScale * 2.0);
            brickSprite.setOrigin(0.5, 0.5);
            brickSprite.rotation = b.rotation;

            // create a physics object for the bomb
            const brick = SpriteToBox(this.worldId, brickSprite, {
                type: DYNAMIC,
                restitution: 0.25,
                friction: 1.0,
                density: 1.5
            });
    
            const userData = {
                type: 'brick'
            };
            
            b2Body_SetUserData(brick.bodyId, userData);
            AddSpriteToWorld(this.worldId, brickSprite, brick);

            this.building.push(brick);
        });

        // TODO: add occupants in the building
    }

    addCatapult ()
    {
        // pole
        this.catapult = this.add.image(250, 560, 'blocks', frames.catapult).setScale(gameConfig.spriteScale * 5.0, gameConfig.spriteScale * 3.0);
        this.catapult.setOrigin(0.0, 0.5);
        this.catapult.rotation = Math.PI / 2;
        // cross-piece
        this.catapultCross = this.add.image(250, 560, 'blocks', frames.catapult).setScale(gameConfig.spriteScale * 2.0);
        this.catapultCross.setOrigin(0.5, 0.5);
    }

    reload ()
    {
        if (this.currentBomb) return;

        this.currentBomb = this.add.image(110, 600, 'blocks', frames.bomb).setScale(gameConfig.spriteScale);
        this.currentBomb.setOrigin(0.5, 0.5);
    }

    aim ()
    {
        if (!this.currentBomb) return;

        // Get mouse position and catapult position
        const mouseX = this.input.activePointer.x;
        const mouseY = this.input.activePointer.y;
        const catapultTopX = this.catapultCross.x;
        const catapultTopY = this.catapultCross.y;

        // Calculate direction vector from catapult top to mouse
        const directionX = catapultTopX - mouseX;
        const directionY = catapultTopY - mouseY;

        // Don't track the mouse unless it's in the correct region to launch from
        if (directionX > 20 && directionY <= 50)
        {
            this.currentBomb.x = mouseX;
            this.currentBomb.y = mouseY;
        }
    }

    fire ()
    {
        if (!this.currentBomb) return;

        const mouseX = this.input.activePointer.x;
        const mouseY = this.input.activePointer.y;
        const catapultTopX = this.catapultCross.x;
        const catapultTopY = this.catapultCross.y;

        const directionX = catapultTopX - mouseX;
        const directionY = catapultTopY - mouseY;

        // Don't launch unless the mouse is in the correct region to launch from
        if (!(directionX > 20 && directionY <= 50))
            return;

        const distance = Math.sqrt(directionX * directionX + directionY * directionY);
        
        const length = Math.sqrt(directionX * directionX + directionY * directionY);
        const normalizedX = directionX / length;
        const normalizedY = directionY / length;

        const strengthMultiplier = Math.min(Math.max(distance / catapultTopX, 0.2), 1);

        // Clamp launch strength
        const minStrength = 15;
        const maxStrength = 200;
        const launchStrength = minStrength + (maxStrength - minStrength) * strengthMultiplier;

        const launchImpulse = new b2Vec2(
            normalizedX * launchStrength,
            -normalizedY * launchStrength
        );

        // create a physics object for the bomb
        const bomb = SpriteToCircle(this.worldId, this.currentBomb, {
            type: DYNAMIC,
            restitution: 0.25,
            friction: 0.1,
            density: 2.0,
            angularDamping: 0.1,
            radius: 1.0,
        });

        const userData = {
            type: 'bomb',
            onGround: false
        };
        
        b2Body_SetUserData(bomb.bodyId, userData);
        AddSpriteToWorld(this.worldId, this.currentBomb, bomb);

        // fire it!
        b2Body_ApplyLinearImpulseToCenter(bomb.bodyId, launchImpulse, true);
    }

    removeBomb ()
    {
            // recover the physics body from the sprite reference
            let bomb = GetBodyFromSprite(this.worldId, this.currentBomb);
            // disconnect them
            RemoveSpriteFromWorld(this.worldId, this.currentBomb);
            // destroy the physics body
            b2DestroyBody(bomb.bodyId);
            // destroy the sprite
            this.currentBomb.destroy();

            this.currentBomb = null;
            this.bombImpact = 0;
    }

    checkBounds ()
    {
        if (this.currentBomb && this.currentBomb.y > game.config.height)
        {
            this.removeBomb();
            this.reload();
        }
    }

    checkCollision ( time )
    {
        const contactEvents = b2World_GetContactEvents(this.worldId);
        let nextBomb = false;

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

                if (userDataA?.type === 'bomb' || userDataB?.type === 'bomb')
                {
                    if (this.currentBomb)
                    {
                        // light the bomb fuse on first contact
                        if (!this.bombImpact)
                            this.bombImpact = time + FUSE_TIME;
                    }
                }
            }
        }
    }

    setupCameras ()
    {
        this.actionCamera = this.cameras.add(0, 0, game.config.width, game.config.height);
        this.actionCamera.ignore([ this.sky, this.bombsLabel ]);    // , this.maxLabel ]);
        this.cameras.main.ignore([ this.ground ]);
    }

    zoomCamera ()
    {
        const stackHeight = (gameProperties.currentStack + gameConfig.boxDropOffset + gameConfig.boxStackTopMultiplier) * gameConfig.boxHeight;
        const zoomFactor = this.scale.height / stackHeight;
        const centerY = this.scale.height - (stackHeight * 0.5);

        this.actionCamera.zoomTo(zoomFactor, gameConfig.cameraDuration);
        this.actionCamera.pan(this.scale.width / 2, centerY, gameConfig.cameraDuration);
    }


    handleExplosion ( time )
    {
        if (this.bombImpact && this.bombImpact < time)
        {
            this.removeBomb();
            this.reload();
            this.bombImpact = 0;
        }
    }

    update (time, delta)
    {
        const worldId = this.world.worldId;

        WorldStep({ worldId, deltaTime: delta });

        this.aim();

        UpdateWorldSprites(worldId);

        if (this.debug.visible)
        {
            this.debug.clear();
            b2World_Draw(worldId, this.worldDraw);
        }

        this.checkCollision( time );
        this.checkBounds();

        this.handleExplosion( time );
    }
}

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    scene: Example
};

const game = new Phaser.Game(config);

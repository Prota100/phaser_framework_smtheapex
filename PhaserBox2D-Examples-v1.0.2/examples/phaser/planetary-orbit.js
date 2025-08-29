import * as Phaser from '../lib/phaser.esm.js';

import { AddSpriteToWorld, RemoveSpriteFromWorld, GetWorldScale, SetWorldScale, SpriteToBox, UpdateWorldSprites, SpriteToCircle } from '../lib/PhaserBox2D.js';
import { CreateWorld, STATIC, WorldStep, b2World_Draw } from '../lib/PhaserBox2D.js';

import { PhaserDebugDraw } from './PhaserDebugDraw.js';
import { b2DefaultWorldDef, b2World_GetSensorEvents, b2World_GetContactEvents, b2Body_SetUserData, b2Shape_GetBody, b2Body_IsValid, b2Body_GetUserData, GetBodyFromSprite, pxm, B2_NULL_INDEX, b2Body_ApplyForceToCenter, b2MulSV, b2Normalize, b2Sub } from '../lib/PhaserBox2D.js';

// Configuration settings for the stacking game.
const gameConfig = {
    gravityY: -10,
    lineDashSize: 5,
    lineColor: 0xffffff,
    lineThickness: 2,
    lineLengthMin: 50,
    lineLengthMax: 300,
    firingForce: 10000,
    distanceToExit: 150,
    durationToExit: 1500
}

// State variables to track game progress.
const gameProperties = {
    currentHeight: 0,
    currentStack: -1,
    maxHeightAchieved: 0,
    planets: {},
    readyToFire: false,
    levelComplete: false
}

const lineProperties = {
    graphics: null,
    line: null,
    isDrawing: false,
    length: 0,
}

class Example extends Phaser.Scene
{
    constructor()
    {
        super();
    }

    preload ()
    {
        this.load.image('sky', '../resources/images/sky.png');
        this.load.image('planet', '../resources/images/bombstar.png');
        this.load.image('planet-pink', '../resources/images/ball-pink.png');
        this.load.image('planet-sun', '../resources/images/fireball1.png');
        this.load.atlas('blocks', '../resources/images/blocks.png', '../resources/images/blocks.json');
        this.load.image('bird', '../resources/images/parrot.png');
    }

    create ()
    {
        this.initializePhysicsWorld();
        // this.initializeCamera();
        this.initializeGameElements();
    }

    initializePhysicsWorld ()
    {
        SetWorldScale(20);

        const worldDef = b2DefaultWorldDef();
        worldDef.gravity.y = 0;
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
        this.planetGroup = this.add.group();

        const planetX = this.scale.width * 0.5;
        const planetY = this.scale.height * 0.5;
        const startPosition = {
            x: 50,
            y: 400
        }

        this.addPlanet(planetX + 200, planetY + 150, 250, 50, 'planet');
        this.addPlanet(planetX - 200, planetY - 150, 250, 50, 'planet-pink');
        this.addPlanet(planetX + 300, planetY - 250, 150, 1000, 'planet-sun', true);
        this.birdSprite = this.addBird(startPosition);
        this.addUi();
        this.addInput();
    }

    addUi ()
    {
        lineProperties.line = new Phaser.Geom.Line(0, 0, 0, 0);
        lineProperties.graphics = this.add.graphics();
    }

    addInput ()
    {
        this.input.on('pointerdown', this.addLine, this);
        this.input.on('pointermove', this.moveLine, this);
        this.input.on('pointerup', this.clearLine, this);
    }

    addLine (pointer)
    {
        if (gameProperties.isDrawing) return;

        gameProperties.isDrawing = true;
    }

    moveLine (pointer)
    {
        if (!gameProperties.isDrawing) return;
        const line = lineProperties.line;
        line.setTo(this.birdSprite.x, this.birdSprite.y, pointer.x, pointer.y);
        const graphics = lineProperties.graphics;
        const lineLength = Phaser.Geom.Line.Length(line);
        const lineOffset = Math.min(gameConfig.lineLengthMax - lineLength, 0);
        lineProperties.length = lineLength + lineOffset;
        Phaser.Geom.Line.Extend(line, 0, lineOffset);
        graphics.clear();

        if (lineProperties.length < gameConfig.lineLengthMin) 
        {
            gameProperties.readyToFire = false;
            return;
        }

        const points = line.getPoints(Math.round(lineProperties.length / gameConfig.lineDashSize));
        graphics.lineStyle(gameConfig.lineThickness, gameConfig.lineColor);

        for (let i = 0; i < points.length; i += 2)
        {
            const startPoint = points[ i ];
            const endPoint = points[ i + 1 ];

            if (!startPoint || !endPoint) return;

            graphics.lineBetween(startPoint.x, startPoint.y, endPoint.x, endPoint.y);
        }

        gameProperties.readyToFire = true;
    }

    clearLine ()
    {
        if (gameProperties.readyToFire) this.fireBird();
        gameProperties.readyToFire = false;
        gameProperties.isDrawing = false;
        lineProperties.graphics.clear();
    }

    addPlanet (x, y, radius, force, asset, isExit)
    {
        // add planet sprite
        const planetSprite = this.add.sprite(x, y, asset);

        if (!isExit)
        {
            const planet = SpriteToCircle(this.worldId, planetSprite, {
                type: STATIC,
                restitution: 0,
                friction: 0.5,
                radius: pxm(planetSprite.width * 0.5)
            });

            AddSpriteToWorld(this.worldId, planetSprite, planet);
        }

        this.addGravityField(x, y, radius, asset);

        this.planetGroup.add(planetSprite);

        gameProperties.planets[ asset ] = {
            x: x,
            y: y,
            radius: radius,
            force: force,
            inOrbit: [],
            isExit: isExit
        }
    }

    addGravityField (x, y, radius, asset)
    {
        const gravityGraphics = this.add.graphics();
        gravityGraphics.lineStyle(2, 0xffffff, 0.5);
        gravityGraphics.strokeCircle(radius, radius, radius - 1);

        const gravityName = `gravityField${x}${y}`;
        gravityGraphics.generateTexture(gravityName, radius * 2, radius * 2);
        gravityGraphics.destroy();

        const gravitySprite = this.add.sprite(x, y, gravityName);

        const gravity = SpriteToCircle(this.worldId, gravitySprite, {
            type: STATIC,
            restitution: 0,
            friction: 0.5,
            isSensor: true,
            radius: pxm(radius)
        });

        const userData = {
            planet: asset
        };

        b2Body_SetUserData(gravity.bodyId, userData);
        AddSpriteToWorld(this.worldId, gravitySprite, gravity);
    }

    addBird (pointer)
    {
        const pointerX = pointer.x;
        const pointerY = pointer.y;
        const birdSprite = this.add.image(pointerX, pointerY, 'bird').setScale(0.3);

        const bird = SpriteToCircle(this.worldId, birdSprite, {
            restitution: 0,
            friction: 0.5,
            angularDamping: 1,
            radius: 1
        });

        const userData = {
            sprite: birdSprite,
            type: 'bird'
        };

        birdSprite.bodyId = bird.bodyId;

        b2Body_SetUserData(bird.bodyId, userData);
        AddSpriteToWorld(this.worldId, birdSprite, bird);

        return birdSprite;
    }

    fireBird ()
    {
        const bird = this.birdSprite;
        const bodyId = bird.bodyId;
        const line = lineProperties.line;
        const forcePercent = lineProperties.length / gameConfig.lineLengthMax;
        const forceToApply = gameConfig.firingForce * forcePercent;

        const normalized = b2Normalize({ x: line.x2 - line.x1, y: line.y2 - line.y1 })
        normalized.y *= -1;
        const force = b2MulSV(forceToApply, normalized);
        b2Body_ApplyForceToCenter(bodyId, force, true);
    }

    destroyBird (sprite)
    {
        RemoveSpriteFromWorld(this.worldId, sprite);
        this.tweens.add({
            targets: sprite,
            scaleX: 1,
            scaleY: 1,
            alpha: 0,
            duration: gameConfig.durationToExit * .5,
            completeDelay: gameConfig.durationToExit,
            onComplete: () =>
            {
                this.levelRestart();
            }
        })
    }

    inOrbit ()
    {
        const sensorEvents = b2World_GetSensorEvents(this.worldId);
        if (sensorEvents.beginCount > 0)
        {
            for (let i = 0; i < sensorEvents.beginCount; i++)
            {
                const event = sensorEvents.beginEvents[ i ];
                const sensorShapeId = event.sensorShapeId;
                const sensorBodyId = b2Shape_GetBody(sensorShapeId);

                const visitorShapeId = event.visitorShapeId;
                const visitorBodyId = b2Shape_GetBody(visitorShapeId);

                if (!b2Body_IsValid(sensorBodyId) || !b2Body_IsValid(visitorBodyId))
                {
                    continue;
                }

                const sensorUserData = b2Body_GetUserData(sensorBodyId);
                const visitorUserData = b2Body_GetUserData(visitorBodyId);
                const planet = gameProperties.planets[ sensorUserData.planet ];
                const inOrbit = planet.inOrbit;
                const index = inOrbit.indexOf(visitorUserData.sprite);

                if (index === -1)
                {
                    inOrbit.push(visitorUserData.sprite);
                }
            }
        }

        if (sensorEvents.endCount > 0)
        {
            for (let i = 0; i < sensorEvents.endCount; i++)
            {
                const event = sensorEvents.endEvents[ i ];
                const sensorShapeId = event.sensorShapeId;
                const sensorBodyId = b2Shape_GetBody(sensorShapeId);

                const visitorShapeId = event.visitorShapeId;
                const visitorBodyId = b2Shape_GetBody(visitorShapeId);

                if (!b2Body_IsValid(sensorBodyId) || !b2Body_IsValid(visitorBodyId))
                {
                    continue;
                }

                const sensorUserData = b2Body_GetUserData(sensorBodyId);
                const visitorUserData = b2Body_GetUserData(visitorBodyId);
                const planet = gameProperties.planets[ sensorUserData.planet ];
                const inOrbit = planet.inOrbit;
                const index = inOrbit.indexOf(visitorUserData.sprite);

                if (index !== -1)
                {
                    inOrbit.splice(index, 1);
                }
            }
        }
    }

    applyGravity ()
    {
        for (const key in gameProperties.planets)
        {
            if (gameProperties.planets.hasOwnProperty(key))
            {
                const planet = gameProperties.planets[ key ];
                planet.inOrbit.forEach(sprite =>
                {
                    const bodyId = sprite.bodyId;
                    if (bodyId)
                    {
                        const planetPosition = { x: planet.x, y: planet.y };
                        const spritePosition = { x: sprite.x, y: sprite.y };
                        const normalized = b2Normalize(b2Sub(planetPosition, spritePosition));
                        normalized.y *= -1;
                        const force = b2MulSV(planet.force, normalized);
                        b2Body_ApplyForceToCenter(bodyId, force);

                        if (planet.isExit && !gameProperties.levelComplete)
                        {
                            const distance = Phaser.Math.Distance.Between(planetPosition.x, planetPosition.y, spritePosition.x, spritePosition.y);

                            if (distance < gameConfig.distanceToExit)
                            {
                                this.levelComplete(planetPosition);
                            }
                        }
                    }
                });
            }
        }
    }

    checkPlanetCollision ()
    {
        const contactEvents = b2World_GetContactEvents(this.worldId);
        if (contactEvents.beginCount > 0)
        {
            for (let i = 0; i < contactEvents.beginEvents.length; i++)
            {
                const event = contactEvents.beginEvents[ i ];
                if (!event) continue;

                const shapeIdA = event.shapeIdA;
                const shapeIdB = event.shapeIdB;
                const bodyIdA = b2Shape_GetBody(shapeIdA);
                const bodyIdB = b2Shape_GetBody(shapeIdB);

                if (!b2Body_IsValid(bodyIdA) || !b2Body_IsValid(bodyIdB)) return;

                const userDataA = b2Body_GetUserData(bodyIdA);
                const userDataB = b2Body_GetUserData(bodyIdB);

                if (userDataA?.type === 'bird')
                {
                    this.destroyBird(userDataA.sprite);
                }

                if (userDataB?.type === 'bird')
                {
                    this.destroyBird(userDataB.sprite);
                }
                
            }
        }
    }

    checkWorldBounds ()
    {
        if (this.birdSprite.x < 0 || this.birdSprite.x > this.scale.width || this.birdSprite.y < 0 || this.birdSprite.y > this.scale.height)
        {
            this.levelRestart();
        }
    }

    levelComplete (exitPosition)
    {
        gameProperties.levelComplete = true;

        RemoveSpriteFromWorld(this.worldId, this.birdSprite);

        this.tweens.add({
            targets: this.birdSprite,
            x: exitPosition.x,
            y: exitPosition.y,
            scaleX: 0,
            scaleY: 0,
            duration: gameConfig.durationToExit,
            completeDelay: gameConfig.durationToExit,
            ease: 'Cubic.easeOut',
            onComplete: () =>
            {
                this.levelRestart();
            }
        })
    }

    levelRestart ()
    {
        this.scene.restart();
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

        this.inOrbit();
        this.applyGravity();
        this.checkPlanetCollision();
        this.checkWorldBounds();
    }

    getBodyIdIndex = (arr, bodyId) =>
    {
        return arr.findIndex(item =>
            Object.keys(bodyId).every(key => item[ key ] === bodyId[ key ])
        );
    };
}

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    scene: Example
};

const game = new Phaser.Game(config);
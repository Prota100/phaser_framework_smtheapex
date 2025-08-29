import * as Phaser from '../lib/phaser.esm.js';

import { AddSpriteToWorld, RemoveSpriteFromWorld, GetWorldScale, SetWorldScale, SpriteToBox, UpdateWorldSprites, SpriteToCircle, b2Vec2 } from '../lib/PhaserBox2D.js';
import { CreateWorld, CreateCircle, STATIC, DYNAMIC, WorldStep, b2World_Draw, b2HexColor } from '../lib/PhaserBox2D.js';

import { PhaserDebugDraw } from './PhaserDebugDraw.js';
import { b2DefaultWorldDef, b2World_GetSensorEvents, b2World_GetContactEvents, b2Body_SetUserData, b2Shape_GetBody, b2Body_IsValid, b2Body_GetTransform, b2Body_SetLinearVelocity, pxm, pxmVec2, b2Body_ApplyForceToCenter, b2MulSV, b2Normalize, b2Sub } from '../lib/PhaserBox2D.js';

// Configuration settings for the stacking game.
const gameConfig = {
    gravityY: -10,
}

class Example extends Phaser.Scene
{
    attractor = null;
    line = null;
    lineLengthMax = 0;
    lineLengthMin = 50;
    attractorForce = 100;
    shapesForce = 100;
    shapes = [];

    constructor()
    {
        super();
    }

    create ()
    {
        this.initializePhysicsWorld();
        this.initializeGameElements();
    }

    initializePhysicsWorld ()
    {
        SetWorldScale(20);

        const worldDef = b2DefaultWorldDef();
        worldDef.gravity.y = 0;
        this.world = CreateWorld({ worldDef });
        this.worldId = this.world.worldId;
        // this.debug = this.add.graphics();
        this.debug = this.add.graphics().setVisible(false);
        this.worldDraw = new PhaserDebugDraw(this.debug, 1280, 720, GetWorldScale());
    }

    initializeGameElements ()
    {
        this.generateTextures();
        this.addShapes();
        this.addAttractor();
        // this.addInput();
    }

    generateTextures ()
    {
        const radius = 50;
        const attractorRadius = Math.max(this.scale.width * 0.25, this.scale.height * 0.25) * 0.5;
        const thickness = 10;

        const circle = new Phaser.Geom.Circle(radius + thickness, radius + thickness, radius);
        const circleAttractor = new Phaser.Geom.Circle(attractorRadius + 1, attractorRadius + 1, attractorRadius);
        const rectangle = new Phaser.Geom.Rectangle(0, 0, 100, 100);

        const circle1 = this.add.graphics(
            {
                fillStyle:
                {
                    color: 0xFF2D6A,
                },
                lineStyle:
                {
                    color: 0xE9202E,
                    width: thickness
                }
            }).fillCircleShape(circle).strokeCircleShape(circle);
        circle1.generateTexture('circle1', (radius + thickness) * 2, (radius + thickness) * 2);
        circle1.destroy();

        const circle1Outline = this.add.graphics(
            {
                lineStyle:
                {
                    color: 0xE9202E,
                    width: thickness
                }
            }).fillCircleShape(circle).strokeCircleShape(circle);
        circle1Outline.generateTexture('circle1Outline', (radius + thickness) * 2, (radius + thickness) * 2);
        circle1Outline.destroy();

        const circle2 = this.add.graphics(
            {
                fillStyle:
                {
                    color: 0x4267F8,
                },
                lineStyle:
                {
                    color: 0x3257E8,
                    width: thickness
                }
            }).fillCircleShape(circle).strokeCircleShape(circle);
        circle2.generateTexture('circle2', (radius + thickness) * 2, (radius + thickness) * 2);
        circle2.destroy();

        const circle2Outline = this.add.graphics(
            {
                lineStyle:
                {
                    color: 0x3257E8,
                    width: thickness
                }
            }).fillCircleShape(circle).strokeCircleShape(circle);
        circle2Outline.generateTexture('circle2Outline', (radius + thickness) * 2, (radius + thickness) * 2);
        circle2Outline.destroy();

        const circle3 = this.add.graphics(
            {
                fillStyle:
                {
                    color: 0xF0F0F0,
                },
                lineStyle:
                {
                    color: 0xFFFFFF,
                    width: thickness
                }
            }).fillCircleShape(circle).strokeCircleShape(circle);
        circle3.generateTexture('circle3', (radius + thickness) * 2, (radius + thickness) * 2);
        circle3.destroy();

        const circle3Outline = this.add.graphics(
            {
                lineStyle:
                {
                    color: 0xFFFFFF,
                    width: thickness
                }
            }).fillCircleShape(circle).strokeCircleShape(circle);
        circle3Outline.generateTexture('circle3Outline', (radius + thickness) * 2, (radius + thickness) * 2);
        circle3Outline.destroy();

        const square = this.add.graphics({
            fillStyle:
            {
                color: 0xF0F0F0,
            },
            lineStyle:
            {
                color: 0xFFFFFF,
                width: thickness
            }
        }).fillRectShape(rectangle).strokeRectShape(rectangle);
        square.generateTexture('square', 100, 100);
        square.destroy();

        const squareOutline = this.add.graphics({
            fillStyle:
            {
                color: 0xF0F0F0,
            },
            lineStyle:
            {
                color: 0xFFFFFF,
                width: thickness
            }
        }).fillRectShape(rectangle).strokeRectShape(rectangle);
        squareOutline.generateTexture('squareOutline', 100, 100);
        squareOutline.destroy();

        const attractor = this.add.graphics({
            fillStyle:
            {
                color: 0xF0F0F0,
            },
        }).fillCircleShape(circleAttractor);
        attractor.generateTexture('attractor', (attractorRadius * 2) + 2, (attractorRadius * 2) + 2);
        attractor.destroy();
    }

    addShapes ()
    {
        this.line = new Phaser.Geom.Line(0, 0, 0, 0);
        this.lineLengthMax = Math.min(this.scale.width * 0.5, this.scale.height * 0.5);

        for (let i = 0; i < 60; i++)
        {
            const x = Phaser.Math.Between(0, this.scale.width);
            const y = Phaser.Math.Between(0, this.scale.height);

            // create squares
            const size = Math.random() > 0.5 ? Phaser.Math.Between(10, 80) : Phaser.Math.Between(4, 60);
            const squareTexture = Math.random() > 0.5 ? 'square' : 'squareOutline';
            const squareSprite = this.add.image(this.scale.width * 0.5, this.scale.height * 0.5, squareTexture).setDisplaySize(size, size);
            const square = SpriteToBox(this.worldId, squareSprite, {
                restitution: 0.5,
                friction: 0,
            });

            squareSprite.bodyId = square.bodyId;
            AddSpriteToWorld(this.worldId, squareSprite, square);

            // create circles
            const circleTexture = Math.random() > 0.3 ? '' : 'Outline';
            const circle1Radius = Phaser.Math.Between(2, 8);
            const circle2Radius = Phaser.Math.Between(2, 20);
            const circle3Radius = Phaser.Math.Between(2, 40);

            // circle 1
            const circle1Sprite = this.add.image(x, y, `circle1${circleTexture}`).setDisplaySize(circle1Radius * 2, circle1Radius * 2);
            const circle1 = SpriteToCircle(this.worldId, circle1Sprite, {
                restitution: 0.5,
                mass: 0.1,
                friction: 0,
                radius: pxm(circle1Radius),
            });
            circle1Sprite.bodyId = circle1.bodyId;
            AddSpriteToWorld(this.worldId, circle1Sprite, circle1);

            // circle 2
            const circle2Sprite = this.add.image(x, y, `circle2${circleTexture}`).setDisplaySize(circle2Radius * 2, circle2Radius * 2);
            const circle2 = SpriteToCircle(this.worldId, circle2Sprite, {
                restitution: 0.5,
                mass: 6,
                friction: 0,
                radius: pxm(circle2Radius),
            });
            circle2Sprite.bodyId = circle2.bodyId;
            AddSpriteToWorld(this.worldId, circle2Sprite, circle2);

            // circle 3
            const circle3Sprite = this.add.image(x, y, `circle3${circleTexture}`).setDisplaySize(circle3Radius * 2, circle3Radius * 2);
            const circle3 = SpriteToCircle(this.worldId, circle3Sprite, {
                restitution: 0.5,
                mass: 0.2,
                friction: 0.6,
                radius: pxm(circle3Radius),
            });
            circle3Sprite.bodyId = circle3.bodyId;
            AddSpriteToWorld(this.worldId, circle3Sprite, circle3);

            this.shapes.push(squareSprite, circle1Sprite, circle2Sprite, circle3Sprite);
        }
    }

    addAttractor ()
    {
        this.attractorSprite = this.add.image(this.scale.width * 0.5, this.scale.height * 0.5, 'attractor');

        const attractor = SpriteToCircle(this.worldId, this.attractorSprite, {
            restitution: 0.5,
            friction: 1,
            radius: pxm(this.attractorSprite.width * 0.5),
        });

        this.attractorSprite.bodyId = attractor.bodyId;

        AddSpriteToWorld(this.worldId, this.attractorSprite, attractor);
    }

    addInput ()
    {
        this.input.on('pointermove', this.moveAttractor, this);
    }

    moveAttractor ()
    {
        const pointer = this.input.activePointer;
        const targetPosition = { x: pointer.worldX, y: pointer.worldY };
        const spritePosition = { x: this.attractorSprite.x, y: this.attractorSprite.y };
        const normalized = b2Normalize(b2Sub(targetPosition, spritePosition));
        normalized.y *= -1;

        this.line.setTo(spritePosition.x, spritePosition.y, targetPosition.x, targetPosition.y);

        const length = Phaser.Geom.Line.Length(this.line);
        const force = length / this.lineLengthMax * this.attractorForce;

        const forceToApply = b2MulSV(force, normalized);
        b2Body_SetLinearVelocity(this.attractorSprite.bodyId, forceToApply);
    }

    moveShapes ()
    {
        // loop through this.shapes
        for (let i = 0; i < this.shapes.length; i++)
        {
            const sprite = this.shapes[ i ];
            const bodyId = sprite.bodyId;

            const spritePosition = { x: sprite.x, y: sprite.y };
            const targetPosition = { x: this.attractorSprite.x, y: this.attractorSprite.y };
            const normalized = b2Normalize(b2Sub(targetPosition, spritePosition));
            normalized.y *= -1;

            const force = b2MulSV(this.shapesForce, normalized);
            b2Body_ApplyForceToCenter(bodyId, force, true);
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

        this.moveAttractor();
        this.moveShapes();
    }
}

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    scene: Example
};

const game = new Phaser.Game(config);
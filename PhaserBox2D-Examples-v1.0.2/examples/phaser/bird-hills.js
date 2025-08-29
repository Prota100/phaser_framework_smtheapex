import * as Phaser from '../lib/phaser.esm.js';

import { AddSpriteToWorld, RemoveSpriteFromWorld, GetWorldScale, SetWorldScale, SpriteToBox, SpriteToCircle, UpdateWorldSprites, b2DestroyBody } from '../lib/PhaserBox2D.js';
import { CreateWorld, STATIC, WorldStep, b2World_Draw } from '../lib/PhaserBox2D.js';

import { PhaserDebugDraw } from './PhaserDebugDraw.js';
import { b2DefaultWorldDef, b2Vec2, b2MulSV, b2Body_ApplyForceToCenter } from '../lib/PhaserBox2D.js';

// Configuration settings for the stacking game.
const gameConfig = {
    gravityY: -10,
    cameraTransitionTime: 200,
    terrainHeight: 0.5,
    terrainAmplitudeMin: 5,
    terrainAmplitudeMax: 10,
    terrainAmplitudeSize: 10,
    terrainSegmentsMin: 20,
    terrainSegmentsMax: 30,
    terrainSegmentLength: 10,
    terrainToGenerate: 10,
    terrainColor: 0x3d6728,
    terrainPointsColor: 0xFF6728,
    terrainStartX: 150,
    terrainLineThickness: 4,
    removeSegmentX: 500,
    birdDiveForce: 15,
    birdDiveDirection: new b2Vec2(0, -10),
    birdFireForce: 200,
    birdFireDirection: new b2Vec2(5, 10),
}

// State variables to track game progress.
const gameProperties = {
    currentHeight: 0,
    currentStack: -1,
    maxHeightAchieved: 0,
    terrainSegments: [],
    segmentGroup: null,
    gameStarted: false,
    isDiving: false,
    distanceToNextTerrain: 0,
    distanceTravelled: 0,
    birdStartX: 0,
    score: 0,
    lastPoint: null,
}

class Example extends Phaser.Scene
{
    constructor()
    {
        super({ key: 'Game' });
    }

    preload ()
    {
        this.load.image('sky', '../resources/images/sky.png');
        this.load.image('bird', '../resources/images/parrot.png');
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
        SetWorldScale(20);

        const worldDef = b2DefaultWorldDef();
        worldDef.gravity.y = gameConfig.gravityY;
        this.world = CreateWorld({ worldDef });
        this.worldId = this.world.worldId;
        this.debug = this.add.graphics().setVisible(false);
        this.worldDraw = new PhaserDebugDraw(this.debug, 1280, 720, GetWorldScale());
    }

    initializeGameElements ()
    {
        this.addInput();
        this.generateTextures();
        const birdStartPosition = this.generateTerrain({ x: gameConfig.terrainStartX, y: this.scale.height * gameConfig.terrainHeight });
        this.birdSprite = this.addBird(birdStartPosition);
    }

    initCamera ()
    {
        this.cameras.main.setOrigin(0, 0.5);
    }

    addInput ()
    {
        this.input.on('pointerdown', this.pointerDown, this);
        this.input.on('pointerup', this.pointerUp, this);
    }

    addGameUi ()
    {
        this.sky = this.add.image(640, 360, 'sky');
        this.scoreLabel = this.add.text(10, 10, 'Stack: 0', { font: '32px Arial', fill: '#ffffff' });
        this.maxLabel = this.add.text(10, 40, 'Highest Stack: 0', { font: '32px Arial', fill: '#ffffff' });
    }

    fireBird ()
    {
        if (gameProperties.gameStarted) return;
        gameProperties.gameStarted = true;

        const bird = this.birdSprite;
        const bodyId = bird.bodyId;
        const force = b2MulSV(gameConfig.birdFireForce, gameConfig.birdFireDirection);
        b2Body_ApplyForceToCenter(bodyId, force, true);
    }

    pointerDown ()
    {
        gameProperties.isDiving = true;

        this.fireBird();

    }

    pointerUp ()
    {
        gameProperties.isDiving = false;
    }

    generateTextures ()
    {
        const terrainGraphics = this.add.graphics().fillStyle(gameConfig.terrainColor).fillRect(0, 0, 100, 100);
        terrainGraphics.generateTexture('ground', 100, 100);
        terrainGraphics.destroy();
    }

    generateTerrain (startPoint)
    {
        let terrainX = startPoint.x;
        let terrainY = startPoint.y;
        let terrainPoints = [];

        for (let i = 0; i < gameConfig.terrainToGenerate; i++)
        {
            const terrainLength = Phaser.Math.Between(gameConfig.terrainSegmentsMin, gameConfig.terrainSegmentsMax) * gameConfig.terrainSegmentLength;
            const terrainAmplitude = Phaser.Math.Between(gameConfig.terrainAmplitudeMin, gameConfig.terrainAmplitudeMax) * gameConfig.terrainAmplitudeSize;

            const startPoint = {
                x: terrainX,
                y: i === 0 ? terrainY : Math.round(terrainY - terrainAmplitude)
            }
            terrainX += terrainLength;

            const endPoint = {
                x: terrainX,
                y: i === 0 ? terrainY + (gameConfig.terrainAmplitudeMax * gameConfig.terrainAmplitudeSize) : Math.round(terrainY + terrainAmplitude)
            }

            if (i === gameConfig.terrainToGenerate - 1)
            {
                terrainPoints.push(startPoint);
            }
            else
            {
                terrainPoints.push(startPoint, endPoint);
            }

            terrainX += terrainLength;
        }

        gameProperties.lastPoint = terrainPoints[ terrainPoints.length - 1 ];
        gameProperties.distanceToNextTerrain = terrainPoints[ 1 ].x;

        let currentPoint = null;
        let lastPoint = null;

        if (!gameProperties.gameStarted) this.addSegment(terrainPoints[ 0 ].x - gameConfig.terrainStartX, terrainPoints[ 0 ].y, terrainPoints[ 0 ].x, terrainPoints[ 0 ].y);

        for (let i = 1; i < terrainPoints.length; i++)
        {
            const startPoint = terrainPoints[ i - 1 ];
            const endPoint = terrainPoints[ i ];
            const lineWidth = endPoint.x - startPoint.x;
            const lineHeight = (endPoint.y - startPoint.y) * .5;
            const segments = lineWidth / gameConfig.terrainSegmentLength;

            const terrainLine = new Phaser.Geom.Line(startPoint.x, startPoint.y, endPoint.x, endPoint.y);
            const centerPoint = Phaser.Geom.Line.GetPoint(terrainLine, 0.5);

            currentPoint = lastPoint || startPoint;

            for (let j = 0; j < segments; j++)
            {
                const sine = Math.sin(Math.PI / segments * j);
                const cosine = -Math.cos(Math.PI / segments * j);
                const nextPoint =
                {
                    x: currentPoint.x + gameConfig.terrainSegmentLength,
                    y: centerPoint.y + (lineHeight * cosine)
                }

                this.addSegment(currentPoint.x, currentPoint.y, nextPoint.x, nextPoint.y);
                currentPoint = nextPoint;

                if (j === segments - 1)
                {
                    lastPoint = nextPoint;
                }
            }
        }

        const startLine = new Phaser.Geom.Line(terrainPoints[ 0 ].x - gameConfig.terrainStartX, terrainPoints[ 0 ].y, terrainPoints[ 0 ].x, terrainPoints[ 0 ].y);
        const birdStartPosition = Phaser.Geom.Line.GetPoint(startLine, 0.9)
        birdStartPosition.y -= 50;

        if (!gameProperties.gameStarted) return birdStartPosition;
        else return null;
    }

    addSegment (x1, y1, x2, y2)
    {
        const segmentLine = new Phaser.Geom.Line(x1, y1, x2, y2);
        const segmentLength = Phaser.Geom.Line.Length(segmentLine);
        const centerPoint = Phaser.Geom.Line.GetPoint(segmentLine, 0.5);
        const angle = Phaser.Geom.Line.Angle(segmentLine);

        const segment = this.add.image(centerPoint.x, centerPoint.y, 'ground').setDisplaySize(segmentLength, gameConfig.terrainLineThickness).setAngle(Phaser.Math.RadToDeg(angle));
        gameProperties.terrainSegments.push(segment);

        const ground = SpriteToBox(this.worldId, segment, {
            type: STATIC,
            friction: 1,
            restitution: 0,
        });

        // attach the new physics body to the Phaser.Image
        segment.setData('ground-bodyId', ground.bodyId);

        gameProperties.segmentGroup.add(segment);
    }

    removeSegments ()
    {
        if (!gameProperties.gameStarted) return;

        gameProperties.segmentGroup.getChildren().forEach(function (segment)
        {
            const dx = this.birdSprite.x - segment.x;
            if (dx > gameConfig.removeSegmentX)
            {
                const ground = segment.getData('ground-bodyId');
                gameProperties.segmentGroup.remove(segment, true, true);
                RemoveSpriteFromWorld(this.worldId, segment);
                if (ground)
                {
                    b2DestroyBody(ground);
                }
            }
        }, this);
    }

    updateCamera ()
    {
        this.cameras.main.scrollX = this.birdSprite.x - 100;

        const birdHeight = (this.scale.height - this.birdSprite.y);
        const zoomFactor = Math.min(this.scale.height / birdHeight, 1.5);
        this.cameras.main.scrollY = Math.min((this.scale.height * 0.5) - (birdHeight * 0.7), 0);
        this.cameras.main.zoomTo(zoomFactor, gameConfig.cameraTransitionTime);

        if (gameProperties.distanceTravelled > gameProperties.distanceToNextTerrain)
        {
            this.generateTerrain(gameProperties.lastPoint);
        }
    }

    updateScore ()
    {
        if (!gameProperties.gameStarted) return;
        gameProperties.distanceTravelled = this.birdSprite.x - gameProperties.birdStartX;
        gameProperties.score = Math.floor(gameProperties.distanceTravelled / 10);

        this.GameUi.updateScore(gameProperties.score);
    }

    addBird (pointer)
    {
        gameProperties.birdStartX = pointer.x;

        const pointerX = pointer.x;
        const pointerY = pointer.y;
        const birdSprite = this.add.image(pointerX, pointerY, 'bird').setScale(0.3);

        const bird = SpriteToCircle(this.worldId, birdSprite, {
            restitution: 0,
            friction: 0.5,
            angularDamping: 1,
            radius: 1
        });

        birdSprite.bodyId = bird.bodyId;

        AddSpriteToWorld(this.worldId, birdSprite, bird);

        return birdSprite;
    }

    birdDive ()
    {
        if (!gameProperties.isDiving || !gameProperties.gameStarted) return;

        const bird = this.birdSprite;
        const bodyId = bird.bodyId;
        const force = b2MulSV(gameConfig.birdDiveForce, gameConfig.birdDiveDirection);
        b2Body_ApplyForceToCenter(bodyId, force, true);
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

        this.birdDive();
        this.removeSegments();
        this.updateCamera();
        this.updateScore();
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
    }

    updateScore (score)
    {
        this.score_label.text = `Score: ${score}`;
    }
}

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    scene: [ Example, GameUi ]
};

const game = new Phaser.Game(config);

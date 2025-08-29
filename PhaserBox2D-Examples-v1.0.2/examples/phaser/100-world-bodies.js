import * as Phaser from '../lib/phaser.esm.js';
import
{
    AddSpriteToWorld,
    b2DefaultWorldDef,
    b2Vec2,
    CreateWorld,
    CreateBoxPolygon,
    SpriteToBox,
    UpdateWorldSprites,
    WorldStep,
    STATIC,
    b2HexColor,
    b2DefaultShapeDef,
    b2DefaultBodyDef,
    pxmVec2,
    b2Body_ApplyLinearImpulseToCenter,
    GetWorldScale,
    b2World_Draw,
} from '../lib/PhaserBox2D.js';

import { PhaserDebugDraw } from './PhaserDebugDraw.js';

const GEMS = 0x0001;
const BOUNDS = 0x0002;
const BODIES = 100;

export class Example extends Phaser.Scene 
{
    constructor() 
    {
        super(); // Initialize the scene
    }

    preload () 
    {
        this.load.atlas('gems', '../resources/atlas/gems.png', '../resources/atlas/gems.json');
    }

    create () 
    {
        const debug = this.add.graphics();
        // Configure the physics world with no gravity
        const worldDef = b2DefaultWorldDef();
        worldDef.gravity = new b2Vec2(0, 0);
        const worldBounds = new Phaser.Geom.Rectangle(0, 0, this.scale.width * 2, this.scale.height * 2);

        this.world = CreateWorld({ worldDef });
        this.debug = debug;
        this.worldDraw = new PhaserDebugDraw(debug, this.scale.width, this.scale.height, GetWorldScale());
        this.worldId = this.world.worldId;

        this.generateTextures();
        this.createBoundaries();

        // Add the background image
        const spriteBounds = Phaser.Geom.Rectangle.Inflate(Phaser.Geom.Rectangle.Clone(worldBounds), -100, -100);

        this.anims.create({ key: 'diamond', frames: this.anims.generateFrameNames('gems', { prefix: 'diamond_', end: 15, zeroPad: 4 }), repeat: -1 });
        this.anims.create({ key: 'prism', frames: this.anims.generateFrameNames('gems', { prefix: 'prism_', end: 6, zeroPad: 4 }), repeat: -1 });
        this.anims.create({ key: 'ruby', frames: this.anims.generateFrameNames('gems', { prefix: 'ruby_', end: 6, zeroPad: 4 }), repeat: -1 });
        this.anims.create({ key: 'square', frames: this.anims.generateFrameNames('gems', { prefix: 'square_', end: 14, zeroPad: 4 }), repeat: -1 });

        //  Create loads of random sprites

        const anims = [ 'diamond', 'prism', 'ruby', 'square' ];

        for (let i = 0; i < BODIES; i++)
        {
            const pos = Phaser.Geom.Rectangle.Random(spriteBounds);

            const gem = this.add.sprite(pos.x, pos.y, 'gems');
            gem.play(Phaser.Math.RND.pick(anims));

            const gemBody = SpriteToBox(this.worldId, gem, {
                restitution: 1,
                fixedRotation: true,
                categoryBits: GEMS,
                maskBits: BOUNDS
            });
            AddSpriteToWorld(this.worldId, gem, gemBody);

            const randomImpulseX = Phaser.Math.Between(50, 100) * (Math.random() < 0.5 ? -1 : 1);
            const randomImpulseY = Phaser.Math.Between(50, 100) * (Math.random() < 0.5 ? -1 : 1);
            const impulse = new b2Vec2(randomImpulseX, randomImpulseY);
            b2Body_ApplyLinearImpulseToCenter(gemBody.bodyId, impulse, true); // Apply an impulse to the ball
        }

        const cursors = this.input.keyboard.createCursorKeys();

        const controlConfig = {
            camera: this.cameras.main,
            left: cursors.left,
            right: cursors.right,
            up: cursors.up,
            down: cursors.down,
            zoomIn: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
            zoomOut: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
            acceleration: 0.06,
            drag: 0.0005,
            maxSpeed: 1.0
        };

        this.controls = new Phaser.Cameras.Controls.SmoothedKeyControl(controlConfig);

        this.add.text(0, 0, 'Use Cursors to scroll camera.\nQ / E to zoom in and out', { font: '18px Courier', fill: '#00ff00' });
    }

    generateTextures ()
    {
        const terrainGraphics = this.add.graphics().fillStyle(b2HexColor.b2_colorLawnGreen).fillRect(0, 0, 100, 100);
        terrainGraphics.generateTexture('ground', 100, 100);
        terrainGraphics.destroy();
    }

    createBoundaries ()
    {
        const offset = 50;
        const left = -offset;
        const right = this.scale.width + offset;
        const top = -offset;
        const bottom = this.scale.height + offset;

        const width = this.scale.width + (offset * 2);
        const height = this.scale.height + (offset * 2);
        const thickness = 20;

        const shapeDef = b2DefaultShapeDef();
        shapeDef.restitution = 1;

        const topImage = this.add.image(this.scale.width, top, 'ground').setDisplaySize(width * 2, thickness);
        const topBody = SpriteToBox(this.worldId, topImage, {
            type: STATIC,
            friction: 0,
            restitution: 1,
            categoryBits: BOUNDS,
            maskBits: GEMS
        });
        AddSpriteToWorld(this.worldId, topImage, topBody);

        const bottomImage = this.add.image(this.scale.width, bottom * 2, 'ground').setDisplaySize(width * 2, thickness);
        const bottomBody = SpriteToBox(this.worldId, bottomImage, {
            type: STATIC,
            friction: 0,
            restitution: 1,
            categoryBits: BOUNDS,
            maskBits: GEMS
        });
        AddSpriteToWorld(this.worldId, bottomImage, bottomBody);

        const leftImage = this.add.image(left, this.scale.height, 'ground').setDisplaySize(thickness, height * 2);
        const leftBody = SpriteToBox(this.worldId, leftImage, {
            type: STATIC,
            friction: 0,
            restitution: 1,
            categoryBits: BOUNDS,
            maskBits: GEMS
        });
        AddSpriteToWorld(this.worldId, leftImage, leftBody);

        const rightImage = this.add.image(right * 2, this.scale.height, 'ground').setDisplaySize(thickness, height * 2);
        const rightBody = SpriteToBox(this.worldId, rightImage, {
            type: STATIC,
            friction: 0,
            restitution: 1,
            categoryBits: BOUNDS,
            maskBits: GEMS
        });
        AddSpriteToWorld(this.worldId, rightImage, rightBody);
    }

    update (time, delta) 
    {
        // Step the physics world and update sprite positions
        if (this.world) 
        {
            WorldStep({ worldId: this.worldId, deltaTime: delta });
            UpdateWorldSprites(this.worldId);
        }

        this.controls.update(delta);
        this.debug.clear();
        b2World_Draw(this.worldId, this.worldDraw);
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

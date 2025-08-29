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
    b2HexColor,
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
    text = null;
    graphics = null;
    block = null;
    atari = null;

    constructor() 
    {
        super();
    }

    preload () 
    {
        this.load.image('block', '../resources/images/block.png');
        this.load.image('atari', '../resources/images/atari800.png');
    }

    create () 
    {
        // Configure the physics world with no gravity
        const worldDef = b2DefaultWorldDef();
        worldDef.gravity = new b2Vec2(0, -10);

        this.world = CreateWorld({ worldDef });
        this.worldId = this.world.worldId;

        this.atari = this.add.image(400, 300, 'atari');

        this.block = this.add.image(0, 0, 'block');
        this.block.setVelocity(200, 200);
        this.block.setBounce(1, 1);
        this.block.setCollideWorldBounds(true);

        this.graphics = this.add.graphics();

        this.text = this.add.text(0, 0, '-');

        this.createBoundaries();
    }

    generateSquareTexture (color, name)
    {
        const graphic = this.add.graphics().fillStyle(color).fillRect(0, 0, 100, 100);
        graphic.generateTexture(name, 100, 100);
        graphic.destroy();
    }
    
    createBoundaries ()
    {
        const textureName = "square";
        this.generateSquareTexture(b2HexColor.b2_colorLawnGreen, textureName);

        const offset = 10;
        const left = -offset;
        const right = this.scale.width + offset;
        const top = -offset;
        const bottom = this.scale.height + offset;

        const width = this.scale.width + (offset);
        const height = this.scale.height + (offset);
        const thickness = 20;

        const shapeDef = b2DefaultShapeDef();
        shapeDef.restitution = 1;

        const topImage = this.add.image(width * 0.5, top, textureName).setDisplaySize(width, thickness);
        const topBody = SpriteToBox(this.worldId, topImage, {
            type: STATIC,
            friction: 0,
            restitution: 1,
        });
        AddSpriteToWorld(this.worldId, topImage, topBody);
        
        const bottomImage = this.add.image(width * 0.5, bottom, textureName).setDisplaySize(width, thickness);
        const bottomBody = SpriteToBox(this.worldId, bottomImage, {
            type: STATIC,
            friction: 0,
            restitution: 1,
        });
        AddSpriteToWorld(this.worldId, bottomImage, bottomBody);

        const leftImage = this.add.image(left, height * 0.5, textureName).setDisplaySize(thickness, height);
        const leftBody = SpriteToBox(this.worldId, leftImage, {
            type: STATIC,
            friction: 0,
            restitution: 1,
        });
        AddSpriteToWorld(this.worldId, leftImage, leftBody);

        const rightImage = this.add.image(right, height * 0.5, textureName).setDisplaySize(thickness, height);
        const rightBody = SpriteToBox(this.worldId, rightImage, {
            type: STATIC,
            friction: 0,
            restitution: 1,
        });
        AddSpriteToWorld(this.worldId, rightImage, rightBody);
    }

    drawGraphics()
    {
        this.graphics.clear();

        this.draw(this.atari);
        this.draw(this.block);

        this.text.setText([
            'Box:',
            '',
            JSON.stringify(
                Phaser.Utils.Objects.Pick(this.block.body, [
                    'blocked',
                    'touching',
                    'embedded'
                ]),
                null,
                2
            )
        ]);
    }

    draw (gameObject)
    {
        this.graphics.lineStyle(5, 0xffff00, 0.8);

        this.drawFaces(gameObject.body, gameObject.body.touching);

        this.graphics.lineStyle(5, 0xff0000, 0.8);

        this.drawFaces(gameObject.body, gameObject.body.blocked);
    }

    drawFaces (body, faces)
    {
        if (faces.left)
        {
            this.graphics.lineBetween(body.left, body.top, body.left, body.bottom);
        }

        if (faces.up)
        {
            this.graphics.lineBetween(body.left, body.top, body.right, body.top);
        }

        if (faces.right)
        {
            this.graphics.lineBetween(body.right, body.top, body.right, body.bottom);
        }

        if (faces.down)
        {
            this.graphics.lineBetween(body.left, body.bottom, body.right, body.bottom);
        }
    }

    update (time, delta)
    {
        // Step the physics world and update sprite positions
        if (this.world) 
        {
            WorldStep({ worldId: this.worldId, deltaTime: delta });
            UpdateWorldSprites(this.worldId);
        }

        this.checkCollisions();
        this.drawGraphics();
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

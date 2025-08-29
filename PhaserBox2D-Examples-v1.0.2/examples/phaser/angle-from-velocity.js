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
    b2HexColor,
    b2Body_SetTransform,
    b2Body_GetPosition,
    b2Body_GetLinearVelocity,
    b2Body_SetLinearVelocity,
    b2Body_GetRotation,
    RotFromRad
} from '../lib/PhaserBox2D.js';

export class Example extends Phaser.Scene 
{
    constructor() 
    {
        super(); // Initialize the scene with the name 'Blade'
    }

    preload () 
    {
        this.load.image('arrow', '../resources/images/arrow.png');
    }

    create () 
    {
        // Configure the physics world with no gravity
        const worldDef = b2DefaultWorldDef();
        worldDef.gravity = new b2Vec2(0, -10);

        this.world = CreateWorld({ worldDef });
        this.worldId = this.world.worldId;

        this.arrowSprite = this.add.image(400, 100, 'arrow');
        this.arrowBody = SpriteToBox(this.worldId, this.arrowSprite, {
            restitution: 1.03,
            friction: 0.5,
            fixedRotation: true
        });

        this.arrowBodyId = this.arrowBody.bodyId;

        AddSpriteToWorld(this.worldId, this.arrowSprite, this.arrowBody);

        b2Body_SetLinearVelocity(this.arrowBodyId, new b2Vec2(10, 0));

        const textureName = "square";
        this.generateSquareTexture(b2HexColor.b2_colorLawnGreen, textureName);
        this.createBoundaries(textureName);
    }

    generateSquareTexture (color, name)
    {
        const graphic = this.add.graphics().fillStyle(color).fillRect(0, 0, 100, 100);
        graphic.generateTexture(name, 100, 100);
        graphic.destroy();
    }

    createBoundaries (textureName)
    {
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

    updateAngle ()
    {
        const position = b2Body_GetPosition(this.arrowBodyId);
        const velocity = b2Body_GetLinearVelocity(this.arrowBodyId);
        
        const radians = Math.atan2(-velocity.y, velocity.x);
        const rotation = RotFromRad(radians);
        b2Body_SetTransform(this.arrowBodyId, position, rotation);
    }

    update (time, delta) 
    {
        // Step the physics world and update sprite positions
        if (this.world) 
        {
            WorldStep({ worldId: this.worldId, deltaTime: delta });
            UpdateWorldSprites(this.worldId);
        }

        this.updateAngle();
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

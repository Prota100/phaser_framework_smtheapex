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
    b2HexColor,
    GetWorldScale,
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
    GetBodyFromSprite,
    pxm,
    pxmVec2,
    mpx
} from '../lib/PhaserBox2D.js';

import { PhaserDebugDraw } from './PhaserDebugDraw.js';

export class Example extends Phaser.Scene 
{
    text = null;
    graphics = null;
    blockSprite = null;
    atari = null;
    touching = null;
    blocked = null;

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
        worldDef.gravity = new b2Vec2(0, 0);

        this.world = CreateWorld({ worldDef });
        this.worldId = this.world.worldId;

        this.atariSprite = this.add.image(this.scale.width * 0.5, this.scale.height * 0.5, 'atari');
        this.atariBody = SpriteToBox(this.worldId, this.atariSprite, {
            friction: 0.5,
            isSensor: true
        });

        this.atariBodyId = this.atariBody.bodyId;

        AddSpriteToWorld(this.worldId, this.atariSprite, this.atariBody);
        b2Body_SetUserData(this.atariBodyId, { type: 'atari' });

        this.blockSprite = this.add.image(100, 100, 'block');
        this.blockBody = SpriteToBox(this.worldId, this.blockSprite, {
            restitution: 1,
            friction: 0.5,
            fixedRotation: true,
        });

        const vertices = this.blockBody.object.vertices;
        console.log(vertices);

        this.blockBodyId = this.blockBody.bodyId;

        AddSpriteToWorld(this.worldId, this.blockSprite, this.blockBody);
        const velocity = new b2Vec2(10, 10);
        b2Body_SetLinearVelocity(this.blockBodyId, velocity);
        b2Body_SetUserData(this.blockBodyId, { type: 'block' });

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

    drawGraphics ()
    {
        this.graphics.clear();

        // this.draw(this.atari);
        this.draw(this.blockSprite);

        this.text.setText([
            'Box:',
            '',
            // JSON.stringify(
            //     Phaser.Utils.Objects.Pick(this.blockSprite.body, [
            //         'blocked',
            //         'touching',
            //         'embedded'
            //     ]),
            //     null,
            //     2
            // )
        ]);
    }

    draw (sprite)
    {
        const body = GetBodyFromSprite(this.worldId, sprite);
        const bodyId = body.bodyId;
        const vertices = body.object.vertices;

        this.graphics.lineStyle(5, 0xffff00, 0.8);
        this.drawFaces(sprite, vertices); // touching

        // this.graphics.lineStyle(5, 0xff0000, 0.8);

        // this.drawFaces(gameObject.body, gameObject.body.blocked);
    }

    drawFaces (sprite, vertices)
    {
        for (let i = 0; i < vertices.length; i++)
        {
            const point1 = vertices[ i ];
            const point2 = vertices[ i + 1 ] || vertices[ 0 ];
            const center = { x: sprite.x, y: sprite.y };
            this.graphics.lineBetween(
                center.x + mpx(point1.x),
                center.y + mpx(point1.y),
                center.x + mpx(point2.x),
                center.y + mpx(point2.y)
            );
        }
        // if (faces.left)
        // {
        //     this.graphics.lineBetween(body.left, body.top, body.left, body.bottom);
        // }

        // if (faces.up)
        // {
        //     this.graphics.lineBetween(body.left, body.top, body.right, body.top);
        // }

        // if (faces.right)
        // {
        //     this.graphics.lineBetween(body.right, body.top, body.right, body.bottom);
        // }

        // if (faces.down)
        // {
        //     this.graphics.lineBetween(body.left, body.bottom, body.right, body.bottom);
        // }
    }

    checkCollisions ()
    {
        this.checkSensorEvents();


        // check up to four contacts for the player to see if they're touching a platform
        // (four = one contact per cardinal direction?)o
        // let capacity = b2Body_GetContactCapacity(this.blockBodyId);
        // capacity = Math.min(capacity, 4);
        // const contactData = Array.from({ length: capacity }, () => new b2ContactData());
        // const count = b2Body_GetContactData(this.blockBodyId, contactData, capacity);
        // console.log(capacity)
        
        // for (let i = 0; i < count; i++)
        // {
        //     const bodyIdA = b2Shape_GetBody(contactData[ i ].shapeIdA);
        //     const bodyIdB = b2Shape_GetBody(contactData[ i ].shapeIdB);
        //     const userDataA = b2Body_GetUserData(bodyIdA);
        //     const userDataB = b2Body_GetUserData(bodyIdB);

        //     // is shapeIdA the player, or the other shape?
        //     const sign = B2_ID_EQUALS(bodyIdA, this.blockBodyId) ? 1.0 : -1.0;

        //     const normalX = sign * contactData[ i ].manifold.normalX;
        //     const normalY = sign * contactData[ i ].manifold.normalY;
        //     // console.log(normalX, normalY);
        // }
    }

    checkSensorEvents ()
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

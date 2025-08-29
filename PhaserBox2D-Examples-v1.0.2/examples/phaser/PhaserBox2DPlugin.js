import { CreateBoxPolygon, CreateCircle, CreateWorld, DYNAMIC, STATIC, WorldStep, b2World_Draw } from '../lib/PhaserBox2D.js';
import { GetWorldScale, SetWorldScale, b2Body_GetTransform, mpx, pxm, pxmVec2, rotFromRad } from '../lib/PhaserBox2D.js';
import { b2DefaultBodyDef, b2DefaultWorldDef, b2HexColor } from '../lib/PhaserBox2D.js';

export class PhaserBox2DPlugin
{
    constructor (scene)
    {
        this.scene = scene;
        this.scale = 30.0;
    }

    setWorldScale (scale)
    {
        SetWorldScale(scale);

        this.scale = scale;
    }

    bodyToSprite (body, sprite)
    {
        const t = b2Body_GetTransform(body.bodyId);

        sprite.setPosition(t.p.x * this.scale, -(t.p.y * this.scale));

        sprite.rotation = -Math.atan2(t.q.s, t.q.c);
    }

}

import * as Phaser from '../lib/phaser.esm.js';
import { BodyToSprite, CreateCircle, CreateWorld, GetWorldScale, SetWorldScale, WorldStep, b2World_Draw, pxm } from '../lib/PhaserBox2D.js';
import { DYNAMIC, STATIC, b2Vec2, pxmVec2 } from '../lib/PhaserBox2D.js';
import { b2DefaultBodyDef, b2DefaultWorldDef, b2HexColor, CreateBoxPolygon } from '../lib/PhaserBox2D.js';
import { PhaserDebugDraw } from './PhaserDebugDraw.js';

class VerletNode {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.oldX = x;
        this.oldY = y;
        this.radius = 2; // Radius for collision detection
        this.isDragged = false;
    }

    update(delta) {
        if (this.isDragged) return;

        const velocityX = this.x - this.oldX;
        const velocityY = this.y - this.oldY;

        this.oldX = this.x;
        this.oldY = this.y;

        this.x += velocityX;
        this.y += velocityY;
        this.y += 0.5 * delta; // gravity offset, feel free to play with it
    }

    applyConstraint(x, y) {
        this.x = x;
        this.y = y;
    }

    collideWithCircle(circle) {
        const dx = this.x - circle.x;
        const dy = this.y - circle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDist = this.radius + circle.radius;

        if (distance < minDist) {
            const angle = Math.atan2(dy, dx);
            const targetX = circle.x + Math.cos(angle) * minDist;
            const targetY = circle.y + Math.sin(angle) * minDist;
            const ax = (targetX - this.x) * 0.5;
            const ay = (targetY - this.y) * 0.5;

            this.x += ax;
            this.y += ay;
            circle.x -= ax;
            circle.y -= ay;
        }
    }
}

class VerletConstraint {
    constructor(nodeA, nodeB, length) {
        this.nodeA = nodeA;
        this.nodeB = nodeB;
        this.length = length;
    }

    solve() {
        const dx = this.nodeB.x - this.nodeA.x;
        const dy = this.nodeB.y - this.nodeA.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const difference = this.length - distance;
        const percent = difference / distance / 2;
        const offsetX = dx * percent;
        const offsetY = dy * percent;

        this.nodeA.x -= offsetX;
        this.nodeA.y -= offsetY;
        this.nodeB.x += offsetX;
        this.nodeB.y += offsetY;
    }
}

class Example extends Phaser.Scene {
    constructor() {
        super();
    }

    preload() {
        this.load.image('basketball', '../resources/images/basketball.png');
        this.load.image('backboard', '../resources/images/backboard.png');
    }

    create() {
        SetWorldScale(30);
        const worldDef = b2DefaultWorldDef();
        worldDef.gravity.y = -9.8;
        const world = CreateWorld({ worldDef });
        const worldId = world.worldId;

        this.add.image(640, 275, 'backboard');

        CreateBoxPolygon({
            worldId: worldId,
            type: STATIC,
            position: pxmVec2(640, 275),
            size: pxmVec2(10, 100),
            density: 1.0,
            friction: 0.5,
            color: b2HexColor.b2_colorWhite
        });

        this.nodes = [];
        this.constraints = [];
        const netWidthTop = 120;
        const netWidthBottom = 60;
        const netHeight = 50;
        const numNodesX = 10;
        const numNodesY = 5;

        for (let y = 0; y < numNodesY; y++) {
            const t = y / (numNodesY - 1);
            const netWidth = netWidthTop * (1 - t) + netWidthBottom * t;
            const spacingX = netWidth / (numNodesX - 1);
            for (let x = 0; x < numNodesX; x++) {
                const nodeX = (y === numNodesY - 1) ? 640 + x * (netWidthBottom / (numNodesX - 1)) - netWidthBottom / 2 : 640 + x * spacingX - netWidth / 2;
                const node = new VerletNode(nodeX, 200 + y * (netHeight / (numNodesY - 1)));
                this.nodes.push(node);
                if (x > 0) {
                    const constraint = new VerletConstraint(this.nodes[y * numNodesX + x - 1], node, spacingX);
                    this.constraints.push(constraint);
                }
                if (y > 0) {
                    const constraint = new VerletConstraint(this.nodes[(y - 1) * numNodesX + x], node, netHeight / (numNodesY - 1));
                    this.constraints.push(constraint);
                }
            }
        }

        for (let x = 0; x < numNodesX; x++) {
            this.nodes[x].applyConstraint(640 + x * (netWidthTop / (numNodesX - 1)) - netWidthTop / 2, 200);
        }

        this.basketball = this.add.image(640, 100, 'basketball');
        this.basketball.setScale(.5);
        this.basketballBody = CreateCircle({
            worldId: worldId,
            type: DYNAMIC,
            position: pxmVec2(640, 100),
            radius: pxm(15),
            density: 1.0,
            friction: 0.5,
            color: b2HexColor.b2_colorOrange
        });

        this.input.on('pointerdown', (pointer) => {
            for (const node of this.nodes) {
                const dx = pointer.x - node.x;
                const dy = pointer.y - node.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 10) {
                    node.isDragged = true;
                    node.dragOffsetX = dx;
                    node.dragOffsetY = dy;
                }
            }
        });

        this.input.on('pointermove', (pointer) => {
            for (const node of this.nodes) {
                if (node.isDragged) {
                    node.x = pointer.x - node.dragOffsetX;
                    node.y = pointer.y - node.dragOffsetY;
                }
            }
        });

        this.input.on('pointerup', () => {
            for (const node of this.nodes) {
                node.isDragged = false;
            }
        });

        const debug = this.add.graphics();
        const debugDraw = new PhaserDebugDraw(debug, 1280, 720, GetWorldScale());
        this.debug = debug;
        this.world = world;
        this.worldDraw = debugDraw;


        // console.log(this.basketballBody);
    }

    update(time, delta) {
        WorldStep({ worldId: this.world.worldId, deltaTime: delta });

        for (const node of this.nodes) {
            node.update(delta);
        }

        for (const constraint of this.constraints) {
            constraint.solve();
        }

        // Fix the top nodes
        const netWidthTop = 100;
        const netWidthBottom = 60;
        const numNodesX = 10;
        const spacingXTop = netWidthTop / (numNodesX - 1);
        const spacingXBottom = netWidthBottom / (numNodesX - 1);
        const numNodesY = 5;
        const netHeight = 160;


        for (let x = 0; x < numNodesX; x++) {
            this.nodes[x].applyConstraint(640 + x * spacingXTop - netWidthTop / 2, 260);
        }

        // Fix the bottom nodes
        const bottomRowStartIndex = (numNodesY - 1) * numNodesX;
        for (let x = 0; x < numNodesX; x++) {
            this.nodes[bottomRowStartIndex + x].applyConstraint(640 + x * spacingXBottom - netWidthBottom / 2, 200 + (numNodesY - 1) * (netHeight / (numNodesY - 1)));
        }

        BodyToSprite(this.basketballBody, this.basketball);

        this.debug.clear();
        this.debug.lineStyle(2, 0xffffff);
        for (const constraint of this.constraints) {
            this.debug.beginPath();
            this.debug.moveTo(constraint.nodeA.x, constraint.nodeA.y);
            this.debug.lineTo(constraint.nodeB.x, constraint.nodeB.y);
            this.debug.strokePath();
        }

        //b2World_Draw(this.world.worldId, this.worldDraw);

    }
}

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    scene: Example
};

const game = new Phaser.Game(config);
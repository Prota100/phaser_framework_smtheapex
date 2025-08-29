/**
 * Phaser Box2D TypeScript Definitions
 * Simplified type definitions for Box2D integration
 */

export interface b2Vec2 {
    x: number;
    y: number;
}

export interface b2Rot {
    c: number;
    s: number;
}

export interface b2WorldDef {
    gravity: b2Vec2;
    restitutionThreshold: number;
    contactPushoutVelocity: number;
    hitEventThreshold: number;
    contactHertz: number;
    contactDampingRatio: number;
    jointHertz: number;
    jointDampingRatio: number;
    enableSleep: boolean;
    enableContinuous: boolean;
}

export interface b2BodyDef {
    type: number;
    position: b2Vec2;
    rotation: b2Rot;
    linearVelocity: b2Vec2;
    angularVelocity: number;
    linearDamping: number;
    angularDamping: number;
    gravityScale: number;
    sleepThreshold: number;
    userData: any;
    enableSleep: boolean;
    isAwake: boolean;
    fixedRotation: boolean;
    isBullet: boolean;
    isEnabled: boolean;
    automaticMass: boolean;
}

export interface b2World {
    worldId: number;
}

export interface b2Body {
    bodyId: number;
    worldId: number;
}

export enum b2BodyType {
    b2_staticBody = 0,
    b2_kinematicBody = 1,
    b2_dynamicBody = 2
}

export interface b2HexColor {
    b2_colorAliceBlue: number;
    b2_colorAntiqueWhite: number;
    b2_colorRed: number;
    b2_colorGreen: number;
    b2_colorBlue: number;
    b2_colorGold: number;
    b2_colorLawnGreen: number;
}

// Function declarations
export function b2DefaultWorldDef(): b2WorldDef;
export function b2DefaultBodyDef(): b2BodyDef;
export function CreateWorld(options: { worldDef: b2WorldDef }): b2World;
export function CreateBoxPolygon(options: any): b2Body;
export function CreateCircle(options: any): b2Body;
export function WorldStep(options: { worldId: number; deltaTime: number }): void;
export function CreateDebugDraw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, scale: number): any;
export function b2World_Draw(worldId: number, draw: any): void;
export function RAF(callback: (deltaTime: number, currentTime: number, fps: number) => void): void;

// Export all as namespace for compatibility
export as namespace PhaserBox2D;
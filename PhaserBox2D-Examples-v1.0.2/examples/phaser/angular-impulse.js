import * as Phaser from '../lib/phaser.esm.js';
import { 
    AddSpriteToWorld, 
    b2DefaultWorldDef, 
    b2Vec2, 
    CreateWorld, 
    SpriteToBox, 
    UpdateWorldSprites, 
    WorldStep, 
    b2Body_ApplyAngularImpulse, 
    b2Body_GetAngularVelocity 
} from '../lib/PhaserBox2D.js';

export class Example extends Phaser.Scene 
{
    angularImpulse = 0;         // Current angular impulse applied to the wheel
    angularAcceleration = 100; // Rate of change for angular impulse
    maxAngularImpulse = 2000;  // Maximum allowable angular impulse

    constructor () 
    {
        super('Blade'); // Initialize the scene with the name 'Blade'
    }

    preload () 
    {
        // Load the wheel sprite
        this.load.image('wheel', '../resources/images/blade.png');
    }

    create () 
    {
        // Configure the physics world with no gravity
        const worldDef = b2DefaultWorldDef();
        worldDef.gravity = new b2Vec2(0, 0);

        this.world = CreateWorld({ worldDef });
        this.worldId = this.world.worldId;

        // Add the background image
        this.add.image(512, 384, 'background');

        // Create the wheel sprite and its physics body
        this.wheel = this.add.image(512, 384, 'wheel');
        this.wheelBody = SpriteToBox(this.worldId, this.wheel, {
            restitution: 0.3,      // Bounciness
            friction: 0.5,         // Surface friction
            angularDamping: 1      // Resistance to angular motion
        });
        AddSpriteToWorld(this.worldId, this.wheel, this.wheelBody);

        // Add an on-screen text for displaying debug info
        this.text = this.add.text(0, 0, '', 
        {
            fixedWidth: 350,
            fixedHeight: 150,
            fill: 'aqua',
            fontSize: '16px',
            backgroundColor: '#000c'
        });

        // Set up keyboard input for controlling the wheel
        this.cursors = this.input.keyboard.createCursorKeys();
    }

    update (time, delta) 
    {
        // Step the physics world and update sprite positions
        if (this.world) 
        {
            WorldStep({ worldId: this.worldId, deltaTime: delta });
            UpdateWorldSprites(this.worldId);
        }

        // Handle keyboard input for applying angular impulse
        const { left, right } = this.cursors;

        if (left.isDown) 
        {
            // Increase angular impulse when the right key is pressed
            this.angularImpulse = Math.min(this.angularImpulse + this.angularAcceleration, this.maxAngularImpulse);
        } 
        else if (right.isDown) 
            {
            // Decrease angular impulse when the left key is pressed
            this.angularImpulse = Math.max(this.angularImpulse - this.angularAcceleration, -this.maxAngularImpulse);
        } 
        else 
        {
            // Gradually reduce angular impulse when no key is pressed
            this.angularImpulse *= 0.95;
        }

        // Apply the current angular impulse to the wheel
        if (this.wheelBody) 
        {
            b2Body_ApplyAngularImpulse(this.wheelBody.bodyId, this.angularImpulse, true);
        }

        // Update the debug text with current physics values
        this.text.setText(`
Angular Acceleration: ${this.angularAcceleration.toFixed(2)}
Angular Impulse:       ${this.angularImpulse.toFixed(2)}
Angular Velocity:      ${b2Body_GetAngularVelocity(this.wheelBody.bodyId).toFixed(2)}
        `);
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

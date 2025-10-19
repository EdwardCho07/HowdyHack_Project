class HomeScene extends Phaser.Scene {
  constructor() {
    super('HomeScene');
  }
  preload() {
  }
  create() {
    const { width, height } = this.scale;

    // Title text
    this.add.text(width / 2, height / 2 - 100, 'My 2D Platformer', {
      fontSize: '48px',
      fill: '#fff',
      fontFamily: 'Arial',
      stroke: '#000',
      strokeThickness: 6
    }).setOrigin(0.5);

    // Start button
    const startText = this.add.text(width / 2, height / 2 + 50, 'Press SPACE to Start', {
      fontSize: '32px',
      fill: '#fff'
    }).setOrigin(0.5);

    // Listen for SPACE key
    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('GameScene'); // switch to the game
    });
  }
}

class GameScene extends Phaser.Scene{
  constructor(){
    super('GameScene');
  }

  player; platforms; keys;
  onGround = false;
  currentSurfaceAngle = 0;
  spinning = false;
  targetRotation = 0;
  hasSpun = false;

  preload() {
    // You can load images here later:
    this.load.spritesheet('player', 'skate_idle.png', {frameWidth: 300, frameHeight: 300});
    this.load.spritesheet('player_right', 'Skateboard_Moving_Right.png', {frameWidth: 300, frameHeight: 300});
    this.load.spritesheet('player_left', 'Skateboard_Moving_Left.png', {frameWidth: 300, frameHeight: 300});
    this.load.image('player_air', 'Skateboard_Air.png');
    this.load.image('ground', 'grass.png');
    this.load.image('ramp', 'ramp.png');
  }

  createPlatforms(scene, numPlatforms = 50) {
    let x = 600; // starting x position
    let previousY = window.innerHeight - 100; // starting platform height

    for (let i = 0; i < numPlatforms; i++) {
      // Random horizontal spacing between platforms
      const spacing = Phaser.Math.Between(200, 600);
      x += spacing;

      // Random vertical offset, but limit difference from previous platform
      const deltaY = Phaser.Math.Between(-100, 100);
      let y = Phaser.Math.Clamp(previousY + deltaY, window.innerHeight - 300, window.innerHeight - 50);
      previousY = y;

      // Random platform width
      const width = Phaser.Math.Between(200, 400);

      // Decide if this platform should be a ramp
      const isRamp = Phaser.Math.Between(0, 1) === 1;
      const angle = isRamp ? Phaser.Math.Between(-30, 30) : 0;

      // Create the platform/ramp
      scene.matter.add.rectangle(x, y, width, 20, {
        isStatic: true,
        angle: Phaser.Math.DegToRad(angle),
        friction: 0,
        frictionStatic: 0
      });
    }
  }
  create() {
    // Platforms
    this.matter.world.setBounds(0, 0, 60000, window.innerHeight);
    this.createPlatforms(this, 50); 
    // Ground
    this.matter.add.rectangle(5000, window.innerHeight - 10, 10000, 20, { isStatic: true });

    // Ramp
    this.matter.add.rectangle(600, window.innerHeight - 60, 300, 20, {
      isStatic: true,
      angle: Phaser.Math.DegToRad(-20)
    });

    // Add player (a physics-enabled rectangle)
    this.player = this.matter.add.sprite(100, window.innerHeight - 200, 'player');
    this.player.setScale(0.5);
    this.player.setRectangle(this.player.displayWidth, this.player.displayHeight);
    this.player.setBounce(0.2);
    this.player.setFixedRotation(false);
    this.player.setMass(1);
    this.player.setFriction(0);   
    this.player.setFrictionAir(0.02);

    let groundContacts = [];

    this.anims.create({
        key: 'idle',
        frames: this.anims.generateFrameNumbers('player', { start: 0, end: 1 }),
        frameRate: 3,
        repeat: -1
    });
    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('player_right', { start: 0, end: 2 }),
        frameRate: 4,
        repeat: -1
    });
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('player_left', { start: 0, end: 2 }),
        frameRate: 4,
        repeat: -1
    });

    this.matter.world.on('collisionstart', (event) => {
      event.pairs.forEach(pair => {
          if (pair.bodyA === this.player.body || pair.bodyB === this.player.body) {
              const other = pair.bodyA === this.player.body ? pair.bodyB : pair.bodyA;
              const collision = pair.collision;
              const normal = collision.normal;

              // Determine if surface is mostly below player
              const playerIsA = pair.bodyA === this.player.body;
              let normalY = playerIsA ? normal.y : -normal.y;

              if (normalY < -0.5) {
                  // Add to ground contacts
                  if (!groundContacts.includes(other)) groundContacts.push(other);

                  this.onGround = true;

                  // Use the collision normal for ramp angle
                  this.currentSurfaceAngle = Math.atan2(normal.x, -normal.y);
              }
          }
      });
    });
    this.matter.world.on('collisionend', (event) => {
      event.pairs.forEach(pair => {
          if (pair.bodyA === this.player.body || pair.bodyB === this.player.body) {
              const other = pair.bodyA === this.player.body ? pair.bodyB : pair.bodyA;

              // Remove from ground contacts
              const index = groundContacts.indexOf(other);
              if (index !== -1) groundContacts.splice(index, 1);

              // Only unset onGround if no contacts below remain
              this.onGround = groundContacts.length > 0;
              if (!this.onGround) this.currentSurfaceAngle = 0;
          }
      });
    });

    // Camera
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, 10000, window.innerHeight);

    // Input keys
    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      rotateLeft: Phaser.Input.Keyboard.KeyCodes.LEFT,
      rotateRight: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      six: Phaser.Input.Keyboard.KeyCodes.SIX,
      seven: Phaser.Input.Keyboard.KeyCodes.SEVEN,
    });
  }

  update() {
    const moveForce = 0.002;
    const jumpForce = 0.040;
    const rotateForce = 0.006;
    const maxSpeed = 8;

    // Smooth horizontal movement
    let targetVelX = 0;
    if (this.keys.left.isDown){ 
      targetVelX = -maxSpeed;
      this.player.anims.play('left', true);
    }
    else if (this.keys.right.isDown){
      targetVelX = maxSpeed;
      this.player.anims.play('right', true);
    } else {
      if(this.onGround){
        this.player.anims.play('idle', true);
      }
    }
    // Interpolate current velocity toward target velocity
    this.player.setVelocityX(Phaser.Math.Linear(this.player.body.velocity.x, targetVelX, 0.1));

    // Jump (only when touching ground or ramp)
    if (Phaser.Input.Keyboard.JustDown(this.keys.space) && this.onGround) {
      this.player.applyForce({ x: 0, y: -jumpForce });
    }
    // Start spin when both keys are down and not already spinning
    if (!this.spinning && !this.onGround && !this.hasSpun && this.keys.six.isDown && this.keys.seven.isDown) {
      this.spinning = true;
      // Set target rotation: 360 degrees = 2 * PI radians
      this.targetRotation = this.player.rotation + Math.PI * 2;
      // Set angular velocity for the spin
      this.player.setAngularVelocity(0.2); // adjust speed as desired
    }

    if (this.spinning) {
      // Check if player has reached or passed the target rotation
      if ((this.player.body.angularVelocity > 0 && this.player.rotation >= this.targetRotation) ||
          (this.player.body.angularVelocity < 0 && this.player.rotation <= this.targetRotation)) {
          this.spinning = false;
          this.player.setAngularVelocity(0);
          this.player.rotation = this.targetRotation % (Math.PI * 2); // wrap rotation
      }
    }

    if (this.onGround) {
      // Smoothly interpolate rotation to match surface angle
      const ROTATION_SPEED = 0.1;
      this.player.rotation = Phaser.Math.Angle.RotateTo(
          this.player.rotation,
          this.currentSurfaceAngle,
          ROTATION_SPEED
      );
      this.player.setAngularVelocity(0);

      // Stop angular velocity so it doesn't wobble
      this.player.setAngularVelocity(0);
    } else {
        // Rotation in air (spins, etc.) remains unchanged
    }


    // Check if player fell below the screen
    if (this.player.y > config.height + 200) { // 200px buffer
      // Example: reset player to starting position
      this.player.setPosition(100, window.innerHeight - 200);
      this.player.setVelocity(0, 0);
      this.player.setAngularVelocity(0);
      this.player.rotation = 0;
      
      // Reset flags if needed
      this.onGround = false;
      this.hasSpun = false;
      this.spinning = false;
    }  
  }
}

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#87ceeb',
  physics: {
    default: 'matter',
    matter: {
      gravity: { y: 1 },
      debug: true
    }
  },
  scene: [HomeScene, GameScene]
};

let game = new Phaser.Game(config);



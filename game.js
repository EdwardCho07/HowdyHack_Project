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

  player;
  platforms;
  keys;

  preload() {
    // You can load images here later:
    this.load.spritesheet('player', 'skate_idle.png', {frameWidth: 300, frameHeight: 300});
    this.load.spritesheet('player_right', 'Skateboard_Moving_Right.png', {frameWidth: 300, frameHeight: 300});
    this.load.spritesheet('player_left', 'Skateboard_Moving_Left.png', {frameWidth: 300, frameHeight: 300});
    this.load.image('player_air', 'Skateboard_Air.png');
    this.load.image('ground', 'grass.png');
  }

  create() {
    // Platforms
    this.platforms = this.physics.add.staticGroup();
    this.platforms.create(400, 390, 'ground')
            .setScale(2)
            .refreshBody()
            .setSize(800, 20)
            .setVisible(true); // hide if you like

    this.platforms.create(300, 300, 'ground').setSize(50, 20).refreshBody();
    this.platforms.create(550, 240, 'ground').setSize(70, 20).refreshBody();

    const floor = this.add.rectangle(0, window.innerHeight - 10, window.innerWidth * 2, 20, 0x654321); // x, y, width, height, color
    this.physics.add.existing(floor, true); // true = static body

    // Add player (a physics-enabled rectangle)
    this.player = this.physics.add.sprite(10 , window.innerHeight - 100, 'player');
    this.player.setBounce(0.2);
    this.player.body.setCollideWorldBounds(true);
    this.player.setScale(0.5);
    this.player.setOrigin(0.5, 0.5);
    this.player.body.setSize(this.player.width, this.player.height);
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
    // Collide player with platforms
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.player, floor); 

    // Input keys
    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      rotateLeft: Phaser.Input.Keyboard.KeyCodes.LEFT,
      rotateRight: Phaser.Input.Keyboard.KeyCodes.RIGHT
    });
  }

  update() {
    const accel = 250;       // horizontal acceleration
    const drag = 200;        // friction
    const maxSpeed = 300;
    const jump = -350;
    const rotationAccel = 0.003; // how fast rotation accelerates
    const rotationDrag = 0.99;  // slows rotation per frame
    const tiltAmount = 0.1;     
    const onGround = this.player.body.touching.down;

    // Initialize angularVelocity if not exists
    if (this.player.body.angularVelocity === undefined) this.player.body.angularVelocity = 0;

    // Apply friction
    this.player.body.setDragX(drag);
    this.player.body.setMaxVelocity(maxSpeed, 600);

    // Horizontal movement (A/D keys)
    if (this.keys.left.isDown){
      this.player.body.setAccelerationX(-accel);
      this.player.anims.play('left', true);
    }
    else if (this.keys.right.isDown) {
      this.player.body.setAccelerationX(accel);
      this.player.anims.play('right', true);
    }
    else {
      this.player.body.setAccelerationX(0);
      if(onGround){
        this.player.anims.play('idle', true);
      }
    }
    // Jump
    if (this.keys.space.isDown && onGround){
      this.player.body.setVelocityY(jump);
    }
    // Tilt while moving on ground
    if (onGround) {
      const targetTilt = this.keys.left.isDown ? -tiltAmount : this.keys.right.isDown ? tiltAmount : 0;
      this.player.rotation = Phaser.Math.Linear(this.player.rotation, targetTilt, 0.1);
    } else {
      // Rotational momentum in air
      this.player.anims.stop();
      this.player.setTexture('player_air');
      if (this.keys.rotateLeft.isDown) this.player.body.angularVelocity -= rotationAccel;
      if (this.keys.rotateRight.isDown) this.player.body.angularVelocity += rotationAccel;

      // Apply angular velocity to rotation
      this.player.rotation += this.player.body.angularVelocity;

      // Apply drag to gradually slow down rotation
      this.player.body.angularVelocity *= rotationDrag;
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
  scene: { preload, create, update }
};

let game = new Phaser.Game(config);
let player, input;
let onGround = false;

function preload() {
  this.load.spritesheet('player', 'skate_idle.png', { frameWidth: 300, frameHeight: 300 });
  this.load.image('ground', 'grass.png');
  this.load.image('ramp', 'ramp.png');
}

function create() {
  this.matter.world.setBounds(0, 0, 60000, window.innerHeight);

  // Ground
  this.matter.add.rectangle(5000, window.innerHeight - 10, 10000, 20, { isStatic: true });

  // Ramp
  this.matter.add.rectangle(600, window.innerHeight - 60, 300, 20, {
    isStatic: true,
    angle: Phaser.Math.DegToRad(-20)
  });

  // Player
  player = this.matter.add.sprite(100, window.innerHeight - 200, 'player');
  player.setScale(2);
  player.setRectangle(player.displayWidth, player.displayHeight);
  player.setBounce(0.2);
  player.setFixedRotation(false);
  player.setMass(1);
  player.setFriction(0);   
  player.setFrictionAir(0.02); 

  // Collision detection for ground/ramp contact
  this.matter.world.on('collisionstart', (event) => {
    event.pairs.forEach(pair => {
      if (pair.bodyA === player.body || pair.bodyB === player.body) {
        const collision = pair.collision;
        const normalY = collision.normal.y;

        // Check both directions since the normal may flip depending on order
        if (Math.abs(normalY) > 0.5) {
          const playerIsBodyA = pair.bodyA === player.body;
          const isSurfaceBelow = playerIsBodyA ? (normalY < 0) : (normalY > 0);

          if (isSurfaceBelow) {
            onGround = true;
          }
        }
      }
    });
  });

  this.matter.world.on('collisionend', (event) => {
    event.pairs.forEach(pair => {
      if (pair.bodyA === player.body || pair.bodyB === player.body) {
        onGround = false;
      }
    });
  });

  // Camera
  this.cameras.main.startFollow(player, true, 0.1, 0.1);
  this.cameras.main.setBounds(0, 0, 10000, window.innerHeight);

  // Input
  input = this.input.keyboard.addKeys({
    up: Phaser.Input.Keyboard.KeyCodes.W,
    left: Phaser.Input.Keyboard.KeyCodes.A,
    right: Phaser.Input.Keyboard.KeyCodes.D,
    space: Phaser.Input.Keyboard.KeyCodes.SPACE,
    rotateLeft: Phaser.Input.Keyboard.KeyCodes.LEFT,
    rotateRight: Phaser.Input.Keyboard.KeyCodes.RIGHT
  });
}

function update() {
  const moveForce = 0.002;
  const jumpForce = 0.035;
  const rotateForce = 0.006;

  const maxSpeed = 5

  // Smooth horizontal movement
  let targetVelX = 0;
  if (input.left.isDown) targetVelX = -maxSpeed;
  else if (input.right.isDown) targetVelX = maxSpeed;

  // Interpolate current velocity toward target velocity
  player.setVelocityX(Phaser.Math.Linear(player.body.velocity.x, targetVelX, 0.1));

  // Jump (only when touching ground or ramp)
  if (Phaser.Input.Keyboard.JustDown(input.space) && onGround) {
    player.applyForce({ x: 0, y: -jumpForce });
  }

}


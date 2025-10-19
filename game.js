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
let currentSurfaceAngle = 0; // stores the current ramp angle


function preload() {
  this.load.spritesheet('player', 'skate_idle.png', { frameWidth: 300, frameHeight: 300 });
  this.load.image('ground', 'grass.png');
  this.load.image('ramp', 'ramp.png');
}

function createPlatforms(scene, numPlatforms = 50) {
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



function create() {
  this.matter.world.setBounds(0, 0, 60000, window.innerHeight + 400);

  //
  createPlatforms(this, 50); 

  // Ground
  this.matter.add.rectangle(0, window.innerHeight - 10, 1000, 20, { isStatic: true });

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

  let groundContacts = [];

  this.matter.world.on('collisionstart', (event) => {
      event.pairs.forEach(pair => {
          if (pair.bodyA === player.body || pair.bodyB === player.body) {
              const other = pair.bodyA === player.body ? pair.bodyB : pair.bodyA;
              const collision = pair.collision;
              const normal = collision.normal;

              // Determine if surface is mostly below player
              const playerIsA = pair.bodyA === player.body;
              let normalY = playerIsA ? normal.y : -normal.y;

              if (normalY < -0.5) {
                  // Add to ground contacts
                  if (!groundContacts.includes(other)) groundContacts.push(other);

                  onGround = true;

                  // Use the collision normal for ramp angle
                  currentSurfaceAngle = Math.atan2(normal.x, -normal.y);
              }
          }
      });
  });

  this.matter.world.on('collisionend', (event) => {
      event.pairs.forEach(pair => {
          if (pair.bodyA === player.body || pair.bodyB === player.body) {
              const other = pair.bodyA === player.body ? pair.bodyB : pair.bodyA;

              // Remove from ground contacts
              const index = groundContacts.indexOf(other);
              if (index !== -1) groundContacts.splice(index, 1);

              // Only unset onGround if no contacts below remain
              onGround = groundContacts.length > 0;
              if (!onGround) currentSurfaceAngle = 0;
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
    rotateRight: Phaser.Input.Keyboard.KeyCodes.RIGHT,
    six: Phaser.Input.Keyboard.KeyCodes.SIX,
    seven: Phaser.Input.Keyboard.KeyCodes.SEVEN,
  });
}

let spinning = false;
let targetRotation = 0;
let hasSpun = false;  // Tracks if spin has been used in current jump


function update() {
  const moveForce = 0.002;
  const jumpForce = 0.040;
  const rotateForce = 0.006;

  const maxSpeed = 8

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

  // Start spin when both keys are down and not already spinning
  if (!spinning && !onGround && !hasSpun && input.six.isDown && input.seven.isDown) {
    spinning = true;
    // Set target rotation: 360 degrees = 2 * PI radians
    targetRotation = player.rotation + Math.PI * 2;
    // Set angular velocity for the spin
    player.setAngularVelocity(0.2); // adjust speed as desired
  }

  if (spinning) {
    // Check if player has reached or passed the target rotation
    if ((player.body.angularVelocity > 0 && player.rotation >= targetRotation) ||
        (player.body.angularVelocity < 0 && player.rotation <= targetRotation)) {
        spinning = false;
        player.setAngularVelocity(0);
        player.rotation = targetRotation % (Math.PI * 2); // wrap rotation
    }
  }

  if (onGround) {
    // Smoothly interpolate rotation to match surface angle
    const ROTATION_SPEED = 0.1;
    player.rotation = Phaser.Math.Angle.RotateTo(
        player.rotation,
        currentSurfaceAngle,
        ROTATION_SPEED
    );
    player.setAngularVelocity(0);

    // Stop angular velocity so it doesn't wobble
    player.setAngularVelocity(0);
  } else {
      // Rotation in air (spins, etc.) remains unchanged
  }


  // Check if player fell below the screen
  if (player.y > config.height + 200) { // 200px buffer
    // Example: reset player to starting position
    player.setPosition(100, window.innerHeight - 200);
    player.setVelocity(0, 0);
    player.setAngularVelocity(0);
    player.rotation = 0;
    
    // Reset flags if needed
    onGround = false;
    hasSpun = false;
    spinning = false;
  }  

}


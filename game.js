const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#87ceeb',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 500 },
      debug: false
    }
  },
  scene: {
    preload,
    create,
    update
  }
};

game = new Phaser.Game(config);

let player;
let platforms;
let input;

function preload() {
  // You can load images here later:
  this.load.spritesheet('player', 'skate_idle.png', {frameWidth: 300, frameHeight: 300});
  this.load.image('ground', 'grass.png');
}

function create() {
  // Platforms
  platforms = this.physics.add.staticGroup();
  platforms.create(400, 390, 'ground')
           .setScale(2)
           .refreshBody()
           .setSize(800, 20)
           .setVisible(true); // hide if you like

  platforms.create(300, 300, 'ground').setSize(50, 20).refreshBody();
  platforms.create(550, 240, 'ground').setSize(70, 20).refreshBody();

  const floor = this.add.rectangle(0, window.innerHeight - 10, window.innerWidth * 2, 20, 0x654321); // x, y, width, height, color
  this.physics.add.existing(floor, true); // true = static body

  // Add player (a physics-enabled rectangle)
  player = this.physics.add.sprite(10 , window.innerHeight - 100, 'player');
  player.setBounce(0.2);
  player.body.setCollideWorldBounds(true);
  player.setScale(0.5);
  player.setOrigin(0.5, 0.5);
  player.body.setSize(player.width, player.height);
  this.anims.create({
      key: 'idle',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 1 }),
      frameRate: 1,
      repeat: -1
  });
  // Collide player with platforms
  this.physics.add.collider(player, platforms);
  this.physics.add.collider(player, floor); 

  // Input keys
  input = this.input.keyboard.addKeys({
    up: Phaser.Input.Keyboard.KeyCodes.W,
    left: Phaser.Input.Keyboard.KeyCodes.A,
    down: Phaser.Input.Keyboard.KeyCodes.S,
    right: Phaser.Input.Keyboard.KeyCodes.D,
    space: Phaser.Input.Keyboard.KeyCodes.SPACE,
    rotateLeft: Phaser.Input.Keyboard.KeyCodes.LEFT,
    rotateRight: Phaser.Input.Keyboard.KeyCodes.RIGHT
  });
}

function update() {
  const accel = 250;       // horizontal acceleration
  const drag = 200;        // friction
  const maxSpeed = 300;
  const jump = -500;
  const rotationSpeed = 0.1; // rotation speed per frame
  const tiltAmount = 0.2;      // max tilt when moving
  const onGround = player.body.touching.down;

  // Apply friction
  player.body.setDragX(drag);
  player.body.setMaxVelocity(maxSpeed, 600);

  // Horizontal movement (A/D keys)
  if (input.left.isDown) 
    player.body.setAccelerationX(-accel);
  else if (input.right.isDown) 
    player.body.setAccelerationX(accel);
  else 
    player.body.setAccelerationX(0);

  // Jump
  if (input.space.isDown && onGround) 
    player.body.setVelocityY(jump);

  // Tilt while moving on ground
  if (onGround) {
    const targetTilt = input.left.isDown ? -tiltAmount : input.right.isDown ? tiltAmount : 0;
    player.rotation = Phaser.Math.Linear(player.rotation, targetTilt, 0.1);
  } else {
    // Spin while in air
    if (input.rotateLeft.isDown) player.rotation -= rotationSpeed;
    if (input.rotateRight.isDown) player.rotation += rotationSpeed;
  }
}

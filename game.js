const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 400,
  backgroundColor: '#87ceeb',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 600 },
      debug: false
    }
  },
  scene: {
    preload,
    create,
    update
  }
};

const game = new Phaser.Game(config);

let player;
let platforms;

function preload() {
  // You can load images here later:
  // this.load.image('player', 'player.png');
  // this.load.image('platform', 'platform.png');
}

function create() {
  // Add static platforms (they don’t move)
  platforms = this.physics.add.staticGroup();
  platforms.create(400, 390, 'ground')
           .setScale(2)
           .refreshBody()
           .setSize(800, 20)
           .setVisible(false); // hide if you like

  platforms.create(300, 300, 'ground').setSize(120, 20).refreshBody();
  platforms.create(550, 240, 'ground').setSize(100, 20).refreshBody();

  // Add player (a physics-enabled rectangle)
  player = this.add.rectangle(100, 300, 40, 40, 0xff0000);
  this.physics.add.existing(player);
  player.body.setCollideWorldBounds(true);

  // Collide player with platforms
  this.physics.add.collider(player, platforms);

  // Input
  input = this.input.keyboard.addKeys({
    up: Phaser.Input.Keyboard.KeyCodes.W,
    left: Phaser.Input.Keyboard.KeyCodes.A,
    down: Phaser.Input.Keyboard.KeyCodes.S,
    right: Phaser.Input.Keyboard.KeyCodes.D,
    space: Phaser.Input.Keyboard.KeyCodes.SPACE
  });

  }

function update() {
  const accel = 250;  // acceleration rate
  const drag = 200;   // slows player when not pressing
  const maxSpeed = 300;
  const jump = -400;
  const onGround = player.body.touching.down;

  // Apply drag (friction)
  player.body.setDragX(drag);

  // Limit max velocity
  player.body.setMaxVelocity(maxSpeed, 600);
  // Horizontal movement
  if (input.left.isDown) {
    player.body.setAccelerationX(-accel);
  } 
  else if (input.right.isDown) {
    player.body.setAccelerationX(accel);
  } 
  else {
    player.body.setAccelerationX(0);
  }

  // Jump
  if (input.space.isDown && onGround) {
    player.body.setVelocityY(jump);
  }
}

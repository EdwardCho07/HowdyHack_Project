const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
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

game = new Phaser.Game(config);

let player;
let platforms;

function preload() {
  // You can load images here later:
  this.load.spritesheet('player', 'skate_idle.png', {frameWidth: 300, frameHeight: 300});
  this.load.image('ground', 'grass.png');
}

function create() {
  // Add static platforms (they don’t move)
  platforms = this.physics.add.staticGroup();
  platforms.create(400, 390, 'ground')
           .setScale(2)
           .refreshBody()
           .setSize(800, 20)
           .setVisible(true); // hide if you like

  platforms.create(300, 300, 'ground').setSize(50, 20).refreshBody();
  platforms.create(550, 240, 'ground').setSize(70, 20).refreshBody();

  // Add player (a physics-enabled rectangle)
  player = this.physics.add.sprite(100,300, 'player');
  player.setBounce(0.2);
  player.body.setCollideWorldBounds(true);
  player.setScale(1.0);
  this.anims.create({
      key: 'idle',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 1 }),
      frameRate: 1,
      repeat: -1
  });
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
  const speed = 200;
  const jump = -400;
  const onGround = player.body.touching.down;

  // Horizontal movement
  if (input.left.isDown) {
    player.body.setVelocityX(-speed);
  } else if (input.right.isDown) {
    player.body.setVelocityX(speed);
  } else {
    player.body.setVelocityX(0);
  }

  // Jump
  if (input.space.isDown && onGround) {
    player.body.setVelocityY(jump);
  } else if(input.up.isDown){
    player.body.setVelocityY(-200);
  }
}

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
let cursors;
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
  cursors = this.input.keyboard.createCursorKeys();
}

function update() {
  const speed = 200;
  const jump = -400;
  const onGround = player.body.touching.down;

  // Horizontal movement
  if (cursors.left.isDown) {
    player.body.setVelocityX(-speed);
  } else if (cursors.right.isDown) {
    player.body.setVelocityX(speed);
  } else {
    player.body.setVelocityX(0);
  }

  // Jump
  if (cursors.space.isDown && onGround) {
    player.body.setVelocityY(jump);
  }
}

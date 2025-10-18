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
  this.matter.world.setBounds(0, 0, 10000, window.innerHeight);

  // Ground
  this.matter.add.rectangle(5000, window.innerHeight - 10, 10000, 20, { isStatic: true });

  // Ramp
  this.matter.add.rectangle(600, window.innerHeight - 100, 300, 20, {
    isStatic: true,
    angle: Phaser.Math.DegToRad(-20)
  });

  // Player
  player = this.matter.add.sprite(100, window.innerHeight - 200, 'player');
  player.setScale(0.5);
  player.setRectangle(player.displayWidth, player.displayHeight);
  player.setBounce(0.2);
  player.setFixedRotation(false);
  player.setMass(1);
  player.setFriction(0.01);   
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
  const jumpForce = 0.025;
  const rotateForce = 0.006;

  // Horizontal movement
  if (input.left.isDown) {
    player.applyForce({ x: -moveForce, y: 0 });
  } else if (input.right.isDown) {
    player.applyForce({ x: moveForce, y: 0 });
  }

  // Jump (only when touching ground or ramp)
  if (Phaser.Input.Keyboard.JustDown(input.space) && onGround) {
    player.applyForce({ x: 0, y: -jumpForce });
  }

  // Rotation control
  if (input.rotateLeft.isDown && onGround) {
    player.setAngularVelocity(player.body.angularVelocity - rotateForce);
  }
  if (input.rotateRight.isDown && onGround) {
    player.setAngularVelocity(player.body.angularVelocity + rotateForce);
  }

  const maxSpeed = onGround ? 5 : 3; // lower max in air
  if (player.body.velocity.x > maxSpeed) player.setVelocityX(maxSpeed);
  if (player.body.velocity.x < -maxSpeed) player.setVelocityX(-maxSpeed);

}

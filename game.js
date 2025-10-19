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
  
  obstacles = [];
  obstacleSpeed = 2; // pixels per frame


  preload() {
    // You can load images here later:
    this.load.spritesheet('player', 'skate_idle.png', {frameWidth: 300, frameHeight: 300});
    this.load.spritesheet('player_right', 'Skateboard_Moving_Right.png', {frameWidth: 300, frameHeight: 300});
    this.load.spritesheet('player_left', 'Skateboard_Moving_Left.png', {frameWidth: 300, frameHeight: 300});
    this.load.image('player_air', 'Skateboard_Air.png');
    this.load.image('ground', 'grass.png');
    this.load.image('ramp', 'grass.png');
  }

  createTerrain(scene, worldWidth = 20000) {
    const { width, height } = this.scale;

    const minY = height - 450;       // highest point terrain can go
    const maxY = height - 50;        // lowest point terrain can go
    const minLength = 300;           // min horizontal segment length
    const maxLength = 400;           // max horizontal segment length
    const gapChance = 0.3;           // chance to generate a gap
    const solidStart = 500;          // first 500px is flat buffer
    const maxSlope = 0.5;            // max rise/run ratio per segment
    const maxJumpHeight = 150;       // maximum height difference player can jump
    const minGapWidth = 50;          // min gap width
    const maxGapWidth = 150;         // max gap width

    let points = [];
    let x = 0;
    let y = height - 120; // starting Y
    points.push({ x, y });

    const graphics = scene.add.graphics();
    graphics.lineStyle(6, 0x4b2e05, 1);

    while (x < worldWidth) {
        // Decide if we make a gap
        const makeGap = x >= solidStart && Math.random() < gapChance;
        if (makeGap) {
            const gapWidth = Phaser.Math.Between(minGapWidth, maxGapWidth);
            x += gapWidth;

            // Clamp next Y after gap to be reachable
            let nextY = Phaser.Math.Between(y - maxJumpHeight, y + maxJumpHeight);
            nextY = Phaser.Math.Clamp(nextY, minY, maxY);

            points.push(null); // mark the gap
            y = nextY;
            continue;
        }

        // Generate terrain segment
        let length = Phaser.Math.Between(minLength, maxLength);

        // Clamp vertical change for segment
        let deltaY;
        if (x < solidStart) {
            deltaY = 0; // keep flat for starting buffer
        } else {
            deltaY = Phaser.Math.Between(-maxJumpHeight, maxJumpHeight);
        }

        let nextY = Phaser.Math.Clamp(y + deltaY, minY, maxY);

        const prev = points[points.length - 1] || { x, y };
        const p1 = prev || { x, y };
        const p2 = { x: x + length, y: nextY };

        // Add terrain physics
        scene.matter.add.rectangle(
            (p1.x + p2.x) / 2,
            (p1.y + p2.y) / 2,
            Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y),
            5,
            {
                isStatic: true,
                angle: Phaser.Math.Angle.Between(p1.x, p1.y, p2.x, p2.y),
                friction: 0.4,
                frictionStatic: 0.8
            }
        );

        // Draw segment
        graphics.lineBetween(p1.x, p1.y, p2.x, p2.y);

        points.push(p2);
        x += length;
        y = nextY; // update current y

        // Add moving obstacle randomly
        if (Math.random() < 0.2 && p2 !== null && x > solidStart + 200) { // 20% chance
          const obsWidth = 50;
          const obsHeight = 50;
          const obsX = (p1.x + p2.x) / 2;
          const obsY = (p1.y + p2.y) - obsHeight / 2 - 5; // slightly above terrain

          const obstacle = scene.matter.add.rectangle(
            obsX,
            obsY,
            obsWidth,
            obsHeight,
            {
                isStatic: false,
                friction: 0,
                frictionAir: 0,
                restitution: 0,
                label: 'obstacle'
            }
          );

          obstacle.initialX = obsX; // store initial X for oscillation
          obstacle.range = Phaser.Math.Between(100, 300); // movement range
          obstacle.direction = Math.random() < 0.5 ? 1 : -1; // start moving left or right

          scene.obstacles.push(obstacle);
        }
    }

    graphics.strokePath();
    this.terrainPoints = points;
  }

  create() {
    // Platforms
    this.matter.world.setBounds(0, 0, 20000, window.innerHeight + 400, true, true, true, false);
    this.createTerrain(this, 20000); 


    // Add player (a physics-enabled rectangle)
    this.player = this.matter.add.sprite(100,  window.innerHeight - 300, 'player');
    this.player.setScale(0.5);
    this.player.setRectangle(this.player.displayWidth, this.player.displayHeight);
    this.player.setBounce(0.1);
    this.player.setFixedRotation(false);
    this.player.setMass(10);
    this.player.setFriction(0);   
    this.player.setFrictionAir(0.01);
    this.player.setOrigin(0.5, 0.5);
    this.player.setFlipY(true)
    this.player.setFlipX(true)

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
                  if (!groundContacts.includes(other)) 
                    groundContacts.push(other);
                  
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
              if (index !== -1) 
                groundContacts.splice(index, 1);

              // Only unset onGround if no contacts below remain
              this.onGround = groundContacts.length > 0;
              if (!this.onGround) {
                  this.currentSurfaceAngle = 0;
              }
          }
      });
    });

    // Camera
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, 60000, window.innerHeight);

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
    const moveForce = 0.003;
    const jumpForce = 0.40;
    const maxSpeed = 10;

    // Smooth horizontal movement
    // Smooth horizontal movement with inertia
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

    if (targetVelX !== 0) {
      // If pressing left/right, apply acceleration
      const velDiff = targetVelX - this.player.body.velocity.x;
      this.player.applyForce({ x: velDiff * moveForce, y: 0 });
    } else {
        // No input: apply small friction to slow down gradually
        this.player.setVelocityX(this.player.body.velocity.x * 0.9999); // 0.995 = slow slide
    }
    // Jump
    if (Phaser.Input.Keyboard.JustDown(this.keys.space) && this.onGround) {
        const jumpForceY = -jumpForce - Math.abs(this.player.body.velocity.x) * 0.005; // extra boost if moving fast
        this.player.applyForce({ x: 0, y: jumpForceY });
        
        // Optional: add horizontal momentum slightly
        this.player.applyForce({ x: this.player.body.velocity.x * 0.001, y: 0 });
    }

    // Start spin when both keys are down
    if (!this.spinning && !this.onGround && this.keys.six.isDown && this.keys.seven.isDown) {
      this.spinning = true;

      // Set target rotation: 360 degrees plus current rotation
      this.targetRotation = this.player.rotation + Math.PI * 2;

      // Set angular velocity based on horizontal speed (faster = faster spin)
      const baseSpin = 0.15; // base spin
      this.player.setAngularVelocity(baseSpin + Math.abs(this.player.body.velocity.x) * 0.01);
    }

    if (this.spinning) {
      // Check if player has reached or passed the target rotation
      if ((this.player.body.angularVelocity > 0 && this.player.rotation >= this.targetRotation) ||
          (this.player.body.angularVelocity < 0 && this.player.rotation <= this.targetRotation)) {
          this.player.setAngularVelocity(0);
          this.player.rotation = this.targetRotation % (Math.PI * 2); // wrap rotation
      }
    }

    if (this.onGround) {
      this.spinning = false;
      const ROTATION_SPEED = 0.1;
      this.player.rotation = Phaser.Math.Angle.RotateTo(
      this.player.rotation,
      this.currentSurfaceAngle,
      ROTATION_SPEED
    );

    // Keep horizontal velocity for momentum
    // Optional: dampen slightly for friction
    this.player.setVelocityX(this.player.body.velocity.x * 0.98);

    //Force upright if nearly flat surface
    if (Math.abs(this.currentSurfaceAngle) < Phaser.Math.DegToRad(5)) {
      this.player.setRotation(0); // rotates the display
      this.matter.body.setAngle(this.player.body, 0); // rotates physics body too
    }

    // Stop angular velocity so it doesn't wobble
      this.player.setAngularVelocity(0);
  }


    // Check if player fell below the screen
    if (this.player.y > config.height + 200) { // 200px buffer
      // Example: reset player to starting position
      this.player.setPosition(100, window.innerHeight - 200);
      this.player.setVelocity(0, 0);
      this.player.setAngularVelocity(0);
      
      // Reset flags if needed
      this.onGround = false;
      this.
      
    // Move obstacles back and forth
    this.obstacles.forEach(obs => {
    obs.position.x += obs.direction * this.obstacleSpeed;

    // Reverse direction if we reach the range
    if (obs.position.x > obs.initialX + obs.range) obs.direction = -1;
    if (obs.position.x < obs.initialX - obs.range) obs.direction = 1;

    // Update Matter body position
    this.matter.body.setPosition(obs, { x: obs.position.x, y: obs.position.y });
});
spinning = false;
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



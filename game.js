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
    this.load.spritesheet('scooter', 'Scooter_Animation.png', {frameWidth: 300, frameHeight: 300});
    this.load.spritesheet('ollie_anim', 'Skateboard_Ollie.png', {frameWidth: 300, frameHeight: 300});
    this.load.image('player_air', 'Skateboard_Air.png');
    this.load.image('ground', 'grass.png');
    this.load.image('ramp', 'grass.png');
  }

  createTerrain(scene, worldWidth = 20000) {
    const { width, height } = this.scale;

    const minY = height - 450;
    const maxY = height - 50;
    const minLength = 300;
    const maxLength = 400;
    const gapChance = 0.3;
    const solidStart = 500;
    const maxJumpHeight = 150;
    const minGapWidth = 50;
    const maxGapWidth = 150;

    let points = [];
    let x = 0;
    let y = height - 120;
    points.push({ x, y });

    const graphics = scene.add.graphics();
    graphics.lineStyle(6, 0x4b2e05, 1);

    // Initialize arrays
    this.obstacles = [];
    this.terrainSegments = [];

    while (x < worldWidth) {
        const makeGap = x >= solidStart && Math.random() < gapChance;
        if (makeGap) {
            const gapWidth = Phaser.Math.Between(minGapWidth, maxGapWidth);
            x += gapWidth;
            y = Phaser.Math.Clamp(y + Phaser.Math.Between(-maxJumpHeight, maxJumpHeight), minY, maxY);
            points.push(null);
            continue;
        }

        const length = Phaser.Math.Between(minLength, maxLength);
        const nextY = Phaser.Math.Clamp(y + (x < solidStart ? 0 : Phaser.Math.Between(-maxJumpHeight, maxJumpHeight)), minY, maxY);

        const p1 = points[points.length - 1] || { x, y };
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

        // Draw terrain
        graphics.lineBetween(p1.x, p1.y, p2.x, p2.y);

        // Save segment for obstacle slope alignment
        this.terrainSegments.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });

        points.push(p2);

        // Add obstacle with 50% chance per terrain segment
        if (Math.random() < 0.5 && x > solidStart + 200) {
            const obsWidth = 50;
            const obsHeight = 50;
            const obsX = (p1.x + p2.x) / 2;

            // Compute Y on terrain
            const t = (obsX - p1.x) / (p2.x - p1.x);
            const obsY = Phaser.Math.Linear(p1.y, p2.y, t) - obsHeight / 2 - 5;

            // Create kinematic obstacle
            const obstacle = scene.matter.add.sprite(obsX, obsY, 'scooter');
            obstacle.setScale(0.3)

            // Set physics properties
            obstacle.setBody({ type: 'rectangle', width: obstacle.displayWidth, height: obstacle.displayHeight });
            obstacle.isKinematic = true;
            Phaser.Physics.Matter.Matter.Body.setMass(obstacle.body, 5000);

            // Set initial movement properties
            obstacle.initialX = obsX;
            obstacle.range = Phaser.Math.Between(100, 300);
            obstacle.direction = Math.random() < 0.5 ? 1 : -1;
            obstacle.speed = 2;

            this.obstacles.push(obstacle);
        }

        x += length;
        y = nextY;
    }

    graphics.strokePath();
    this.terrainPoints = points;
  }

  getTerrainY(x) {
    for (const seg of this.terrainSegments) {
        if (x >= seg.x1 && x <= seg.x2) {
            const t = (x - seg.x1) / (seg.x2 - seg.x1);
            return Phaser.Math.Linear(seg.y1, seg.y2, t);
        }
    }
    return this.scale.height - 100; // fallback
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
    this.anims.create({
      key: 'scooter_move',
      frames: this.anims.generateFrameNumbers('scooter', { start: 0, end: 2 }), 
      frameRate: 3, 
      repeat: -1 
    });
    this.anims.create({
      key: 'ollie',
      frames: this.anims.generateFrameNumbers('ollie_anim', { start: 0, end: 3 }), 
      frameRate: 3, 
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
      // Play the scooter animation
      obs.anims.play('scooter_move', true);

      // Move X
      obs.position.x += obs.direction * obs.speed;

      // Reverse direction at edges
      if (obs.position.x > obs.initialX + obs.range) obs.direction = -1;
      if (obs.position.x < obs.initialX - obs.range) obs.direction = 1;

      // Align Y to terrain
      const terrainY = this.getTerrainY(obs.position.x);
      Phaser.Physics.Matter.Matter.Body.setPosition(obs, {
          x: obs.position.x,
          y: terrainY - (obs.bounds.max.y - obs.position.y)
      });
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



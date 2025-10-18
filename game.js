const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const gravity = 0.6;
const player = {
  x: 100,
  y: 300,
  width: 40,
  height: 40,
  vx: 0,
  vy: 0,
  grounded: false,
  speed: 5,
  jump: -12
};

const keys = {};
const platforms = [
  { x: 0, y: 360, width: 800, height: 40 }, // ground
  { x: 300, y: 280, width: 120, height: 20 },
  { x: 500, y: 220, width: 100, height: 20 }
];

document.addEventListener('keydown', e => keys[e.code] = true);
document.addEventListener('keyup', e => keys[e.code] = false);

function update() {
  // Move left/right
  if (keys['ArrowLeft']) player.vx = -player.speed;
  else if (keys['ArrowRight']) player.vx = player.speed;
  else player.vx = 0;

  // Jump
  if (keys['Space'] && player.grounded) {
    player.vy = player.jump;
    player.grounded = false;
  }

  // Apply gravity
  player.vy += gravity;
  player.x += player.vx;
  player.y += player.vy;

  // Collision detection
  player.grounded = false;
  for (let p of platforms) {
    if (
      player.x < p.x + p.width &&
      player.x + player.width > p.x &&
      player.y < p.y + p.height &&
      player.y + player.height > p.y
    ) {
      // landed on top
      if (player.vy > 0 && player.y + player.height - player.vy <= p.y) {
        player.y = p.y - player.height;
        player.vy = 0;
        player.grounded = true;
      }
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw platforms
  ctx.fillStyle = '#654321';
  for (let p of platforms)
    ctx.fillRect(p.x, p.y, p.width, p.height);

  // Draw player
  ctx.fillStyle = 'red';
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();

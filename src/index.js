import kaboom from 'https://unpkg.com/kaboom@3000/dist/kaboom.mjs';

kaboom({ background: '#00031A', debug: true });

loadSprite('menuImage', './assets/menu.webp');

loadSprite('asteroidBoss', './assets/sprites/boss.webp', {
  sliceX: 9,
  sliceY: 2,
  anims: {
    idle: {
      from: 0,
      to: 7,
      speed: 5,
      loop: true,
    },
    damage: {
      from: 8,
      to: 14,
      speed: 6,
    },
  },
});

loadSprite('asteroidOne', './assets/sprites/asteroids/1.webp');
loadSprite('asteroidTwo', './assets/sprites/asteroids/2.webp');
loadSprite('asteroidThree', './assets/sprites/asteroids/3.webp');

loadSprite('rocket', './assets/sprites/spaceship_spritesheet_small.webp', {
  sliceX: 6,
  sliceY: 1,
  anims: {
    idle: {
      from: 0,
      to: 2,
      speed: 5,
    },
    run: {
      from: 3,
      to: 4,
      speed: 10,
    },
  },
});

loadSound('hit', './assets/audio/effects/better_hit.mp3');
loadSound('shoot', './assets/audio/effects/better_shoot.mp3');
loadSound('explode', './assets/audio/effects/better_explode.mp3');

loadSound('Euphoria', './assets/audio/Euphoria_compressed.mp3');
loadSound('Imperius', './assets/audio/Imperius_compressed.mp3');
loadSound('Mortals', './assets/audio/Mortals_compressed.mp3');

scene('menu', () => {
  onUpdate(() => setCursor('default'));

  function addButton(txt, p, f) {
    // add a parent background object
    const btn = add([
      rect(240, 80, { radius: 8 }),
      pos(p),
      area(),
      scale(1),
      anchor('center'),
      outline(4),
    ]);

    // add a child object that displays the text
    btn.add([text(txt), anchor('center'), color(0, 0, 0)]);

    // onHoverUpdate() comes from area() component
    // it runs every frame when the object is being hovered
    btn.onHoverUpdate(() => {
      const t = time() * 10;
      btn.color = hsl2rgb((t / 10) % 1, 0.6, 0.7);
      btn.scale = vec2(1.2);
      setCursor('pointer');
    });

    // onHoverEnd() comes from area() component
    // it runs once when the object stopped being hovered
    btn.onHoverEnd(() => {
      btn.scale = vec2(1);
      btn.color = rgb();
    });

    // onClick() comes from area() component
    // it runs once when the object is clicked
    btn.onClick(f);

    return btn;
  }

  add([
    sprite('menuImage'),
    pos(vec2(width() / 2.9, height() - 1300 / 2)),
    scale(0.4),
    fixed(),
  ]);

  addButton('New Game', vec2(width() / 2, height() - 600 / 2), () =>
    go('battle')
  );
  addButton('About', vec2(width() / 2, height() - 400 / 2), () =>
    window.open('https://github.com/vedrecide/space-shooter', '_blank').focus()
  );
  add([
    text(
      `Longest time: ${Math.floor(localStorage.getItem('longestTime'))} seconds`
    ),
    scale(0.5),
    pos(vec2(width() / 2.5, height() - 300 / 2)),
  ]);
});

let time_ = 0;

scene('battle', () => {
  const BULLET_SPEED = 1200;
  const TRASH_SPEED = 120;
  const BOSS_SPEED = 48;
  const PLAYER_SPEED = 480;
  const BOSS_HEALTH = 7500;
  const OBJ_HEALTH = 4;

  const bossName = 'asteroidBoss';

  let insaneMode = false;

  const playlist = ['Euphoria', 'Imperius', 'Mortals'];
  let musicName = playlist[Math.floor(Math.random() * playlist.length)];
  let music = play(musicName, { loop: true });

  volume(0.5);

  function grow(rate) {
    return {
      update() {
        const n = rate * dt();
        this.scale.x += n;
        this.scale.y += n;
      },
    };
  }

  function late(t) {
    let timer = 0;
    return {
      add() {
        this.hidden = true;
      },
      update() {
        timer += dt();
        if (timer >= t) {
          this.hidden = false;
        }
      },
    };
  }

  add([
    text('KILL', { size: 160 }),
    pos(width() / 2, height() / 2),
    anchor('center'),
    lifespan(1),
    fixed(),
  ]);

  add([
    text('THE', { size: 80 }),
    pos(width() / 2, height() / 2),
    anchor('center'),
    lifespan(2),
    late(1),
    fixed(),
  ]);

  add([
    text('ASTEROID BOSS', { size: 120 }),
    pos(width() / 2, height() / 2),
    anchor('center'),
    lifespan(3),
    late(2),
    fixed(),
  ]);

  const sky = add([rect(width(), height()), color(0, 0, 0), opacity(0)]);

  sky.onUpdate(() => {
    if (insaneMode) {
      const t = time() * 10;
      sky.color.r = wave(127, 255, t);
      sky.color.g = wave(127, 255, t + 1);
      sky.color.b = wave(127, 255, t + 2);
      sky.opacity = 1;
    } else {
      sky.color = rgb(0, 0, 0);
      sky.opacity = 0;
    }
  });

  // 	add([
  // 		sprite("stars"),
  // 		scale(width() / 240, height() / 240),
  // 		pos(0, 0),
  // 		"stars",
  // 	])

  // 	add([
  // 		sprite("stars"),
  // 		scale(width() / 240, height() / 240),
  // 		pos(0, -height()),
  // 		"stars",
  // 	])

  // 	onUpdate("stars", (r) => {
  // 		r.move(0, STAR_SPEED * (insaneMode ? 10 : 1))
  // 		if (r.pos.y >= height()) {
  // 			r.pos.y -= height() * 2
  // 		}
  // 	})

  const player = add([
    sprite('rocket'),
    scale(3),
    area(),
    pos(width() / 2, height() - 64),
    anchor('center'),
  ]);

  onKeyDown('w', () => {
    player.move(0, -PLAYER_SPEED);
    if (player.pos.y <= 0) {
      player.pos.y = height() - height();
    }
  });

  onKeyDown('s', () => {
    player.move(0, PLAYER_SPEED);
    if (player.pos.y > height()) {
      player.pos.y = height();
    }
  });

  onKeyDown('a', () => {
    player.move(-PLAYER_SPEED, 0);
    player.play('run');
    player.flipX = true;
    if (player.pos.x < 0) {
      player.pos.x = width();
    }
  });

  onKeyDown('d', () => {
    player.move(PLAYER_SPEED, 0);
    player.play('run');
    if (player.flipX) {
      player.flipX = false;
    }
    if (player.pos.x > width()) {
      player.pos.x = 0;
    }
  });

  onKeyDown('left', () => {
    player.move(-PLAYER_SPEED, 0);
    player.play('run');
    player.flipX = true;
    if (player.pos.x < 0) {
      player.pos.x = width();
    }
  });

  onKeyDown('right', () => {
    player.move(PLAYER_SPEED, 0);
    player.play('run');
    if (player.flipX) {
      player.flipX = false;
    }
    if (player.pos.x > width()) {
      player.pos.x = 0;
    }
  });

  onKeyPress('up', () => {
    insaneMode = true;
    music.speed = 1.5;
  });

  onKeyRelease('up', () => {
    insaneMode = false;
    music.speed = 1;
  });

  onKeyPress('f', (c) => {
    setFullscreen(!isFullscreen());
  });

  const timer = add([text(0), pos(12, 32), fixed(), { time: time_ }]);

  timer.onUpdate(() => {
    timer.time += dt();
    timer.text = timer.time.toFixed(2);
  });

  player.onCollide('enemy', (e) => {
    destroy(e);
    destroy(player);
    shake(120);
    play('explode');
    music.detune = -1200;
    addExplode(center(), 12, 120, 30);
    wait(2, () => {
      music.paused = true;
      if (localStorage.getItem('longestTime') < timer.time) {
        localStorage.setItem('longestTime', timer.time);
      }
      go('menu');
    });
  });

  function addExplode(p, n, rad, size) {
    for (let i = 0; i < n; i++) {
      wait(rand(n * 0.1), () => {
        for (let i = 0; i < 2; i++) {
          add([
            pos(p.add(rand(vec2(-rad), vec2(rad)))),
            rect(4, 4),
            scale(1 * size, 1 * size),
            lifespan(0.1),
            grow(rand(48, 72) * size),
            anchor('center'),
          ]);
        }
      });
    }
  }

  function spawnBullet(p) {
    add([
      rect(12, 48),
      area(),
      pos(p),
      anchor('center'),
      color(127, 127, 255),
      outline(4),
      move(UP, BULLET_SPEED),
      offscreen({ destroy: true }),
      // strings here means a tag
      'bullet',
    ]);
  }

  onUpdate('bullet', (b) => {
    if (insaneMode) {
      b.color = rand(rgb(0, 0, 0), rgb(255, 255, 255));
    }
  });

  onKeyPress('space', () => {
    spawnBullet(player.pos.sub(16, 0));
    spawnBullet(player.pos.add(16, 0));
    play('shoot', {
      volume: 0.3,
      detune: rand(-1200, 1200),
    });
  });

  function spawnTrash() {
    const asteroidType = ['One', 'Two', 'Three'];
    add([
      sprite(
        `asteroid${
          asteroidType[Math.floor(Math.random() * asteroidType.length)]
        }`
      ),
      scale(rand(2, 3)),
      rotate(rand(0, 180)),
      area(),
      pos(rand(0, width()), 0),
      health(OBJ_HEALTH),
      anchor('bot'),
      'trash',
      'enemy',
      { speed: rand(TRASH_SPEED * 0.5, TRASH_SPEED * 1.5) },
    ]);
    wait(insaneMode ? 0.1 : 0.3, spawnTrash);
  }

  const boss = add([
    sprite(bossName),
    area(),
    pos(width() / 2, 40),
    health(BOSS_HEALTH),
    scale(1.5),
    anchor('top'),
    'enemy',
    'boss',
    {
      dir: 1,
    },
  ]);

  boss.play('idle');

  on('death', 'enemy', (e) => {
    destroy(e);
    shake(2);
    addKaboom(e.pos);
  });

  on('hurt', 'enemy', (e) => {
    shake(1);
    play('hit', {
      detune: rand(-1200, 1200),
      speed: rand(0.2, 2),
    });
  });

  on('hurt', 'boss', (_) => {
    shake(1);
    boss.play('damage');
    wait(2, () => {
      boss.play('idle');
    });
  });

  onCollide('bullet', 'enemy', (b, e) => {
    destroy(b);
    e.hurt(insaneMode ? 10 : 1);
    addExplode(b.pos, 1, 24, 1);
  });

  onUpdate('trash', (t) => {
    t.move(0, t.speed * (insaneMode ? 5 : 1));
    if (t.pos.y - t.height > height()) {
      destroy(t);
    }
  });

  boss.onUpdate((p) => {
    boss.move(BOSS_SPEED * boss.dir * (insaneMode ? 3 : 1), 0);
    if (boss.dir === 1 && boss.pos.x >= width() - 20) {
      boss.dir = -1;
    }
    if (boss.dir === -1 && boss.pos.x <= 20) {
      boss.dir = 1;
    }
  });

  boss.onHurt(() => {
    healthbar.set(boss.hp());
  });

  boss.onDeath(() => {
    music.stop();
    go('win', {
      time: timer.time,
      boss: bossName,
    });
  });

  const healthbar = add([
    rect(width(), 24),
    pos(0, 0),
    color(107, 201, 108),
    fixed(),
    {
      max: BOSS_HEALTH,
      set(hp) {
        this.width = (width() * hp) / this.max;
        this.flash = true;
      },
    },
  ]);

  healthbar.onUpdate(() => {
    if (healthbar.flash) {
      healthbar.color = rgb(255, 255, 255);
      healthbar.flash = false;
    } else {
      healthbar.color = rgb(127, 255, 127);
    }
  });

  add([
    text('UP: insane mode', { width: width() / 2, size: 32 }),
    anchor('botleft'),
    pos(24, height() - 24),
  ]);

  let text_ = add([]);

  if (musicName === 'Imperius') {
    text_ = add([
      text('Now playing: Imperius - prod. Caleb Bryant', {
        width: width() / 2,
        size: 16,
      }),
      anchor('botleft'),
      pos(24, height() - 65),
    ]);
  }

  if (musicName === 'Euphoria') {
    text_ = add([
      text('Now playing: Euphoria - VOJ, Narvent', {
        width: width() / 2,
        size: 16,
      }),
      anchor('botleft'),
      pos(24, height() - 65),
    ]);
  }

  if (musicName === 'Mortals') {
    text_ = add([
      text('Now playing: Mortals - Laura Brehm, NCS', {
        width: width() / 2,
        size: 16,
      }),
      anchor('botleft'),
      pos(24, height() - 65),
    ]);
  }

  spawnTrash();
});

scene('win', ({ time, boss }) => {
  if (localStorage.getItem('longestTime') < timer.time) {
    localStorage.setItem('longestTime', timer.time);
  }
  add([
    sprite(boss),
    color(255, 0, 0),
    anchor('center'),
    scale(8),
    pos(width() / 2, height() / 2),
  ]);

  add([
    text(time.toFixed(2), 24),
    anchor('center'),
    pos(width() / 2, height() / 2),
  ]);
});

go('menu');

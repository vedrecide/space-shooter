import kaboom from 'https://unpkg.com/kaboom@3000/dist/kaboom.mjs';

kaboom({
  background: [77, 0, 77],
});

scene('main', () => {
  onUpdate(() => setCursor('default'));

  const addButton = (txt, p, func) => {
    const btn = add([
      rect(220, 80, { radius: 8 }),
      pos(p),
      area(),
      scale(1),
      anchor('center'),
      outline(4),
    ]);

    btn.add([text(txt), anchor('center'), color(0, 0, 0)]);

    btn.onHoverUpdate(() => {
      const t = time() * 10;
      btn.color = hsl2rgb((t / 10) % 1, 0.6, 0.7);
      setCursor('pointer');
    });

    btn.onHoverEnd(() => {
      btn.scale = vec2(1);
      btn.color = rgb();
    });

    btn.onClick(func);

    return btn;
  };

  add([pos(vec2(150, 100)), text('Space shooter')]);
  addButton('New Game', vec2(300, 200), () => go('game'));
  addButton('About', vec2(300, 300), () =>
    window.open('https://github.com', '_blank').focus()
  );
});

scene('game', () => {
  add([text('Game'), pos(12)]);
});

go('main');

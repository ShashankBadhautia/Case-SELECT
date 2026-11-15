import Phaser from "phaser";

import { EVENTS, bridge } from "../bridge.js";
import { TILE } from "../world/assets.js";
import { buildLocation } from "../world/buildLocation.js";
import { PLAYER_LOOK, lookTextureKey, textureForNpc } from "../world/characters.js";
import { getLayout } from "../world/layouts/index.js";

const WALK_SPEED = 72; // pixels per second
const INTERACT_RANGE = 20; // pixels from the player's feet
const DOOR_PROMPT_RANGE = 1.5 * TILE;

const toPx = (tiles) => tiles * TILE;

/**
 * Draws one location and lets the player walk around it.
 *
 * Started (and restarted) by PhaserGame with:
 *   locationId      which layout to draw
 *   npcs            [{ id }] standing here
 *   markers         { npcIds: [], terminal: false } objective markers
 *   fromLocationId  the location the player came from, to pick the door
 *
 * The scene never decides what an interaction means. It reports it on the
 * bridge (TALK, USE_TERMINAL, INSPECT, WALK_TO) and React answers.
 */
export class LocationScene extends Phaser.Scene {
  constructor() {
    super("location");
  }

  init(data) {
    this.world = data;
    this.locked = false;
    this.focus = null;
    this.doorInside = null;
    this.doorReported = false;
    this.npcSprites = new Map();
    this.markers = [];
  }

  create() {
    this.built = buildLocation(getLayout(this.world.locationId));

    this.drawGround();
    this.drawProps();
    const obstacles = this.createObstacles();
    this.createPlayer(obstacles);
    this.createNpcs(obstacles);
    this.showMarkers(this.world.markers);
    this.setupCamera();
    this.setupInput();
    this.listenToBridge();

    this.cameras.main.fadeIn(220, 0, 0, 0);
  }

  // ───────────── Building the scene ─────────────

  drawGround() {
    for (const { sheet, frame, rect } of this.built.ground) {
      const [x, y, w, h] = rect;
      for (let ty = y; ty < y + h; ty += 1) {
        for (let tx = x; tx < x + w; tx += 1) {
          this.add.image(toPx(tx), toPx(ty), sheet, frame).setOrigin(0).setDepth(-1000);
        }
      }
    }
  }

  drawProps() {
    for (const sprite of this.built.sprites) {
      this.add
        .image(toPx(sprite.x), toPx(sprite.y), sprite.sheet, sprite.frame)
        .setOrigin(0)
        .setDepth(toPx(sprite.sortY));
    }
  }

  /** One static body per horizontal run of blocked tiles. */
  createObstacles() {
    const group = this.physics.add.staticGroup();

    this.built.blocked.forEach((row, y) => {
      let start = null;
      row.forEach((isBlocked, x) => {
        if (isBlocked && start === null) start = x;
        if ((!isBlocked || x === row.length - 1) && start !== null) {
          const end = isBlocked ? x + 1 : x;
          const zone = this.add.zone(toPx(start), toPx(y), toPx(end - start), TILE).setOrigin(0);
          group.add(zone);
          start = null;
        }
      });
    });

    group.refresh();
    return group;
  }

  spawnPoint() {
    const door = this.built.doors.find((d) => d.to === this.world.fromLocationId);
    const spot = door?.spawn ?? this.built.spawn;
    return { x: toPx(spot.x + (door ? 0 : 0.5)), y: toPx(spot.y + (door ? 0 : 1)) };
  }

  createPlayer(obstacles) {
    const { x, y } = this.spawnPoint();
    this.player = this.physics.add.sprite(x, y, lookTextureKey(PLAYER_LOOK)).setOrigin(0.5, 1);
    // Only the feet collide, so the player can walk up close to furniture.
    this.player.body.setSize(10, 5).setOffset(3, 11);
    this.player.setCollideWorldBounds(true);
    this.physics.world.setBounds(0, 0, this.built.size.width, this.built.size.height);
    this.physics.add.collider(this.player, obstacles);
  }

  createNpcs(obstacles) {
    const spots = Object.values(this.built.npcSpots);

    this.world.npcs.forEach((npc, index) => {
      const spot = this.built.npcSpots[npc.id] ?? spots[index] ?? this.built.spawn;
      const sprite = this.physics.add
        .staticSprite(toPx(spot.x + 0.5), toPx(spot.y + 1), textureForNpc(npc.id))
        .setOrigin(0.5, 1)
        .refreshBody(); // static bodies only follow the new origin once refreshed
      // A little wider than the player's feet, so you stop in front of people.
      sprite.body.setSize(12, 8, false).setOffset(2, 8);
      sprite.setDepth(sprite.y);
      this.physics.add.collider(this.player, sprite);
      obstacles.add(sprite);

      // A slow idle bob so the room feels alive.
      this.tweens.add({
        targets: sprite,
        scaleY: 0.94,
        duration: 900 + index * 130,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
      this.npcSprites.set(npc.id, sprite);
    });
  }

  showMarkers({ npcIds = [], terminal = false } = {}) {
    this.markers.forEach((marker) => marker.destroy());
    this.markers = [];

    const anchors = npcIds
      .map((id) => this.npcSprites.get(id))
      .filter(Boolean)
      .map((sprite) => ({ x: sprite.x, y: sprite.y - TILE - 2 }));

    if (terminal && this.built.terminal) {
      const { spot } = this.built.terminal;
      anchors.push({ x: toPx(spot.x), y: toPx(spot.y - 2) - 2 });
    }

    for (const { x, y } of anchors) {
      const marker = this.add.image(x, y, "marker").setOrigin(0.5, 1).setDepth(10000);
      this.tweens.add({ targets: marker, y: y - 3, duration: 450, yoyo: true, repeat: -1, ease: "Sine.inOut" });
      this.markers.push(marker);
    }
  }

  setupCamera() {
    const camera = this.cameras.main;
    camera.setRoundPixels(true);
    camera.startFollow(this.player, true, 0.15, 0.15);
    this.fitCamera();
    this.scale.on("resize", this.fitCamera, this);
  }

  /**
   * Largest whole-number zoom that fits the room, so pixels stay square. When
   * the room is smaller than the screen on an axis, the bounds are widened
   * evenly on that axis so the room sits in the middle.
   */
  fitCamera() {
    const { width, height } = this.scale.gameSize;
    const room = this.built.size;
    const zoom = Math.max(1, Math.floor(Math.min(width / room.width, height / room.height)));
    const view = { width: width / zoom, height: height / zoom };

    const camera = this.cameras.main;
    camera.setZoom(zoom);
    camera.setBounds(
      Math.min(0, (room.width - view.width) / 2),
      Math.min(0, (room.height - view.height) / 2),
      Math.max(room.width, view.width),
      Math.max(room.height, view.height),
    );
  }

  setupInput() {
    // Keys are not captured, so typing in React text fields still works.
    this.keys = this.input.keyboard.addKeys("W,A,S,D,UP,DOWN,LEFT,RIGHT", false);

    // Events rather than polling, so even a tap shorter than a frame counts.
    for (const key of ["E", "SPACE", "ENTER"]) {
      this.input.keyboard.on(`keydown-${key}`, () => {
        if (!this.locked) this.interact();
      });
    }
  }

  listenToBridge() {
    const onLock = (locked) => {
      this.locked = locked;
      this.player.setVelocity(0);
      this.input.keyboard.resetKeys();
    };
    const onMarkers = (markers) => this.showMarkers(markers);

    bridge.on(EVENTS.LOCK_INPUT, onLock);
    bridge.on(EVENTS.SET_MARKERS, onMarkers);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      bridge.off(EVENTS.LOCK_INPUT, onLock);
      bridge.off(EVENTS.SET_MARKERS, onMarkers);
      this.scale.off("resize", this.fitCamera, this);
    });
  }

  // ───────────── Every frame ─────────────

  update(time) {
    if (this.locked) return;

    this.movePlayer(time);
    this.checkDoors();
    this.updateFocus();
  }

  movePlayer(time) {
    const k = this.keys;
    const dx = (k.RIGHT.isDown || k.D.isDown ? 1 : 0) - (k.LEFT.isDown || k.A.isDown ? 1 : 0);
    const dy = (k.DOWN.isDown || k.S.isDown ? 1 : 0) - (k.UP.isDown || k.W.isDown ? 1 : 0);

    const velocity = new Phaser.Math.Vector2(dx, dy).normalize().scale(WALK_SPEED);
    this.player.setVelocity(velocity.x, velocity.y);

    if (dx !== 0) this.player.setFlipX(dx < 0);
    const moving = dx !== 0 || dy !== 0;
    // Two-frame walk: a little squash every other step.
    this.player.setScale(1, moving && Math.floor(time / 140) % 2 ? 0.9 : 1);
    this.player.setDepth(this.player.y);
  }

  feet() {
    return { x: this.player.x, y: this.player.y - 2 };
  }

  /** Uses a door when the player stands in its zone walking towards it. */
  checkDoors() {
    const { x, y } = this.feet();
    const inside = this.built.doors.find(({ zone }) =>
      new Phaser.Geom.Rectangle(toPx(zone.x), toPx(zone.y), toPx(zone.w), toPx(zone.h)).contains(x, y),
    );

    if (inside !== this.doorInside) {
      this.doorInside = inside ?? null;
      this.doorReported = false;
    }
    if (!inside || this.doorReported) return;

    const { velocity } = this.player.body;
    const towards = {
      up: velocity.y < 0,
      down: velocity.y > 0,
      left: velocity.x < 0,
      right: velocity.x > 0,
    }[inside.enter];

    // Report once per visit to the zone, not every frame the key is held.
    if (towards) {
      this.doorReported = true;
      bridge.emit(EVENTS.WALK_TO, { locationId: inside.to });
    }
  }

  /** The nearest thing the player could interact with, or null. */
  nearestTarget() {
    const { x, y } = this.feet();
    const candidates = [];

    for (const [id, sprite] of this.npcSprites) {
      candidates.push({ kind: "npc", id, x: sprite.x, y: sprite.y, range: INTERACT_RANGE + 4 });
    }
    if (this.built.terminal) {
      const { spot, label } = this.built.terminal;
      candidates.push({ kind: "terminal", label, x: toPx(spot.x), y: toPx(spot.y), range: INTERACT_RANGE });
    }
    for (const item of this.built.inspect) {
      const { area } = item;
      // Distance to the closest point of the area, so wide objects are easy to reach.
      const cx = Phaser.Math.Clamp(x, toPx(area.x), toPx(area.x + area.w));
      const cy = Phaser.Math.Clamp(y, toPx(area.y), toPx(area.y + area.h));
      candidates.push({ kind: "inspect", title: item.title, text: item.text, x: cx, y: cy, range: 14 });
    }
    for (const door of this.built.doors) {
      const { zone } = door;
      candidates.push({
        kind: "door",
        to: door.to,
        x: toPx(zone.x + zone.w / 2),
        y: toPx(zone.y + zone.h / 2),
        range: DOOR_PROMPT_RANGE,
      });
    }

    let best = null;
    for (const target of candidates) {
      const distance = Phaser.Math.Distance.Between(x, y, target.x, target.y);
      if (distance <= target.range && (!best || distance < best.distance)) {
        best = { ...target, distance };
      }
    }
    return best;
  }

  updateFocus() {
    const target = this.nearestTarget();
    const key = target ? `${target.kind}:${target.id ?? target.to ?? target.title ?? ""}` : null;
    if (key === this.focusKey) return;

    this.focusKey = key;
    this.focus = target;
    bridge.emit(EVENTS.FOCUS, target ? { kind: target.kind, id: target.id, to: target.to, label: target.label ?? target.title } : null);
  }

  interact() {
    const target = this.focus;
    if (!target) return;

    if (target.kind === "npc") bridge.emit(EVENTS.TALK, { npcId: target.id });
    if (target.kind === "terminal") bridge.emit(EVENTS.USE_TERMINAL, { locationId: this.world.locationId });
    if (target.kind === "inspect") bridge.emit(EVENTS.INSPECT, { title: target.title, text: target.text });
    if (target.kind === "door") bridge.emit(EVENTS.WALK_TO, { locationId: target.to });
  }
}

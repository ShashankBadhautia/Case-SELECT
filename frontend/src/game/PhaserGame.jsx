import Phaser from "phaser";
import { useEffect, useRef, useState } from "react";

import { EVENTS, bridge } from "./bridge.js";
import { BootScene } from "./scenes/BootScene.js";
import { LocationScene } from "./scenes/LocationScene.js";

/**
 * Hosts the Phaser canvas and keeps it in sync with React state.
 *
 * Props:
 *   world        { locationId, npcs, markers, fromLocationId }; a new
 *                locationId redraws the scene
 *   markers      objective markers; changing them does not redraw
 *   inputLocked  true while a React overlay owns the keyboard
 */
export function PhaserGame({ world, markers, inputLocked }) {
  const containerRef = useRef(null);
  const gameRef = useRef(null);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    const onReady = () => setBooted(true);
    bridge.on(EVENTS.READY, onReady);

    gameRef.current = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      backgroundColor: "#0d0b09",
      pixelArt: true,
      roundPixels: true,
      scale: { mode: Phaser.Scale.RESIZE, width: "100%", height: "100%" },
      physics: { default: "arcade", arcade: { gravity: { x: 0, y: 0 } } },
      scene: [BootScene, LocationScene],
    });

    return () => {
      bridge.off(EVENTS.READY, onReady);
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  // Draw the location whenever the player moves somewhere else.
  const worldKey = world ? `${world.locationId}` : null;
  useEffect(() => {
    if (!booted || !world) return;
    gameRef.current.scene.start("location", world);
    // Only a change of location redraws; markers update separately below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booted, worldKey]);

  useEffect(() => {
    if (booted) bridge.emit(EVENTS.SET_MARKERS, markers);
  }, [booted, markers]);

  useEffect(() => {
    bridge.emit(EVENTS.LOCK_INPUT, inputLocked);
  }, [inputLocked]);

  return <div ref={containerRef} className="game-canvas" />;
}

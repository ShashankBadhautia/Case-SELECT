import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { EVENTS, bridge } from "../game/bridge.js";
import { describeObjective, locationName, markersFor, npcById } from "../game/objective.js";
import { PhaserGame } from "../game/PhaserGame.jsx";
import { getLayout } from "../game/world/layouts/index.js";
import { useCaseSession } from "../hooks/useCaseSession.js";
import { useKeyDown } from "../hooks/useKeyDown.js";
import { usePlayer } from "../hooks/usePlayer.js";
import { useToasts } from "../hooks/useToasts.js";
import { CaseClosed } from "../ui/CaseClosed.jsx";
import { CaseFile } from "../ui/CaseFile.jsx";
import { DialogueBox } from "../ui/DialogueBox.jsx";
import { Hud } from "../ui/Hud.jsx";
import { PauseMenu } from "../ui/PauseMenu.jsx";
import { SqlTerminal } from "../ui/SqlTerminal.jsx";
import { Toasts } from "../ui/Toasts.jsx";

/**
 * Plays one case full-screen: the Phaser world underneath, React overlays on
 * top. This page is the referee between the two: Phaser reports what the
 * player touched, the server says what it means, and the page decides which
 * overlay to show.
 *
 * Overlays (one at a time):
 *   dialogue  { npcId, lines, lineIndex, sequenceId | null, hint }
 *   note      { title, text }            an inspected object
 *   terminal  { title, question, sequenceId | null }
 *   casefile, menu
 */
export function GamePage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { player, error: playerError } = usePlayer();
  const { session, progress, error, loading, actions } = useCaseSession(caseId, player?.id);

  const [movedTo, setMovedTo] = useState(null); // location chosen this visit
  const [cameFrom, setCameFrom] = useState(null);
  const [overlay, setOverlay] = useState(null);
  const [focus, setFocus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toasts, toast] = useToasts();

  const locationId = movedTo ?? progress?.locationId ?? null;

  // ───────────── Reacting to the world ─────────────

  const talkTo = useCallback(
    (npcId) => {
      const step = progress.currentStep;
      const isLead = step?.type === "DIALOGUE" && step.npcId === npcId && step.locationId === locationId;

      if (isLead) {
        setOverlay({ type: "dialogue", npcId, lines: step.lines, lineIndex: 0, sequenceId: step.sequenceId });
        return;
      }

      setOverlay({
        type: "dialogue",
        npcId,
        lines: [progress.npcLastLines[npcId] ?? "…"],
        lineIndex: 0,
        sequenceId: null,
        hint: "Nothing new here. Check your lead (C).",
      });
    },
    [progress, locationId],
  );

  const openTerminal = useCallback(() => {
    const step = progress.currentStep;
    const isLead = step?.type === "QUERY" && step.locationId === locationId;
    setOverlay({
      type: "terminal",
      title: getLayout(locationId).terminal?.label ?? "Records terminal",
      question: isLead ? step.query : null,
      sequenceId: isLead ? step.sequenceId : null,
    });
  }, [progress, locationId]);

  const walkTo = useCallback(
    (target) => {
      if (!progress.unlockedLocationIds.includes(target)) {
        toast(`${locationName(session, target)} can wait. Follow your lead first.`, "warn");
        return;
      }
      setCameFrom(locationId);
      setMovedTo(target);
      setFocus(null);
      actions.moveTo(target).catch((err) => toast(err.message, "error"));
    },
    [progress, session, locationId, actions, toast],
  );

  // Phaser events call whatever the latest handlers are.
  const handlers = useRef({});
  useEffect(() => {
    handlers.current = { talkTo, openTerminal, walkTo };
  });

  useEffect(() => {
    const onTalk = ({ npcId }) => handlers.current.talkTo(npcId);
    const onTerminal = () => handlers.current.openTerminal();
    const onWalk = ({ locationId: target }) => handlers.current.walkTo(target);
    const onInspect = ({ title, text }) => setOverlay({ type: "note", title, text });

    bridge.on(EVENTS.TALK, onTalk);
    bridge.on(EVENTS.USE_TERMINAL, onTerminal);
    bridge.on(EVENTS.WALK_TO, onWalk);
    bridge.on(EVENTS.INSPECT, onInspect);
    bridge.on(EVENTS.FOCUS, setFocus);
    return () => {
      bridge.off(EVENTS.TALK, onTalk);
      bridge.off(EVENTS.USE_TERMINAL, onTerminal);
      bridge.off(EVENTS.WALK_TO, onWalk);
      bridge.off(EVENTS.INSPECT, onInspect);
      bridge.off(EVENTS.FOCUS, setFocus);
    };
  }, []);

  // ───────────── Overlay actions ─────────────

  const advanceDialogue = async () => {
    const { lines, lineIndex, sequenceId, npcId } = overlay;
    if (lineIndex < lines.length - 1) {
      setOverlay({ ...overlay, lineIndex: lineIndex + 1 });
      return;
    }
    if (sequenceId == null) {
      setOverlay(null);
      return;
    }

    setBusy(true);
    try {
      const { progress: next } = await actions.completeDialogue(sequenceId);
      const step = next.currentStep;
      const sameConversation = step?.type === "DIALOGUE" && step.npcId === npcId && step.locationId === locationId;

      if (sameConversation) {
        setOverlay({ ...overlay, lines: step.lines, lineIndex: 0, sequenceId: step.sequenceId });
      } else {
        setOverlay(null);
      }
    } catch (err) {
      setOverlay(null);
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const runInTerminal = async (sql) => {
    if (overlay.sequenceId == null) {
      return { result: await actions.explore(sql) };
    }
    return actions.answer(overlay.sequenceId, sql);
  };

  const afterSolved = (response) => {
    setOverlay(null);
    const before = new Set(progress.unlockedLocationIds);
    const opened = response.progress.unlockedLocationIds.filter((id) => !before.has(id));
    toast("Evidence added to your case file", "good");
    opened.forEach((id) => toast(`New place unlocked: ${locationName(session, id)}`, "good"));
  };

  const restart = async () => {
    setOverlay(null);
    await actions.reset();
    setMovedTo(null);
    setCameFrom(null);
  };

  useKeyDown(
    ["c", "C", "Tab", "Escape"],
    (event) => {
      event.preventDefault();
      setOverlay({ type: event.key === "Escape" ? "menu" : "casefile" });
    },
    Boolean(progress) && overlay === null,
  );

  // ───────────── What Phaser should show ─────────────

  const markersKey = progress && locationId ? JSON.stringify(markersFor(progress, locationId)) : "";
  const markers = useMemo(() => (markersKey ? JSON.parse(markersKey) : null), [markersKey]);

  const world = useMemo(() => {
    if (!session || !locationId) return null;
    return {
      locationId,
      fromLocationId: cameFrom,
      npcs: session.npcs.filter((npc) => npc.locationId === locationId),
      markers,
    };
    // A new world object only when the player changes location.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, locationId]);

  // ───────────── Render ─────────────

  const failure = playerError ?? error;
  if (failure) {
    return (
      <main className="screen screen--center">
        <section className="panel message">
          <h1>Case file unavailable</h1>
          <p>{failure.message}</p>
          <Link className="btn" to="/">
            Back to case files
          </Link>
        </section>
      </main>
    );
  }

  if (loading || !world) {
    return (
      <main className="screen screen--center">
        <p className="loading">Opening the case file…</p>
      </main>
    );
  }

  const caseClosed = progress.status === "COMPLETED" && overlay === null;

  return (
    <main className="game">
      <PhaserGame world={world} markers={markers} inputLocked={overlay !== null || busy || caseClosed} />

      <Hud
        caseName={session.case.caseName}
        location={locationName(session, locationId)}
        objective={describeObjective(session, progress)}
        prompt={overlay || caseClosed ? null : promptFor(focus, session, progress)}
        onOpenCaseFile={() => setOverlay({ type: "casefile" })}
        onOpenMenu={() => setOverlay({ type: "menu" })}
      />
      <Toasts toasts={toasts} />

      {overlay?.type === "dialogue" && (
        <DialogueBox
          speaker={{
            npcId: overlay.npcId,
            name: npcById(session, overlay.npcId).npcName,
            role: npcById(session, overlay.npcId).role,
          }}
          text={overlay.lines[overlay.lineIndex]}
          hint={overlay.hint}
          busy={busy}
          onAdvance={advanceDialogue}
        />
      )}

      {overlay?.type === "note" && (
        <DialogueBox speaker={{ name: overlay.title }} text={overlay.text} onAdvance={() => setOverlay(null)} />
      )}

      {overlay?.type === "terminal" && (
        <SqlTerminal
          title={overlay.title}
          question={overlay.question}
          tables={session.tables}
          onRun={runInTerminal}
          onSolved={afterSolved}
          onClose={() => setOverlay(null)}
        />
      )}

      {overlay?.type === "casefile" && (
        <CaseFile session={session} progress={progress} onClose={() => setOverlay(null)} />
      )}

      {overlay?.type === "menu" && (
        <PauseMenu onResume={() => setOverlay(null)} onRestart={restart} onQuit={() => navigate("/")} />
      )}

      {caseClosed && (
        <CaseClosed session={session} progress={progress} onReplay={restart} onQuit={() => navigate("/")} />
      )}
    </main>
  );
}

/** The hint at the bottom of the screen for whatever the player is next to. */
function promptFor(focus, session, progress) {
  if (!focus) return null;

  switch (focus.kind) {
    case "npc":
      return { key: "E", text: `Talk to ${npcById(session, focus.id).npcName}` };
    case "terminal":
      return { key: "E", text: `Use the ${focus.label.toLowerCase()}` };
    case "inspect":
      return { key: "E", text: `Inspect: ${focus.label}` };
    case "door": {
      const name = locationName(session, focus.to);
      return progress.unlockedLocationIds.includes(focus.to)
        ? { text: `Walk through to ${name}` }
        : { text: `${name} (locked)`, locked: true };
    }
    default:
      return null;
  }
}

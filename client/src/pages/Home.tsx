import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  ChevronDown,
  CircleHelp,
  Crown,
  Eye,
  Flame,
  Gauge,
  History,
  Maximize2,
  MicOff,
  Move,
  RotateCcw,
  Sparkles,
  Target,
  Undo2,
  Waves,
  Volume2,
  VolumeX,
} from "lucide-react";

const FISH_ASSET = "/manus-storage/goldfish-overlay_cbdc9929.png";
const EMBLEM_ASSET = "/manus-storage/taiwan-tech-emblem_f9723e43.png";
const VISUAL_TARGET = "/manus-storage/viet-co-tuong-visual-target_77971af1.png";
const AD_TEXT = "QUANTA MỸ THUẬN NAM ĐỊNH ĐANG CÓ THƯỞNG CÔNG TY CẤP 9";
const BOARD_W = 9;
const BOARD_H = 10;
const AI_SIDE: Side = "black";

type Side = "red" | "black";
type PieceType = "general" | "advisor" | "elephant" | "horse" | "chariot" | "cannon" | "soldier";
type CameraId = "front" | "back";

type Piece = {
  side: Side;
  type: PieceType;
  label: string;
};
type Board = Array<Piece | null>;
type Move = { from: number; to: number };
type CameraPosition = { x: number; y: number };
type CameraStatus = "idle" | "connecting" | "live" | "blocked";

const pieceLabels: Record<PieceType, string> = {
  general: "TƯỚNG",
  advisor: "SĨ",
  elephant: "TƯỢNG",
  horse: "MÃ",
  chariot: "XE",
  cannon: "PHÁO",
  soldier: "TỐT",
};

const pieceValues: Record<PieceType, number> = {
  general: 10000,
  chariot: 900,
  cannon: 450,
  horse: 400,
  elephant: 200,
  advisor: 200,
  soldier: 100,
};

const idx = (row: number, col: number) => row * BOARD_W + col;
const rowOf = (square: number) => Math.floor(square / BOARD_W);
const colOf = (square: number) => square % BOARD_W;
const inBounds = (row: number, col: number) => row >= 0 && row < BOARD_H && col >= 0 && col < BOARD_W;
const insidePalace = (side: Side, row: number, col: number) => {
  if (col < 3 || col > 5) return false;
  return side === "red" ? row >= 7 && row <= 9 : row >= 0 && row <= 2;
};
const otherSide = (side: Side): Side => (side === "red" ? "black" : "red");

function createPiece(side: Side, type: PieceType): Piece {
  return { side, type, label: pieceLabels[type] };
}

export function createInitialBoard(): Board {
  const board: Board = Array.from({ length: BOARD_W * BOARD_H }, () => null);
  const blackBack: PieceType[] = ["chariot", "horse", "elephant", "advisor", "general", "advisor", "elephant", "horse", "chariot"];
  const redBack: PieceType[] = ["chariot", "horse", "elephant", "advisor", "general", "advisor", "elephant", "horse", "chariot"];
  blackBack.forEach((type, col) => (board[idx(0, col)] = createPiece("black", type)));
  redBack.forEach((type, col) => (board[idx(9, col)] = createPiece("red", type)));
  board[idx(2, 1)] = createPiece("black", "cannon");
  board[idx(2, 7)] = createPiece("black", "cannon");
  board[idx(7, 1)] = createPiece("red", "cannon");
  board[idx(7, 7)] = createPiece("red", "cannon");
  [0, 2, 4, 6, 8].forEach((col) => {
    board[idx(3, col)] = createPiece("black", "soldier");
    board[idx(6, col)] = createPiece("red", "soldier");
  });
  return board;
}

function isRiverCrossed(side: Side, row: number) {
  return side === "red" ? row <= 4 : row >= 5;
}

function getRawMoves(board: Board, from: number): number[] {
  const piece = board[from];
  if (!piece) return [];
  const row = rowOf(from);
  const col = colOf(from);
  const result: number[] = [];
  const push = (nextRow: number, nextCol: number) => {
    if (inBounds(nextRow, nextCol)) {
      const target = board[idx(nextRow, nextCol)];
      if (!target || target.side !== piece.side) result.push(idx(nextRow, nextCol));
    }
  };
  const addRays = (directions: Array<[number, number]>, cannon = false) => {
    directions.forEach(([dr, dc]) => {
      let r = row + dr;
      let c = col + dc;
      let jumped = false;
      while (inBounds(r, c)) {
        const target = board[idx(r, c)];
        if (!target) {
          if (!cannon || !jumped) result.push(idx(r, c));
        } else if (!cannon) {
          if (target.side !== piece.side) result.push(idx(r, c));
          break;
        } else if (!jumped) {
          jumped = true;
        } else {
          if (target.side !== piece.side) result.push(idx(r, c));
          break;
        }
        r += dr;
        c += dc;
      }
    });
  };

  if (piece.type === "general") {
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => {
      const nextRow = row + dr;
      const nextCol = col + dc;
      if (insidePalace(piece.side, nextRow, nextCol)) push(nextRow, nextCol);
    });
  } else if (piece.type === "advisor") {
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([dr, dc]) => {
      const nextRow = row + dr;
      const nextCol = col + dc;
      if (insidePalace(piece.side, nextRow, nextCol)) push(nextRow, nextCol);
    });
  } else if (piece.type === "elephant") {
    [[2, 2], [2, -2], [-2, 2], [-2, -2]].forEach(([dr, dc]) => {
      const nextRow = row + dr;
      const nextCol = col + dc;
      const eye = idx(row + dr / 2, col + dc / 2);
      if (inBounds(nextRow, nextCol) && !board[eye] && (piece.side === "red" ? nextRow >= 5 : nextRow <= 4)) push(nextRow, nextCol);
    });
  } else if (piece.type === "horse") {
    [[2, 1, 1, 0], [2, -1, 1, 0], [-2, 1, -1, 0], [-2, -1, -1, 0], [1, 2, 0, 1], [1, -2, 0, -1], [-1, 2, 0, 1], [-1, -2, 0, -1]].forEach(([dr, dc, br, bc]) => {
      const nextRow = row + dr;
      const nextCol = col + dc;
      if (inBounds(nextRow, nextCol) && !board[idx(row + br, col + bc)]) push(nextRow, nextCol);
    });
  } else if (piece.type === "chariot") {
    addRays([[1, 0], [-1, 0], [0, 1], [0, -1]]);
  } else if (piece.type === "cannon") {
    addRays([[1, 0], [-1, 0], [0, 1], [0, -1]], true);
  } else if (piece.type === "soldier") {
    const forward = piece.side === "red" ? -1 : 1;
    push(row + forward, col);
    if (isRiverCrossed(piece.side, row)) {
      push(row, col - 1);
      push(row, col + 1);
    }
  }
  return result;
}

function findGeneral(board: Board, side: Side) {
  return board.findIndex((piece) => piece?.side === side && piece.type === "general");
}

function generalsFace(board: Board) {
  const red = findGeneral(board, "red");
  const black = findGeneral(board, "black");
  if (red < 0 || black < 0 || colOf(red) !== colOf(black)) return false;
  const minRow = Math.min(rowOf(red), rowOf(black));
  const maxRow = Math.max(rowOf(red), rowOf(black));
  for (let row = minRow + 1; row < maxRow; row += 1) if (board[idx(row, colOf(red))]) return false;
  return true;
}

function isInCheck(board: Board, side: Side) {
  const general = findGeneral(board, side);
  if (general < 0) return true;
  if (generalsFace(board)) return true;
  const enemy = otherSide(side);
  return board.some((piece, from) => piece?.side === enemy && getRawMoves(board, from).includes(general));
}

export function applyMove(board: Board, move: Move) {
  const next = board.slice();
  next[move.to] = next[move.from];
  next[move.from] = null;
  return next;
}

export function getLegalMoves(board: Board, side: Side): Move[] {
  const moves: Move[] = [];
  board.forEach((piece, from) => {
    if (!piece || piece.side !== side) return;
    getRawMoves(board, from).forEach((to) => {
      const next = applyMove(board, { from, to });
      if (!isInCheck(next, side)) moves.push({ from, to });
    });
  });
  return moves;
}

function moveScore(board: Board, move: Move) {
  const captured = board[move.to];
  const moving = board[move.from];
  const row = rowOf(move.to);
  const col = colOf(move.to);
  return (captured ? pieceValues[captured.type] * 10 : 0) + (moving ? pieceValues[moving.type] : 0) + (4 - Math.abs(4 - col)) * 2 + (moving?.type === "soldier" ? (moving.side === "red" ? 9 - row : row) : 0);
}

function evaluate(board: Board) {
  let score = 0;
  board.forEach((piece, square) => {
    if (!piece) return;
    const row = rowOf(square);
    const col = colOf(square);
    const positional = piece.type === "soldier" ? (piece.side === "red" ? 9 - row : row) * 4 + (isRiverCrossed(piece.side, row) ? 25 : 0) : (4 - Math.abs(4 - col)) * 2;
    const value = pieceValues[piece.type] + positional;
    score += piece.side === "red" ? value : -value;
  });
  if (findGeneral(board, "red") < 0) return -999999;
  if (findGeneral(board, "black") < 0) return 999999;
  return score;
}

function minimax(board: Board, side: Side, depth: number, alpha: number, beta: number): number {
  const moves = getLegalMoves(board, side);
  if (depth === 0 || moves.length === 0 || findGeneral(board, "red") < 0 || findGeneral(board, "black") < 0) {
    const terminal = moves.length === 0 && isInCheck(board, side) ? (side === "red" ? -999999 : 999999) : evaluate(board);
    return terminal;
  }
  const ordered = moves.sort((a, b) => moveScore(board, b) - moveScore(board, a)).slice(0, depth === 1 ? 36 : 28);
  if (side === "red") {
    let best = -Infinity;
    for (const move of ordered) {
      best = Math.max(best, minimax(applyMove(board, move), "black", depth - 1, alpha, beta));
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  }
  let best = Infinity;
  for (const move of ordered) {
    best = Math.min(best, minimax(applyMove(board, move), "red", depth - 1, alpha, beta));
    beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }
  return best;
}

export function chooseBestMove(board: Board): Move | null {
  const moves = getLegalMoves(board, AI_SIDE).sort((a, b) => moveScore(board, b) - moveScore(board, a));
  let best: Move | null = null;
  let bestScore = Infinity;
  for (const move of moves.slice(0, 30)) {
    const score = minimax(applyMove(board, move), "red", 2, -Infinity, Infinity);
    if (score < bestScore) {
      bestScore = score;
      best = move;
    }
  }
  return best;
}

function formatSquare(square: number) {
  return `${String.fromCharCode(65 + colOf(square))}${rowOf(square) + 1}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const fishPositions = [
  { top: "7%", left: "-17%", duration: "24s", delay: "-4s", flip: false },
  { top: "20%", left: "58%", duration: "29s", delay: "-13s", flip: true },
  { top: "39%", left: "-22%", duration: "22s", delay: "-17s", flip: false },
  { top: "62%", left: "54%", duration: "27s", delay: "-7s", flip: true },
  { top: "80%", left: "-13%", duration: "31s", delay: "-20s", flip: false },
];

const adPositions = [
  { top: "30%", left: "-6%", delay: "-2s", duration: "19s", rotate: "-8deg" },
  { top: "51%", left: "23%", delay: "-10s", duration: "23s", rotate: "6deg" },
  { top: "73%", left: "-9%", delay: "-16s", duration: "21s", rotate: "-4deg" },
];

function CameraCard({
  id,
  stream,
  status,
  position,
  onToggle,
  onDragStart,
}: {
  id: CameraId;
  stream: MediaStream | null;
  status: CameraStatus;
  position: CameraPosition;
  onToggle: (id: CameraId) => void;
  onDragStart: (id: CameraId, event: React.PointerEvent<HTMLDivElement>) => void;
}) {
  const isFront = id === "front";
  return (
    <div
      className={`camera-card ${status === "live" ? "is-live" : ""}`}
      style={{ left: `${position.x}%`, top: `${position.y}%` }}
      onPointerDown={(event) => onDragStart(id, event)}
      aria-label={`${isFront ? "Camera trước" : "Camera sau"}. Kéo để di chuyển.`}
    >
      <div className="camera-frame">
        {stream ? <video ref={(node) => { if (node) node.srcObject = stream; }} autoPlay muted playsInline /> : <div className="camera-empty"><Camera size={18} /><span>{status === "blocked" ? "Cấp quyền camera" : status === "connecting" ? "Đang xin quyền" : "Chưa bật"}</span></div>}
        <div className="camera-scanline" />
        <div className="camera-corner camera-corner-tl" />
        <div className="camera-corner camera-corner-br" />
        <span className="camera-chip"><span className={`live-dot ${status === "live" ? "on" : ""}`} />{status === "live" ? "LIVE" : "CAM"}</span>
        <span className="camera-label">{isFront ? "TRƯỚC" : "SAU"}</span>
        <span className="camera-drag"><Move size={11} /> KÉO</span>
      </div>
      <button className="camera-toggle" onClick={() => onToggle(id)} type="button">
        {status === "live" ? <CameraOff size={13} /> : <Camera size={13} />}
        {status === "live" ? "TẮT" : "BẬT CAM"}
      </button>
    </div>
  );
}

export default function Home() {
  const [board, setBoard] = useState<Board>(() => createInitialBoard());
  const [turn, setTurn] = useState<Side>("red");
  const [selected, setSelected] = useState<number | null>(null);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [snapshots, setSnapshots] = useState<Board[]>([]);
  const [captured, setCaptured] = useState<Piece[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [winner, setWinner] = useState<Side | null>(null);
  const [rewardKey, setRewardKey] = useState(0);
  const [rewardVisible, setRewardVisible] = useState(false);
  const [cameraStreams, setCameraStreams] = useState<Record<CameraId, MediaStream | null>>({ front: null, back: null });
  const [cameraStatus, setCameraStatus] = useState<Record<CameraId, CameraStatus>>({ front: "idle", back: "idle" });
  const [cameraPositions, setCameraPositions] = useState<Record<CameraId, CameraPosition>>({ front: { x: 3, y: 20 }, back: { x: 68, y: 20 } });
  const [audioEnabled, setAudioEnabled] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: CameraId; offsetX: number; offsetY: number } | null>(null);
  const cameraStreamsRef = useRef(cameraStreams);
  const audioRef = useRef<{ context: AudioContext; master: GainNode; sources: AudioScheduledSourceNode[] } | null>(null);
  const battleTimerRef = useRef<number | null>(null);

  const legalTargets = useMemo(() => selected === null || turn !== "red" || winner ? [] : getLegalMoves(board, "red").filter((move) => move.from === selected).map((move) => move.to), [board, selected, turn, winner]);
  const redCount = board.filter((piece) => piece?.side === "red").length;
  const blackCount = board.filter((piece) => piece?.side === "black").length;

  const triggerReward = useCallback(() => {
    setRewardKey((key) => key + 1);
    setRewardVisible(true);
    window.setTimeout(() => setRewardVisible(false), 2300);
  }, []);

  const playBoardSound = useCallback((kind: "move" | "capture") => {
    const context = audioRef.current?.context;
    if (!context || context.state !== "running") return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = kind === "capture" ? "sawtooth" : "triangle";
    oscillator.frequency.setValueAtTime(kind === "capture" ? 110 : 220, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(kind === "capture" ? 58 : 120, context.currentTime + .18);
    gain.gain.setValueAtTime(.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(kind === "capture" ? .16 : .08, context.currentTime + .015);
    gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + .2);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + .22);
  }, []);

  const playBattlePulse = useCallback(() => {
    const current = audioRef.current;
    if (!current || current.context.state !== "running") return;
    const { context, master } = current;
    const now = context.currentTime;
    const drum = context.createOscillator();
    const drumGain = context.createGain();
    drum.type = "sine";
    drum.frequency.setValueAtTime(86, now);
    drum.frequency.exponentialRampToValueAtTime(42, now + .28);
    drumGain.gain.setValueAtTime(.0001, now);
    drumGain.gain.exponentialRampToValueAtTime(.28, now + .02);
    drumGain.gain.exponentialRampToValueAtTime(.0001, now + .34);
    drum.connect(drumGain).connect(master);
    drum.start(now);
    drum.stop(now + .36);
    const steel = context.createOscillator();
    const steelGain = context.createGain();
    steel.type = "triangle";
    steel.frequency.setValueAtTime(690, now + .06);
    steel.frequency.exponentialRampToValueAtTime(230, now + .32);
    steelGain.gain.setValueAtTime(.0001, now + .06);
    steelGain.gain.exponentialRampToValueAtTime(.06, now + .075);
    steelGain.gain.exponentialRampToValueAtTime(.0001, now + .34);
    steel.connect(steelGain).connect(master);
    steel.start(now + .06);
    steel.stop(now + .37);
  }, []);

  const commitMove = useCallback((move: Move) => {
    setSnapshots((current) => [...current.slice(-7), board]);
    const capturedPiece = board[move.to];
    const movingPiece = board[move.from];
    setBoard((current) => applyMove(current, move));
    setLastMove(move);
    setSelected(null);
    if (capturedPiece) {
      setCaptured((current) => [...current, capturedPiece]);
      triggerReward();
    }
    playBoardSound(capturedPiece ? "capture" : "move");
    if (movingPiece) setMoveHistory((current) => [...current, `${movingPiece.label} ${formatSquare(move.from)} → ${formatSquare(move.to)}`].slice(-5));
  }, [board, playBoardSound, triggerReward]);

  const resetGame = useCallback(() => {
    setBoard(createInitialBoard());
    setTurn("red");
    setSelected(null);
    setLastMove(null);
    setMoveHistory([]);
    setSnapshots([]);
    setCaptured([]);
    setWinner(null);
    setIsThinking(false);
  }, []);

  const undoMove = useCallback(() => {
    const previous = snapshots[snapshots.length - 1];
    if (!previous || isThinking) return;
    setBoard(previous);
    setSnapshots((current) => current.slice(0, -1));
    setMoveHistory((current) => current.slice(0, -1));
    setLastMove(null);
    setSelected(null);
    setTurn("red");
    setWinner(null);
  }, [isThinking, snapshots]);

  const handleSquare = (square: number) => {
    if (turn !== "red" || isThinking || winner) return;
    const piece = board[square];
    if (selected !== null) {
      if (square === selected) {
        setSelected(null);
        return;
      }
      if (legalTargets.includes(square)) {
        commitMove({ from: selected, to: square });
        const next = applyMove(board, { from: selected, to: square });
        if (findGeneral(next, "black") < 0) setWinner("red");
        else setTurn("black");
        return;
      }
    }
    if (piece?.side === "red") setSelected(square);
    else setSelected(null);
  };

  useEffect(() => {
    if (turn !== "black" || winner || isThinking) return;
    const timer = window.setTimeout(() => {
      setIsThinking(true);
      window.setTimeout(() => {
        const move = chooseBestMove(board);
        if (!move) {
          setWinner("red");
          setIsThinking(false);
          return;
        }
        const next = applyMove(board, move);
        const capturedPiece = board[move.to];
        const movingPiece = board[move.from];
        setSnapshots((current) => [...current.slice(-7), board]);
        setBoard(next);
        setLastMove(move);
        setMoveHistory((current) => [...current, `${movingPiece?.label ?? "AI"} ${formatSquare(move.from)} → ${formatSquare(move.to)}`].slice(-5));
        if (capturedPiece) {
          setCaptured((current) => [...current, capturedPiece]);
          triggerReward();
        }
        playBoardSound(capturedPiece ? "capture" : "move");
        if (findGeneral(next, "red") < 0) setWinner("black");
        else setTurn("red");
        setIsThinking(false);
      }, 80);
    }, 420);
    return () => window.clearTimeout(timer);
  }, [board, isThinking, playBoardSound, triggerReward, turn, winner]);

  useEffect(() => {
    cameraStreamsRef.current = cameraStreams;
  }, [cameraStreams]);

  useEffect(() => () => {
    Object.values(cameraStreamsRef.current).forEach((stream) => stream?.getTracks().forEach((track) => track.stop()));
    if (battleTimerRef.current !== null) window.clearInterval(battleTimerRef.current);
    audioRef.current?.sources.forEach((source) => { try { source.stop(); } catch { /* already stopped */ } });
    void audioRef.current?.context.close();
  }, []);

  const toggleCamera = async (id: CameraId) => {
    const existing = cameraStreamsRef.current[id];
    if (existing) {
      existing.getTracks().forEach((track) => track.stop());
      cameraStreamsRef.current = { ...cameraStreamsRef.current, [id]: null };
      setCameraStreams((current) => ({ ...current, [id]: null }));
      setCameraStatus((current) => ({ ...current, [id]: "idle" }));
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus((current) => ({ ...current, [id]: "blocked" }));
      return;
    }
    setCameraStatus((current) => ({ ...current, [id]: "connecting" }));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: id === "front" ? "user" : "environment" }, audio: false });
      cameraStreamsRef.current = { ...cameraStreamsRef.current, [id]: stream };
      setCameraStreams((current) => ({ ...current, [id]: stream }));
      setCameraStatus((current) => ({ ...current, [id]: "live" }));
    } catch {
      setCameraStatus((current) => ({ ...current, [id]: "blocked" }));
    }
  };

  const startAllCameras = async () => {
    for (const id of ["front", "back"] as CameraId[]) {
      if (!cameraStreamsRef.current[id]) await toggleCamera(id);
    }
  };

  const toggleBattleAudio = async () => {
    if (audioRef.current) {
      if (battleTimerRef.current !== null) window.clearInterval(battleTimerRef.current);
      battleTimerRef.current = null;
      audioRef.current.sources.forEach((source) => { try { source.stop(); } catch { /* already stopped */ } });
      await audioRef.current.context.close();
      audioRef.current = null;
      setAudioEnabled(false);
      return;
    }
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    await context.resume();
    const master = context.createGain();
    master.gain.value = .045;
    master.connect(context.destination);
    const drone = context.createOscillator();
    const droneGain = context.createGain();
    drone.type = "sine";
    drone.frequency.value = 54;
    droneGain.gain.value = .7;
    drone.connect(droneGain).connect(master);
    drone.start();
    const pulse = context.createOscillator();
    const pulseGain = context.createGain();
    pulse.type = "triangle";
    pulse.frequency.value = 1.7;
    pulseGain.gain.value = .12;
    pulse.connect(pulseGain).connect(master);
    pulse.start();
    audioRef.current = { context, master, sources: [drone, pulse] };
    setAudioEnabled(true);
    playBattlePulse();
    battleTimerRef.current = window.setInterval(playBattlePulse, 4200);
  };

  const handleDragStart = (id: CameraId, event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button")) return;
    const card = event.currentTarget.getBoundingClientRect();
    dragRef.current = { id, offsetX: event.clientX - card.left, offsetY: event.clientY - card.top };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleDragMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const stage = stageRef.current;
    if (!drag || !stage) return;
    const rect = stage.getBoundingClientRect();
    const cardWidth = rect.width * 0.29;
    const cardHeight = cardWidth;
    const x = clamp((event.clientX - rect.left - drag.offsetX) / rect.width * 100, 1, 70);
    const y = clamp((event.clientY - rect.top - drag.offsetY) / rect.height * 100, 1, 82);
    void cardHeight;
    setCameraPositions((current) => ({ ...current, [drag.id]: { x, y } }));
  };

  const liveCount = Object.values(cameraStatus).filter((status) => status === "live").length;

  return (
    <main className="app-shell">
      <div ref={stageRef} className="game-stage" onPointerMove={handleDragMove} onPointerUp={() => { dragRef.current = null; }} onPointerCancel={() => { dragRef.current = null; }}>
        <div className="texture-layer" style={{ backgroundImage: `url(${VISUAL_TARGET})` }} />

        <div className="fish-layer" aria-hidden="true">
          {fishPositions.map((fish, index) => (
            <img key={index} className={`goldfish goldfish-${index + 1}`} src={FISH_ASSET} alt="" style={{ top: fish.top, left: fish.left, animationDuration: fish.duration, animationDelay: fish.delay, transform: fish.flip ? "scaleX(-1)" : undefined }} />
          ))}
        </div>

        <div className="reward-layer" aria-hidden="true">
          {rewardVisible && <div key={rewardKey} className="reward-pop"><img src={EMBLEM_ASSET} alt="" /><span>THU HOẠCH</span></div>}
        </div>

        <div className="ad-layer" aria-hidden="true">
          {adPositions.map((ad, index) => <span key={index} className="ad-ribbon" style={{ top: ad.top, left: ad.left, animationDelay: ad.delay, animationDuration: ad.duration, rotate: ad.rotate }}>{AD_TEXT}</span>)}
        </div>

        <header className="top-bar">
          <div className="brand-lockup">
            <div className="brand-seal"><Sparkles size={16} /></div>
            <div><div className="brand-name">VIET CỜ TƯỚNG</div><div className="brand-sub">CHÂN · THIỆN · MỸ</div></div>
          </div>
          <div className="top-status"><span className="status-dot" /> <span>AI ONLINE</span><span className="status-divider" /> <span>9:16</span></div>
          <span className="icon-button" aria-hidden="true"><Sparkles size={14} /></span>
        </header>

        <section className="hero-copy" aria-label="Thông tin trận đấu">
          <div className="eyebrow"><span className="eyebrow-line" /> BẢN ĐỒNG HÀNH · 01 <span className="eyebrow-line" /></div>
          <h1>AI <em>TỐI CAO</em></h1>
          <p>Đối đầu với bộ não chiến thuật đa tầng</p>
        </section>

        <section className="camera-layer" aria-label="Hai camera live">
          <CameraCard id="front" stream={cameraStreams.front} status={cameraStatus.front} position={cameraPositions.front} onToggle={toggleCamera} onDragStart={handleDragStart} />
          <CameraCard id="back" stream={cameraStreams.back} status={cameraStatus.back} position={cameraPositions.back} onToggle={toggleCamera} onDragStart={handleDragStart} />
          <button className="camera-hub" type="button" onClick={startAllCameras}><Camera size={13} /> {liveCount === 2 ? "HAI CAM ĐANG LIVE" : "BẬT 2 CAMERA"}</button>
        </section>

        <section className="board-zone" aria-label="Bàn cờ tướng tương tác">
          <div className="board-meta">
            <div className="player-chip player-red"><span className="player-token">ĐỎ</span><div><strong>BẠN</strong><small>Người chơi</small></div><Crown size={15} /></div>
            <div className="versus"><span>VS</span><small>{isThinking ? "AI đang tính" : winner ? "Kết thúc" : turn === "red" ? "Lượt của bạn" : "Lượt AI"}</small></div>
            <div className="player-chip player-black"><span className="player-token">ĐEN</span><div><strong>ZEPHYR</strong><small>Depth 3 · 1.8s</small></div><Gauge size={15} /></div>
          </div>

          <div className="board-shell">
            <div className="board-glow" />
            <div className="board-frame">
              <div className="board-art" aria-hidden="true">
                <svg viewBox="0 0 9 10" preserveAspectRatio="none">
                  {Array.from({ length: 9 }, (_, col) => <line key={`v-${col}`} x1={col} y1="0" x2={col} y2="10" />)}
                  {Array.from({ length: 10 }, (_, row) => <line key={`h-${row}`} x1="0" y1={row} x2="8" y2={row} />)}
                  <path d="M3 0 L5 2 M5 0 L3 2 M3 8 L5 10 M5 8 L3 10" />
                  <path className="river-mark" d="M0.2 5 L3.1 5 M4.9 5 L7.8 5" />
                </svg>
                <div className="river-label river-left">楚河</div><div className="river-label river-right">漢界</div>
              </div>
              <div className="board-grid">
                {board.map((piece, square) => {
                  const isSelected = selected === square;
                  const isTarget = legalTargets.includes(square);
                  const isLast = lastMove?.from === square || lastMove?.to === square;
                  return <button key={square} type="button" className={`board-cell ${isSelected ? "selected" : ""} ${isTarget ? "target" : ""} ${isLast ? "last" : ""}`} onClick={() => handleSquare(square)} aria-label={piece ? `${piece.side === "red" ? "Đỏ" : "Đen"} ${piece.label}, hàng ${rowOf(square) + 1}, cột ${colOf(square) + 1}` : `Ô trống, hàng ${rowOf(square) + 1}, cột ${colOf(square) + 1}`}>
                    {piece && <span className={`chess-piece ${piece.side}`} title={piece.label}><span>{piece.label}</span></span>}
                    {isTarget && !piece && <span className="target-dot" />}
                  </button>;
                })}
              </div>
            </div>
            <div className="board-caption"><span>9×10 · 90 GIAO ĐIỂM</span><strong>CỜ TƯỚNG</strong><span>A–I · 1–10</span></div>
          </div>

          <div className="board-footer">
            <div className="piece-stat"><span className="mini-disc red" /> ĐỎ <strong>{redCount}</strong></div>
            <div className="move-state"><span className={`thinking-dot ${isThinking ? "active" : ""}`} /> {isThinking ? "ZEPHYR ĐANG SUY NGHĨ" : winner ? (winner === "red" ? "BẠN ĐÃ THẮNG" : "AI ĐÃ THẮNG") : "CHỌN QUÂN ĐỎ ĐỂ DI CHUYỂN"}</div>
            <div className="piece-stat"><span className="mini-disc black" /> ĐEN <strong>{blackCount}</strong></div>
          </div>
        </section>

        <section className="control-deck" aria-label="Điều khiển trận đấu">
          <button className="control-button" type="button" onClick={undoMove} disabled={!snapshots.length || isThinking}><Undo2 size={15} /><span>HOÀN TÁC</span></button>
          <button className="control-button primary" type="button" onClick={resetGame}><RotateCcw size={15} /><span>TRẬN MỚI</span></button>
          <button className="control-button" type="button" onClick={() => window.alert(moveHistory.length ? moveHistory.join("\n") : "Chưa có nước đi nào.")}><History size={15} /><span>LỊCH SỬ</span></button>
          <button className={`control-button audio-button ${audioEnabled ? "active" : ""}`} type="button" onClick={() => void toggleBattleAudio()}>{audioEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}<span>{audioEnabled ? "ÂM THANH ON" : "ÂM THANH"}</span></button>
        </section>

        <footer className="bottom-note"><span><Waves size={12} /> HỆ SINH THÁI QUÂN CỜ SỐ</span><span className="footer-center"><span className="pulse-ring" /> TÍN HIỆU ỔN ĐỊNH</span><span><CircleHelp size={12} /> TRỢ GIÚP</span></footer>

        <div className="capture-counter"><Target size={12} /> {captured.length.toString().padStart(2, "0")} CAPTURED</div>
        <div className="camera-permission-note"><MicOff size={11} /> Âm thanh tắt · Camera cần quyền truy cập</div>
      </div>
    </main>
  );
}

import { describe, expect, it } from "vitest";
import { applyMove, chooseBestMove, createInitialBoard, getLegalMoves } from "../pages/Home";

describe("xiangqi gameplay core", () => {
  it("creates a standard 32-piece starting position", () => {
    const board = createInitialBoard();
    expect(board.filter(Boolean)).toHaveLength(32);
    expect(board[4]?.label).toBe("TƯỚNG");
    expect(board[85]?.side).toBe("red");
  });

  it("exposes legal red moves without allowing the first move to be a slide through a piece", () => {
    const board = createInitialBoard();
    const moves = getLegalMoves(board, "red");
    expect(moves.length).toBeGreaterThan(0);
    expect(moves.some((move) => move.from === 64 && move.to === 55)).toBe(true);
    expect(moves.some((move) => move.from === 80 && move.to === 70)).toBe(false);
  });

  it("applies a move without mutating the original board", () => {
    const board = createInitialBoard();
    const next = applyMove(board, { from: 64, to: 55 });
    expect(board[64]?.label).toBe("PHÁO");
    expect(board[55]).toBeNull();
    expect(next[64]).toBeNull();
    expect(next[55]?.label).toBe("PHÁO");
  });

  it("selects a legal black response for the AI", () => {
    const board = createInitialBoard();
    const aiMove = chooseBestMove(board);
    expect(aiMove).not.toBeNull();
    expect(getLegalMoves(board, "black")).toContainEqual(aiMove);
  });
});

"use client";

import ChessBoard from "@/app/components/chess/ChessBoard";
import { initialBoard } from "@/lib/initialBoard";
import { useGameStore } from "@/store/useGameStore";
import axios from "axios";
import React, { useEffect, useState } from "react";

type Move = {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
};

const ReplayPage = ({ params }: { params: { gameId: string } }) => {
  const [moves, setMoves] = useState<Move[]>([]);
  const [index, setIndex] = useState(0);

  const setBoard = useGameStore((s) => s.setBoard);
  const applyRemoteMove = useGameStore((s) => s.applyRemoteMove);
  const resetGame = useGameStore((s) => s.resetGame);

  useEffect(() => {
    const fetchGame = async () => {
      resetGame();
      const res = await axios.get(`${process.env.NEST_PUBLIC_API_URL!}/game/${params.gameId}`);
      setMoves(res.data.moves);
      setIndex(0);
    };

    fetchGame();
  }, [params.gameId, resetGame]);

  useEffect(() => {
    setBoard(initialBoard);

    for (let i = 0; i < index; i++) {
      const move = moves[i];
      if (!move) break;

      applyRemoteMove({
        from: { row: move.fromRow, col: move.fromCol },
        to: { row: move.toRow, col: move.toCol },
      });
    }
  }, [index, moves, setBoard, applyRemoteMove]);

  return (
    <div className="flex flex-col items-center gap-4">
      <ChessBoard />

      <div className="flex gap-2">
        <button onClick={() => setIndex(0)}>⏮</button>

        <button onClick={() => setIndex((i) => Math.max(0, i - 1))}>
          ◀
        </button>

        <button
          onClick={() =>
            setIndex((i) => Math.min(moves.length, i + 1))
          }
        >
          ▶
        </button>

        <button onClick={() => setIndex(moves.length)}>
          ⏭
        </button>
      </div>
    </div>
  );
};

export default ReplayPage;

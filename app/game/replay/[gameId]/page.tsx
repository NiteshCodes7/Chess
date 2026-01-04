"use client";

import ChessBoard from "@/app/components/chess/ChessBoard";
import { initialBoard } from "@/lib/initialBoard";
import { useGameStore } from "@/store/useGameStore";
import axios from "axios";
import React, { use, useEffect, useState } from "react";

type Move = {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
};

const ReplayPage = ({ params }: { params: Promise<{ gameId: string }> }) => {

  const { gameId } = use(params)

  const [moves, setMoves] = useState<Move[]>([]);
  const [index, setIndex] = useState(0);

  const setBoard = useGameStore((s) => s.setBoard);
  const applyRemoteMove = useGameStore((s) => s.applyRemoteMove);
  const resetGame = useGameStore((s) => s.resetGame);

  useEffect(() => {
    const fetchGame = async () => {
      resetGame();
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL!}/game/${gameId}`);
      setMoves(res.data.moves);
      setIndex(0);
    };

    fetchGame();
  }, [gameId, resetGame]);

  useEffect(() => {
    setBoard(initialBoard);

    for (let i = 0; i < index; i++) {
      const move = moves[i];
      if (!move) break;

      applyRemoteMove({
        from: { row: move.fromRow, col: move.fromCol },
        to: { row: move.toRow, col: move.toCol },
        turn: i % 2 === 0 ? "white" : "black",

      });
    }
  }, [index, moves, setBoard, applyRemoteMove]);

  return (
    <div className="flex flex-col items-center justify-center h-[100vh] gap-4">
      <ChessBoard />

      <div className="flex gap-2">
        <button 
        className="cursor-pointer" 
        onClick={() => {
          setIndex(0)
          resetGame();
        }}
        >⏮</button>

        <button className="cursor-pointer" onClick={() => setIndex((i) => Math.max(0, i - 1))}>
          ◀
        </button>

        <button
          className="cursor-pointer"
          onClick={() =>
            setIndex((i) => Math.min(moves.length, i + 1))
          }
        >
          ▶
        </button>

        <button className="cursor-pointer" onClick={() => setIndex(moves.length)}>
          ⏭
        </button>
      </div>
    </div>
  );
};

export default ReplayPage;

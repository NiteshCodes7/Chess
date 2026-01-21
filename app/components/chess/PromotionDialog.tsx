type Piece = "queen" | "rook" | "bishop" | "knight";

export function PromotionDialog({ onSelect }: { onSelect: (piece: Piece) => void }) {
  const pieces: Piece[] = ["queen", "rook", "bishop", "knight"];

  return (
    <div className="bg-gray-800 p-4 rounded text-white">
      <p>Promote to:</p>
      <div className="flex space-x-2 mt-2">
        {pieces.map(p => (
          <button
            key={p}
            onClick={() => onSelect(p)}
            className="px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded"
          >
            {p[0].toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}

import React, { useEffect, useRef } from 'react';
import './App.scss';

const CANVAS_SIZE = 500;
const GRID_COUNT = 10;
const CELL_SIZE = CANVAS_SIZE / GRID_COUNT;

type Player = 'X' | 'O';
type Cell = Player | null;

const Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Khởi tạo bảng trò chơi 10x10
    let board: Cell[][] = Array.from({ length: GRID_COUNT }, () =>
      Array(GRID_COUNT).fill(null)
    );
    let gameState: 'start' | 'play' | 'end' = 'start';
    let winner: Player | 'Draw' | null = null;
    let aiThinking: boolean = false; // cờ báo hiệu AI đang suy nghĩ

    // Hàm kiểm tra chiến thắng với điều kiện 5 dấu liền nhau (ngang, dọc, hoặc chéo)
    const checkWinner = (): Player | 'Draw' | null => {
      for (let i = 0; i < GRID_COUNT; i++) {
        for (let j = 0; j < GRID_COUNT; j++) {
          const cell = board[i][j];
          if (cell === null) continue;

          // Kiểm tra hàng ngang
          if (j <= GRID_COUNT - 5) {
            let win = true;
            for (let k = 1; k < 5; k++) {
              if (board[i][j + k] !== cell) {
                win = false;
                break;
              }
            }
            if (win) return cell;
          }

          // Kiểm tra cột dọc
          if (i <= GRID_COUNT - 5) {
            let win = true;
            for (let k = 1; k < 5; k++) {
              if (board[i + k][j] !== cell) {
                win = false;
                break;
              }
            }
            if (win) return cell;
          }

          // Kiểm tra đường chéo chính (xuống phải)
          if (i <= GRID_COUNT - 5 && j <= GRID_COUNT - 5) {
            let win = true;
            for (let k = 1; k < 5; k++) {
              if (board[i + k][j + k] !== cell) {
                win = false;
                break;
              }
            }
            if (win) return cell;
          }

          // Kiểm tra đường chéo phụ (xuống trái)
          if (i <= GRID_COUNT - 5 && j >= 4) {
            let win = true;
            for (let k = 1; k < 5; k++) {
              if (board[i + k][j - k] !== cell) {
                win = false;
                break;
              }
            }
            if (win) return cell;
          }
        }
      }
      // Nếu tất cả ô đã được điền mà không có người thắng, trả về hòa
      const isDraw = board.every(row => row.every(cell => cell !== null));
      if (isDraw) return 'Draw';
      return null;
    };

    // Hàm tìm nước đi thắng cho marker cho trước (dùng cho việc tìm nước thắng hoặc chặn đối thủ)
    const findWinningMove = (marker: Player): { row: number, col: number } | null => {
      for (let i = 0; i < GRID_COUNT; i++) {
        for (let j = 0; j < GRID_COUNT; j++) {
          if (board[i][j] === null) {
            board[i][j] = marker;
            const result = checkWinner();
            board[i][j] = null;
            if (result === marker) {
              return { row: i, col: j };
            }
          }
        }
      }
      return null;
    };

    // Hàm lấy một nước đi ngẫu nhiên từ các ô trống
    const getRandomMove = (): { row: number, col: number } | null => {
      const emptyCells: { row: number, col: number }[] = [];
      for (let i = 0; i < GRID_COUNT; i++) {
        for (let j = 0; j < GRID_COUNT; j++) {
          if (board[i][j] === null) {
            emptyCells.push({ row: i, col: j });
          }
        }
      }
      if (emptyCells.length === 0) return null;
      const randomIndex = Math.floor(Math.random() * emptyCells.length);
      return emptyCells[randomIndex];
    };

    // Hàm xử lý nước đi của AI (marker 'O')
    const aiMove = () => {
      if (gameState !== 'play') return;
      // Ưu tiên tìm nước đi thắng cho AI
      let move = findWinningMove('O');
      // Nếu không có, chặn nước thắng của người chơi (marker 'X')
      if (!move) {
        move = findWinningMove('X');
      }
      // Nếu vẫn chưa có, chọn nước đi ngẫu nhiên
      if (!move) {
        move = getRandomMove();
      }
      if (move) {
        board[move.row][move.col] = 'O';
        const result = checkWinner();
        if (result) {
          gameState = 'end';
          winner = result;
        }
      }
    };

    // Xử lý sự kiện click của người chơi (với marker 'X')
    const handleClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Nếu game ở trạng thái start, chuyển sang play
      if (gameState === 'start') {
        gameState = 'play';
      }

      // Nếu game đang chơi và AI không đang suy nghĩ
      if (gameState === 'play' && !aiThinking) {
        const col = Math.floor(x / CELL_SIZE);
        const row = Math.floor(y / CELL_SIZE);
        if (board[row][col] === null) {
          // Người chơi đánh 'X'
          board[row][col] = 'X';
          const result = checkWinner();
          if (result) {
            gameState = 'end';
            winner = result;
          } else {
            // Sau lượt người chơi, AI sẽ di chuyển với độ trễ 500ms
            aiThinking = true;
            setTimeout(() => {
              aiMove();
              aiThinking = false;
            }, 500);
          }
        }
      } else if (gameState === 'end') {
        resetGame();
        gameState = 'play';
      }
    };

    canvas.addEventListener('click', handleClick);

    // Hàm vẽ giao diện game
    const draw = () => {
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // Vẽ lưới 10x10
      ctx.strokeStyle = '#000';
      for (let i = 0; i <= GRID_COUNT; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
        ctx.stroke();
      }

      // Vẽ các dấu X và O
      ctx.font = `${CELL_SIZE * 0.6}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = 0; i < GRID_COUNT; i++) {
        for (let j = 0; j < GRID_COUNT; j++) {
          const mark = board[i][j];
          if (mark) {
            ctx.fillStyle = mark === 'X' ? 'red' : 'blue';
            ctx.fillText(mark, j * CELL_SIZE + CELL_SIZE / 2, i * CELL_SIZE + CELL_SIZE / 2);
          }
        }
      }

      // Vẽ thông tin trạng thái game
      ctx.fillStyle = 'black';
      ctx.font = '24px Arial';
      if (gameState === 'start') {
        ctx.fillText('Xin mời bạn đi trước!', CANVAS_SIZE / 2, 30);
      } else if (gameState === 'play') {
        if (aiThinking) {
          ctx.fillText("Trí tuệ nhân tạo đang suy nghĩ...", CANVAS_SIZE / 2, 30);
        } else {
          ctx.fillText("Đến lượt bạn!", CANVAS_SIZE / 2, 30);
        }
      } else if (gameState === 'end') {
        if (winner === 'Draw') {
          ctx.fillText('Hòa!', CANVAS_SIZE / 2, 30);
        } else if (winner === 'X') {
          ctx.fillText('Bạn đã thắng!', CANVAS_SIZE / 2, 30);
        } else {
          ctx.fillText('Trí tuệ nhân tạo đã thắng!', CANVAS_SIZE / 2, 30);
        }
        ctx.fillText('Nhấn để chơi lại', CANVAS_SIZE / 2, CANVAS_SIZE - 30);
      }
    };

    const gameLoop = () => {
      draw();
      requestAnimationFrame(gameLoop);
    };

    const resetGame = () => {
      board = Array.from({ length: GRID_COUNT }, () =>
        Array(GRID_COUNT).fill(null)
      );
      gameState = 'start';
      winner = null;
      aiThinking = false;
    };

    gameLoop();

    return () => {
      canvas.removeEventListener('click', handleClick);
    };
  }, []);

  return <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} />;
};

export default Game;
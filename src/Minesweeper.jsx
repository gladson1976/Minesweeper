import React, { useCallback, useEffect, useState } from 'react';
import classNames from 'classnames';
import _ from 'lodash';
import './Minesweeper.css';

export default function Minesweeper() {
  const create2DArray = (arrRows, arrColumns, defaultValue = undefined) => {
    let arrTemp = new Array(arrRows || 0);
    for (let i = 0; i < arrRows; i += 1) {
      arrTemp[i] = new Array(arrColumns || 0);
      _.fill(arrTemp[i], defaultValue);
    }
    return arrTemp;
  };

  const getRandom = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const [gameTimer, setGameTimer] = useState(0);
  const [timerRef, setTimerRef] = useState(null);
  const [numberColors] = useState(['gray', 'blue', 'green', 'red', 'purple', 'maroon', 'turquoise', 'black', 'dark-gray'])
  const selectedDifficulty = 'Beginner';
  const [availableDifficulty] = useState({
    Beginner: {
      rows: 9,
      columns: 9,
      maxMines: 10,
    },
    Intermediate: {
      rows: 16,
      columns: 16,
      maxMines: 40,
    },
    Advanced: {
      rows: 16,
      columns: 30,
      maxMines: 99,
    },
  });
  const currentDifficulty = availableDifficulty[selectedDifficulty];
  const [currentGame, setCurrentGame] = useState({
    minefield: create2DArray(currentDifficulty.rows, currentDifficulty.columns, [0, 0]),
    timer: 0,
    gameState: 0 // 0 - Not Started, 1 - In Progress, 2 - Game Lost, 3 - Game Won, 4 - Paused
  });
  const [cellNeighbours] = useState([
    [-1, 1],
    [0, 1],
    [1, 1],
    [1, 0],
    [1, -1],
    [0, -1],
    [-1, -1],
    [-1, 0]
  ]);

  const initBoard = useCallback(() => {
    let tempGame = {};
    _.set(
      tempGame,
      'minefield',
      create2DArray(currentDifficulty.rows, currentDifficulty.columns, [0, 0])
    );
    _.set(tempGame, 'timer', 0);
    _.set(tempGame, 'gameState', 0);
    setCurrentGame(tempGame);
  }, [currentDifficulty]);

  const initMinefield = useCallback(() => {
    initBoard();
    setGameTimer(0);
    let tempGame = _.cloneDeep(currentGame);
    let boardIndexes = [];
    for (let i = 0; i < currentDifficulty.rows; i++) {
      _.fill(tempGame.minefield[i], [0, 0]);
      for (let j = 0; j < currentDifficulty.columns; j++) {
        boardIndexes.push({ row: i, col: j });
      }
    }
    for (let i = 0; i < currentDifficulty.maxMines; i++) {
      const pickedCell = boardIndexes[getRandom(0, boardIndexes.length - 1)];
      tempGame.minefield[pickedCell.row][pickedCell.col] = [9, 0];
      boardIndexes = _.difference(boardIndexes, [pickedCell]);
    }
    for (let i = 0; i < currentDifficulty.rows; i++) {
      for (let j = 0; j < currentDifficulty.columns; j++) {
        let mineCount = 0;
        if (tempGame.minefield[i][j][0] !== 9) {
          for (let k = 0; k < cellNeighbours.length; k++) {
            const cellNeighbour = cellNeighbours[k];
            const neighbour = [parseInt(i) + parseInt(cellNeighbour[0]), parseInt(j) + parseInt(cellNeighbour[1])];
            if (
              neighbour[0] > -1 &&
              neighbour[0] < currentDifficulty.rows &&
              neighbour[1] > -1 &&
              neighbour[1] < currentDifficulty.columns
            ) {
              if (tempGame.minefield[neighbour[0]][neighbour[1]][0] === 9) {
                mineCount++;
              }
            }
          }
          tempGame.minefield[i][j] = [mineCount, 0];
        }
      }
    }
    setCurrentGame(tempGame);
  }, [cellNeighbours, currentDifficulty, currentGame, initBoard]);

  const startTimer = useCallback(() => {
    const t = window.setInterval(() => setGameTimer(gameTimer => gameTimer + 1), 1000);
    setTimerRef(t);
  }, []);

  const stopTimer = useCallback(() => {
    window.clearInterval(timerRef);
    setTimerRef(null);
  }, [timerRef]);

  // const revealMines = useCallback(() => {
  //   let tempGame = _.cloneDeep(currentGame);
  //   for (let i = 0; i < currentDifficulty.rows; i++) {
  //     for (let j = 0; j < currentDifficulty.columns; j++) {
  //       if (tempGame.minefield[i][j][0] === 9 && tempGame.minefield[i][j][1] === 0) {
  //         tempGame.minefield[i][j] = [9, 1];
  //       }
  //     }
  //   }
  //   setCurrentGame(tempGame);
  // }, [currentDifficulty, currentGame]);

  const clearNeighbours = useCallback((row, col, game) => {
    let currentCell = game.minefield[row][col];
    if (currentCell[1] !== 1) {
      game.minefield[row][col] = [game.minefield[row][col][0], 1];
      if (currentCell[0] === 0) {
        for (let k = 0; k < cellNeighbours.length; k++) {
          const cellNeighbour = cellNeighbours[k];
          const neighbour = [parseInt(row) + parseInt(cellNeighbour[0]), parseInt(col) + parseInt(cellNeighbour[1])];
          if (
            neighbour[0] > -1 &&
            neighbour[0] < currentDifficulty.rows &&
            neighbour[1] > -1 &&
            neighbour[1] < currentDifficulty.columns
          ) {
            clearNeighbours(neighbour[0], neighbour[1], game);
          }
        }
      }
    }
    return;
  }, [cellNeighbours, currentDifficulty]);

  const navigateMinefield = useCallback((row, col) => {
    let tempGame = _.cloneDeep(currentGame);
    if (tempGame.gameState === 2) {
      return;
    }
    if (tempGame.gameState === 0 || tempGame.gameState === 3) {
      tempGame.gameState = 1;
      startTimer();
    }
    if (tempGame.minefield[row][col][0] !== 9) {
      clearNeighbours(row, col, tempGame);
    } else {
      tempGame.minefield[row][col] = [9, 9];
      tempGame.gameState = 2;
      for (let i = 0; i < currentDifficulty.rows; i++) {
        for (let j = 0; j < currentDifficulty.columns; j++) {
          if (tempGame.minefield[i][j][0] === 9 && tempGame.minefield[i][j][1] === 0) {
            tempGame.minefield[i][j] = [9, 1];
          }
        }
      }
      // revealMines();
      stopTimer();
    }
    setCurrentGame(tempGame);
  }, [clearNeighbours, currentDifficulty, currentGame, startTimer, stopTimer]);

  const drawMinefield = useCallback(() => {
    return (
      <div
        className={`minefield minefield-${selectedDifficulty.toLowerCase()}`}
      >
        {_.map(currentGame.minefield, (mineRow, rindex) => {
          return _.map(mineRow, (mineCell, cindex) => {
            if (mineCell[1] === 0) {
              return (
                <button
                  className={
                    classNames('minecell-button',
                      {
                        'minecell-mine': mineCell[0] === 9 && mineCell[1] === 1
                      }
                    )
                  }
                  key={`${rindex}${cindex}`}
                  onClick={() => navigateMinefield(rindex, cindex)}
                />
              );
            }
            if (mineCell[1] === 1) {
              return (
                <div
                  className={
                    classNames('minecell', `minecell-${numberColors[mineCell[0]]}`,
                      {
                        'minecell-mine': mineCell[0] === 9 && mineCell[1] === 1
                      }
                    )
                  }
                  key={`${rindex}${cindex}`}
                >
                  {
                    mineCell[0] === 0 || mineCell[0] === 9
                      ? ''
                      : mineCell[0]
                  }
                </div>
              );
            }
            if (mineCell[1] === 9) {
              return (
                <div
                  className={classNames('minecell', 'minecell-explode')}
                  key={`${rindex}${cindex}`}
                />
              );
            }
          });
        })}
      </div>
    );
  }, [currentGame, navigateMinefield, numberColors]);

  const drawIcons = useCallback(() => {
    return (
      <div className='icon-bar'>
        <div>{gameTimer}</div>
        <button type='button' onClick={initMinefield}>
          New
        </button>
      </div>
    );
  }, [gameTimer, initMinefield]);

  const drawGameBoard = useCallback(() => {
    return (
      <div className='game-board'>
        {drawIcons()}
        {drawMinefield()}
      </div>
    );
  }, [drawIcons, drawMinefield]);

  useEffect(() => {
    drawGameBoard();
  }, [drawGameBoard, currentGame.minefield]);

  return drawGameBoard();
}

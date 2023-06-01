import React, { useCallback, useEffect, useState } from 'react';
import classNames from 'classnames';
import _ from 'lodash';
// import { useLongpress } from './useLongpress';
import { useDoubleclick } from './useDoubleclick';
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

  const appTitle = 'Minesweeper';
  // const appVersion = 'v1.0';
  const hintCount = 0;
  const [safeGame] = useState(false);
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
    // Cell value [x, y]. x => 0 to 8 - count of mines, 9 - mine. y => 0 - Unopened, 1 - Opened, 2 - Marked, 9 - Exploded
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

  const minefieldCheckClick = useDoubleclick({
    onSingleClick: ev => navigateMinefield(ev),
    onDoubleClick: ev => markMine(ev)
  });
  const clearedCheckClick = useDoubleclick({
    onSingleClick: ev => clearUnflagged(ev),
    onDoubleClick: ev => clearUnflagged(ev)
  });
  
  const initMinefield = useCallback(() => {
    let tempGame = _.cloneDeep(currentGame);
    _.set(
      tempGame,
      'minefield',
      create2DArray(currentDifficulty.rows, currentDifficulty.columns, [0, 0])
    );
    _.set(tempGame, 'timer', 0);
    _.set(tempGame, 'gameState', 0);
    setGameTimer(0);

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
  }, [cellNeighbours, currentDifficulty, currentGame]);

  const startTimer = useCallback(() => {
    const t = window.setInterval(() => setGameTimer(gameTimer => gameTimer + 1), 1000);
    setTimerRef(t);
  }, []);

  const stopTimer = useCallback(() => {
    window.clearInterval(timerRef);
    setTimerRef(null);
  }, [timerRef]);

  const showAllMines = useCallback((tempGame) => {
    if (_.isUndefined(tempGame)) {
      return;
    }
    for (let i = 0; i < currentDifficulty.rows; i++) {
      for (let j = 0; j < currentDifficulty.columns; j++) {
        if (tempGame.minefield[i][j][0] === 9 && tempGame.minefield[i][j][1] === 0) {
          tempGame.minefield[i][j] = [9, 2];
        }
      }
    }
  }, [currentDifficulty]);

  const showVictory = useCallback((tempGame) => {
    showAllMines(tempGame);
    stopTimer();
  }, [showAllMines, stopTimer]);

  const isMinefieldCleared = useCallback((tempGame) => {
    const minesRemaining = _.reduce(_.map(tempGame.minefield, (row) => {
      return _.filter(row, (col) => (
        col[1] === 0 || col[1] === 2
      )).length
    }), (sum, n) => {
      return sum + n;
    });
    if (currentDifficulty.maxMines === minesRemaining) {
      return true;
    }
    return false;
  }, [currentDifficulty]);

  const clearNeighbours = useCallback((row, col, game) => {
    let currentCell = game.minefield[row][col];
    if (currentCell[1] !== 1 && currentCell[1] !== 2) {
      game.minefield[row][col] = [currentCell[0], 1];
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
      if (currentCell[0] === 9) {
        console.log(game.minefield);
        game.minefield[row][col] = [9, 9];
        game.gameState = 2;
        // Reveal all remaining mines if there is an explosion
        for (let i = 0; i < currentDifficulty.rows; i++) {
          for (let j = 0; j < currentDifficulty.columns; j++) {
            if (game.minefield[i][j][0] === 9 && game.minefield[i][j][1] === 0) {
              game.minefield[i][j] = [9, 1];
            }
          }
        }
        stopTimer();              
      }
    }
    return;
  }, [cellNeighbours, currentDifficulty, stopTimer]);

  const navigateMinefield = useCallback((ev) => {
    const row = ev.target.attributes.getNamedItem('row').value;
    const col = ev.target.attributes.getNamedItem('col').value;
    let tempGame = _.cloneDeep(currentGame);
    if (tempGame.gameState === 2) {
      return;
    }
    if (tempGame.gameState === 0 || tempGame.gameState === 3) { // Not clicked yet or Paused
      tempGame.gameState = 1;
      startTimer();
    }
    if (tempGame.minefield[row][col][0] !== 9 && tempGame.minefield[row][col][1] !== 2) {
      clearNeighbours(row, col, tempGame);
      if (isMinefieldCleared(tempGame)) {
        showVictory(tempGame);
      }
    } else if (tempGame.minefield[row][col][0] === 9) {
      tempGame.minefield[row][col] = [9, 9];
      tempGame.gameState = 2;
      // Reveal all remaining mines if there is an explosion
      for (let i = 0; i < currentDifficulty.rows; i++) {
        for (let j = 0; j < currentDifficulty.columns; j++) {
          if (tempGame.minefield[i][j][0] === 9 && tempGame.minefield[i][j][1] === 0) {
            tempGame.minefield[i][j] = [9, 1];
          }
        }
      }
      stopTimer();
    }
    setCurrentGame(tempGame);
  }, [clearNeighbours, currentDifficulty, currentGame, isMinefieldCleared, showVictory, startTimer, stopTimer]);

  const clearUnflagged = useCallback((ev) => {
    const row = ev.target.attributes.getNamedItem('row').value;
    const col = ev.target.attributes.getNamedItem('col').value;
    let tempGame = _.cloneDeep(currentGame);

    const neighbourhoodMines = tempGame.minefield[row][col][0];
    let markedMines = 0;
    for (let k = 0; k < cellNeighbours.length; k++) {
      const cellNeighbour = cellNeighbours[k];
      const neighbour = [parseInt(row) + parseInt(cellNeighbour[0]), parseInt(col) + parseInt(cellNeighbour[1])];
      if (
        neighbour[0] > -1 &&
        neighbour[0] < currentDifficulty.rows &&
        neighbour[1] > -1 &&
        neighbour[1] < currentDifficulty.columns
      ) {
        if (tempGame.minefield[neighbour[0]][neighbour[1]][1] === 2) {
          markedMines++;
        }
      }
    }
    if (neighbourhoodMines === markedMines) {
      for (let k = 0; k < cellNeighbours.length; k++) {
        const cellNeighbour = cellNeighbours[k];
        const neighbour = [parseInt(row) + parseInt(cellNeighbour[0]), parseInt(col) + parseInt(cellNeighbour[1])];
        if (
          neighbour[0] > -1 &&
          neighbour[0] < currentDifficulty.rows &&
          neighbour[1] > -1 &&
          neighbour[1] < currentDifficulty.columns
        ) {
          if (tempGame.minefield[neighbour[0]][neighbour[1]][1] !== 2) {
            clearNeighbours(neighbour[0], neighbour[1], tempGame);
          }
        }
      }
      if (isMinefieldCleared(tempGame)) {
        showVictory();
      }
    }

    setCurrentGame(tempGame);
  }, [cellNeighbours, clearNeighbours, currentDifficulty, currentGame, isMinefieldCleared, showVictory]);

  const markMine = useCallback((ev) => {
    const row = ev.target.attributes.getNamedItem('row').value;
    const col = ev.target.attributes.getNamedItem('col').value;
    let tempGame = _.cloneDeep(currentGame);
    if (tempGame.gameState === 2) {
      return;
    }
    if (tempGame.gameState === 0 || tempGame.gameState === 3) {
      tempGame.gameState = 1;
      startTimer();
    }
    if (tempGame.minefield[row][col][1] === 0) {
      tempGame.minefield[row][col] = [tempGame.minefield[row][col][0], 2];
    } else if (tempGame.minefield[row][col][1] === 2) {
      tempGame.minefield[row][col] = [tempGame.minefield[row][col][0], 0];
    }

    setCurrentGame(tempGame);
  }, [currentGame, startTimer]);

  const drawMinefield = useCallback(() => {
    return (
      <div
        className={`minefield minefield-${selectedDifficulty.toLowerCase()}`}
      >
        {_.map(currentGame.minefield, (mineRow, rindex) => {
          return _.map(mineRow, (mineCell, cindex) => {
            if (mineCell[1] === 0 || mineCell[1] === 2) { // Unopened / Marked cell
              return (
                <button
                  className={
                    classNames('minecell-button',
                      {
                        'minecell-mine': mineCell[0] === 9 && mineCell[1] === 1,
                        'minecell-flag': mineCell[1] === 2
                      }
                    )
                  }
                  key={`${rindex}${cindex}`}
                  row={rindex}
                  col={cindex}
                  {...minefieldCheckClick}
                />
              );
            }
            if (mineCell[1] === 1) { // Opened cell
              return (
                <div
                  className={
                    classNames('minecell', `minecell-${numberColors[mineCell[0]]}`,
                      {
                        'minecell-mine': mineCell[0] === 9 && mineCell[1] === 1 // Reveal all mines if there is an explosion
                      }
                    )
                  }
                  key={`${rindex}${cindex}`}
                  row={rindex}
                  col={cindex}
                  {...clearedCheckClick}
                >
                  {
                    mineCell[0] === 0 || mineCell[0] === 9
                      ? ''
                      : mineCell[0]
                  }
                </div>
              );
            }
            if (mineCell[1] === 9) { // Mine explosion !!!
              return (
                <div
                  className={classNames('minecell', 'minecell-explode')}
                  key={`${rindex}${cindex}`}
                  row={rindex}
                  col={cindex}
                />
              );
            }
          });
        })}
      </div>
    );
  }, [clearedCheckClick, currentGame.minefield, minefieldCheckClick, numberColors]);

  // const drawIcons = useCallback(() => {
  //   return (
  //     <div className='icon-bar'>
  //       <div>{gameTimer}</div>
  //       <button type='button' onClick={initMinefield}>
  //         New
  //       </button>
  //     </div>
  //   );
  // }, [gameTimer, initMinefield]);

  const goHint = useCallback(() => {}, []);

  const showSettings = useCallback(() => {}, []);

  const showStats = useCallback(() => {}, []);

  const showHelp = useCallback(() => {}, []);

  const renderMinesweeperHeader = useCallback(() => {
		return (
			<div key='onitamaHeader' className="minesweeper-title title-border">
				<table key='onitamaTitleTable' className="minesweeper-title">
					<tbody key='onitamaTitleBody'>
						<tr key='onitamaTitleTRTitle'>
							<td key='onitamaTitleTDTitle' className="title">
								<span>{appTitle}</span>
							</td>
							<td key='onitamaTitleTDIcons' className="title text-right">
								<span key='onitamaTitleHint' className={classNames('material-icons', 'icon icon-hint', 'title-button', 'cursor-pointer', { 'hidden': hintCount === 0 })} onClick={goHint} />
								<span key='onitamaTitleNew' className="material-icons icon icon-replay title-button cursor-pointer" onClick={initMinefield} />
								<span key='onitamaTitleSettings' className="material-icons icon icon-settings title-button cursor-pointer" onClick={showSettings} />
								<span key='onitamaTitleStats' className="material-icons icon icon-bar-chart title-button cursor-pointer" onClick={showStats} />
								<span key='onitamaTitleHelp' className="material-icons icon icon-question title-button cursor-pointer" onClick={showHelp} />
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		);
	}, [goHint, initMinefield, showHelp, showSettings, showStats]);

  const drawGameBoard = useCallback(() => {
    return (
      <div className='game-board'>
        {/* {drawIcons()} */}
        {renderMinesweeperHeader()}
        {gameTimer}
        {drawMinefield()}
      </div>
    );
  }, [drawMinefield, gameTimer, renderMinesweeperHeader]);

  useEffect(() => {
    if (!safeGame) {
      initMinefield();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return drawGameBoard();
}

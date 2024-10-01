'use strict';

const elements = {
  canvas: document.querySelector('#canvas'),
  playButton: document.querySelector('.play-button'),
  settingsSizeGrid: document.querySelector('.settings-size-grid'),
  newGenerationTimeValue: document.querySelector('.new-generation-time-value')
};

const game = {
  loopTimerId: null,
  grid: []
};

const settings = {
  frameSpeed: 100,
  sizeGrid: Number(elements.settingsSizeGrid.value),
  sizeCanvas: Number(elements.canvas.getAttribute('width')),
  sizeCell: null,
  density: 0.8
};

const colors = {
  alive: 0xff000000,
  dead: 0xffffffff
};

const rules = {
  reanimate: 3,
  underPopulation: 1,
  overPopulation: 4
};

const ctx = elements.canvas.getContext('2d');

init();

function init() {
  setGrid(true);
}

function setGrid(isFillMode = false) {
  settings.sizeCell = settings.sizeCanvas / settings.sizeGrid;
  for (let rowIndex = 0; rowIndex < settings.sizeGrid; rowIndex++) {
    game.grid[rowIndex] = [];
    for (let columnIndex = 0; columnIndex < settings.sizeGrid; columnIndex++) {
      game.grid[rowIndex][columnIndex] = isFillMode ? 0 : Number(Math.random() > settings.density);
    }
  }
}

function getNeighbors() {
  const cellNeighbors = [];
  for (let currentRowIndex = 0; currentRowIndex < game.grid.length; currentRowIndex++) {
    cellNeighbors[currentRowIndex] = [];
    const prevRowIndex = (currentRowIndex + settings.sizeGrid - 1) % settings.sizeGrid;
    const nextRowIndex = (currentRowIndex + settings.sizeGrid + 1) % settings.sizeGrid;
    for (let currentColumnIndex = 0; currentColumnIndex < settings.sizeGrid; currentColumnIndex++) {
      const prevColumnIndex = (currentColumnIndex + settings.sizeGrid - 1) % settings.sizeGrid;
      const nextColumnIndex = (currentColumnIndex + settings.sizeGrid + 1) % settings.sizeGrid;
      const cellsAround = [
        game.grid[prevRowIndex][prevColumnIndex],
        game.grid[prevRowIndex][currentColumnIndex],
        game.grid[prevRowIndex][nextColumnIndex],
        game.grid[currentRowIndex][prevColumnIndex],
        game.grid[currentRowIndex][nextColumnIndex],
        game.grid[nextRowIndex][prevColumnIndex],
        game.grid[nextRowIndex][currentColumnIndex],
        game.grid[nextRowIndex][nextColumnIndex]
      ];
      cellNeighbors[currentRowIndex][currentColumnIndex] = cellsAround.reduce((acc, item) => acc + item, 0);
    }
  }
  return cellNeighbors;
}

function frame() {
  const timeStart = performance.now();
  const cellNeighbors = getNeighbors();
  for (let rowIndex = 0; rowIndex < game.grid.length; rowIndex++) {
    for (let columnIndex = 0; columnIndex < game.grid.length; columnIndex++) {
      const cell = game.grid[rowIndex][columnIndex];
      const countNeighbors = cellNeighbors[rowIndex][columnIndex];
      const shouldReanimateCell = cell === 0 && countNeighbors === rules.reanimate;
      const shouldKeepAliveCell =
        cell === 1 && countNeighbors > rules.underPopulation && countNeighbors < rules.overPopulation;
      game.grid[rowIndex][columnIndex] = Number(shouldReanimateCell || shouldKeepAliveCell);
    }
  }
  drawTable();
  const timeEnd = performance.now() - timeStart;
  elements.newGenerationTimeValue.textContent = timeEnd.toFixed(2);
}

function drawTable() {
  const data = ctx.createImageData(settings.sizeCanvas, settings.sizeCanvas);
  const buf = new Uint32Array(data.data.buffer);

  let index = 0;
  for (let y = 0; y < settings.sizeCanvas; y++) {
    for (let x = 0; x < settings.sizeCanvas; x++) {
      buf[index++] =
        game.grid[Math.floor(y / settings.sizeCell)][Math.floor(x / settings.sizeCell)] === 1
          ? colors.alive
          : colors.dead;
    }
  }

  ctx.putImageData(data, 0, 0);
}

function play() {
  if (game.loopTimerId === null) {
    game.loopTimerId = setInterval(frame, settings.frameSpeed);
    elements.playButton.textContent = 'Пауза';
  } else {
    clearInterval(game.loopTimerId);
    game.loopTimerId = null;
    elements.playButton.textContent = 'Старт';
  }
}

function setSize(event) {
  settings.sizeGrid = Number(event.target.value);
  setGrid(true);
}

function addCell(event) {
  const rect = event.target.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const row = Math.floor(y / settings.sizeCell);
  const column = Math.floor(x / settings.sizeCell);
  if (game.grid.length > 0) {
    game.grid[row][column] = 1;
    drawTable();
  }
}

function generateGrid() {
  setGrid();
  drawTable();
}

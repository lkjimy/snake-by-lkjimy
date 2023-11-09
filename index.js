'use strict'

Array.prototype.includesArray = function (foreignArray = []) {
  if (Array.isArray(foreignArray)) {
    for (let i = 0; i < this.length; i++) {
      if (Array.isArray(this[i]) && this[i].length === foreignArray.length) {
        const is = this[i].every((item, index) => {
          return item === foreignArray[index]
        })
        if (is) {
          return true
        }
      }
    }
  }

  return false
}

const state = {
  canvasSize: 500,
  gridSize: 20,
  get blockSize() {
    return this.canvasSize / this.gridSize
  },
  score: 0,
  speed: 300,
  snake: [
    [0, 0],
    [0, 1],
    [0, 2]
  ],
  food: [],
  commandQueue: ['r'],
  timer: undefined,
  gameState: 'start' // 'running', 'paused', 'game-over', 'won'
}

const elements = {
  canvasEl: document.getElementById('canvas'),
  headingEl: document.getElementById('heading'),
  gameUiEl: document.getElementById('game-ui'),
  scoreEl: document.getElementById('score'),
  speedEl: document.getElementById('speed')
}

elements.scoreEl.innerText = `${state.score}`.padStart(3, '0')
elements.speedEl.innerText = `${state.speed}`.padStart(4, '0')
elements.canvasEl.height = state.canvasSize
elements.canvasEl.width = state.canvasSize
const ctx = elements.canvasEl.getContext('2d')

document.addEventListener('keydown', keyboardHandler)

function keyboardHandler(event) {
  if (state.gameState === 'running') {
    if (event.key === 'ArrowUp') {
      if (state.commandQueue.at(-1) !== 'd') {
        state.commandQueue.push('u')
      }
    }
    if (event.key === 'ArrowRight') {
      if (state.commandQueue.at(-1) !== 'l') {
        state.commandQueue.push('r')
      }
    }
    if (event.key === 'ArrowDown') {
      if (state.commandQueue.at(-1) !== 'u') {
        state.commandQueue.push('d')
      }
    }
    if (event.key === 'ArrowLeft') {
      if (state.commandQueue.at(-1) !== 'r') {
        state.commandQueue.push('l')
      }
    }
  }
  if (event.key === 'Enter') {
    if (state.gameState === 'start' || state.gameState === 'game-over') {
      reset()
      startGame()
    } else if (state.gameState === 'running' || state.gameState === 'paused') {
      togglePause()
    }
  }
}

function generatecanvasBg() {
  const canvas = document.createElement('canvas')
  canvas.height = state.canvasSize
  canvas.width = state.canvasSize
  const ctx = canvas.getContext('2d', { alpha: false })

  ctx.globalCompositeOperation = 'destination-under'
  ctx.fillStyle = '#161720'
  ctx.fillRect(0, 0, state.canvasSize, state.canvasSize)
  ctx.strokeStyle = '#1c1e2a'

  for (let index = 1; index < state.gridSize; index++) {
    ctx.beginPath()
    ctx.moveTo(index * state.blockSize, 0)
    ctx.lineTo(index * state.blockSize, state.canvasSize)
    ctx.stroke()
    ctx.closePath()

    ctx.beginPath()
    ctx.moveTo(0, index * state.blockSize)
    ctx.lineTo(state.canvasSize, index * state.blockSize)
    ctx.stroke()
    ctx.closePath()
  }

  return canvas.toDataURL()
}

elements.canvasEl.style.backgroundImage = `url("${generatecanvasBg()}")`

function main() {
  if (state.gameState === 'running') {
    for (let index = 0; index < state.snake.length; index++) {
      renderPos([state.snake[index][0], state.snake[index][1]])
    }
  }

  const head = state.snake.at(-1)
  let newHead = []

  if (state.commandQueue[0] === 'r') {
    newHead = [adjustCoord(head[0]), adjustCoord(head[1] + 1)]
  }
  if (state.commandQueue[0] === 'l') {
    newHead = [adjustCoord(head[0]), adjustCoord(head[1] - 1)]
  }
  if (state.commandQueue[0] === 'u') {
    newHead = [adjustCoord(head[0] - 1), adjustCoord(head[1])]
  }
  if (state.commandQueue[0] === 'd') {
    newHead = [adjustCoord(head[0] + 1), adjustCoord(head[1])]
  }

  if (state.commandQueue.length > 1) {
    state.commandQueue.shift()
  }

  if (state.snake.includesArray(newHead)) {
    endGame()
  }

  const isEating = state.food.includesArray(newHead)

  state.snake.push(newHead)

  if (isEating) {
    state.food = []
    state.score += 1
    updateScore()
  }

  if (!isEating) {
    const tail = state.snake.shift()
    clearPos(tail)
  }

  renderPos([state.snake.at(-1)[0], state.snake.at(-1)[1]])

  if (!state.food.length) {
    state.food = [findRandomClearPos()]
    renderPos([state.food[0][0], state.food[0][1]], '#d94d07')
  }
}

function adjustCoord(value) {
  if (value >= state.gridSize) {
    return value - state.gridSize
  } else if (value < 0) {
    return value + state.gridSize
  } else {
    return value
  }
}

function findRandomClearPos() {
  let pos = [
    Math.round(Math.random() * (state.gridSize - 1)),
    Math.round(Math.random() * (state.gridSize - 1))
  ]

  if (state.snake.includesArray(pos)) {
    pos = findRandomClearPos()
  }

  return pos
}

function renderPos(pos = [0, 0], color = 'white') {
  ctx.fillStyle = color
  ctx.fillRect(
    pos[1] * state.blockSize,
    pos[0] * state.blockSize,
    state.blockSize,
    state.blockSize
  )
}

function clearPos(pos) {
  ctx.clearRect(
    pos[1] * state.blockSize,
    pos[0] * state.blockSize,
    state.blockSize,
    state.blockSize
  )
}

function reset() {
  ctx.clearRect(0, 0, state.canvasSize, state.canvasSize)

  state.score = 0
  state.speed = 300
  state.snake = [
    [0, 0],
    [0, 1],
    [0, 2]
  ]
  state.food = []
  state.commandQueue = ['r']
  state.gameState = 'start'
  state.timer = undefined

  updateScore()
  updateSpeed()
}

function startGame() {
  state.timer = setInterval(main, state.speed)
  state.gameState = 'running'
  elements.headingEl.classList.add('d-none')
}

function endGame() {
  clearInterval(state.timer)
  state.gameState = 'game-over'
}

function togglePause() {
  if (state.gameState === 'running') {
    clearInterval(state.timer)
    state.gameState = 'paused'
  } else {
    state.timer = setInterval(main, state.speed)
    state.gameState = 'running'
  }
}

function updateScore() {
  elements.scoreEl.innerText = `${state.score}`.padStart(3, '0')
}

function updateSpeed() {
  elements.speedEl.innerText = `${state.speed}`.padStart(4, '0')
}
// States of the game
// 1. Before starting the game
// 2. paused mid-game
// 3. end-game, the player lost
// 4. end-game, the player won

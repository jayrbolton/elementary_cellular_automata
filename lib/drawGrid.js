
let canvas = document.createElement('canvas')
let ctx = canvas.getContext('2d')
canvas.id = 'grid-canvas'
canvas.width = window.innerWidth
canvas.height = window.innerHeight * 3
document.body.appendChild(canvas)

// Given a cell pixel size, a complete array of arrays of binary numbers representing the automata, draw the grid of cells using the canvas API
// TODO have a "show more" button at the bottom to render another chunk
// TODO animate rows fading downward
module.exports = (cellWidth, cells) => {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "rgb(100,100,100)"
	let [cWidth, cHeight] = [cellWidth - 1, cellWidth - 1]
	for(let i = 0, len = cells.length; i < len; ++i) {
		let row = cells[i]
		let y = i * cellWidth
		for(let j = 0, len = row.length; j < len; ++j) {
			let cell = row[j]
			let x = j * cellWidth
			if(cell) ctx.fillRect(x, y, cWidth, cHeight)
		}
	}
}


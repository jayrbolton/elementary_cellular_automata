require('./js/d3.v3.min')

var app = require('view-script'),
	utils = require('./js/utils')

app.def("settings", {
	width: 100,
	rules: [0,0,0,1,1,1,1,0],
	seed: 'random',
	color: 'red'
})

app.def('draw', function() {
	var svg = document.querySelector('svg'),
		pad = 2,
		cell_size = svg.offsetWidth / app.settings.width - pad,
		n_rows = Math.floor(svg.offsetHeight / cell_size)

	while(svg.firstChild) svg.removeChild(svg.firstChild)

	if(app.settings.seed === 'random')
		var grid = generate_random(app.settings.width)
	else
		var grid = generate_middle(app.settings.width)

	for(var i = 0; i < n_rows; ++i) {
		draw_row(svg, i, grid[i], cell_size, pad)
		calculate_generation(i + 1, grid, app.settings.rules)
	}
})

app.def('meta_open', true)
app.draw()

function draw_row(svg, row_index, row_data, cell_size, pad) {
	var row = d3.select('svg').append('g')

	var cols = row.selectAll('rect').data(row_data)
		.enter().append('rect')
		.attr('width', cell_size)
		.attr('height', cell_size)
		.attr('y', function() { return row_index * (cell_size + pad) })
		.attr('x', function(_, i) { return i * (cell_size + pad) })
		.attr('data-state', utils.id)

	row
		.attr('opacity', 0)
		.transition()
		.duration(300)
		.delay(function(x,i) { return i * 300})
		.attr('opacity', 1)
}

function generate_random(width) {
	var grid = [[]]
	for(var i = 0; i < width; ++i) grid[0][i] = Math.round(Math.random())
	return grid
}

function generate_middle(width) {
	var grid = [[]]
	for(var i = 0; i < width; ++i) grid[0][i] = 0
	grid[0][Math.floor(width/2)] = 1
	return grid
}

function calculate_generation(row, grid, rules) {
	var prev_row = grid[row-1],
		new_row = grid[row] = []
		width = prev_row.length

	for(var i = 0; i < width; ++i) {
		var top = prev_row[i],
			left = prev_row[utils.mod(i-1, width)],
			right = prev_row[utils.mod(i+1, width)],
			index = parseInt(String(left) + String(top) + String(right), 2)
		new_row.push(app.settings.rules[7-index])
	}
	return grid
}

// Utils

// Meta settings/info

// Convert a decimal number to binary and pad it with zeroes
app.def('dec_to_bin', function(dec) {
	if(isNaN(dec)) dec = 0
	var bin = Number(dec).toString(2).split('')
	// Zero-pad the binary number
	for(var i = 0, len = bin.length; i < 8 - len; ++i)
		bin.unshift('0')
	return bin
})


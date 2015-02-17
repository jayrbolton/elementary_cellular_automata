require('./js/d3.v3.min')

// 128 64 32 16 8 4 2 1
var settings = { width: 100, rules: [0,0,0,1,1,1,1,0], seed: 'random' }

draw_generations()

function draw_generations() {
	var svg = document.querySelector('svg'),
		pad = 2,
		cell_size = svg.offsetWidth / settings.width - pad,
		n_rows = Math.floor(svg.offsetHeight/cell_size)

	if(settings.seed === 'random') var grid = generate_random(settings.width)
	else var grid = generate_middle(settings.width)

	for(var i = 0; i < n_rows; ++i)
		calculate_generation(i+1, grid, settings.rules)
	draw_grid(grid, cell_size, pad)
}

function draw_grid(grid, cell_size, pad) {
	// Rows/generations
	var row = d3.select('svg').html('')
		.selectAll('g')
		.data(grid)
		.enter().append('g')
	
	// Columns/cells
	var cols = row.selectAll('rect')
		.data(id)
		.enter().append('rect')
		.attr('width', cell_size)
		.attr('height', cell_size)
		.attr('y', function(_, _, j) { return j * (cell_size + pad) })
		.attr('x', function(_, i) { return i * (cell_size + pad) })
		.attr('data-state', id)

	// Animate each row
	row
		.attr('opacity', 0)
		.transition()
		.duration(300)
		.delay(function(x,i) { return i * 300})
		.attr('opacity', 1)
}

function fast_forward() {
	var row = d3.select('svg').selectAll('g').transition().delay(0).duration(0).attr('opacity', 1)
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
			left = prev_row[mod(i-1, width)],
			right = prev_row[mod(i+1, width)],
			index = parseInt(String(left) + String(top) + String(right), 2)
		new_row.push(rules[7-index])
	}
	return grid
}

// Utils

function mod(dividend, divisor) { return ((dividend % divisor) + divisor) % divisor; }
function id(x){return x}


// Meta settings/info

var meta_el = document.querySelector('.meta')

meta_el.querySelector('.meta-open').onclick = function() {
	if(meta_el.className.indexOf('is-open') === -1) meta_el.className = 'meta is-open'
	else meta_el.className = 'meta'
}

// UI Events

meta_el.querySelector('.meta-play').onclick = draw_generations

meta_el.querySelector('.meta-fastForward').onclick = fast_forward

meta_el.querySelector('.meta-settings-ruleNo').onkeyup = function(ev) {
	var binaries = Number(this.value).toString(2).split('')
	// Zero-pad the binary number
	for(var i = 0, len = binaries.length; i < 8 - len; ++i) binaries.unshift('0')
	settings.rules = binaries
	set_cell_states(settings.rules)
}

meta_el.querySelector('.meta-seed-random').onchange = function(ev) {
	if(this.checked) settings.seed = 'random'
}

meta_el.querySelector('.meta-seed-middle').onchange = function(ev) {
	if(this.checked) settings.seed = 'middle'
}

meta_el.querySelector('.meta-settings-width').onchange = function(ev) {
	settings.width = Number(this.value)
}

var cell_states = meta_el.querySelectorAll('.rules-newStates .cell')

function set_cell_states(rules) {
	[].forEach.call(cell_states, function(el, i) {
		el.setAttribute('data-state', rules[i])
	})
}

set_cell_states(settings.rules)

function set_rule_decimal(rules) {
	meta_el.querySelector('.meta-settings-ruleNo').value = parseInt(rules.join(''), 2)
}

[].forEach.call(cell_states, function(el) {
	el.onclick = function(ev) {
		ev.preventDefault()
		var i = Number(this.getAttribute('data-i'))
		settings.rules[i] = settings.rules[i] ? 0 : 1
		set_cell_states(settings.rules)
		set_rule_decimal(settings.rules)
	}
})


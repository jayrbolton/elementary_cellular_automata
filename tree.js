// The application tree, encapsulating the sidepanel and all the controls.
// For the grid of cells, see grid.js

import {h, partial, flyd} from '/home/big/j/code/vvvview/index.es6.js'
const R = require('ramda')


var streams = {
	toggleMetaPanel: flyd.stream(),
	setRule: flyd.stream(),
	setWidth: flyd.stream(),
	selectSeed: flyd.stream(),
	refreshGrid: flyd.stream(),
	shortcutRule: flyd.stream()
}
const shortcutRuleScoped = settings => ev => streams.shortcutRule(settings)

const root = state =>
	h('div.wrapper', [
		// h('div.grid', partial(grid, state.cellWidth, state.cells)),
		h('div.meta', {className: state.metaOpen ? 'is-open' : ''}, [ 
			h('div.meta-btn.meta-open', {onclick: streams.toggleMetaPanel}, [
				h('span.meta-open-gear', h('i.fa.fa-cog')),
				h('div.meta-open-close', h('i.fa.fa-times')),
			]),
			h('div.meta-btn.meta-play', {onclick: streams.refreshGrid}, [
				h('i.fa.fa-refresh', {className: state.newSetting && 'has-newSetting'})
			]),
			h('h1', 'Elementary Cellular Automata'),
			partial(settingsForm, state),
			partial(explanation)
		])
	])

module.exports = {
	root: root,
	streams
}

const settingsForm = state =>
	h('form.meta-settings', [
		h('div.field--inline', [
			'Rule # ',
			h('input.meta-settings-ruleNo', { maxlength: 3, type: 'number', max: 255, value: state.decRule, onchange: streams.setRule, onkeyup: streams.setRule }),
		]),
		h('div.field--inline', [
			'Row width ',
			h('input.meta-settings-width', {maxlength: 3, type: 'number', value: state.rowWidth, onchange: streams.setWidth})
		]),
		rulesTable(state),
		seedSetting(state)
	])

const seedSetting = (state) =>
	h('div.field.field--seed', [
		h('label', 'Seed initial row with '),
		h('span', [
			h('input.meta-seed-random#seed-random', {
				type: 'radio',
				name: 'seed',
				value: 'random',
				onchange: streams.selectSeed,
				checked: state.seed === 'random'
			}),
		h('label', {htmlFor: 'seed-random'}, ' Random')
		]),
		h('span', [
			h('input#seed-middle.meta-seed-middle', {
				type: 'radio',
				name: 'seed',
				value: 'middle',
				onchange: streams.selectSeed,
				checked: state.seed === 'middle'
			}),
			h('label', {htmlFor: 'seed-middle'}, ' Middle Black')
		]),
		h('span', [
			h('input#seed-middle--white.meta-seed-middle', {
				type: 'radio',
				name: 'seed',
				value: 'middleWhite',
				onchange: streams.selectSeed,
				checked: state.seed === 'middleWhite'
			}),
			h('label', {htmlFor: 'seed-middle--white'}, ' Middle White')
		])
	])

const ruleSeeds = [[0,0,0], [0,0,1], [0,1,0], [0,1,1], [1,0,0], [1,0,1], [1,1,0], [1,1,1]]

const rulesTable = state => {
	var mapIndex = R.addIndex(R.map)
	var rows       = mapIndex(ruleRow, ruleSeeds)
	var states     = mapIndex(ruleState, state.rule)
	var arrows     = R.times(()=> h('td', {innerHTML: "&#8595;"}), 8)
	return h('table.rules', h('tbody', [
		h('tr.rules-patterns', rows),
		h('tr.rules-arrows', arrows),
		h('tr.rules-newStates', states)
	]))
}

// Show a single table row for the rules visualization
const ruleRow = (triplet, index) =>
	h('td.rules-patterns-cells.rules-' + index, [
		h('div.cell', {className: triplet[0] && 'is-active'}),
		h('div.cell', {className: triplet[1] && 'is-active'}),
		h('div.cell', {className: triplet[2] && 'is-active'}),
	])

const ruleState = (bin, index) =>
	h('td', h('div.cell', { className: bin ? 'is-active' : '' }))

const explanation = () =>
	h('div.explanation', [
		h('p', [
			h('strong', 'Elementary Cellular Automata'),
			" are a very simple kind of simulation using binary cells. Each row is a generation, advancing through time from top to bottom."
		]),
		h('p', [
			"For more information, see ",
			h('a', {href: "http://mathworld.wolfram.com/ElementaryCellularAutomaton.html", target: "_blank"}, 'Wolfram MathWorld'),
			" and ",
			h('a', {href: "https://en.wikipedia.org/wiki/Elementary_cellular_automaton", target: "_blank"}, 'Wikipedia.'),
		]),
		h('p', [
			"Written by ",
			h('a', {target: '_blank', href: 'http://jayrbolton.com'}, 'Jay R Bolton'),
			' using ' ,
			h('a', {target: '_blank', href: 'https://github.com/jayrbolton/vvvview'}, 'vvvview'),
			". See the ",
			h('a', {target: '_blank', href: 'https://github.com/jayrbolton/elementary_cellular_automata'}, 'Github repo.')
		]),
		h('p', "Interesting rules:"),
		h('ul', [
			h('li', [
				h('a', {href: '#', onclick: shortcutRuleScoped({decRule: 110, seed: 'random'})}, '110: Turing complete'),
				' - ',
				h('a', {target: '_blank', href: 'https://en.wikipedia.org/wiki/Rule_110'}, '(wikipedia page)')
			]),
			h('li', [
				h('a', {href: '#', onclick: shortcutRuleScoped({decRule: 90, seed: 'random'})}, '30: Truly chaotic'),
				' - ',
				h('a', {target: '_blank', href: 'https://en.wikipedia.org/wiki/Rule_30'}, '(wikipedia page)')
			]),
			h('li', [
				h('a', {href: '#', onclick: shortcutRuleScoped({decRule: 90, seed: 'middle'})}, '90: The Sierpinski Triangle'),
				' - ',
				h('a', {target: '_blank', href: 'https://en.wikipedia.org/wiki/Rule_90'}, '(wikipedia page)')
			]),
			h('li', h('a', {href: '#', onclick: shortcutRuleScoped({decRule: 57, seed: 'middle'})}, '57: Pretty')),
			h('li', [
				h('a', {href: '#', onclick: shortcutRuleScoped({decRule: 184, seed: 'random'})}, '184: Has modeled traffic, particles, ballistics...'),
				' - ',
				h('a', {target: '_blank', href: 'https://en.wikipedia.org/wiki/Rule_184'}, '(wikipedia page)')
			]),
		])
	])


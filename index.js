'use strict'
import R from 'ramda'
import {flyd, combineState, createView} from '/home/big/j/code/vvvview/index.es6.js'

import computeCA from './computeCA'
import {root, streams} from './tree'

import decToBin from './lib/dec-to-bin'
import drawGrid from './lib/drawGrid'

window.flyd = flyd
window.R = R

const cache = localStorage.getItem('eca.state')
var defaults = {}

const getCellWidth = width => window.innerWidth / (width+1)
const getTotalRows = cellWidth => (window.innerHeight * 3) / cellWidth

if(cache) {
	defaults = JSON.parse(cache)
} else {
	let rowWidth = 200
	let cellWidth = getCellWidth(rowWidth)
	let totalRows = getTotalRows(cellWidth)
	let rule = [0,0,0,1,1,1,1,0]
	defaults = cache ? JSON.parse(cache) : {
		rule: rule,
		decRule: 30,
		color: 'red',
		metaOpen: true,
		rowWidth: rowWidth,
		seed: 'middle',
		cellWidth: cellWidth,
		totalRows: totalRows,
		cells: computeCA(totalRows, getInitialRow('middle', rowWidth), rule)
	}
}
drawGrid(defaults.cellWidth, defaults.cells)

// eca = elementary cellular automata
var eca = createView(document.body, root, defaults)

// sync settings to localStorage
eca.sync = state => localStorage.setItem('eca.state', JSON.stringify(state))

//// streams

combineState(state => {
	state.newSetting = true
	return state
}, eca, [streams.setRule, streams.setWidth, streams.selectSeed])

// set a rule (in decimal)
var rules = flyd.map(getVal, streams.setRule)
combineState((state, decimal) => {
	if(decimal === undefined || decimal > 255) return state
	state.rule = decToBin(decimal)
	state.decRule = decimal
	return state
}, eca, [rules])

// refresh rules into the grid
combineState(refresh, eca, [streams.refreshGrid])

// open/close the meta panel
combineState(state => {
	state.metaOpen = !state.metaOpen
	return state
}, eca, [streams.toggleMetaPanel])

// set the initial seed row
combineState((state, ev) => {
	state.seed = getVal(ev)
	return state
}, eca, [streams.selectSeed])

combineState((state, ev) => {
	let width = Number(getVal(ev))
	if(width > 1000) return state
	state.rowWidth = width
	state.cellWidth = getCellWidth(width)
	state.totalRows = getTotalRows(state.cellWidth)
	return state
}, eca, [streams.setWidth])

combineState((state, settings) => {
	for(var key in settings) {
		state[key] = settings[key]
		if(key === 'decRule') state.rule = decToBin(settings[key])
	}
	return refresh(state)
}, eca, [streams.shortcutRule])

function refresh(state) {
	state.cells = computeCA(state.totalRows, getInitialRow(eca.state.seed, eca.state.rowWidth), eca.state.rule)
	state.newSetting = false
	drawGrid(state.cellWidth, state.cells)
	return state
}

window.eca = eca

// Generate an initial random row
const initialRandom = (width) =>
	[R.times(randBin, width)]

// random binary num
function randBin() {return Math.round(Math.random())}

// Generate an initial row with only a black cell in the middle
function getInitialRow(type, width) {
	if(type === 'middle') {
		return R.update(Math.floor(width/2), 1, R.repeat(0, width))
	} else if(type === 'random') {
		return R.map(randBin, R.repeat(0, width))
	} else if(type === 'middleWhite') {
		return R.update(Math.floor(width/2), 0, R.repeat(1, width))
	}
}

function getVal(ev){return ev.target.value}


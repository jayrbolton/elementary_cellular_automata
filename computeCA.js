// Compute n generations of cellular automata for a given rule
// Represent the generations as an array of arrays of 1's and 0's
const R = require('ramda')

const compute = (limit, initialRow, rule) =>
	R.head(iterate(R.apply(computeRow))([[initialRow], rule])(limit))

module.exports = compute

// Computing rules is a simple lookup in the rule array!
// For example:
// Given a rule like [0,0,1,1,1,1,0]
// And on each iteration, given a triplet of 0,0,1
// Convert the triplet to binary: parseInt("001", 2) -> 1
// rule[1] -> 0

const computeRow = (history, rule) => {
	var prev = R.last(history)
	var width = prev.length
	var newRow = R.addIndex(R.map)((top, i) => {
		var left = prev[mod(i-1, width)]
		var right = prev[mod(i+1, width)]
		return rule[ 7 - parseInt(String(left) + String(top) + String(right), 2) ]
	}, prev)
	history.push(newRow)
	return [history, rule, width]
}

// Iterate similarly to haskell (but with a limit). Why doesn't ramda have this?
const iterate = fn => acc => limit => {
	for(var i = 0; i < limit; ++i) acc = fn(acc)
	return acc
}

// Modulus that works with negative numbers
const mod = (dividend, divisor) =>
	((dividend % divisor) + divisor) % divisor


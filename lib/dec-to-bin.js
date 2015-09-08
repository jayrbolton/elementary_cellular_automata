import padZeros from './pad-zeros'

// Convert a decimal to a binary number represented as an array of 1's and 0's
module.exports = dec =>
	padZeros(8, parseInt(dec).toString(2).split('').map(Number))

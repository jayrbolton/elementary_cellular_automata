var utils = {}

module.exports = utils

// Modulus that works with negative numbers
utils.mod = function(dividend, divisor) { return ((dividend % divisor) + divisor) % divisor }

utils.id = function(x) {return x}

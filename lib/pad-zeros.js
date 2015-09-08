
// Pad the beginning of the given array with the given amount of zeros
module.exports = (len, arr) =>
	R.concat(R.repeat(0, len - arr.length), arr)

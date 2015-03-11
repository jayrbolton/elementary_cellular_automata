// Given a view s-expr, return all the keywords
// eg. "(add 1 (incr x))" -> ["add", "incr", "x"]

module.exports = get_keys
function get_keys(expr) {
	return expr
		.replace(/([\(\)])|(\d+(\.\d+)?)|('.+?')|(".+?")/g,'')
		.replace(/  +/, ' ')
		.trim().split(" ")
}

window.get_keys = get_keys

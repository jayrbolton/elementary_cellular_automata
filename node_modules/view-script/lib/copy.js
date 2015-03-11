// mutating object copy utilities

var copy = module.exports = {}

copy.shallow = function(from, to) {
	to = to || {}
	for(var key in from) to[key] = from[key]
	return to
}

copy.deep = function(from, to) {
	to = to || {}
	var stack = [{from: from, to: to}]
	while(stack.length) {
		var current = stack.pop()
		for(var key in current.from) {
			if(current.from[key] && current.from[key].constructor === Object) {
				if(!current.to[key] || current.to[key].constructor !== Object)
					current.to[key] = current.from[key]
				stack.push({from: current.from[key], to: current.to[key]})
			}
			else
				current.to[key] = current.from[key]
		}
	}
	return to
}


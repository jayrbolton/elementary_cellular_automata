// Return all the flat key names for an object
// eg: {a: 1, b: {c: 2, {d: 1}}, e: [{q: 'q'}, {q: 'q'}]} // -> ['a', 'b', 'b.c', 'b.c.d', 'e']
// This is useful for binding nested keys 'a.b.c' to change events

module.exports = flatten_keys

function flatten_keys(obj) {
	var stack = [[obj, '']], // a pair of current object level and current parent key name
		keys = []
	while(stack.length) {
		var next = stack.pop(), currentObj = next[0], parentKey = next[1], nestedKey
		for(var key in currentObj) {
			nestedKey = key
			if(parentKey.length) nestedKey = parentKey + '.' + nestedKey
			keys.push(nestedKey)
			if(currentObj[key] && currentObj[key].constructor === Object)
				stack.push([currentObj[key], nestedKey])
		}
	}
	return keys
}

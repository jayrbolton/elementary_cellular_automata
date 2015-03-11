// Traverse a DOM tree and apply functions to each node
// You can bail the traversal early from within the same node by returning
// false on the enter function. It'll bail on the currrent node's parent node's
// evaluation of all its children.

module.exports = each_node

function each_node(node, fn) {
	var stack = [node], level_width = 1
	while(stack.length) {
		var current = stack.pop()
		--level_width

		if(current.nodeType !== 3) { // skip text nodes
			if(fn(current)) {
				level_width = current.childNodes.length
				for(var i = current.childNodes.length-1; i >= 0; --i) // Eval top down
					stack.push(current.childNodes[i])
			} else {
				stack = stack.slice(0, stack.length-level_width)
			}
		}
	}
}

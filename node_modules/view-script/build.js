(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var each_node = require('./lib/each_node'),
	copy = require('./lib/copy'),
	iter = require('./lib/iter'),
	parse = require('./lib/parse'),
	flatten_keys = require('./lib/flatten_keys'),
	unflatten_keys = require('./lib/unflatten_keys'),
	evaluate = require('./lib/evaluate'),
	get_keys = require('./lib/get_keys'),
	prev_open_tag = require('./lib/prev_open_tag')

var app = module.exports = { _bindings: {}, _scopes: {}}

app.view = function(expr) { return evaluate(expr, this) }

app.def = function() {
	var self = this
	// Set a key to a value
	if(arguments.length === 2) var obj = unflatten_keys(arguments[0], arguments[1])
	else var obj = arguments[0]

	for(var key in obj) {
		if(obj[key] && obj[key].constructor === Object && self[key] && self[key].constructor === Object) {
			if(self.hasOwnProperty(key))
				copy.deep(obj[key], self[key])
			else // Make a complete copy so we do not affect objects in parents and siblings
				self[key] = copy.deep(obj[key], copy.deep(self[key]))
		} else
			self[key] = obj[key]
	}

	iter.each(flatten_keys(obj), function(key) {
		if(self._bindings[key])
			iter.each(self._bindings[key], function(n) {
				var result = eval_comment(self, n)
			})
	})
	return self
}

app.def('set', function(key, val) { this.def(key, val) })

app.def('set_at', function(arr_key, index, val) {
	var arr = this.view(arr_key)
	copy.deep(val, arr[index])
	this.def(arr_key, arr)
})

app.def_lazy = function(key,fn) { this.def(key, {_lazy: fn}) }

app.render = function(node) {
	var self = this
	each_node(node, function(n) {
		var cont = true
		if(n.nodeType === 8 && n.textContent[0] === '=') { // nodeType 8 == comment
			var keys = get_keys(n.textContent.slice(1))
			iter.each(keys, function(k) {
				self._bindings[k] = self._bindings[k] || []
				if(self._bindings[k].indexOf(n) === -1) self._bindings[k].push(n)
			})
			var result = eval_comment(self, n)
			if(result && result.skip) cont = false
		}
		return cont
	})
	return self
}

function eval_comment(view, comment) {
	var prev_node = view.node, prev_comment = view.comment
	view.comment = comment
	view.node = prev_open_tag(comment)
	var result = evaluate(comment.textContent.slice(1), view)
	view.node = prev_node
	view.comment = prev_comment
	return result
}

app.clear_bindings = function() {this._bindings = {}; return this}

// Inherit a view & namespace the parent! TODO
app.scope = function(scope_name) {
	if(scope_name && this.comment && this.node) {
		var existing = this._scopes[scope_name]
		if(existing) existing.push(this.node)
		else this._scopes[scope_name] = [this.node]
		// We only need to save the scope once per pageload
		this.comment.parentNode.removeChild(this.comment)
		delete this._bindings['scope']
		return
	}

	var child_view = Object.create(this)
	child_view.parent = this
	child_view._bindings = {}

	if(scope_name && this._scopes[scope_name])
		iter.each(this._scopes[scope_name], function(el) { child_view.render(el) })
	else
		child_view._bindings = Object.create(this._bindings, {})

	return child_view
}

// Default view helpers

app.def('no_op', function() {})
app.def('id', function(x) {return x})

app.def("put", function(x) {
	if(x === undefined || x === null || x === NaN) return
	var interp = this.comment.nextSibling
	if(!interp || interp.className !== 'deja-put') {
		interp = document.createElement('span')
		interp.className = 'deja-put'
		this.comment.parentNode.insertBefore(interp, this.comment.nextSibling)
	}
	interp.innerHTML = String(x)
	return x
})

// Array funcs

app.def('concat', function(arr1_key, arr2) {
	var arr1 = this.view(arr1_key)
	this.def(arr1_key, arr1.concat(arr2))
	return arr1
})

app.def('push', function(val, arr_key) {
	var arr = this.view(arr_key)
	if(!arr.length) arr = []
	arr.push(val)
	this.def(arr_key, arr)
})

app.def('pop', function(arr_key) {
	var arr = this.view(arr_key), val = arr.pop()
	this.def(arr_key, arr)
	return val
})

app.def('show_if', function(pred) {
	if(pred) this.node.style.display = ''
	else this.node.style.display = 'none'
})

app.def('hide_if', function(pred) {
	if(pred) this.node.style.display = 'none'
	else this.node.style.display = ''
})

app.def('repeat', function(arr) {
	var self = this
	self.node.style.display = 'none'
	self.node.removeChild(self.comment)

	if(self.node.parentNode.className.indexOf('deja-repeat') !== -1 || self.node.parentNode.children.length === 1) {
		var wrapper = self.node.parentNode
		wrapper.className += ' deja-repeat'
		while(wrapper.children.length > 1)
			wrapper.removeChild(wrapper.lastChild)
	} else {
		var wrapper = self.node.nextSibling
		if(!wrapper || wrapper.className !== 'deja-repeat') {
			wrapper = document.createElement('span')
			wrapper.className = 'deja-repeat'
			self.node.parentNode.insertBefore(wrapper, self.node.nextSibling)
		}

		else while(wrapper.firstChild)
			wrapper.removeChild(wrapper.firstChild)
	}

	iter.each(arr, function(x, i) {
		var cloned = self.node.cloneNode(true)
		cloned.style.display = ''
		var child = self.scope().clear_bindings().def('i', i).def('each', x).def(x).render(cloned)
		wrapper.appendChild(cloned)
	})

	self.node.insertBefore(self.comment, self.node.firstChild)
	return {skip: true}
})

app.def('add', function() { return sum(arguments) })
app.def('sub', function() { return diff(arguments) })
app.def('mul', function() { return prod(arguments) })
app.def('divide', function(x,y) { return x/y })

app.def('incr', function(key) {
	var val = Number(this.view(key))
	if(val === undefined) return
	this.def(key, val + 1)
	return this.view(key)
})

app.def('decr', function(key) {
	var val = Number(this.view(key))
	if(val === undefined) return
	this.def(key, val - 1)
	return val - 1
})

app.def('add_class', function(class_name) { add_class(this.node, class_name) })
app.def('remove_class', function(class_name) { remove_class(this.node, class_name) })

app.def('toggle_class', function(class_name) {
	if(this.node.className.indexOf(class_name) !== -1) remove_class(this.node, class_name)
	else add_class(this.node, class_name)
})

app.def('class_if', function(pred, class_name) {
	if(pred) add_class(this.node, class_name)
	else remove_class(this.node, class_name)
})

app.def('cat', function() {
	return iter.fold(arguments, '', function(str, term) { return str += term })
})

app.def_lazy('on', function(events) {
	if(!this.node) return
	var self = this, args = arguments, node = self.node, comment = self.comment

	events = this.view(events)
	if(!(events instanceof Array)) events = [events]

	iter.each(events, function(ev) {
		self.node['on' + ev] = function(e) {
			e.preventDefault()
			self.node = node
			self.comment = comment
			self.view(iter.slice(args, 1))
		}
	})
})

app.def('empty',  function(arr) { return !arr || !arr.length })
app.def('length', function(arr) { return (arr ? arr.length : 0) })
app.def('tail', function(arr) { return arr.slice(1) })
app.def('init', function(arr) { return arr.slice(0, arr.length-1) })
app.def('head', function(arr) {return arr[0]})
app.def('attr', function(key, val) { this.node.setAttribute(key, val) })
app.def('get_value', function() { return this.node.value })
app.def('reload', function() { window.location.reload() })
app.def('redirect', function(url) { window.location.href = url })
app.def('stringify', function(obj) { return JSON.stringify(obj) })
app.def('form_data', function() { return new FormData(this.node) })
app.def('log', function() { console.log.apply(console, arguments) })

app.def('set_value', function(val) {
	if(val === undefined || val === null) this.node.value = ''
	else this.node.value = val
})

app.def('form_object', function() {
	var result = {}
	each_node(this.node, function(n) {
		if(n.nodeType === 1 && (n.nodeName ===  'INPUT' || n.nodeName === 'TEXTAREA' || n.nodeName === 'SELECT') && n.hasAttribute('name')) {
			var name = n.getAttribute('name'), existing = result[n.getAttribute('name')]
			if(existing === undefined)
				result[name] = n.value
			else {
				if(result[name] instanceof Array) result[name].push(n.value)
				else result[name] = [result[name], n.value]
			}
		}
		return true
	})
	return result
})

app.def('toggle', function(key) {
	var existing = this.view(key)
	if(existing === undefined) {
		this.def(key, arguments[1])
		return
	}

	for(var i = 1; i < arguments.length; ++i) {
		if(existing === arguments[i]) {
			var index = (i+1) % arguments.length
			if(index === 0) index = 1
			this.def(key, arguments[index])
			return
		}
	}

	this.def(key, arguments[1])
})

app.def('css', function(style_rule, val) { this.node.style[style_rule] = val })

app.def_lazy('if', function(predicate, then_expr, else_expr) {
	if(this.view(predicate)) return this.view(then_expr)
	else return this.view(else_expr)
})

app.def_lazy('delay', function(ms, expr) {
	var self = this
	delay(self.view(ms), function() {self.view(expr)})
})

app.def('select_option', function(val) {
	var option = this.node.querySelector("option[value='" + val + "']")
	if(option) option.setAttribute('selected', 'selected')
})

app.def('not',  function(val) {return !val})
app.def('eq', function() { return compare(function(x, y) { return x == y }, arguments, this) })
app.def('<', function() { return compare(function(x, y) { return x < y }, arguments, this) })
app.def('>', function() { return compare(function(x, y) { return x > y }, arguments, this) })
app.def('<=', function() { return compare(function(x, y) { return x <= y }, arguments, this) })
app.def('>=', function() { return compare(function(x, y) { return x >= y }, arguments, this) })

app.def('all', function() {
	for(var i = 0; i < arguments.length; ++i) if(!arguments[i]) return false
	return arguments[arguments.length-1]
})

app.def('any', function() {
	for(var i = 0; i < arguments.length; ++i) if(arguments[i]) return arguments[i]
	return arguments[arguments.length-1]
})

app.def('obj_to_url_params', function(obj) {
	var str = ''
	for(var key in obj) str += '&' + key + '=' + obj[key]
	str = str.replace(/^&/, '?')
	return str
})

app.render(document.body)

// Utilities

function sum(ns) {return iter.fold(ns, 0, function(sum, n) {return sum+n})}

function diff(ns) {return iter.fold(ns, function(diff, n) {return diff-n})}

function prod(ns) {return iter.fold(ns, 1, function(prod, n) {return prod*n})}

function add_class(node, class_name) { if(node.className.indexOf(class_name) === -1) node.className += ' ' + class_name }

function remove_class(node, class_name) { node.className = node.className.replace(class_name, '') }

// N-ary general purpose comparator func
function compare(fn, args) {
	var last = args[0]
	for(var i = 1; i < args.length; ++i) {
		if(!fn(last, args[i])) return false
		last = args[i]
	} return true
}

var delay = (function() {
	var timer = 0
	return function(ms, callback) {
		clearTimeout(timer)
		timer = setTimeout(callback, ms)
	}
})()

},{"./lib/copy":2,"./lib/each_node":4,"./lib/evaluate":6,"./lib/flatten_keys":7,"./lib/get_keys":8,"./lib/iter":9,"./lib/parse":10,"./lib/prev_open_tag":11,"./lib/unflatten_keys":12}],2:[function(require,module,exports){
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


},{}],3:[function(require,module,exports){
// Get a possibly nested set of keys 
// eg. deep_get('x', {x: 1}) -> 1
// eg. deep_get('x.y', {x: {y: 1}}) -> 1
// eg. deep_get('x.y', {'x.y': 1}) -> 1
//
// Indexes on arrays
// eg. deep_get('xs.1', {xs: ['a','b','c']}) -> 'b'
//
// Use 'this' for an identity property, useful for self-referencing inside
// scopes
// eg. deep_get('this', 1) -> 1
// eg. deep_get('x.this', {x: 1}) -> 1
//
// You can do a shadowing scope type of deal by passing in a third param, your scope
// eg. deep_get('x', {y: 1, thing: {x: 9}}, 'thing') -> 1
// eg. deep_get('x', {x: 9, thing: {y: 1}}, 'thing') -> 9
// eg. deep_get('this', {x: 9, thing: {y: 1}}, 'thing') -> {y: 1}

module.exports = deep_get

function deep_get(keys, obj) {
	if(obj[keys]) return obj[keys]
	var current = obj, keys = keys.split('.')

	for(var i = 0; i < keys.length; ++i) {
		if(current === undefined) return
		if(!isNaN(keys[i])) keys[i] = Number(keys[i])
		if(current[keys[i]] !== undefined) current = current[keys[i]]
		else return
	}
	return current
}

},{}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){

module.exports = err

function err(msg, comment) {
	console.log("[deja-view] Error:", msg, "at", comment)
}


},{}],6:[function(require,module,exports){
var deep_get = require('./deep_get'),
	parse = require('./parse'),
	iter = require('./iter'),
	err = require('./err')

module.exports = evaluate


function evaluate(expr, view) {
	if(expr === undefined) return
	var stack = expr instanceof Array ? expr.reverse() : [expr], results = []

	while(stack.length) {
		var call = stack.pop()

		if(call === undefined)
			return err("Unable to evaluate " + expr, view.comment)

		if(typeof call === 'string')
			handle_parse(call, stack, results, view)

		else if(call.hasOwnProperty('val'))
			results.push(call.val)

		else if(call.key !== undefined)
			retrieve_key(call, results, stack, view)

		else if(call.apply) apply_fn(call, results, view)

		else err("Unable to evaluate " + expr, view.comment)
	}

	if(results.length === 0) return undefined
	if(results.length === 1) return results[0]
	else return results
}


function retrieve_key(call, results, stack, view) {
	var val = deep_get(call.key, view)

	// If we're on a lazy function, push all the un-evaluated terms from the stack
	// into the results and apply the function to those
	if(val && val._lazy && typeof val._lazy === 'function') {
		var param_len = call.len - call.pos - 1
		for(var i = 0; i < param_len; ++i) {
			var param = stack.pop()
			if(param.key) {
				param.len = stack.length-1
				param.pos = i
			}
			results.push(param)
		}
		stack.push({apply: val._lazy, param_len: param_len, key_name: call.key})
	}

	// Evaluate each of the arguments to the function before applying it
	else if(typeof val === 'function') {
		var param_len = call.len - call.pos - 1
		stack.splice(stack.length - param_len, 0, {
			apply: val, param_len: call.len - call.pos - 1, key_name: call.key
		})
	}

	else if(val === undefined && call.first)
		stack.splice(0, stack.length)

	else results.push(val)
}


function apply_fn(call, results, view) {
	if(call.param_len !== undefined)
		var args = results.splice(results.length - call.param_len, call.param_len)
	else args = results.splice(0)

	if(view.parent && call.key_name.indexOf("parent"))
		var view_apply = view.parent
	else
		var view_apply = view

	results.push(call.apply.apply(view, args))
}


function handle_parse(expr, stack, results, view) {
	var sub_exprs = parse(expr, view.comment)

	sub_exprs[0].first = true

	for(var i = sub_exprs.length-1; i >= 0; --i) {
		if(sub_exprs[i].key) {
			sub_exprs[i].len = sub_exprs.length
			sub_exprs[i].pos = i
		}
		stack.push(sub_exprs[i])
	}
}


},{"./deep_get":3,"./err":5,"./iter":9,"./parse":10}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
// Very simple & tiny browser-compatible map/fold/each/filter without the extras

var iter = module.exports = {}

iter.each = function(arr, fn) {
	if(!arr) return
	for(var i = 0; i < arr.length; ++i)
		fn(arr[i], i)
}

iter.map = function(arr, fn) {
	if(!arr) return []
	var result = []
	for(var i = 0; i < arr.length; ++i)
		result.push(fn(arr[i], i))
	return result
}

iter.fold = function(arr, x, y) {
	if(!arr) return init

	if(!y) var fn = x, init = arr[0], i = 1
	else   var fn = y, init = x,      i = 0

	var result = init
	for(var len = arr.length; i < len; ++i)
		result = fn(result, arr[i], i)
	return result
}

iter.filter = function(arr, pred) {
	if(!arr) return []
	var result = []
	for(var i = 0; i < arr.length; ++i)
		if(pred(arr[i], i)) result.push(arr[i])
	return result
}

iter.slice = function(arr, i) {
	var result = []
	for(var len = arr.length; i < len; ++i) result.push(arr[i])
	return result
}

},{}],10:[function(require,module,exports){
// Convert a string expression into an array that evaluate() can use
// eg. "(add 1 (fn (decr x)))"  ->  ["add", 1, "(fn (decr x))"]

// Due to the evaluator's laziness, this is kind of a weird combination of a
// lexer/parser. We only lex/parse the very top level of the expression and
// pass in any sub-expressions unparsed.

// This parser is designed like a finite state machine 

// This is a flat O(n) where n is the length in characters of the expression

module.exports = parse


function parse(expr, node) {
	if(expr === undefined) return []
	expr = expr.trim()
	
	var pos = 0, matches = []

	while(pos < expr.length) {

		// Eat whitespace and extra close parens
		if(expr[pos].match(/[\s)]/))
			++pos

		else {

			if(expr[pos].match(/["']/)) {
				var lookahead = find_delimiter(pos, expr, expr[pos]) + 1
				matches.push({val: expr.slice(pos + 1, lookahead - 1)})
			}

			else if(expr[pos] === '(') {
				var lookahead = find_scope(pos, expr)
				matches.push(expr.slice(pos + 1, lookahead - 1))
			}

			else {
				var lookahead = find_delimiter(pos, expr, /[\$\)\(\[\]" ]/),
					word = expr.slice(pos, lookahead)

				if(word === 'true' || word === 'false') matches.push({val: word === 'true'})
				else if(word === 'null') matches.push({val: null})
				else if(word === 'undefined') matches.push({val: undefined})
				else if(!isNaN(word)) matches.push({val: Number(word)})
				else matches.push({key: word})
			}

			pos = lookahead
		}
	}
	return matches
}


function find_scope(pos, str) {
	++pos
	for(var level = 1, len = str.length; level > 0 && pos <= len; ++pos) {
		if     (str[pos] === ')') --level
		else if(str[pos] === '(') ++level
	}
	return pos
}


function find_delimiter(pos, str, delimiter) {
	++pos
	while(pos < str.length && !str[pos].match(delimiter)) ++pos
	return pos
}


},{}],11:[function(require,module,exports){
// Return the "previous tag" for a given node, disregarding tree structure If
// you flatten the tree structure of the DOM into just a top-down list of
// nodes, this will just return the node above the current node.

module.exports = function prev_open_tag(node) {
	if(!node) return document.body
	var prev = node

	while(prev && prev.nodeType !== 1)
		prev = prev.previousSibling

	if(prev) return prev
	else return node.parentNode
}


},{}],12:[function(require,module,exports){
var iter = require('./iter')

module.exports = function unflatten_keys(keyStr, val) {
	if(!keyStr || !keyStr.length) throw new Error("[deja-view] Invalid key used for accessing view data: " + keyStr)
	var keys = keyStr.split('.'), obj = {}, nested = obj
	for(var i = 0; i < keys.length - 1; ++i) {
		nested[keys[i]] = {}
		nested = nested[keys[i]]
	}
	nested[keys[keys.length-1]] = val
	return obj
}

},{"./iter":9}]},{},[1]);

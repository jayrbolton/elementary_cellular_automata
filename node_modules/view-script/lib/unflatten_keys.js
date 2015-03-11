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

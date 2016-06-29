var util = require('util'),
	events = require('events'),
	os = require('os'),
	async = require('async');

var timer = null;

function Ttl(options) {

	this._store = {};

	this.options = {
		ttl: 0,
		timeOutFunction: null,
		lastUsage: false,
		checkPeriode: 0
	};

	this.on("get", function() {});
	this.on("push", function() {});
	this.on("del", function() {});
	this.on("clear", function() {});
	this.on("expired", function() {});
	this.on("error", function() {});

	if (typeof options !== 'undefined' && options.hasOwnProperty('ttl') && parseInt(options.ttl) != options.ttl) {
		this.emit("error", 'options.ttl `'+parseInt(options.ttl)+'` is not a number.');
		delete options.ttl;
	}
	if (typeof options !== 'undefined' && options.hasOwnProperty('checkPeriode') && parseInt(options.checkPeriode) != options.checkPeriode) {
		this.emit("error", 'options.checkPeriode `'+options.checkPeriode+'` is not a number.');
		delete options.checkPeriode;
	}
	if (typeof options !== 'undefined' && typeof options.timeOutFunction !== 'function') {
		this.emit("error", 'options.timeOutFunction is not a function.');
		delete options.timeOutFunction;
	}

	this.options = util._extend(this.options, options);
	var self = this;

	if (this.options.checkPeriode > 0) {
		timer = setInterval(function() {
			var keys = Object.keys(self._store), i=0, len=keys.length, obj;

			for (; i < len; i++) {
				obj = self._store[keys[i]];
				self._check(obj);
			}
		}, this.options.checkPeriode);
	}
}

util.inherits(Ttl, events.EventEmitter);

Ttl.prototype.get = function(keys, callback) {
	var self = this;

	if (Array.isArray(keys) === false) {
		keys = [keys];
	}

	if (typeof callback === 'undefined') {
		callback = null;
	}

	var values = {},
			i=0, len=keys.length, key;

	if (callback) {
		async.each(keys, function(key, cb) {
			self._readObj(key, function(result) {
				values[key] = result;
				cb(null);
			});
		}, function(err){
			// Read all Values
			callback(self._shiftValue(keys, values));
		});
	} else {
		for (; i < len; i++) {
			key = keys[i];
			values[key] = this._readObj(key);
		}

		return this._shiftValue(keys, values);
	}
};

Ttl.prototype.push = function(key, value, timeOutFunction, ttl) {
	if (typeof ttl === 'undefined') {
		ttl = this.options.ttl;
	}

	if (typeof timeOutFunction !== 'function') {
		timeOutFunction = this.options.timeOutFunction;
	}

	if ((typeof value === 'undefined' || value === null) && typeof timeOutFunction !== 'function') {
		this.emit("error", "Push missing a Value or a TimeOutFunction");
		return false;
	}

	var container = {
		createTime: os.uptime(),
		lastUsage: os.uptime(),
		ttl: ttl,
		key: key,
		value: value,
		timeOutFunction: timeOutFunction
	};

	if ((typeof value === 'undefined' || value === null) && typeof timeOutFunction === 'function') {
		timeOutFunction(container);
	}

	this.emit('push', key, container);

	this._store[key] = container;
	return true;
};

Ttl.prototype.size = function() {
	return Object.keys(this._store).length;
};

Ttl.prototype.del = function(keys) {
	if (Array.isArray(keys) === false) {
		keys = [keys];
	}

	var count = 0,
			i=0, len=keys.length, key;

	for (; i < len; i++) {
		key = keys[i];

		if (!this._store.hasOwnProperty(key)) {
			continue;
		}

		count++;

		this.emit('del', key);
		delete this._store[key];
	}

	return count;
};

Ttl.prototype.clear = function() {
	this._store = {};
	this.emit('clear');
};

Ttl.prototype.getOptions = function() {
	return this.options;
};

Ttl.prototype._shiftValue = function(keys, values) {
	if (keys.length === 1) {
		return values[keys[0]];
	} else if (keys.length > 1) {
		return values;
	} else {
		return null;
	}
};

Ttl.prototype._readObj = function(key, callback) {
	var self = this;

	if (!this._store.hasOwnProperty(key)) {
		if (!callback) {
			return null;
		} else {
			callback(null);
		}
	}

	var obj = this._store[key];

	if (callback) {
		this._check(obj, function(check) {
			if (!check) {
				callback(null);
			} else {
				self._readValue(obj, key, callback);
			}
		});
	} else {
		if (!this._check(obj)) {
			return null;
		} else {
			return this._readValue(obj, key);
		}
	}
};

Ttl.prototype._readValue = function(obj, key, callback) {
	// Last Usage
	obj.lastUsage = os.uptime();

	var value = null;

	if (typeof obj.value === 'function') {
		value = obj.value();
	} else {
		value = obj.value;
	}
	this.emit('get', key, value);

	if (!callback) {
		return value;
	} else {
		callback(value);
	}
};

Ttl.prototype._check = function(obj, callback, pass) {
	var self = this;

	if (typeof pass === 'undefined') {
		pass = 1;
	}

	var lastTime = obj.createTime;
	if (this.options.lastUsage) {
		lastTime = obj.lastUsage;
	}

	if (obj.ttl > 0 && os.uptime()-lastTime > obj.ttl) {
		this.emit('expired', obj.key, obj);

		if (obj.timeOutFunction !== null && pass === 1) {
			if (callback) {
				obj.timeOutFunction(obj, function(callback) {
					self._check(obj, callback, pass+1);
				});
			} else {
				obj.timeOutFunction(obj);
				this._check(obj, callback, pass+1);
			}
		} else {
			this.del(obj.key);
		}

		if (callback) {
			callback(false);
		} else {
			return false;
		}
	}

	if (callback) {
		callback(true);
	} else {
		return true;
	}
};

module.exports = Ttl;

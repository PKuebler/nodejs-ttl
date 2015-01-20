var util = require('util'),
	events = require('events'),
	os = require('os');

var timer = null;

function Ttl(options) {

	this._store = [];

	this.options = {
		ttl: 0,
		timeOutFunction: null,
		lastUsage: false,
		checkPeriode: 0
	}

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

	if(this.options.checkPeriode > 0)
		timer = setInterval(function() {	
			var keys = Object.keys(this._store);

			for (var i = 0; i < keys.length; i++) {
				var obj = this._store[keys[i]];

				this._check(obj);
			}
		}, this.options.checkPeriode);
}

util.inherits(Ttl, events.EventEmitter);

Ttl.prototype.get = function(keys) {
	if (!util.isArray(keys)) {
		keys = [keys];
	}

	var values = {};

	for (var i = 0; i < keys.length; i++) {
		var key = keys[i];

		if (!this._store.hasOwnProperty(key)) {
			values[key] = null;
			continue;
		}

		var obj = this._store[key];

		if (!this._check(obj)) {
			values[key] = null;
			continue;
		}

		// Last Usage
		obj.lastUsage = os.uptime();

		if (typeof obj.value === 'function') {
			values[key] = obj.value();
		} else {
			values[key] = obj.value;
		}
		this.emit('get', key, values[key]);
	}

	if (keys.length == 1) {
		return values[keys[0]];
	} else if (keys.length > 1) {
		return values;
	} else {
		return null;
	}

}

Ttl.prototype.push = function(key, value, timeOutFunction, ttl) {
	if (typeof ttl === 'undefined') {
		ttl = this.options.ttl;
	}

	if (typeof timeOutFunction !== 'function')
		timeOutFunction = this.options.timeOutFunction;

	if ((value == null) && typeof timeOutFunction !== 'function') {
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
	}

	if ((typeof value === 'undefined' || value == null) && typeof timeOutFunction === 'function') {
		timeOutFunction(container);
	}

	this.emit('push', key, container);

	this._store[key] = container;
	return true;
}

Ttl.prototype.size = function() {
	return Object.keys(this._store).length;
}

Ttl.prototype.del = function(keys) {
	if (!util.isArray(keys)) {
		keys = [keys];
	}

	var count = 0;

	for (var i = 0; i < keys.length; i++) {
		var key = keys[i];

		if (!this._store.hasOwnProperty(key)) {
			continue;
		}

		count++;

		this.emit('del', key);
		delete this._store[key];
	}

	return count;
}

Ttl.prototype.clear = function() {
	this._store = {};
	this.emit('clear');
}


Ttl.prototype.getOptions = function() {
	return this.options;
};

Ttl.prototype._check = function(obj, pass) {
	if (typeof pass === 'undefined')
		pass = 1;

	var lastTime = obj.createTime;
	if (this.options.lastUsage)
		lastTime = obj.lastUsage;

	if (obj.ttl > 0 && os.uptime()-lastTime > obj.ttl) {
		// Abgelaufen
		this.emit('expired', obj.key, obj);

		if (obj.timeOutFunction != null && pass == 1) {
			obj.timeOutFunction(obj);
			this._check(obj, pass+1);
		} else {
			this.del(obj.key);
		}

		return false;
	}
	return true;

}

module.exports = Ttl;
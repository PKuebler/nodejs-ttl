var test   = require('utest');
var assert = require('assert');
var crypto = require('crypto');
var os = require('os');

var timeToLife = require('../ttl');

// http://blog.tompawlak.org/how-to-generate-random-values-nodejs-javascript
function randomString(howMany, chars) {
    chars = chars 
        || "abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789";
    var rnd = crypto.randomBytes(howMany)
        , value = new Array(howMany)
        , len = chars.length;

    for (var i = 0; i < howMany; i++) {
        value[i] = chars[rnd[i] % len]
    };

    return value.join('');
}

test('ttl', {

	'Set Options': function() {

		var options = {
			lastUsage: true,
			ttl: randomString(5,'ABCDEF'),
			checkPeriode: randomString(5),
			timeOutFunction: randomString(5)
		};

		var ttl = new timeToLife(options);
		
		assert.equal(ttl.getOptions().lastUsage, options.lastUsage);
		assert.equal(ttl.getOptions().ttl, 0);
		assert.equal(ttl.getOptions().checkPeriode, 0);
		assert.equal(ttl.getOptions().timeOutFunction, null);
	}
});

test('Push', {

	before: function() {
		this.ttl = new timeToLife();
	},
	after: function() {
		this.ttl = null;
	},

	'No Parameters': function() {
		assert.ifError(this.ttl.push('myKey'));
		assert.ifError(this.ttl._store.hasOwnProperty('myKey'));
	},

	'Content': function() {
		this.ttl.push('myKey', {name: 'Test Content'});

		assert.ifError(!this.ttl._store.hasOwnProperty('myKey'));
		assert.equal(this.ttl._store['myKey'].value.name, 'Test Content');

		delete this.ttl._store['myKey'];
	},

	'Function Content': function() {
		this.ttl.push('myKey', function() {
			return 'Test Content';
		});

		assert.equal(this.ttl._store['myKey'].value(), 'Test Content');

		delete this.ttl._store['myKey'];
	},

	'TimeOutFunction': function() {
		this.ttl.push('myKey', null, function(container) {
			container['value'] = 'test';
		});

		this.ttl._store['myKey'].timeOutFunction(this.ttl._store['myKey']);
		
		assert.equal(this.ttl._store['myKey'].value, "test");

		delete this.ttl._store['myKey'];
	},

	'Content & TimeOutFunction': function() {
		this.ttl.push('myKey', 'Test Content', function(container) {
			container['value'] = 'Test Content new';
		});

		assert.equal(this.ttl._store['myKey'].value, 'Test Content');

		this.ttl._store['myKey'].timeOutFunction(this.ttl._store['myKey']);

		assert.equal(this.ttl._store['myKey'].value, 'Test Content new');

		delete this.ttl._store['myKey'];
	},

	'Content with TTL': function() {
		this.ttl.push('myKey', 'Test Content', null, 200);

		assert.equal(this.ttl._store['myKey'].value, 'Test Content');
		assert.equal(this.ttl._store['myKey'].ttl, 200);

		delete this.ttl._store['myKey'];
	},

	'TimeOutFunction with TTL': function() {
		this.ttl.push('myKey', null, function(container) {
			container['value'] = 'Test Content new';
		}, 200);

		this.ttl._store['myKey'].timeOutFunction(this.ttl._store['myKey']);

		assert.equal(this.ttl._store['myKey'].value, 'Test Content new');
		assert.equal(this.ttl._store['myKey'].ttl, 200);

		delete this.ttl._store['myKey'];
	},

});

test('Push with Option', {

	before: function() {
		this.ttl = new timeToLife({
			ttl: 200,
			timeOutFunction: function(container) {
				container['value'] = 'Test Content';
			}
		});
	},
	after: function() {
		this.ttl = null;
	},

	'Method': function() {
		assert.ifError(!this.ttl.push('myKey'));

		this.ttl._store['myKey'].timeOutFunction(this.ttl._store['myKey']);

		assert.equal(this.ttl._store['myKey'].value, 'Test Content');

		delete this.ttl._store['myKey'];
	},

	'TTL': function() {
		this.ttl.push('myKey', 'test');
		assert.equal(this.ttl._store['myKey'].ttl, 200);

		this.ttl.push('myKey2', 'test', null, 0);
		assert.equal(this.ttl._store['myKey2'].ttl, 0);

		delete this.ttl._store['myKey'];
		delete this.ttl._store['myKey2'];
	}
});

test('Get', {

	before: function() {
		this.ttl = new timeToLife();
	},
	after: function() {
		this.ttl = null;
	},

	'Content': function() {
		this.ttl.push('myKey', 'Test Content');

		assert.equal(this.ttl.get('myKey'), 'Test Content');

		delete this.ttl._store['myKey'];
	},

	'Functional Content': function() {
		this.ttl.push('myKey', function() {
			return 'Test Content';
		});

		assert.equal(this.ttl.get('myKey'), 'Test Content');

		delete this.ttl._store['myKey'];
	},

	'Wrong Key': function() {
		assert.ifError(this.ttl.get('myKey'));

		delete this.ttl._store['myKey'];
	}
});

test('Remove', {

	before: function() {
		this.ttl = new timeToLife();
	},
	after: function() {
		this.ttl = null;
	},
	'Key': function() {
		this.ttl._store.myKey = {
			createTime: 222,
			lastUsage: 222,
			ttl: 200,
			timeOutFunction: null,
			key: 'myKey',
			value: 'Test Content'
		}

		assert.ifError(!this.ttl.del('myKey'));
		assert.ifError(this.ttl._store.hasOwnProperty('myKey'));

		delete this.ttl._store['myKey'];
	},
	'Wrong Key': function() {
		assert.equal(this.ttl.del('falseKey'), 0);
	}
});

test('Multiple', {

	before: function() {
		this.ttl = new timeToLife();
		this.ttl.push("key1", randomString(10));
		this.ttl.push("key2", randomString(10));
		this.ttl.push("key3", randomString(10));
		this.ttl.push("key4", randomString(10));
	},
	after: function() {
		this.ttl = null;
	},
	'Get': function() {
		var value = this.ttl.get(["key1","key2","key4"]);

		assert.equal(value.key1, this.ttl._store["key1"].value);
		assert.equal(value.key2, this.ttl._store["key2"].value);
		assert.notEqual(value.key3, this.ttl._store["key3"].value);
		assert.equal(value.key4, this.ttl._store["key4"].value);
	},
	'Del': function() {
		var value = this.ttl.del(["key1","key2","key4"]);
		assert.equal(value, 3);

		assert.ifError(this.ttl._store.hasOwnProperty('key1'));
		assert.ifError(!this.ttl._store.hasOwnProperty('key3'));
		assert.ifError(this.ttl._store.hasOwnProperty('key4'));

		delete this.ttl._store['key3'];
	}

});

test('Tools', {
	before: function() {
		this.ttl = new timeToLife();
		this.ttl.push("key1", randomString(10));
		this.ttl.push("key2", randomString(10));
		this.ttl.push("key3", randomString(10));
		this.ttl.push("key4", randomString(10));
	},
	after: function() {
		this.ttl = null;
	},
	'Size': function() {
		assert.equal(this.ttl.size(), 4);
	},
	'Clear': function() {
		this.ttl.clear();
		assert.equal(this.ttl.size(), 0);

		this.ttl.push("key1", randomString(10));
		assert.equal(this.ttl.size(), 1);

		delete this.ttl._store["key1"];
	}
});

test('Expired', {
	before: function() {
		this.ttl = new timeToLife();
	},
	after: function() {
		this.ttl = null;
	},
	'Check': function() {
		this.ttl.push("key1", randomString(20), null, 5);
		this.ttl._store['key1'].createTime = this.ttl._store['key1'].createTime-1000;
		assert.ifError(this.ttl._check(this.ttl._store["key1"]));
		assert.ifError(this.ttl._store.hasOwnProperty('key1'));
	},
	'TimeOutFunction': function() {
		var random = randomString(20);

		this.ttl.push("key2", random, function(container) {
			container['value'] = randomString(20);
			container['createTime'] = os.uptime();
		}, 5);
		this.ttl._store['key2'].createTime = this.ttl._store['key2'].createTime-1000;
		this.ttl._check(this.ttl._store['key2']);

		assert.notEqual(random, this.ttl._store['key2'].value);
	}
});
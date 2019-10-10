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

var self = {ttl: null};

describe('ttl', function() {
	it('Set Options', function() {
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
	});
});

describe('Push', function() {
	before(function() {
		self.ttl = new timeToLife();
	});
	after(function() {
		self.ttl = null;
	});

	it('No Parameters', function() {
		assert.ok(!self.ttl.push('myKey'));
		assert.ok(!self.ttl._store.hasOwnProperty('myKey'));
	});

	it('Content', function() {
		self.ttl.push('myKey', {name: 'Test Content'});

		assert.ok(self.ttl._store.hasOwnProperty('myKey'));
		assert.equal(self.ttl._store['myKey'].value.name, 'Test Content');

		delete self.ttl._store['myKey'];
	});

	it('Function Content', function() {
		self.ttl.push('myKey', function() {
			return 'Test Content';
		});

		assert.equal(self.ttl._store['myKey'].value(), 'Test Content');

		delete self.ttl._store['myKey'];
	});

	it('TimeOutFunction', function() {
		self.ttl.push('myKey', null, function(container) {
			container['value'] = 'test';
		});

		self.ttl._store['myKey'].timeOutFunction(self.ttl._store['myKey']);
		
		assert.equal(self.ttl._store['myKey'].value, "test");

		delete self.ttl._store['myKey'];
	});

	it('Content & TimeOutFunction', function() {
		self.ttl.push('myKey', 'Test Content', function(container) {
			container['value'] = 'Test Content new';
		});

		assert.equal(self.ttl._store['myKey'].value, 'Test Content');

		self.ttl._store['myKey'].timeOutFunction(self.ttl._store['myKey']);

		assert.equal(self.ttl._store['myKey'].value, 'Test Content new');

		delete self.ttl._store['myKey'];
	});

	it('Content with TTL', function() {
		self.ttl.push('myKey', 'Test Content', null, 200);

		assert.equal(self.ttl._store['myKey'].value, 'Test Content');
		assert.equal(self.ttl._store['myKey'].ttl, 200);

		delete self.ttl._store['myKey'];
	});

	it('TimeOutFunction with TTL', function() {
		self.ttl.push('myKey', null, function(container) {
			container['value'] = 'Test Content new';
		}, 200);

		self.ttl._store['myKey'].timeOutFunction(self.ttl._store['myKey']);

		assert.equal(self.ttl._store['myKey'].value, 'Test Content new');
		assert.equal(self.ttl._store['myKey'].ttl, 200);

		delete self.ttl._store['myKey'];
	});

});

describe('Push with Option', function() {
	before(function() {
		self.ttl = new timeToLife({
			ttl: 200,
			timeOutFunction: function(container) {
				container['value'] = 'Test Content';
			}
		});
	});
	after(function() {
		self.ttl = null;
	});

	it('Method', function() {
		assert.ok(self.ttl.push('myKey'));

		self.ttl._store['myKey'].timeOutFunction(self.ttl._store['myKey']);

		assert.equal(self.ttl._store['myKey'].value, 'Test Content');

		delete self.ttl._store['myKey'];
	});

	it('TTL', function() {
		self.ttl.push('myKey', 'test');
		assert.equal(self.ttl._store['myKey'].ttl, 200);

		self.ttl.push('myKey2', 'test', null, 0);
		assert.equal(self.ttl._store['myKey2'].ttl, 0);

		delete self.ttl._store['myKey'];
		delete self.ttl._store['myKey2'];
	});
});

describe('Get', function() {

	before(function() {
		self.ttl = new timeToLife();
	});
	after(function() {
		self.ttl = null;
	});

	it('Content', function() {
		self.ttl.push('myKey', 'Test Content');

		assert.equal(self.ttl.get('myKey'), 'Test Content');

		delete self.ttl._store['myKey'];
	});

	it('Functional Content', function() {
		self.ttl.push('myKey', function() {
			return 'Test Content';
		});

		assert.equal(self.ttl.get('myKey'), 'Test Content');

		delete self.ttl._store['myKey'];
	});

	it('Wrong Key', function() {
		assert.ifError(self.ttl.get('myKey'));

		delete self.ttl._store['myKey'];
	});
});

describe('Remove', function() {

	before(function() {
		self.ttl = new timeToLife();
	});
	after(function() {
		self.ttl = null;
	});

	it('Key', function() {
		self.ttl._store.myKey = {
			createTime: 222,
			lastUsage: 222,
			ttl: 200,
			timeOutFunction: null,
			key: 'myKey',
			value: 'Test Content'
		}

		assert.ok(self.ttl.del('myKey'));
		assert.ok(!self.ttl._store.hasOwnProperty('myKey'));

		delete self.ttl._store['myKey'];
	});
	it('Wrong Key', function() {
		assert.equal(self.ttl.del('falseKey'), 0);
	});
});

describe('Multiple', function() {

	before(function() {
		self.ttl = new timeToLife();
		self.ttl.push("key1", randomString(10));
		self.ttl.push("key2", randomString(10));
		self.ttl.push("key3", randomString(10));
		self.ttl.push("key4", randomString(10));
	});
	after(function() {
		self.ttl = null;
	});
	it('Get', function() {
		var value = self.ttl.get(["key1","key2","key4"]);

		assert.equal(value.key1, self.ttl._store["key1"].value);
		assert.equal(value.key2, self.ttl._store["key2"].value);
		assert.notEqual(value.key3, self.ttl._store["key3"].value);
		assert.equal(value.key4, self.ttl._store["key4"].value);
	});
	it('Del', function() {
		var value = self.ttl.del(["key1","key2","key4"]);
		assert.equal(value, 3);

		assert.ok(!self.ttl._store.hasOwnProperty('key1'));
		assert.ok(self.ttl._store.hasOwnProperty('key3'));
		assert.ok(!self.ttl._store.hasOwnProperty('key4'));

		delete self.ttl._store['key3'];
	});
});

describe('Tools', function() {
	before(function() {
		self.ttl = new timeToLife();
		self.ttl.push("key1", randomString(10));
		self.ttl.push("key2", randomString(10));
		self.ttl.push("key3", randomString(10));
		self.ttl.push("key4", randomString(10));
	});
	after(function() {
		self.ttl = null;
	});
	it('Size', function() {
		assert.equal(self.ttl.size(), 4);
	});
	it('Clear', function() {
		self.ttl.clear();
		assert.equal(self.ttl.size(), 0);

		self.ttl.push("key1", randomString(10));
		assert.equal(self.ttl.size(), 1);

		delete self.ttl._store["key1"];
	});
});

describe('Expired', function() {
	before(function() {
		self.ttl = new timeToLife();
	});
	after(function() {
		self.ttl = null;
	});
	it('Check', function() {
		self.ttl.push("key1", randomString(20), null, 5);
		self.ttl._store['key1'].createTime = self.ttl._store['key1'].createTime-1000;
		assert.ok(!self.ttl._check(self.ttl._store["key1"]));
		assert.ok(!self.ttl._store.hasOwnProperty('key1'));
	});
	it('TimeOutFunction', function() {
		var random = randomString(20);

		self.ttl.push("key2", random, function(container) {
			container['value'] = randomString(20);
			container['createTime'] = os.uptime();
		}, 5);
		self.ttl._store['key2'].createTime = self.ttl._store['key2'].createTime-1000;
		self.ttl._check(self.ttl._store['key2']);

		assert.notEqual(random, self.ttl._store['key2'].value);
	});
});

describe('Async', function() {
	before(function() {
		self.ttl = new timeToLife();
	});
	after(function() {
		self.ttl = null;
	});
	// ToDo: Write Async Tests
});
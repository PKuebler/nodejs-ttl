node-ttl [![Build Status](https://travis-ci.org/PKuebler/nodejs-ttl.svg?branch=master)](https://travis-ci.org/PKuebler/nodejs-ttl)
===========

## Simple Time to life (ttl) NodeJS Store 

# Install

```bash
  npm install node-ttl
```

# Examples:

## Initialize (INIT):

```js
var NodeTtl = require( "node-ttl" );
var ttl = new NodeTtl();
```

### Options

* `ttl`: *(default: 0)* the standard ttl in seconds for every element. `0` = unlimited
* `lastUsage`: *(default: false)* check the time on the basis of past use or creation time.
* `checkPeriode`: *(default: 0)* How frequently should be checked for expired items. `0` = only by get()
* `timeOutFunction`: *(default: null)* This function is called when an item has expired.


## Store a key (PUSH):

`ttl.push(key, [ value ], [ timeOutFunction ], [ ttl ])`

Save the key.
**Note:** Need a `value` or a (global/options) `timeOutFunction`. If the `value` is empty, it is loaded from the `timeOutFunction`. 

* `key` the Key.
* `value` *(optional)* A Variable, Object or Function.
* `timeOutFunction(container)` *(optional)* Called when the time has expired or no value is defined.
* `ttl` *(optional)* Custom Time to life.

```js
ttl.push('key1', 'value1');
ttl.push('key2', {age: 42});

ttl.push('key4', {name: 'Philipp'}, null, 40);

ttl.push('key5', null, function(container) {
    console.log(container);

    /*
    {
        createTime: 1553, // Create (NodeJs Run Time in Seconds)
        lastUsage: 3432, // Last call get() (NodeJs Run Time in Seconds)
        ttl: 5000, // Time to Life
        key: 'key5',
        value: null,
        timeOutFunction: // this function
    }
     */
    
    container.value = 'My new Value';
    // Time Update?
    container.createTime = os.uptime();
});
```

## Get a key (GET):

`ttl.get(key)`

Get the `value` from `key`.
Returns the value. If not found return null;

```js
var value = ttl.get('key');
```

## Get  a key async (GET ASYNC):

`ttl.get(key, function(value){})`

Get the `value` from `key`.
Returns the value. If not found return null;

```js
ttl.get('key', function(value) {
    // null if not found.    
});
```


## Delete a key (DEL):

`ttl.del(key)`

Delete a Element by the `key`.
Returns if success 1.

```js
var value = ttl.del(key);
console.log(value);

// Return 0 if fails
```

## Get multiple keys (MGET)

`ttl.get(keys[])`

Get the `value`s by `key` Array.
If the value was found it returns an object with the `key` `value` pairs;

```js
var value = ttl.get(['key1', 'key2', 'key3']);
console.log(value);

/*
{
    "key1": 'value1'
    "key2": {age: 42},
    "key3": null // Not Found
}
 */
```

## Get multiple keys async (MGET ASYNC)

`ttl.get(keys[], function(values){})`

Get the `value`s by `key` Array.
If the value was found it returns an object with the `key` `value` pairs;

```js
var value = ttl.get(['key1', 'key2', 'key3'], function(values) {
    console.log(values);
});
```

## Delete multiple keys (MDELETE)

`ttl.del(keys[])`

Delete Elements by a `keys` Array.
Returns count of success deletes..

```js
var value = ttl.del(['key1', 'key2']);
console.log(value);

// Return 2
```

## Count Keys (SIZE):

`ttl.size()`

Get Count of Elements.

```js
var value = ttl.size();
console.log(value);
```

## Clear Storage (CLEAR):

`ttl.clear()`

Remove all storaged Elements.

```js
ttl.clear();

console.log(ttl.size());
// Return 0
```

## Get Options:

`ttl.getOptions()`

Returns the global Options.

```js
var value = ttl.getOptions();
console.log(value);

/*
{
    ttl: 0,
    timeOutFunction: null,
    lastUsage: false,
    checkPeriode: 0
}
 */
```

# Events

## get

Fired when found a Key.
You will get the `key` and the `value` as callback argument.

```js
ttl.on("get", function( key, value ){
});
```

## push

Fired when added a new Element.
You will get the `key` and the `container` as callback argument.

```js
ttl.on("push", function( key, container ){
    console.log(container);
    /*
    {
        createTime: 1553, // Create (NodeJs Run Time in Seconds)
        lastUsage: 3432, // Last call get() (NodeJs Run Time in Seconds)
        ttl: 5000, // Time to Life
        key: 'key5',
        value: null,
        timeOutFunction: // this function
    }
    */
});
```

## del

Fired when an item expires or is deleted manually.
You will get the `key` as callback argument.

```js
ttl.on("del", function( key ){
});
```

## clear

Fired when you call `ttl.clear()`.

```js
ttl.on("clear", function(){
});
```

## expired

Fired when an item is expired.
You will get the `key` and the `container` as callback argument.

```js
ttl.on("expired", function( key, container ){
    console.log(container);
    /*
    {
        createTime: 1553, // Create (NodeJs Run Time in Seconds)
        lastUsage: 3432, // Last call get() (NodeJs Run Time in Seconds)
        ttl: 5000, // Time to Life
        key: 'key5',
        value: null,
        timeOutFunction: // this function
    }
    */
});
```

## error

Fired when there was an error.
You will get the `msg` as callback argument.

```js
ttl.on("error", function( msg ){
    console.log(msg)
});
```

# Contributors
[Philipp](http://pkuebler.de/)    
[Roman](https://github.com/romulka)  
[Ligustah](https://github.com/ligustah)
[hellobertrand](https://github.com/hellobertrand)

# The MIT License (MIT)



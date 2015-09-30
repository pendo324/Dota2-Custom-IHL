var bignumber = require("bignumber.js");

// takes a decomposed 64-bit integer and returns it in a bignumber object
var bigInt = function bigInt(high, low) {
    var h = bignumber(new Uint32Array([high])[0]);
    var l = bignumber(new Uint32Array([low])[0]);
    return bignumber(h.shift(-32).or(l));
};

//takes a steamId3 and makes the equivalent steamId64. Dota deals with steamId3 for some reason
var steam3To64 = function steam3To64(id) {
    var p = id % 2;
    var b_id = bignumber(id);
    return bignumber("76561197960265728").plus(b_id).plus(p).toString(); // yes, its a magic number
};

/*
 * Converts a steamid 64 to a steamid 32
 *
 * Returns a BigNumber
 */

function convert64to32(id) {
    return new bignumber(id).minus('76561197960265728');
}

/*
 * Converts a steamid 64 to a steamid 32
 *
 * Returns a BigNumber
 */
function convert32to64(id) {
    return new bignumber('76561197960265728').plus(id);
}

module.exports = {
	bigInt: bigInt,
	steam3To64: steam3To64,
    convert32to64: convert32to64,
    convert64to32: convert64to32
}

if (!Array.prototype.includes) {
  Array.prototype.includes = function(searchElement /*, fromIndex*/ ) {
    'use strict';
    var O = Object(this);
    var len = parseInt(O.length) || 0;
    if (len === 0) {
      return false;
    }
    var n = parseInt(arguments[1]) || 0;
    var k;
    if (n >= 0) {
      k = n;
    } else {
      k = len + n;
      if (k < 0) {k = 0;}
    }
    var currentElement;
    while (k < len) {
      currentElement = O[k];
      if (searchElement === currentElement ||
         (searchElement !== searchElement && currentElement !== currentElement)) {
        return true;
      }
      k++;
    }
    return false;
  };
}



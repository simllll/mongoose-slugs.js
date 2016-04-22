/* jshint node: true */

var mongoose = require('mongoose');
var extend = require("node.extend");

/*
 * slug generator
 *
 * @param {String} modelName
 * @param {String|Array} sluggable
 * @param {String} dest
 * @param {Object} opts
 * @return {Function}
 */

module.exports = function(modelName, sluggable, dest, opts) {
  opts = opts || {};

  return function generateSlug(next, done) {
    var destModified = isModifield.call(this, dest);

    if (!isModifield.call(this, sluggable) && !destModified) { // no changes, just move on
      return next();
    }

    var string;
    if (destModified) {
      string = this[dest]; // "slug" has been manually defined
    } else {
      string = sluggableString.call(this, sluggable);
    }

    this[dest] = toSlug(string);

    // allow duplication
    if (opts.allowDuplication) {
      return next();
    }

    // check uniqueness
    var self = this;
    dupCount.call(this, modelName, dest, opts.scope, function(err, count) {
      if (err) {
        return done(err);
      }
      if (count > 0) {
        if (opts.invalidateOnDuplicate) {
          self.invalidate(dest, 'is already taken');
        } else {
          self[dest] = self[dest]+"-"+count;
        }
      }
      next();
    });
  };
};

/*
 * dupCount queries for duplication and returns err, count
 *
 * @param {String} modelName
 * @param {String} dest
 * @param {Function} scope
 * @param {Function} callback
 * @api private
 */

function dupCount(modelName, dest, scope, callback) {
  scope = scope || function() {
    return {};
  };

  var regex = new RegExp("^"+this[dest]+"(\\-\\d+)?$", 'ig');
  var cond = {_id: {$ne: this._id}};
  cond[dest] = regex;
  mongoose.models[modelName].count(extend(true, cond, scope.call(this)), callback);
}

/*
 * isModifield returns boolean based on whether the field(s) have been modified
 *
 * @param {String|Array} fieldName
 * @return {Boolean}
 */

function isModifield(fieldName) {
  // recurse for an array of fields
  if (fieldName instanceof Array) {
    var self = this;
    var i = 0;
    var len = fieldName.length;
    for(; i<len; i++) {
      if (isModifield.call(self, fieldName[i])) {
        return true;
      }
    }
    return false;
  }

  return ~this.modifiedPaths().indexOf(fieldName);
}

/*
 * toSlug removes non-word characters and replaces with a - (hyphen)
 *
 * @param {String} str
 * @return {String}
 */

function toSlug(str) {
  	return removeDiacritics(str).toLowerCase().replace(/[^\w]/g, '-').replace(/-{2,}/g,'-');
}

/*
 * sluggableString returns the string to be slugged from one ore more fields
 *
 * @param {String|Array} fieldName
 * @return {String}
 */

function sluggableString(fieldName) {
  if ("string" === typeof fieldName) {
    fieldName = [fieldName];
  }
  var self = this;
  return fieldName.map(function(f) {
    return self[f];
  }).join(" ").trim();
}

function removeDiacritics (str) {
	var conversions = new Object();
	conversions['ae'] = 'ä|æ|ǽ';
	conversions['oe'] = 'ö|œ';
	conversions['ue'] = 'ü';
	conversions['Ae'] = 'Ä';
	conversions['Ue'] = 'Ü';
	conversions['Oe'] = 'Ö';
	conversions['A'] = 'À|Á|Â|Ã|Ä|Å|Ǻ|Ā|Ă|Ą|Ǎ';
	conversions['a'] = 'à|á|â|ã|å|ǻ|ā|ă|ą|ǎ|ª';
	conversions['C'] = 'Ç|Ć|Ĉ|Ċ|Č';
	conversions['c'] = 'ç|ć|ĉ|ċ|č';
	conversions['D'] = 'Ð|Ď|Đ';
	conversions['d'] = 'ð|ď|đ';
	conversions['E'] = 'È|É|Ê|Ë|Ē|Ĕ|Ė|Ę|Ě';
	conversions['e'] = 'è|é|ê|ë|ē|ĕ|ė|ę|ě';
	conversions['G'] = 'Ĝ|Ğ|Ġ|Ģ';
	conversions['g'] = 'ĝ|ğ|ġ|ģ';
	conversions['H'] = 'Ĥ|Ħ';
	conversions['h'] = 'ĥ|ħ';
	conversions['I'] = 'Ì|Í|Î|Ï|Ĩ|Ī|Ĭ|Ǐ|Į|İ';
	conversions['i'] = 'ì|í|î|ï|ĩ|ī|ĭ|ǐ|į|ı';
	conversions['J'] = 'Ĵ';
	conversions['j'] = 'ĵ';
	conversions['K'] = 'Ķ';
	conversions['k'] = 'ķ';
	conversions['L'] = 'Ĺ|Ļ|Ľ|Ŀ|Ł';
	conversions['l'] = 'ĺ|ļ|ľ|ŀ|ł';
	conversions['N'] = 'Ñ|Ń|Ņ|Ň';
	conversions['n'] = 'ñ|ń|ņ|ň|ŉ';
	conversions['O'] = 'Ò|Ó|Ô|Õ|Ō|Ŏ|Ǒ|Ő|Ơ|Ø|Ǿ';
	conversions['o'] = 'ò|ó|ô|õ|ō|ŏ|ǒ|ő|ơ|ø|ǿ|º';
	conversions['R'] = 'Ŕ|Ŗ|Ř';
	conversions['r'] = 'ŕ|ŗ|ř';
	conversions['S'] = 'Ś|Ŝ|Ş|Š';
	conversions['s'] = 'ś|ŝ|ş|š|ſ';
	conversions['T'] = 'Ţ|Ť|Ŧ';
	conversions['t'] = 'ţ|ť|ŧ';
	conversions['U'] = 'Ù|Ú|Û|Ũ|Ū|Ŭ|Ů|Ű|Ų|Ư|Ǔ|Ǖ|Ǘ|Ǚ|Ǜ';
	conversions['u'] = 'ù|ú|û|ũ|ū|ŭ|ů|ű|ų|ư|ǔ|ǖ|ǘ|ǚ|ǜ';
	conversions['Y'] = 'Ý|Ÿ|Ŷ';
	conversions['y'] = 'ý|ÿ|ŷ';
	conversions['W'] = 'Ŵ';
	conversions['w'] = 'ŵ';
	conversions['Z'] = 'Ź|Ż|Ž';
	conversions['z'] = 'ź|ż|ž';
	conversions['AE'] = 'Æ|Ǽ';
	conversions['ss'] = 'ß';
	conversions['IJ'] = 'Ĳ';
	conversions['ij'] = 'ĳ';
	conversions['OE'] = 'Œ';
	conversions['f'] = 'ƒ';
	for(var i in conversions){
		var re = new RegExp(conversions[i],"g");
		str = str.replace(re,i);
	}
	return str;
}
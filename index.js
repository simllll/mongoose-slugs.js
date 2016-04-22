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
  return removeAccents(str).toLowerCase().replace(/[^\w]/g, '-');
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

var removalMap = {
	'A'  : /[AⒶＡÀÁÂẦẤẪẨÃĀĂẰẮẴẲȦǠÄǞẢÅǺǍȀȂẠẬẶḀĄ]/g,
	'AA' : /[Ꜳ]/g,
	'AE' : /[ÆǼǢ]/g,
	'AO' : /[Ꜵ]/g,
	'AU' : /[Ꜷ]/g,
	'AV' : /[ꜸꜺ]/g,
	'AY' : /[Ꜽ]/g,
	'B'  : /[BⒷＢḂḄḆɃƂƁ]/g,
	'C'  : /[CⒸＣĆĈĊČÇḈƇȻꜾ]/g,
	'D'  : /[DⒹＤḊĎḌḐḒḎĐƋƊƉꝹ]/g,
	'DZ' : /[ǱǄ]/g,
	'Dz' : /[ǲǅ]/g,
	'E'  : /[EⒺＥÈÉÊỀẾỄỂẼĒḔḖĔĖËẺĚȄȆẸỆȨḜĘḘḚƐƎ]/g,
	'F'  : /[FⒻＦḞƑꝻ]/g,
	'G'  : /[GⒼＧǴĜḠĞĠǦĢǤƓꞠꝽꝾ]/g,
	'H'  : /[HⒽＨĤḢḦȞḤḨḪĦⱧⱵꞍ]/g,
	'I'  : /[IⒾＩÌÍÎĨĪĬİÏḮỈǏȈȊỊĮḬƗ]/g,
	'J'  : /[JⒿＪĴɈ]/g,
	'K'  : /[KⓀＫḰǨḲĶḴƘⱩꝀꝂꝄꞢ]/g,
	'L'  : /[LⓁＬĿĹĽḶḸĻḼḺŁȽⱢⱠꝈꝆꞀ]/g,
	'LJ' : /[Ǉ]/g,
	'Lj' : /[ǈ]/g,
	'M'  : /[MⓂＭḾṀṂⱮƜ]/g,
	'N'  : /[NⓃＮǸŃÑṄŇṆŅṊṈȠƝꞐꞤ]/g,
	'NJ' : /[Ǌ]/g,
	'Nj' : /[ǋ]/g,
	'O'  : /[OⓄＯÒÓÔỒỐỖỔÕṌȬṎŌṐṒŎȮȰÖȪỎŐǑȌȎƠỜỚỠỞỢỌỘǪǬØǾƆƟꝊꝌ]/g,
	'OI' : /[Ƣ]/g,
	'OO' : /[Ꝏ]/g,
	'OU' : /[Ȣ]/g,
	'P'  : /[PⓅＰṔṖƤⱣꝐꝒꝔ]/g,
	'Q'  : /[QⓆＱꝖꝘɊ]/g,
	'R'  : /[RⓇＲŔṘŘȐȒṚṜŖṞɌⱤꝚꞦꞂ]/g,
	'S'  : /[SⓈＳẞŚṤŜṠŠṦṢṨȘŞⱾꞨꞄ]/g,
	'T'  : /[TⓉＴṪŤṬȚŢṰṮŦƬƮȾꞆ]/g,
	'TZ' : /[Ꜩ]/g,
	'U'  : /[UⓊＵÙÚÛŨṸŪṺŬÜǛǗǕǙỦŮŰǓȔȖƯỪỨỮỬỰỤṲŲṶṴɄ]/g,
	'V'  : /[VⓋＶṼṾƲꝞɅ]/g,
	'VY' : /[Ꝡ]/g,
	'W'  : /[WⓌＷẀẂŴẆẄẈⱲ]/g,
	'X'  : /[XⓍＸẊẌ]/g,
	'Y'  : /[YⓎＹỲÝŶỸȲẎŸỶỴƳɎỾ]/g,
	'Z'  : /[ZⓏＺŹẐŻŽẒẔƵȤⱿⱫꝢ]/g,
	'a'  : /[aⓐａẚàáâầấẫẩãāăằắẵẳȧǡäǟảåǻǎȁȃạậặḁąⱥɐ]/g,
	'aa' : /[ꜳ]/g,
	'ae' : /[æǽǣ]/g,
	'ao' : /[ꜵ]/g,
	'au' : /[ꜷ]/g,
	'av' : /[ꜹꜻ]/g,
	'ay' : /[ꜽ]/g,
	'b'  : /[bⓑｂḃḅḇƀƃɓ]/g,
	'c'  : /[cⓒｃćĉċčçḉƈȼꜿↄ]/g,
	'd'  : /[dⓓｄḋďḍḑḓḏđƌɖɗꝺ]/g,
	'dz' : /[ǳǆ]/g,
	'e'  : /[eⓔｅèéêềếễểẽēḕḗĕėëẻěȅȇẹệȩḝęḙḛɇɛǝ]/g,
	'f'  : /[fⓕｆḟƒꝼ]/g,
	'g'  : /[gⓖｇǵĝḡğġǧģǥɠꞡᵹꝿ]/g,
	'h'  : /[hⓗｈĥḣḧȟḥḩḫẖħⱨⱶɥ]/g,
	'hv' : /[ƕ]/g,
	'i'  : /[iⓘｉìíîĩīĭïḯỉǐȉȋịįḭɨı]/g,
	'j'  : /[jⓙｊĵǰɉ]/g,
	'k'  : /[kⓚｋḱǩḳķḵƙⱪꝁꝃꝅꞣ]/g,
	'l'  : /[lⓛｌŀĺľḷḹļḽḻſłƚɫⱡꝉꞁꝇ]/g,
	'lj' : /[ǉ]/g,
	'm'  : /[mⓜｍḿṁṃɱɯ]/g,
	'n'  : /[nⓝｎǹńñṅňṇņṋṉƞɲŉꞑꞥ]/g,
	'nj' : /[ǌ]/g,
	'o'  : /[oⓞｏòóôồốỗổõṍȭṏōṑṓŏȯȱöȫỏőǒȍȏơờớỡởợọộǫǭøǿɔꝋꝍɵ]/g,
	'oi' : /[ƣ]/g,
	'ou' : /[ȣ]/g,
	'oo' : /[ꝏ]/g,
	'p'  : /[pⓟｐṕṗƥᵽꝑꝓꝕ]/g,
	'q'  : /[qⓠｑɋꝗꝙ]/g,
	'r'  : /[rⓡｒŕṙřȑȓṛṝŗṟɍɽꝛꞧꞃ]/g,
	's'  : /[sⓢｓßśṥŝṡšṧṣṩșşȿꞩꞅẛ]/g,
	't'  : /[tⓣｔṫẗťṭțţṱṯŧƭʈⱦꞇ]/g,
	'tz' : /[ꜩ]/g,
	'u'  : /[uⓤｕùúûũṹūṻŭüǜǘǖǚủůűǔȕȗưừứữửựụṳųṷṵʉ]/g,
	'v'  : /[vⓥｖṽṿʋꝟʌ]/g,
	'vy' : /[ꝡ]/g,
	'w'  : /[wⓦｗẁẃŵẇẅẘẉⱳ]/g,
	'x'  : /[xⓧｘẋẍ]/g,
	'y'  : /[yⓨｙỳýŷỹȳẏÿỷẙỵƴɏỿ]/g,
	'z'  : /[zⓩｚźẑżžẓẕƶȥɀⱬꝣ]/g,
};

function removeAccents(str) {
    for(var latin in removalMap) {
      var nonLatin = removalMap[latin];
      str = str.replace(nonLatin , latin);
    }

    return str;
}
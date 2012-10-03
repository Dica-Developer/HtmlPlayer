/*
 * JavaScript ID3 Tag Reader 0.1.2
 * Copyright (c) 2008 Jacob Seidelin, cupboy@gmail.com, http://blog.nihilogic.dk/
 * MIT License [http://www.opensource.org/licenses/mit-license.php]
 *
 * Extended by António Afonso (antonio.afonso@opera.com), Opera Software ASA
 * Modified by António Afonso <antonio.afonso gmail.com>
 * Modified by Audica Dev Team
 */

(function(ns) {
  var ID3 = ns.ID3 = {};

  var _files = {};
  // location of the format identifier
  var _formatIDRange = [0, 7];

  /**
   * Finds out the tag format of this data and returns the appropriate
   * reader.
   */
  ID3.getTagReader = function(data) {
    var result = null;
    if (data.substr(4, 7) == "ftypM4A") {
      result = ID4;
    } else if (data.substr(0, 3) == "ID3") {
      result = ID3v2;
    } else {
      result = ID3v1;
    }
    return result;
  }

  ID3.getTags = function(reader, data, tags) {
    var tagsFound = reader.readTagsFromData(data, tags);
    var tags = {};
    for (var tag in tagsFound )
    if (tagsFound.hasOwnProperty(tag)) {
      tags[tag] = tagsFound[tag];
    }
    return tags;
  }

  ID3.readTags = function(reader, data, url, tags) {
    var tagsFound = reader.readTagsFromData(data, tags);
    var tags = _files[url] || {};
    for (var tag in tagsFound )
    if (tagsFound.hasOwnProperty(tag)) {
      tags[tag] = tagsFound[tag];
    }
    _files[url] = tags;
  }

  ID3.getByteAt = function(data, offset) {
    return data.charCodeAt(offset) & 0xFF;
  }

  ID3.getBytesAt = function(data, iOffset, iLength) {
    var bytes = new Array(iLength);
    for (var i = 0; i < iLength; i++) {
      bytes[i] = ID3.getByteAt(data, iOffset + i);
    }
    return bytes;
  };

  ID3.isBitSetAt = function(data, offset, bit) {
    var byteVal = ID3.getByteAt(data, offset);
    return (byteVal & (1 << bit)) != 0;
  };

  ID3.getLongAt = function(data, iOffset, bBigEndian) {
    var iByte1 = ID3.getByteAt(data, iOffset);
    var iByte2 = ID3.getByteAt(data, iOffset + 1);
    var iByte3 = ID3.getByteAt(data, iOffset + 2);
    var iByte4 = ID3.getByteAt(data, iOffset + 3);

    var iLong = bBigEndian ? (((((iByte1 << 8) + iByte2) << 8) + iByte3) << 8) + iByte4 : (((((iByte4 << 8) + iByte3) << 8) + iByte2) << 8) + iByte1;
    if (iLong < 0)
      iLong += 4294967296;
    return iLong;
  };

  ID3.getStringWithCharsetAt = function(data, iOffset, iLength, iCharset) {
    var bytes = ID3.getBytesAt(data, iOffset, iLength);
    var sString;

    switch( iCharset.toLowerCase() ) {
      case 'utf-16':
      case 'utf-16le':
      case 'utf-16be':
        sString = StringUtils.readUTF16String(bytes, iCharset);
        break;

      case 'utf-8':
        sString = StringUtils.readUTF8String(bytes);
        break;

      default:
        sString = StringUtils.readNullTerminatedString(bytes);
        break;
    }

    return sString;
  };

  ID3.getAllTags = function(url) {
    if (!_files[url])
      return null;

    var tags = {}
    for (var a in _files[url]) {
      if (_files[url].hasOwnProperty(a))
        tags[a] = _files[url][a];
    }
    return tags;
  };

  ID3.getTag = function(url, tag) {
    if (!_files[url])
      return null;

    return _files[url][tag];
  };

  // Export functions for closure compiler
  ns["ID3"] = ns.ID3;
  ID3["loadTags"] = ID3.loadTags;
  ID3["getAllTags"] = ID3.getAllTags;
  ID3["getTag"] = ID3.getTag;
})(this);

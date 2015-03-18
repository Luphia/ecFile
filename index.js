'use strict';

var crypto = require('crypto');
var ecFile = function(data) { this.init(data); };

ecFile.prototype.init = function (data) {
	this.data = {};
	return this;
};

ecFile.prototype.makeCRCTable = function() {
	var c;
	var crcTable = [];
	for (var n = 0; n < 256; n++) {
		c = n;
		for (var k = 0; k < 8; k++) {
			c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
		}
		crcTable[n] = c;
	}
	return crcTable;
};

ecFile.prototype.crc32 = function(str) {
	var crcTable = this.makeCRCTable();
	var crc = 0 ^ (-1);

	for (var i = 0; i < str.length; i++) {
		crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xFF];
	}

	return (crc ^ (-1)) >>> 0;
};

ecFile.prototype.toArrayBuffer = function(buffer) {
	var a = buffer.length;
	var b = new ArrayBuffer(a);
	var view = new Uint8Array(b);
	for (var i = 0; i < a; ++i) {
		view[i] = buffer[i];
	};
	return b;
};

ecFile.prototype.toBuffer = function(ab) {
	var a = ab.byteLength;
	var buffer = new Buffer(a);
	var b = buffer.length;
	var view = new Uint8Array(ab);
	for (var i = 0; i < b; ++i) {
		buffer[i] = view[i];
	};
	return buffer;
};

ecFile.prototype.loadFile = function(blob, opt) {
	this.data.blob = blob;
	this.data.name = opt.name || 'default';
	this.data.type = opt.type || '';
	this.data.id = this.setID();
	this.data.sha1 = crypto.createHash('sha1').update(blob).digest('hex');
	this.data.size = blob.length;
};

ecFile.prototype.setID = function(id) {
	var shaObj;
	if (typeof id != 'undefined') {
		shaObj = id;
	} else {
		shaObj = crypto.createHash('sha1').update(this.data.blob).digest('hex');
	};
	return shaObj;
};

ecFile.prototype.getID = function() {
	return this.data.id;
};

ecFile.prototype.setName = function(data) {
	this.data.name = data;
};

ecFile.prototype.setType = function(data) {
	this.data.type = data
};

ecFile.prototype.reset = function () {
	var num = this.countSlice();
	this.progress = new Array(num);
};

ecFile.prototype.getProgress = function () {
	var progress = this.progress;
	var count = progress.length;
	var ok = 0;
	for (var i = 0; i < count; i++) {
		if (progress[i] == true) {
			ok += 1;
		};
	};
	var ans = ok / count;
	return ans;
};

ecFile.prototype.done = function(num) {
	num -= 1;
	this.progress[num] = true;
	var final = this.getProgress();
	if (final == 1) {
		this.callback(false, true);
	};
};

ecFile.prototype.setCallback = function(callback) {
	if (typeof (callback) != "function") {
		alert('your setCallback is not function');
		return false;
	};
	this.callback = callback;
};

ecFile.prototype.addSlice = function(data) {

	var id = data.id.split('_')[0];
	var sid = parseInt(data.id.split('_')[1], 10) - 1;
	var tid = parseInt(data.id.split('_')[2], 10);

	if (typeof this.Slice == 'undefined') {
		this.Slice = new Array(tid);
		this.progress = new Array(tid);
	};

	this.data.id = id;
	this.data.name = data.name;
	this.data.type = data.type;
	this.data.size = data.size;
	this.data.sha1 = id;
	this.progress[sid] = true;
	this.Slice[sid] = data.blob;

	var final = this.getProgress();

	if (final == 1) {
		this.data.blob = this.Slice.join('');
	};
};

ecFile.prototype.split = function (Byte) {
	this.splitByte = Byte;
	this.reset();
};

ecFile.prototype.getSliceID = function (num) {
	if (num <= 0) {
		this.callback('your getSliceID is error');
		return;
	};
	var countSlice = this.countSlice();
	var str = this.getID() + '_' + num + '_' + countSlice + '_';
	var strcrc32 = crc32(str);
	return str + strcrc32;
};

ecFile.prototype.getSlice = function (num) {
	var blob = this.data.blob;
	var splitByte = this.splitByte;
	var countSlice = this.countSlice();
	var temp = splitByte;
	var id = this.getSliceID(num);
	var type = this.data.type;

	if (countSlice == num && this.data.size < splitByte) {
		var slblob = blob.slice(0, this.data.size, type);
		var data = {
			id: id,
			type: 'EasyFile',
			sha1: crypto.createHash('sha1').update(slblob).digest('hex'),
			blob: slblob
		};
		return data;
	} else if (countSlice >= num && this.data.size > splitByte) {
		var start = temp * num - temp;
		var end = temp * num;

		var slblob = blob.slice(start, end, type);
		var data = {
			id: id,
			type: 'EasyFile',
			sha1: crypto.createHash('sha1').update(slblob).digest('hex'),
			blob: slblob
		};
		return data;
	} else {
		this.callback('your getSlice is error');
		return;
	};
};

ecFile.prototype.countSlice = function () {
	var blob = this.data.blob;
	var splitByte = this.splitByte;
	var a = this.data.size;
	var b = splitByte;
	var c = Math.floor(a / b);
	var d = a % b;

	if (d > 0) {
		return c + 1;
	} else {
		return c;
	};
};

ecFile.prototype.toJSON = function () {
	var data = {
		id: this.data.id,
		name: this.data.name,
		type: this.data.type,
		size: this.data.size,
		sha1: this.data.sha1,
		blob: this.data.blob
	};
	return data;
};
ecFile.prototype.toBase64 = function (blob, cb) {
	var bufferBase64 = new Buffer(blob, 'binary').toString('base64');
	cb(bufferBase64);
};
ecFile.prototype.toBlob = function () {
	return this.toArrayBuffer(this.data.blob);
};

module.exports = EasyFile;
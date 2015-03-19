'use strict';
/*
var ecFile = require("./index.js")
var fs = require("fs")
var ecfile = new ecFile()
var file = fs.readFileSync("xls1.xlsx")
ecfile.loadFile(file)

var json = ecfile.toJSON();
var ecfile2 = new ecFile();
var ecfile3 = new ecFile();

ecfile.split(1024);
ecfile.typeof(ecfile.getSlice(1)) == 'ecSlice';

for(i=1; i<= ecfile.countSlice(); i++) {
var slice = ecfile.getSlice(i);
ecfile2.loadSlice(slice);
}

console.log(ecfile.toBase64() == ecfile2.toBase64());
console.log(JSON.stringify(ecfile.toJSON()) == JSON.stringify(ecfile2.toJSON()));

*/

var crypto = require('crypto');
var ecFile = function(data) { this.init(data); };

ecFile.prototype.init = function (data) {
	this.data = {};
	this.callback = function() {};

	var type = this.typeof(data);
	if(Buffer.isBuffer(data)) {
		this.loadFile(data);
	}
	else if(type == 'string') {
		var buffer = new Buffer(data, 'base64');
		this.loadFile(buffer);
	}
	else if(type == 'ecFile') {
		var buffer = new Buffer(data.blob, 'base64');
		this.loadFile(buffer, data);
	}
	else if(type == 'ecSlice') {
		this.loadSlice(data);
	}

	return this;
};

ecFile.prototype.typeof = function(data) {
	var f = data || {};
	var type = typeof(data);
	if(type == 'object') {
		if(typeof(f.id) == 'string' && f.id.split("_").length == 4 && this.crc32(f.id.substr(0,47)) == f.id.substr(47)) {
			type = "ecSlice";
		}
		else if(f.blob) {
			type = "ecFile";
		}
	}

	return type;
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

ecFile.prototype.toArrayBuffer = function(blob) {
	var a = blob.length;
	var b = new ArrayBuffer(a);
	var view = new Uint8Array(b);
	for (var i = 0; i < a; ++i) {
		view[i] = blob[i];
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
	if(!opt) { opt = {}; }

	this.data.id = this.setID();
	this.data.name = opt.name || this.data.id || 'default';
	this.data.type = opt.type || '';
	
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

ecFile.prototype.loadSlice = function(data) {

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
	this.Slice[sid] = new Buffer(data.blob, 'base64');

	var final = this.getProgress();

	if (final == 1) {
		this.data.blob = Buffer.concat(this.Slice);
	};
};

ecFile.prototype.split = function (Byte) {
	this.splitByte = Byte;
	this.reset();
};

ecFile.prototype.getSliceID = function(num) {
	if (!num || num <= 0) { return false; }

	var countSlice = this.countSlice();
	var str = this.getID() + '_' + num + '_' + countSlice + '_';
	var strcrc32 = this.crc32(str);
	return str + strcrc32;
};

ecFile.prototype.getSlice = function(num) {
	if(!num || num <= 0) { return false; }

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
			name: this.data.name,
			sha1: crypto.createHash('sha1').update(slblob).digest('hex'),
			blob: new Buffer(slblob, 'binary').toString('base64')
		};
		return data;
	} else if (countSlice >= num && this.data.size > splitByte) {
		var start = temp * num - temp;
		var end = temp * num;

		var slblob = blob.slice(start, end, type);
		var data = {
			id: id,
			name: this.data.name,
			sha1: crypto.createHash('sha1').update(slblob).digest('hex'),
			blob: new Buffer(slblob, 'binary').toString('base64')
		};
		return data;
	} else {
		return false;
	};
};

ecFile.prototype.countSlice = function() {
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
		blob: this.toBase64()
	};
	return data;
};
ecFile.prototype.toBase64 = function () {
	var bufferBase64 = new Buffer(this.data.blob, 'binary').toString('base64');
	return bufferBase64;
};
ecFile.prototype.toBlob = function () {
	return this.toArrayBuffer(this.data.blob);
};

module.exports = ecFile;
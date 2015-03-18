# ecFile
Make file operation Easy

## Memo
- html5 file api
http://www.html5rocks.com/en/tutorials/file/dndfiles/

- file data
```code
{
	id: [sha1]
	name: [file name] 
	type: [file type]
	size: [file size]
	sha1: [file hash] 
	blob
}
```

- slice data
```code
{
	id: [fileID]_[slice number]_[total slices]_[CRC]
	type: EasyFile
	sha1
	blob
}
```

- setID
- getID

- reset
- getProgress
- done
- setCallback

- addSlice

- split
- getSliceID
- getSlice
- countSlice

- toJSON
- toBase64
- toBlob

import fs from "fs";

/**
 * Read lines from `filename`, starting at the end and working backward. Each
 * call to `next()` either sends the line next closest to file beginning, or `null`
 * if there are no more lines left.
 */
export class BackwardLineReader {
  fd: number; // file descriptor for the file being read
  pos: number; // next starting position from which to read
  initialChunkSize = 1024 * 64; // default bytes to read each time
  chunkSize: number; // bytes to read the next time (smaller if beginning of file)
  buffer: Buffer; // buffer to handle data just read from the file until it's line-split
  leftover = ""; // text from last read that might not be a standalone line
  lines: string[] = []; // complete lines read from the file and waiting to be consumed
  isOpen = false; // true when the file is open and more can be read

  constructor(filename: string) {
    // start with normal sized read chunks, until we get to the beginning of the file
    this.chunkSize = this.initialChunkSize;
    // first position to read is one chunk back from end of file
    this.pos = fs.statSync(filename).size - this.chunkSize;
    this.fd = fs.openSync(filename, "r");
    this.isOpen = true;
    this.buffer = Buffer.alloc(this.initialChunkSize);
  }

  next(): string | null {
    // if there's full lines waiting, just send the next one
    if (this.lines.length > 0) return this.lines.pop()!;
    // if there's no full lines left, and the file isn't open anymore, we're done
    if (!this.isOpen) return null;

    // normally read into the buffer from index 0, unless this won't be a full chunk's worth
    let bufZeroPos = this.initialChunkSize - this.chunkSize;
    let bytesRead = fs.readSync(
      this.fd,
      this.buffer,
      bufZeroPos,
      this.chunkSize,
      this.pos
    );
    // if we didn't read in a full buffer's worth, slice it to what was actually new
    if (bufZeroPos != 0) {
      this.buffer = this.buffer.slice(bufZeroPos);
    }

    // nothing more to read in, but still need to process what was obtained on this read
    if (bytesRead < this.initialChunkSize) {
      fs.closeSync(this.fd);
      this.isOpen = false;
    }

    // move the next read position back by one chunk length (or to zero)
    this.pos -= this.chunkSize;
    if (this.pos < 0) {
      this.chunkSize = this.initialChunkSize + this.pos;
      this.pos = 0;
    }

    // append leftover text from last time to what was just read in
    this.leftover = this.buffer.toString().trim() + this.leftover;

    // split buffered content by newlines
    let newLines = this.leftover.split("\n");

    // if the end of the file is reached, there are no leftovers
    if (this.isOpen) this.leftover = newLines.shift() || "";

    this.lines.push(...newLines);
    return this.lines.pop()!;
  }
}

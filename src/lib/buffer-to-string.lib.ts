
export function bufferToString(buffer: Buffer) {
  let str = '';

  for (let i = 0; i < buffer.length; i++) {
    str += `${buffer.subarray(i, i + 1).toString('hex')} `;
  }

  return `<Buffer ${str.trim()}>`;
}
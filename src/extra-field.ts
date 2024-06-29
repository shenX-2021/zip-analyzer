export interface ExtraFieldBase {
  headerId: number;
  dataSize: number;
}

export interface ExtraFieldZip64 extends ExtraFieldBase {
  headerId: 0x0001;
  uncompressedSize: BigInt;
}

export interface ExtraFieldMOPGH extends ExtraFieldBase {
  headerId: 0xa220;
  sig: Buffer;
  padVal: Buffer;
  padding: Buffer;
}

export const extraFieldHandlerMap: {
  [p: number]: (buffer: Buffer) => ExtraFieldBase;
} = {
  0x0001: formatExtraFieldZip64,
  0xa220: formatExtraFieldMOPGH,
};

/**
 * get extra field list
 */
export function getExtraFieldList(buffer: Buffer): ExtraFieldBase[] {
  let prevOffset = 0;
  let offset = 0;
  const extraFieldList: ExtraFieldBase[] = [];

  while (offset < buffer.length) {
    offset += 2;
    const dataSize = buffer.subarray(offset, (offset += 2)).readUInt16LE();

    extraFieldList.push(
      formatExtraField(buffer.subarray(prevOffset, (offset += dataSize))),
    );

    prevOffset = offset;
  }

  return extraFieldList;
}

/**
 * format different extra field data
 */
export function formatExtraField(buffer: Buffer): ExtraFieldBase {
  const headerId = buffer.subarray(0, 2).readUInt16LE();
  const func = extraFieldHandlerMap[headerId];

  if (!func) {
    throw new Error(
      `not implemented handler(header id: ${toString(buffer.subarray(0, 2))}), please implemment it yourself`,
    );
  }
  const extraField = func(buffer);

  return extraField;
}

/**
 * format different extra field data - Zip64 extended information extra field
 */
export function formatExtraFieldZip64(buffer: Buffer): ExtraFieldBase {
  let offset = 0;
  const headerId = buffer.subarray(offset, (offset += 2)).readUInt16LE();
  if (headerId !== 0x0001) {
    throw new Error(
      `error header id ${headerId}, header id of \`Zip64 extended information extra field\` is ${0x0001}`,
    );
  }
  const dataSize = buffer.subarray(offset, (offset += 2)).readUInt16LE();
  const uncompressedSize = buffer
    .subarray(offset, (offset += 8))
    .readBigUInt64LE();

  return {
    headerId,
    dataSize,
    uncompressedSize,
  } as ExtraFieldBase;
}

/**
 * format different extra field data - Microsoft Open Packaging Growth Hint
 */
export function formatExtraFieldMOPGH(buffer: Buffer): ExtraFieldBase {
  let offset = 0;
  const headerId = buffer.subarray(offset, (offset += 2)).readUInt16LE();
  if (headerId !== 0xa220) {
    throw new Error(
      `error header id ${headerId}, header id of \`Microsoft Open Packaging Growth Hint\` is ${0xa220}`,
    );
  }
  const dataSize = buffer.subarray(offset, (offset += 2)).readUInt16LE();
  const sig = buffer.subarray(offset, (offset += 2));
  const padVal = buffer.subarray(offset, (offset += 2));
  const padding = buffer.subarray(offset, (offset += dataSize - 4));

  return {
    headerId,
    dataSize,
    sig,
    padVal,
    padding,
  } as ExtraFieldBase;
}

function toString(buffer: Buffer) {
  let str = '';

  for (let i = 0; i < buffer.length; i++) {
    str += `${buffer.subarray(i, i + 1).toString('hex')} `;
  }

  return `<Buffer ${str.trim()}>`;
}

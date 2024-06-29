import path from 'path';
import fsp from 'fs/promises';
import { ExtraFieldBase, getExtraFieldList } from './extra-field';

export interface CentralDirEndRecord {
  signature: Buffer;
  diskNumber: number;
  centralDirStartDiskNumber: number;
  diskCentralDirCount: number;
  centralDirCount: number;
  centralDirSize: number;
  centralDirOffset: number;
  fileCommentLength: number;
  fileComment: string;
  size: number;
  offset: number;
}

export interface CentralDirHeader {
  signature: Buffer;
  compressedVersion: number;
  extractVersion: number;
  flag: number;
  compressionMethod: number;
  lastModTime: number;
  lastModDate: number;
  crc32: number;
  compressedSize: number;
  uncompressedSize: number;
  filenameLength: number;
  extraFieldLength: number;
  fileCommentLength: number;
  startDiskNumber: number;
  internalFileAttr: Buffer;
  externalFileAttr: Buffer;
  lfhOffset: number;
  lfh: LocalFileHeader;
  filename: string;
  extraFieldList: ExtraFieldBase[];
  fileComment: string;
  size: number;
  offset: number;
}

export interface LocalFileHeader {
  signature: Buffer;
  extractVersion: number;
  flag: number;
  compressionMethod: number;
  lastModTime: number;
  lastModDate: number;
  crc32: number;
  compressedSize: number;
  uncompressedSize: number;
  filenameLength: number;
  extraFieldLength: number;
  filename: string;
  extraFieldList: ExtraFieldBase[];
  data: Buffer;
  size: number;
  offset: number;
}

export class Analyzer {
  private centralDirEndRecord: CentralDirEndRecord;
  private centralDirHeaderList: CentralDirHeader[];

  async analysis(filePath: string) {
    const buffer = await fsp.readFile(filePath);

    this.centralDirEndRecord = this.getCentralDirEndRecord(buffer);
    this.centralDirHeaderList = this.getCentralDirHeaderList(buffer);

    console.log(this.centralDirHeaderList);
  }

  /**
   * get end of central directory record
   */
  private getCentralDirEndRecord(originalBuffer: Buffer): CentralDirEndRecord {
    const locator = Buffer.from([0x50, 0x4b, 0x05, 0x06]);
    const idx = originalBuffer.lastIndexOf(locator);
    if (idx < 0) {
      throw new Error(`can't find signature of end of central record.`);
    }
    const buffer = originalBuffer.subarray(idx);

    let offset = 0;

    const signature = buffer.subarray(offset, (offset += 4));
    const diskNumber = buffer.subarray(offset, (offset += 2)).readUInt16LE();
    const centralDirStartDiskNumber = buffer
      .subarray(offset, (offset += 2))
      .readUInt16LE();
    const diskCentralDirCount = buffer
      .subarray(offset, (offset += 2))
      .readUint16LE();
    const centralDirCount = buffer
      .subarray(offset, (offset += 2))
      .readUInt16LE();
    const centralDirSize = buffer
      .subarray(offset, (offset += 4))
      .readUInt32LE();
    const centralDirOffset = buffer
      .subarray(offset, (offset += 4))
      .readUint32LE();
    const fileCommentLength = buffer
      .subarray(offset, (offset += 2))
      .readUint16LE();
    const fileComment = buffer
      .subarray(offset, (offset += fileCommentLength))
      .toString();

    return {
      signature,
      diskNumber,
      centralDirStartDiskNumber,
      diskCentralDirCount,
      centralDirCount,
      centralDirSize,
      centralDirOffset,
      fileCommentLength,
      fileComment,
      offset: idx,
      size: offset,
    };
  }

  /**
   * get central directory header list
   */
  private getCentralDirHeaderList(originalBuffer: Buffer): CentralDirHeader[] {
    const locator = Buffer.from([0x50, 0x4b, 0x01, 0x02]);
    const { centralDirOffset, centralDirSize, centralDirCount } =
      this.centralDirEndRecord;
    const buffer = originalBuffer.subarray(
      centralDirOffset,
      centralDirOffset + centralDirSize,
    );
    // const idx = originalBuffer.lastIndexOf(locator);
    // if (idx < 0) {
    //   throw new Error(`can't find signature of end of central record.`);
    // }

    let offset = 0;
    let prevOffset = 0;
    const centralDirHeaderList: CentralDirHeader[] = [];

    while (centralDirHeaderList.length < centralDirCount) {
      const signature = buffer.subarray(offset, (offset += 4));
      if (Buffer.compare(signature, locator) !== 0) {
        throw new Error(
          `signature(${signature}) of central directory header is illegal, legal value is ${locator}`,
        );
      }
      const compressedVersion = buffer
        .subarray(offset, (offset += 2))
        .readUInt16LE();
      const extractVersion = buffer
        .subarray(offset, (offset += 2))
        .readUInt16LE();
      const flag = buffer.subarray(offset, (offset += 2)).readUInt16LE();
      const compressionMethod = buffer
        .subarray(offset, (offset += 2))
        .readUInt16LE();
      const lastModTime = buffer.subarray(offset, (offset += 2)).readUInt16LE();
      const lastModDate = buffer.subarray(offset, (offset += 2)).readUInt16LE();
      const crc32 = buffer.subarray(offset, (offset += 4)).readUInt16LE();
      const compressedSize = buffer
        .subarray(offset, (offset += 4))
        .readUInt16LE();
      const uncompressedSize = buffer
        .subarray(offset, (offset += 4))
        .readUInt16LE();
      const filenameLength = buffer
        .subarray(offset, (offset += 2))
        .readUInt16LE();
      const extraFieldLength = buffer
        .subarray(offset, (offset += 2))
        .readUInt16LE();
      const fileCommentLength = buffer
        .subarray(offset, (offset += 2))
        .readUInt16LE();
      const startDiskNumber = buffer
        .subarray(offset, (offset += 2))
        .readUInt16LE();
      const internalFileAttr = buffer.subarray(offset, (offset += 2));
      const externalFileAttr = buffer.subarray(offset, (offset += 4));
      const lfhOffset = buffer.subarray(offset, (offset += 4)).readUInt16LE();
      const filename = buffer
        .subarray(offset, (offset += filenameLength))
        .toString();
      const extraFieldList = getExtraFieldList(
        buffer.subarray(offset, (offset += extraFieldLength)),
      );
      const fileComment = buffer
        .subarray(offset, (offset += fileCommentLength))
        .toString();

      console.log(filename, centralDirHeaderList.length, offset, lfhOffset);
      centralDirHeaderList.push({
        signature,
        compressedVersion,
        extractVersion,
        flag,
        compressionMethod,
        lastModDate,
        lastModTime,
        crc32,
        compressedSize,
        uncompressedSize,
        filenameLength,
        extraFieldLength,
        fileCommentLength,
        startDiskNumber,
        filename,
        extraFieldList,
        fileComment,
        internalFileAttr,
        externalFileAttr,
        lfhOffset,
        lfh: this.getLFH(originalBuffer, lfhOffset),
        offset: centralDirOffset + prevOffset,
        size: offset - prevOffset,
      });
      prevOffset = offset;
    }

    return centralDirHeaderList;
  }

  /**
   * get local file header
   */
  private getLFH(originalBuffer: Buffer, lfhOffset: number): LocalFileHeader {
    const buffer = originalBuffer.subarray(lfhOffset);
    const locator = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

    let offset = 0;

    const signature = buffer.subarray(offset, (offset += 4));
    if (Buffer.compare(signature, locator) !== 0) {
      throw new Error(
        `signature(${signature}) of central directory header is illegal, legal value is ${locator}`,
      );
    }
    const extractVersion = buffer
      .subarray(offset, (offset += 2))
      .readUInt16LE();
    const flag = buffer.subarray(offset, (offset += 2)).readUInt16LE();
    const compressionMethod = buffer
      .subarray(offset, (offset += 2))
      .readUInt16LE();
    const lastModTime = buffer.subarray(offset, (offset += 2)).readUInt16LE();
    const lastModDate = buffer.subarray(offset, (offset += 2)).readUInt16LE();
    const crc32 = buffer.subarray(offset, (offset += 4)).readUInt16LE();
    const compressedSize = buffer
      .subarray(offset, (offset += 4))
      .readUInt16LE();
    const uncompressedSize = buffer
      .subarray(offset, (offset += 4))
      .readUInt16LE();
    const filenameLength = buffer
      .subarray(offset, (offset += 2))
      .readUInt16LE();
    const extraFieldLength = buffer
      .subarray(offset, (offset += 2))
      .readUInt16LE();
    const filename = buffer
      .subarray(offset, (offset += filenameLength))
      .toString();
    const extraFieldList = getExtraFieldList(
      buffer.subarray(offset, (offset += extraFieldLength)),
    );
    const data = buffer.subarray(offset, (offset += compressedSize));
    if (data.length !== compressedSize) {
      throw new Error(
        `data size(${data.length}) is different from compressed size(${compressedSize})`,
      );
    }

    return {
      signature,
      extractVersion,
      flag,
      compressionMethod,
      lastModDate,
      lastModTime,
      crc32,
      compressedSize,
      uncompressedSize,
      filenameLength,
      extraFieldLength,
      filename,
      extraFieldList,
      offset: lfhOffset,
      size: offset,
      data,
    };
  }
}

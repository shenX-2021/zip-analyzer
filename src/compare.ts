import { Analyzer, CentralDirHeader, LocalFileHeader } from './analyzer';
import { bufferToString } from './lib/index';

export interface FormatAnalyzerData {
  analyzer: Analyzer;
  onlyFilenameList: string[];
  centralDirHeaderMap: Record<string, CentralDirHeader>;
}

export function compare(a1: Analyzer, a2: Analyzer) {
  if (!a1.done || !a2.done) {
    throw new Error(
      'a1 or a2 are lack of analysising, please call `analysis` method before compare',
    );
  }

  const f1: FormatAnalyzerData = {
    analyzer: a1,
    onlyFilenameList: [],
    centralDirHeaderMap: {},
  };
  const f2: FormatAnalyzerData = {
    analyzer: a2,
    onlyFilenameList: [],
    centralDirHeaderMap: {},
  };

  const commonFilenameList = formatAnalyzer(f1, f2);
  for (const filename of commonFilenameList) {
    _compare(
      f1.centralDirHeaderMap[filename],
      f2.centralDirHeaderMap[filename],
    );
  }
}

interface LogData {
  key: keyof CentralDirHeader | keyof LocalFileHeader;
  message: string;
  type: unknown;
}

function _compare(c1: CentralDirHeader, c2: CentralDirHeader) {
  console.log(
    '---------------------------------------------------------------',
  );
  console.log('\x1B[34mcompare file name:', c1.filename, '\x1B[37m');
  const list: LogData[] = [
    {
      key: 'signature',
      message: 'signature',
      type: 'Buffer',
    },
    {
      key: 'compressedVersion',
      message: 'compressed version',
      type: 'number',
    },
    {
      key: 'extractVersion',
      message: 'extract version',
      type: 'number',
    },
    {
      key: 'flag',
      message: 'flag',
      type: 'number',
    },
    {
      key: 'compressionMethod',
      message: 'compression method',
      type: 'number',
    },
    {
      key: 'lastModTime',
      message: 'last modified file time',
      type: 'number',
    },
    {
      key: 'lastModDate',
      message: 'last modified file date',
      type: 'number',
    },
    {
      key: 'crc32',
      message: 'crc32',
      type: 'number',
    },
    {
      key: 'compressedSize',
      message: 'compressed size',
      type: 'number',
    },
    {
      key: 'uncompressedSize',
      message: 'uncompressed size',
      type: 'number',
    },
    {
      key: 'filenameLength',
      message: 'file name length',
      type: 'number',
    },
    {
      key: 'extraFieldLength',
      message: 'extra field length',
      type: 'number',
    },
    {
      key: 'fileCommentLength',
      message: 'file comment length',
      type: 'number',
    },
    {
      key: 'startDiskNumber',
      message: 'disk number start',
      type: 'number',
    },
    {
      key: 'internalFileAttr',
      message: 'internal file attr',
      type: 'Buffer',
    },
    {
      key: 'externalFileAttr',
      message: 'external file attr',
      type: 'Buffer',
    },
    {
      key: 'lfhOffset',
      message: 'local file header offset',
      type: 'number',
    },
    {
      key: 'filename',
      message: 'filename',
      type: 'number',
    },
    {
      key: 'fileComment',
      message: 'file comment',
      type: 'string',
    },
    {
      key: 'size',
      message: 'size',
      type: 'number',
    },
    {
      key: 'offset',
      message: 'offset',
      type: 'number',
    },
  ];
  for (const item of list) {
    log(item, c1[item.key], c2[item.key]);
  }
  console.log('extra field list:', c1.extraFieldList, c2.extraFieldList);

  const lfhList: LogData[] = [
    {
      key: 'signature',
      message: 'signature',
      type: 'Buffer',
    },
    {
      key: 'extractVersion',
      message: 'extract version',
      type: 'number',
    },
    {
      key: 'flag',
      message: 'flag',
      type: 'number',
    },
    {
      key: 'compressionMethod',
      message: 'compression method',
      type: 'number',
    },
    {
      key: 'lastModTime',
      message: 'last modified file time',
      type: 'number',
    },
    {
      key: 'lastModDate',
      message: 'last modified file date',
      type: 'number',
    },
    {
      key: 'crc32',
      message: 'crc32',
      type: 'number',
    },
    {
      key: 'compressedSize',
      message: 'compressed size',
      type: 'number',
    },
    {
      key: 'uncompressedSize',
      message: 'uncompressed size',
      type: 'number',
    },
    {
      key: 'filenameLength',
      message: 'file name length',
      type: 'number',
    },
    {
      key: 'extraFieldLength',
      message: 'extra field length',
      type: 'number',
    },
    {
      key: 'filename',
      message: 'filename',
      type: 'number',
    },
    {
      key: 'size',
      message: 'size',
      type: 'number',
    },
    {
      key: 'offset',
      message: 'offset',
      type: 'number',
    },
  ];
  console.log('\r\n\x1B[34mlocal file header:\x1B[37m');
  for (const item of lfhList) {
    log(item, c1.lfh[item.key], c2.lfh[item.key]);
  }
  console.log(
    'extra field list:',
    c1.lfh.extraFieldList,
    c2.lfh.extraFieldList,
  );
  console.log(
    '---------------------------------------------------------------',
  );
}

function log(data: LogData, v1: any, v2: any) {
  const { key, message, type } = data;
  let color = '\x1B[37m';

  if (type === 'Buffer') {
    color = Buffer.compare(v1, v2) === 0 ? '\x1B[37m' : '\x1B[31m';
    v1 = bufferToString(v1);
    v2 = bufferToString(v2);
  } else {
    color = v1 === v2 ? '\x1B[37m' : '\x1B[31m';
  }
  console.log(`\x1B[37m${message}: ${color} ${v1}, ${v2}\x1B[37m`);
}

function formatAnalyzer(f1: FormatAnalyzerData, f2: FormatAnalyzerData) {
  const commonFilenameList: string[] = [];

  const only1: Record<string, boolean> = {};
  for (const item of f1.analyzer.centralDirHeaderList) {
    f1.centralDirHeaderMap[item.filename] = item;
    only1[item.filename] = true;
  }

  const only2: Record<string, boolean> = {};
  for (const item of f2.analyzer.centralDirHeaderList) {
    f2.centralDirHeaderMap[item.filename] = item;
    if (only1[item.filename]) {
      delete only1[item.filename];
      commonFilenameList.push(item.filename);
    } else {
      only2[item.filename] = true;
    }
  }

  f1.onlyFilenameList = Object.keys(only1);
  f2.onlyFilenameList = Object.keys(only2);

  return commonFilenameList;
}

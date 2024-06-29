import path from 'path';
import { Analyzer } from '../src/analyzer';

async function boostrap() {
  const p1 = path.join(__dirname, './50000-3000-copy.xlsx');

  const a1 = new Analyzer();
  await a1.analysis(p1);
}

boostrap();

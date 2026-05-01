/**
 * Zobrist hashing for positions.
 * RC4-derived random stream generates keyTable/lockTable.
 * pcIdx mapping: red 8..14 → 0..6, black 16..22 → 7..13.
 * Ported verbatim from legacy/js/core/zobrist.js so that the output is
 * bit-identical across Node and browser runtimes (enforced by the
 * companion golden-value test).
 */

class RC4 {
  private x = 0;
  private y = 0;
  private readonly state: number[];

  constructor(key: readonly number[]) {
    this.state = [];
    for (let i = 0; i < 256; i++) {
      this.state.push(i);
    }
    let j = 0;
    for (let i = 0; i < 256; i++) {
      j = (j + this.state[i]! + key[i % key.length]!) & 0xFF;
      this.swap(i, j);
    }
  }

  private swap(i: number, j: number): void {
    const t = this.state[i]!;
    this.state[i] = this.state[j]!;
    this.state[j] = t;
  }

  nextByte(): number {
    this.x = (this.x + 1) & 0xFF;
    this.y = (this.y + this.state[this.x]!) & 0xFF;
    this.swap(this.x, this.y);
    return this.state[(this.state[this.x]! + this.state[this.y]!) & 0xFF]!;
  }

  nextLong(): number {
    const n0 = this.nextByte();
    const n1 = this.nextByte();
    const n2 = this.nextByte();
    const n3 = this.nextByte();
    return n0 + (n1 << 8) + (n2 << 16) + ((n3 << 24) & 0xFFFFFFFF);
  }
}

export interface ZobristTables {
  readonly playerKey: number;
  readonly playerLock: number;
  readonly keyTable: readonly (readonly number[])[];
  readonly lockTable: readonly (readonly number[])[];
}

function buildZobristTables(): ZobristTables {
  const rc4 = new RC4([0]);

  const playerKey = rc4.nextLong();
  rc4.nextLong(); // skip — matches legacy sequence
  const playerLock = rc4.nextLong();

  const keyTable: number[][] = [];
  const lockTable: number[][] = [];

  for (let i = 0; i < 14; i++) {
    const keys: number[] = [];
    const locks: number[] = [];
    for (let j = 0; j < 256; j++) {
      keys.push(rc4.nextLong());
      rc4.nextLong(); // skip — matches legacy sequence
      locks.push(rc4.nextLong());
    }
    keyTable.push(keys);
    lockTable.push(locks);
  }

  return { playerKey, playerLock, keyTable, lockTable };
}

/** Singleton: all positions share one table. */
export const ZOBRIST: ZobristTables = buildZobristTables();

/**
 * Map piece code to zobrist table row index.
 * Red 8..14 → 0..6; black 16..22 → 7..13.
 */
export function zobristPcIdx(pc: number): number {
  return pc < 16 ? pc - 8 : pc - 16 + 7;
}

/**
 * Mate-in-1 puzzle FENs ported verbatim from legacy/js/test.js.
 * Each FEN is a position where the side to move has a forced mate in one.
 * Used for perft/search regression tests to lock current engine behaviour.
 */
export const MATE_IN_1_PUZZLES: readonly string[] = Object.freeze([
  '9/2Cca4/3k1C3/4P1p2/4N1b2/4R1r2/4c1n2/3p1n3/2rNK4/9 w',
  '4C4/4a4/b2ank2b/9/9/1RNR1crC1/3r1p3/3cKA3/4A4/4n4 w',
  '9/4a4/3k1a3/2R3r2/1N5n1/C7c/1N5n1/2R3r2/3p1p3/4K4 w',
  '9/4P4/2NakaR2/3P1P3/2pP1cb2/3r1c3/1rPNppCn1/3K1A3/2p3n2/9 w',
  '9/9/4Nk3/3c2p2/3r2P2/3p2B2/3p2r2/4KC3/9/9 w',
  '9/9/3k1N3/9/1C5N1/9/1n5r1/9/3p1K3/9 w',
  '9/9/3a1k3/9/1N5N1/4R4/1n5r1/9/3K1p3/9 w',
  '9/3Rak3/3a1n3/1PpP1PPR1/1P5n1/1rBp1pcp1/3C1p3/3Kcr3/9/9 w',
  '9/9/5k1N1/4p1P1p/3P1C1C1/2N1r1r2/9/3ABK3/2ncpp3/1pBAc4 w',
  '1nb1ka3/4a4/4c4/2p1C4/9/3Rcr3/P8/n3C4/4Apr2/4KA3 w',
  '1PP1kab2/1R2a4/4b3R/4C4/1C7/r8/9/2n6/3p1r3/4K4 w',
  '4k4/6P2/3rP2P1/2P6/9/9/9/9/9/4K4 w',
  '3k5/5P3/3a1r3/9/9/9/9/2R6/7p1/4K4 w',
  '9/1P2k4/3a1a3/4P4/8r/9/2R6/3n5/4p4/5K3 w',
  '3aka3/3P5/7R1/4r2C1/6C2/6R2/9/3p1n3/4p4/3K5 w',
  '4ka3/2R1a4/7N1/9/9/9/4p4/2C6/2p1p1r2/1R3K3 w',
  '4k1b2/4CP3/4b4/4p4/4P4/9/4n4/3KB4/4r4/4n1rC1 w',
  '3a1k3/1C7/3a1P3/4N4/9/3n2C2/9/9/1rp1p4/3K5 w',
  '2bakcb2/1n1C1R3/9/4C4/2p1p1p2/9/2N6/6n2/3pAp1r1/4K3c w',
  '4kar2/4a2nn/4bc3/RN1r5/2bC5/9/4p4/9/4p4/3p1K3 w',
]) as readonly string[];

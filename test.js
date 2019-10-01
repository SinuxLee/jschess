"use strict";

let PUZZLE_LIST = [
    "9/2Cca4/3k1C3/4P1p2/4N1b2/4R1r2/4c1n2/3p1n3/2rNK4/9 w",
    "4C4/4a4/b2ank2b/9/9/1RNR1crC1/3r1p3/3cKA3/4A4/4n4 w",
    "9/4a4/3k1a3/2R3r2/1N5n1/C7c/1N5n1/2R3r2/3p1p3/4K4 w",
    "9/4P4/2NakaR2/3P1P3/2pP1cb2/3r1c3/1rPNppCn1/3K1A3/2p3n2/9 w",
    "9/9/4Nk3/3c2p2/3r2P2/3p2B2/3p2r2/4KC3/9/9 w",
    "9/9/3k1N3/9/1C5N1/9/1n5r1/9/3p1K3/9 w",
    "9/9/3a1k3/9/1N5N1/4R4/1n5r1/9/3K1p3/9 w",
    "9/3Rak3/3a1n3/1PpP1PPR1/1P5n1/1rBp1pcp1/3C1p3/3Kcr3/9/9 w",
    "9/9/5k1N1/4p1P1p/3P1C1C1/2N1r1r2/9/3ABK3/2ncpp3/1pBAc4 w",
    "1nb1ka3/4a4/4c4/2p1C4/9/3Rcr3/P8/n3C4/4Apr2/4KA3 w",
    "1PP1kab2/1R2a4/4b3R/4C4/1C7/r8/9/2n6/3p1r3/4K4 w",
    "4k4/6P2/3rP2P1/2P6/9/9/9/9/9/4K4 w",
    "3k5/5P3/3a1r3/9/9/9/9/2R6/7p1/4K4 w",
    "9/1P2k4/3a1a3/4P4/8r/9/2R6/3n5/4p4/5K3 w",
    "3aka3/3P5/7R1/4r2C1/6C2/6R2/9/3p1n3/4p4/3K5 w",
    "4ka3/2R1a4/7N1/9/9/9/4p4/2C6/2p1p1r2/1R3K3 w",
    "4k1b2/4CP3/4b4/4p4/4P4/9/4n4/3KB4/4r4/4n1rC1 w",
    "3a1k3/1C7/3a1P3/4N4/9/3n2C2/9/9/1rp1p4/3K5 w",
    "2bakcb2/1n1C1R3/9/4C4/2p1p1p2/9/2N6/6n2/3pAp1r1/4K3c w",
    "4kar2/4a2nn/4bc3/RN1r5/2bC5/9/4p4/9/4p4/3p1K3 w",
    "2bak1P2/4a4/9/6N2/9/9/9/C1nC5/1c1pRp2r/3cK4 w",
    "9/3R5/2C1k4/9/1N2P4/9/9/5n3/1r2p4/3K5 w",
    "2ca1k3/4P1r1R/4ba3/7Cp/8r/7C1/7n1/9/3p1pp2/3nK4 w",
    "9/5k3/3R5/9/2N6/9/6N2/9/1pp1p1c2/CrBK5 w",
    "1r4r2/3ca4/4k4/2pc1P3/9/9/9/9/5K1n1/5R1RC w",
    "3akab2/1C6c/N3b4/9/1N7/9/9/C8/n4p3/rc2K1p2 w",
    "2n6/6N2/3k5/2P6/9/9/2p6/1C6C/4p1r2/5K3 w",
    "4kab2/1N1Pa4/4b4/3N2p2/6Pn1/9/2P6/2n6/2p1Ap3/3AK2p1 w",
    "2ba1kbRC/2N1a4/9/4p4/4c1p2/9/9/1p2B1r2/4r1n2/3K2B2 w",
    "2bak1b1N/9/2n1ca3/3R1C3/9/9/9/C3B4/c3p2p1/1rB2K3 w",
    "2b2a2c/4a1P2/3kb4/2PN5/2nR5/9/4n4/9/4p4/5K1p1 w",
    "3k2r2/2P1a4/9/9/4N4/7r1/9/4B3C/9/4RK3 w",
    "3nk4/2P1a3R/4r4/4P4/2NC5/9/9/9/4p1p2/2r1cK3 w",
    "C3kab1r/2C1a4/b1n5c/1N7/9/9/9/9/2pc1p3/4K4 w",
    "5k2c/3PP3r/5n2b/6N2/9/8C/9/9/2r2p3/4K4 w",
    "5k3/1P7/2PP1a1P1/9/9/4R4/9/5p3/3p1p3/1p2K4 w",
    "5k3/3Cc1P1r/2c2N3/9/9/9/9/9/3p2r2/3CKR3 w",
    "3k1ar2/2P1a4/3P5/9/9/9/9/7C1/2p2p3/4K1C2 w",
    "r1b1ka3/3Pa4/b8/9/9/9/9/1C4p2/9/c3K4 w",
    "4k1P2/4a1P2/3Rb4/6R2/9/N8/9/4p4/2p1pp3/3K2p2 w",
    "9/3Pak3/9/4P4/2b6/9/9/9/9/4K4 w",
    "3k5/4c4/9/9/RR1N5/9/2n6/3p5/4p2r1/3K5 w",
    "6b2/4ak1C1/2N2aR2/4P4/2b6/9/6p1P/4B1p1r/r3Ap3/3AK3c w",
    "3P5/4ak3/3a2R1b/9/5P2N/9/9/9/2rr5/4K4 w",
    "2ba1k3/3Ra4/2N1b4/2R6/2C6/5r3/9/4rA3/5K3/9 w",
    "4kC3/9/5P3/3R5/9/9/9/2p6/4r4/3K5 w",
    "4k4/3Pa1P2/5P3/9/6b2/9/6n2/9/2C1p4/5K3 w",
    "4ka3/4a4/8b/9/4N4/9/9/1R5C1/2pCp4/3K1nnc1 w",
    "2bak1C2/3caP3/4b4/3N1Cn2/9/9/8n/9/4p4/5K3 w",
    "2bak1P1r/4aP3/b5N2/9/9/9/9/9/5r3/2R1K4 w",
    "3ak4/2PPa4/b3b4/2p1C1N2/3c5/1rB6/9/3p5/4p2p1/1CB2K3 w",
    "5ab2/4k1C2/5P3/9/9/6R2/3r2C2/5K3/4r4/3n5 w",
    "3a1a3/3k2P2/9/9/9/3Nr4/9/7C1/4A2c1/1crRKA3 w",
    "3ak1b2/4aPP2/8b/9/9/9/9/2p5r/1n1cA2CC/4K1cn1 w",
    "6b2/2Nkn2P1/2Pab2r1/2R6/2Cn3c1/9/9/3p5/4r4/3K1p3 w",
    "4kabC1/4a2P1/2N1n4/9/2N6/9/9/5n3/2pRp4/3K5 w",
    "6b2/9/3k5/4P1N2/2b6/9/9/9/3p2p2/4K4 w",
    "5ab2/1P1k5/3a4b/9/6p2/9/6P2/9/4K4/5C3 w",
    "9/5R3/3k5/2P6/9/9/6C2/1rn2p3/9/5K3 w",
    "1C1k1a1N1/1P2a4/1n7/2n6/9/9/5R3/4R4/2r2p1r1/4K4 w",
    "4ka3/c1r3n2/6N2/9/2r2N2R/9/9/1p7/1p1KC2n1/2p1cC3 w",
    "3k2P2/9/3P5/4N4/4r4/4C4/9/2n3n2/2c3p2/4K4 w",
    "3aka3/5PP2/2N6/4c4/9/R8/9/3p5/2p1r4/3K5 w",
    "3k5/9/b8/9/9/rpp6/6R2/3ABA3/2r6/3K2R2 w",
    "9/4k1PP1/9/9/9/9/9/3K1p3/4cn1C1/4r3R w",
    "6R2/3P1k3/3a1a3/9/9/6B2/9/B1r6/5p3/4K4 w",
    "4k4/4a4/4P4/9/9/9/9/4B4/9/4K4 w",
    "6R2/5k3/5a3/5R3/6p2/9/9/4rC2B/2n6/5KBr1 w",
    "6nC1/4n4/5k3/6PN1/9/5r2N/9/5r3/2p1p4/3K5 w",
    "3P1k3/9/9/5P3/6c2/3p2C2/9/9/4p4/5K3 w",
    "1n1a1k1P1/6P2/5a2c/6C2/9/9/9/9/1p2pp3/3K5 w",
    "2ba1abR1/9/4k4/7N1/4r4/9/9/1p3p3/6p2/3K5 w",
    "4c4/4ak3/5aP2/9/9/7R1/3r1r1RC/4p1n2/9/4K2c1 w",
    "3ak4/4aPP2/4b4/2r1C2N1/9/3R5/9/9/3p1p3/4KArc1 w",
    "2Rak1b2/4aN3/9/7C1/8C/7r1/9/9/3p1pc2/4K3c w",
    "N1b1kab2/3Pa4/6n2/1R7/9/1C7/6r2/5K3/4r4/3n5 w",
    "9/5k3/5a3/p2N3r1/9/9/P8/7C1/9/5K3 w",
    "2Pc5/r3a1c1R/5k3/6P2/2b3p2/9/9/9/3p1p3/4K4 w",
    "4cknr1/3Ca2R1/2Ca2Rc1/4n4/9/9/9/9/4p4/3K1p3 w",
    "1P7/4c4/5k3/6P2/3P5/1N7/6n2/4C4/2p1p4/3K5 w",
    "9/4a3P/3ak4/9/2P1P4/3C5/P2p1c3/9/4K4/r1p2r3 w",
    "2bak2rr/3Ra4/4b3N/4C4/9/9/9/2R6/3pAp3/4KAn1c w",
    "4k4/1N1Pr1P2/5C3/5n3/9/9/9/9/3p3p1/1Cp2K3 w",
    "9/4c1P2/3kb4/2C6/3P5/9/9/4BA3/4pnppc/2BKnrrpp w",
    "4r4/2P6/3kb1P2/9/1n7/7N1/9/1cr1BK1C1/6p2/4R4 w",
    "2P2R3/4r4/3k5/9/9/9/9/9/5K3/9 w",
    "3r2b2/3kaP3/3rba3/C1n6/9/3RC4/9/9/2p1p4/3K5 w",
    "3a5/4a4/4k4/9/4n3R/9/9/4rC3/1p2A4/3K5 w",
    "4k4/9/9/4P4/4p4/8R/CRp1p4/3K5/1r7/5n3 w",
    "5k2N/3r2P2/9/9/2p3bC1/9/9/9/2pp2p2/4K2p1 w",
    "3a1kb2/4a3C/4bC3/6N2/9/9/9/9/3r1p3/2p1K1p2 w",
    "3ar1b2/4n4/3akN3/9/5P3/9/9/1p2p3R/5p3/4K4 w",
    "cr6R/1c2k4/2Pab4/n8/6b2/4N2N1/9/1R7/C2p1p3/2p1K1n1r w",
    "c8/5P3/3ak4/6r2/8N/9/9/9/pp2pp3/C2K5 w",
    "3P1k1N1/1cC4R1/3nb4/4n4/9/9/9/7r1/3r1p3/4K4 w",
    "4k4/4a4/4b4/3R5/2b6/6P2/1r2Pp3/3K3CR/4r4/2Bc2B1n w",
    "2bk5/r3aR3/n1r1b4/9/9/6R2/9/3n5/4p4/1C3K3 w",
    "2b2a3/4a4/4k4/5PRc1/9/8N/4P4/3K5/2rpp4/9 w",
    "1P1ak1b2/4a4/4b4/6p2/2N4N1/1C2C4/6P2/r2ppp3/9/c3KA3 w",
    "3ak4/4a4/9/9/4R4/9/9/3AKA3/4C4/4r4 w",
    "1r1a1a3/4k4/4bc3/cN1R1C3/2b6/9/9/9/4pp3/2BK2C2 w",
    "2C3Pc1/3kaRC2/5a3/6N2/9/9/9/2r3R2/3p1pp2/4K1B2 w",
    "r2k1a3/1PP4R1/3a5/9/9/7CR/9/5n3/4r4/3K1c3 w",
    "1rb2k3/1R7/2n1b4/4p4/6R2/5CN2/9/9/4p2r1/3K5 w",
    "3k2bP1/4a4/3Pba3/8r/9/7N1/9/4C4/4p2r1/3K5 w",
    "1c3a3/4a4/3k1N3/9/4R4/C8/9/6n2/3r1r3/2p1K4 w",
    "3a1a3/3r1k3/4b4/6P2/2b6/2B6/9/9/5C3/2B1KR1rc w",
    "9/9/3ak4/9/4P4/9/6R1P/r2AB4/2r6/3K4R w",
    "2bak4/4a2r1/4c4/CNrN5/8R/6C2/9/9/2p1pp3/3K5 w",
    "4kc3/4aRN2/9/9/9/9/9/C8/2pr2pr1/4K4 w",
    "N1Paka3/9/9/6N2/7n1/9/9/4C4/r2p1p3/4K4 w",
    "3k5/2P6/2P3N2/P8/9/9/6p2/3n5/4p4/3K5 w",
    "4ck3/4a4/9/4p4/9/9/9/4K4/Cn1rA4/3N1C3 w",
    "4r4/6P2/C2aNk3/9/9/9/9/9/2p1p2r1/3K5 w",
    "2b1k1b2/3P1P3/3a1a3/7C1/9/9/9/9/1p2pp3/3K5 w",
    "3k5/9/9/2p6/9/4N4/9/9/9/4K4 w",
    "3akr3/R4r2C/3a5/9/9/9/9/6n2/C2pA4/1R2K4 w",
    "4k4/4a4/3r1a3/9/4R4/9/9/3A1A3/4K4/4C4 w",
    "2rak4/4aP1P1/9/c3P4/6N2/9/5C3/9/3r5/4K4 w",
    "3ak2P1/4aP3/9/9/9/9/9/9/2r2rC2/c3K4 w",
    "3a1k3/1Nc1a1R2/5rN2/9/9/9/9/9/3p5/4K1Rrc w",
    "5k3/3Pa4/5a3/8N/9/9/7p1/9/4K4/9 w",
    "2baka3/1P7/4b4/7C1/p8/rp7/cp7/cp7/rp3K3/nn6C w",
    "4k4/3P1P1P1/9/9/9/9/9/3p3p1/1C2pn3/3K5 w",
    "2bak4/4a2R1/4b1R2/7C1/6C2/9/9/9/5pr2/4K2cr w",
    "2Ra1k3/3ra4/6P2/9/8p/6R2/2p6/7r1/4K4/c2A5 w",
    "3k5/9/3a5/9/9/9/9/5R3/c2rA2p1/3C1K3 w",
    "3k5/9/4P4/9/9/5R3/9/9/5K3/4r1c2 w",
    "3a1a3/3k3c1/1n2RN3/5r3/8R/9/2n6/9/3r1p3/2c1K4 w",
    "4r2N1/3ka2c1/C3b1P2/4R1N2/2b6/9/4C4/9/4p1r2/5K3 w",
    "1R1a5/2P1k4/1n2b4/4c4/9/9/9/2C5R/4r1r2/5K3 w",
    "2bak1P2/2P1a3R/4b3N/1N7/9/9/9/2C1B1r1n/1p1rC4/2p1K1p2 w",
    "3k5/4P4/5c3/c8/9/9/9/B8/3C5/5KC2 w",
    "9/9/5k3/2p1P1p2/9/5pB2/9/3A5/9/2B1Kc3 w",
    "4ka2c/9/3a5/9/6rr1/1RR6/9/4p4/9/C3K4 w",
    "3a1k3/4a1P2/R3b1P2/4P4/4p4/9/9/5C3/4p1r2/3K5 w",
    "1C7/1CRPak3/4ba3/9/2b6/9/5p3/9/3pr2p1/5K3 w",
    "3k5/1PP1rnr2/9/9/4p4/2p1C4/4N4/9/7pc/2RC1K2c w",
    "3aka3/5P3/2n3n2/C3N4/1N1R5/9/9/9/3p1r3/4KArc1 w",
    "3akar2/9/7R1/5R3/3c5/9/9/9/9/3K5 w",
    "2b6/1C2k4/n3bR3/6N2/9/9/9/1R7/3p2rr1/1C2K3c w",
    "5a2C/3NakCR1/6Nc1/3r2P1p/7n1/9/9/9/3p1p3/4K2cr w",
    "5kb2/1c2R4/n1n2P3/2P6/8C/5r1R1/9/9/2p1Cp3/3AKArc1 w",
    "r8/3ka2R1/3a3C1/1n2pN3/9/R2N1n2c/5c3/2r2A3/3p1p1p1/4K1C2 w",
    "3k5/4a4/3aP3n/9/9/9/6R2/6R2/2rc1pr2/1c2K4 w",
    "5k3/1N1P4R/3aba3/6P2/9/C2c5/4r4/9/4p4/3K1cr2 w",
    "4ka3/6P2/3a5/1R4C2/4C4/9/9/9/pr2pp3/3K5 w",
    "3k2b1R/4P4/4P3b/9/9/5Cn2/9/9/4p4/2p2K1pC w",
    "3ak1b2/4a4/9/6pN1/4r1b2/9/9/2n6/3pA4/2p1KA1RC w",
    "2ba5/4ak3/bc4PN1/2p6/8p/p8/9/9/3p5/4K4 w",
    "n1ck1P3/4P2P1/4baP1b/5cP2/N8/3C1C3/5n3/5p3/R1r1p3r/3R1K3 w",
    "4k3C/2P1aN3/4b3b/7R1/9/6B2/9/2n5B/1r1c1p3/4K1c1r w",
    "2b1ka3/3Pa4/4b1c2/6RC1/3R2c2/8C/9/2n6/3p3r1/4K4 w",
    "3k4C/2N6/9/9/9/9/9/9/3p2p2/4K3n w",
    "1c2k1C2/c4P3/5a3/7R1/9/9/9/9/3rr2C1/5K3 w",
    "3a5/4ak3/2R3C2/4P1N2/9/9/9/6n2/1n3p3/c1rRK4 w",
    "3a5/4a4/5k3/9/9/8C/9/2cc1C3/2rrN4/4K4 w",
    "1Pcak4/9/3a3C1/4p4/9/9/5R3/4pR3/3pp1r2/3C1K3 w",
    "3a1kb2/4a4/4b4/5NN2/9/9/9/8C/3r4c/4K1n2 w",
    "3ak4/1P2a4/4b2R1/9/4r4/9/9/2p1CK2p/6p2/9 w",
    "1rr2ab2/2RRak3/9/1N7/9/9/9/9/2p1p4/3K5 w",
    "C3ka3/4aP1P1/9/2P6/9/9/9/9/2p2n2c/3RK1pr1 w",
    "3ak4/1C2aR3/2n1c4/7N1/9/7R1/9/4C4/4A1rnr/3AK3c w",
    "3a2b2/3k4C/3a4b/6P2/9/9/9/9/9/4K4 w",
    "3c1a3/8r/1NP1k4/5P3/5n3/9/R8/R4p3/C2Np1p2/1c3K3 w",
    "1Cb1P1r2/3k5/c1Pab4/6P2/1N3r3/9/9/4c4/2p1p4/3K5 w",
    "3ak1b2/4a4/4b4/1r7/4R3R/9/9/4B4/4A4/4K4 w",
    "3k2b2/2PN5/4bC3/8C/9/5r3/9/5p3/3nr4/3p1K3 w",
    "4ka3/4a4/4b1r2/2N6/C5pC1/3R5/3R5/4B2n1/1n2p1p2/cr1N1K2c w",
    "3aka3/9/9/9/2R6/2C1P4/9/CR2c3p/3p1p3/2p1K4 w",
    "2ba1a2N/4k4/4b3N/9/4n1n2/9/9/3K1p3/3cp4/7R1 w",
    "9/4a4/3a1k3/4R1PN1/4p4/9/2C2r3/1cpAK4/3rAp3/2n6 w",
    "3k5/9/9/8p/9/2R3B1r/9/4BA3/6r2/2R2K3 w",
    "n1b2ab2/3Pak2C/1N7/4RP3/9/4R4/9/2p1K1p2/4cr3/C3rn3 w",
    "5k3/5c3/9/9/9/4c4/9/9/9/R2K5 w",
    "3a4R/4ak1rn/9/4pC3/4cN2N/5C3/9/9/r2p1p3/4K4 w",
    "2Ra1kb2/R3c4/4b3r/9/9/9/1r5C1/9/4p4/3K5 w",
    "3akc3/2P6/3a5/4p4/4c4/2R1P4/9/9/C1R1p1pn1/2p2K3 w",
    "4ka3/2P2P3/6N2/4n1R2/9/9/9/6pr1/4AK3/2rCcNpC1 w",
    "3P2C1R/4ak3/4b3b/9/2n5r/9/9/3C1p1R1/3p1r3/4K4 w",
    "5a3/9/3ak4/9/4P4/6B1R/9/4B4/3pr2p1/5K3 w",
    "4ka3/4a2n1/3Rc4/9/9/9/2R1r4/4C4/2nr1p3/2p1K4 w",
    "2bk1a1P1/4a3c/r1PcbN3/5CP2/3R2p2/2r6/4p4/5K3/7CR/3n5 w",
    "4kab2/4a4/8b/9/9/9/9/9/9/4K1R2 w",
    "4k4/3Pa4/5a3/9/8N/7p1/9/9/5K3/9 w",
    "1N1a5/4a4/1NC2k3/4p1p2/9/2cp4R/7C1/1r2n3R/3pA4/r1c1K4 w",
    "3a1k3/2NPac3/5PP2/4r1P2/4r4/9/9/2np5/3cnCp2/2pC1K3 w",
    "2Pa5/3kaPn2/9/8R/9/C2C3N1/9/2pp1K1pp/7rr/7n1 w",
    "2Rak1b2/4aPP2/4b4/1np2N3/3n5/1N2c4/1Cc6/3p1K3/4p4/6r2 w",
    "3k1P1n1/4aPP2/NcCPPa2b/7nN/8r/9/9/4r4/3pCp3/4K4 w",
    "5N3/4P4/PP1k5/n2r5/9/7C1/4r4/4p4/1p1Np2R1/3K5 w",
    "5an2/4a4/3k5/2P1P3R/c3p4/7nR/9/3N2rC1/6pr1/3p1KcC1 w",
    "3aN1RcC/4ak3/4b3n/5P3/9/9/9/2n2cC2/3p1p3/4KAr2 w",
    "2b1k4/2PPa4/b1Ra5/9/9/1N7/5C1r1/2N2R3/3p1p3/cr1CKn1nc w",
    "c5b2/c1P1a4/2P1bk3/9/5P3/N8/6rr1/4CR3/4p4/5K3 w",
    "5a1C1/3ka4/4b4/7N1/1Rb6/9/9/5n3/2r1p4/c4K3 w",
    "2Ra5/2n1a4/4k4/5R1N1/NP1np4/9/9/9/6p2/r3cKBr1 w",
    "3ak4/2PPa3N/9/2n6/9/2r6/9/cn1CKRrRc/5p3/7C1 w",
    "C2k5/4P4/r2cb1N1b/8C/6r2/9/9/6p2/4p4/5K1R1 w",
    "1r1akab2/5R3/4b1n2/7N1/9/2B6/2r1P4/B2RC4/3KA4/c8 w",
    "3k1P3/2P6/2Ca3N1/9/2b1p1b2/3n5/C8/9/2r1r4/3K1p3 w",
    "4k2Pn/3Par3/2c1r3N/2p2n3/6N2/2c5C/1C7/R8/4pp3/3K5 w",
    "5ab2/1P1k5/3a4b/2p6/6p2/5C3/6P2/9/9/2B1K4 w",
    "1P3k3/3PP4/3P5/9/9/9/9/9/3ppC2p/5K3 w",
    "3akab2/1r7/4b4/2C4N1/9/5p3/6R2/9/4p3c/3K5 w",
    "2n2k1cr/3P4N/2n1b3b/2CR4R/2r3c1C/9/9/9/4p4/3K1p3 w",
    "2bak3C/4a4/2P1b4/6RR1/9/9/9/9/c1nr1p3/4K4 w",
    "3rk4/1R2a4/4ba3/9/4r4/9/7R1/4C4/3p5/1cBA1K3 w",
    "Ccbaka3/9/4b4/5N1n1/5R1C1/9/9/9/r2p1r3/4KR3 w",
    "C4r3/3ka4/3acr3/1N1P4C/N2P5/3n5/9/3p5/4p4/3K5 w",
    "3k5/9/3a4n/9/6P2/9/9/5R3/c2rA2p1/3C1K3 w",
    "4k3P/3R5/3R5/9/9/9/3n5/5r3/3K5/2r6 w",
    "1R1a1k3/2Cna1P2/b3b1N2/9/9/9/9/4K1R2/3r1r3/5n3 w",
    "N3ka3/2PPa3C/4b1n1b/9/4N1C1R/9/r8/6n2/3p1r3/4K4 w",
    "3k1a3/4a4/4P4/1R4C2/9/9/9/4B1r2/5p3/3AK2n1 w",
    "5k3/9/9/9/9/9/6p2/4K1p2/6p2/C8 w",
    "2ba2b1C/R1n2k3/9/1n3P3/9/8N/9/4R1p2/3p1p3/2p1K4 w",
    "3a1k2r/1R2P4/3a5/2N6/9/9/9/2n1p4/3p1p3/RC2K1Crc w",
    "2baka3/9/b4P3/9/9/4C4/9/9/9/3K5 w",
    "4k4/4C4/5P3/1R7/9/9/4r4/3A5/6pp1/5K3 w",
    "4k4/3P1P3/9/9/9/9/9/4C4/3p1p3/1pB1K4 w",
    "3a1a3/5k3/9/5N3/9/9/7C1/3A3p1/4Ar3/4K1B2 w",
    "4k4/4a3R/4Pa3/7C1/4p4/9/9/2r6/5r3/3K5 w",
    "2b1kcPP1/4a3n/4ba3/4C1R2/5RN2/9/9/3n5/3r2r2/4K4 w",
    "4ka3/2P2P3/3R1a3/4r2C1/9/9/6pC1/7p1/4r4/5K3 w",
    "4ka3/3Pa4/7Cb/8p/9/9/9/9/1p5p1/4K4 w",
    "2r1kab1r/3Ra4/4b4/1N7/3C5/9/9/1R2B4/3p1p3/c3K4 w",
    "4kaN2/2CPa4/9/5P3/6RC1/6B2/7n1/2n6/3pA4/4KABrc w",
    "7c1/3P3r1/r2ak1P2/6P2/9/9/7CR/2p1B1np1/1p2c2CR/4K4 w",
    "9/4ak1P1/5a3/p8/9/9/9/BC1c5/8C/c3K4 w",
    "2Paka1P1/7PC/n3b4/9/3N2b2/9/c1n6/3r5/1cpC4r/2BK3R1 w",
    "2n1P4/c2kaRR2/3a3c1/3P5/2P6/5N3/r8/2nC5/4r4/3p1K3 w",
    "2bk5/4a4/3Pb2R1/9/9/9/9/2p6/3K2p2/2C1rnp2 w",
    "1RC1k1b2/3na2P1/3ab4/9/9/9/6P2/2n6/3p2rr1/2pCKR3 w",
    "4k4/3P5/9/r1p6/4r4/9/2R1p4/4BK2B/1N4p2/3ARA2C w",
    "2ba1k3/4a4/n3N4/9/9/9/9/3RB1r2/2p2r3/3AK2R1 w",
    "r3k4/3P3n1/3cb3b/3N5/CRR3p2/9/9/3r5/4p1p2/5K1C1 w",
    "3a2b2/4a1P2/5k1C1/4P4/2p3b2/8p/9/9/4p4/3K5 w",
    "3ak1b2/4arP2/5P2b/9/6P2/9/9/9/9/4K4 w",
    "3ak1b1r/4a2Pn/4b4/4C4/9/9/cR7/n8/4A1p2/3AKC3 w",
];

function test() {
    let pos = new Position();
    let legal = 0,
        gened = 0,
        moved = 0,
        check = 0;
    for (let i = 0; i < PUZZLE_LIST.length; i++) {
        pos.fromFen(PUZZLE_LIST[i]);
        for (let posSrc = 0; posSrc < 256; posSrc++) {
            if (isChessOnBoard(posSrc)) {
                for (let posDst = 0; posDst < 256; posDst++) {
                    if (isChessOnBoard(posDst)) {
                        legal += (pos.legalMove(makeMotionBySrcDst(posSrc, posDst)) ? 1 : 0);
                    }
                }
            }
        }
        let mvs = pos.generateMoves(null);
        for (let j = 0; j < mvs.length; j++) {
            if (pos.makeMove(mvs[j])) {
                moved++;
                check += (pos.inCheck() ? 1 : 0);
                pos.undoMakeMove();
            }
        }
        gened += mvs.length;
    }
    alert(legal + "|" + gened + "|" + moved + "|" + check);
}
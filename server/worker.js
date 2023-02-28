import {Search} from './search.js'
import { Position } from './position.js'
import { isMainThread, parentPort } from 'worker_threads'

if (isMainThread) throw new Error('can not run in main thread');

parentPort.on('message', async fen => {
    const time = await makeMove(fen);
    parentPort.postMessage(time);

});

async function makeMove(fen){
    const pos = new Position()
    pos.fromFen(fen)
    const s = new Search(pos, 64)

    return pos.move2Iccs(s.searchMain(10, 10))
}

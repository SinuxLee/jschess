import { isMainThread, parentPort } from 'worker_threads'
import { Position }                 from '../js/engine/position.js'
import { isChecked }                from '../js/engine/movegen.js'
import { fromFen, moveToIccs }      from '../js/engine/fen.js'
import { Search }                   from '../js/ai/search.js'

if (isMainThread) throw new Error('can not run in main thread');

parentPort.on('message', async fen => {
    const result = await makeMove(fen);
    parentPort.postMessage(result);
});

async function makeMove(fen) {
    const pos = new Position();
    fromFen(pos, fen, isChecked);
    const search = new Search(pos, 16);
    search.searchMain(10, 10);      // searchMain 返回估值，最佳走法在 bestMove 里
    return moveToIccs(search.bestMove);
}

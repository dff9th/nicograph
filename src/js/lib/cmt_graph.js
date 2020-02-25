import cmtGraphGlobals from './cmt_graph_globals';

function extractVposMsList(threads) {
    let vposMsList = [];
    threads.forEach((thread) => {
        thread.chats.forEach((chat) => {
            // Omit deleted comment that has no 'content' property
            if (Object.prototype.hasOwnProperty.call(chat, "content")) {
                vposMsList.push(chat.vpos * 10);
            }
        });
    });

    return vposMsList;
}

function aggrCmtCnts(vposMsList, movieTimeMs, isNicoads, divNum) {
    let cmtCnts = new Array(divNum);
    cmtCnts.fill(0);

    // Nicoads time at the movie end
    let nicoadsTimeMs = 0;
    if (isNicoads) {
        nicoadsTimeMs = 10*1000;
    }

    let intervalTimeMs = (movieTimeMs + nicoadsTimeMs) / divNum;
    vposMsList.forEach((timeMs) => {
        // [ToDo]
        // Test in case zero division
        let p = parseInt(timeMs / intervalTimeMs);
        if (p >= divNum) p = divNum - 1;
        cmtCnts[p] += 1;
    });

    return cmtCnts;
}

function drawGraph(drawTgt, cmtCnts) {
    // Draw destination
    let drawTgtRect = drawTgt.getBoundingClientRect();
    let maxCnt = 0;

    // Sum all comments
    for(let i=0; i<cmtCnts.length; i++) {
        if(cmtCnts[i] > maxCnt) {
            maxCnt = cmtCnts[i];
        }
    }
    if (maxCnt == 0) maxCnt = 1;
        
    // Insert a graph element
    const graphId= 'CmtGraph';
    let graphElem = document.getElementById(graphId);
    // Remove before graph
    if (graphElem) {
        graphElem.remove();
    }
    graphElem = document.createElement('div');
    graphElem.id = graphId;
    graphElem.style.display = 'flex';
    graphElem.style['flex-direction'] = 'row';
    drawTgt.insertBefore(graphElem, drawTgt.firstChild);

    // Create comment rectangles
    let baseWidth = drawTgtRect.width / cmtCnts.length;
    let baseHeight = drawTgtRect.height - 4     // Stick out over video if not minus 4
    let frag = document.createDocumentFragment();
    for(let i=0; i<cmtCnts.length; i++) {
        // Create a rectangle element
        let e = document.createElement('div');
        e.className = 'CmtRect';
        e.style.backgroundColor = '#66CCFF';
        e.style.opacity =  0.5;
        e.style.position = 'relative';

        // Calc rectangle
        let eWidth = baseWidth;
        let eHeight = baseHeight * (cmtCnts[i] / maxCnt);
        e.style.width = eWidth + 'px';
        e.style.height = eHeight + 'px';
        e.style.top = baseHeight - eHeight + 4 + 'px';

        // Add element 
        frag.appendChild(e);
    }
    graphElem.appendChild(frag);
}

function addRedrawJobOnResize(drawTgt) {
    const observer = new ResizeObserver((entries) => {
        let curWidth = drawTgt.getBoundingClientRect().width;
        // Re-draw
        let cmtElems = document.getElementsByClassName('CmtRect');
        let baseWidth = curWidth / cmtElems.length;
        for (let e of cmtElems) {
            e.style.width = baseWidth + 'px';
        }
        entries;    // For ESLint no-unused-vars

        console.debug(debugGlobals.a);
        debugGlobals.a++;
        console.debug(debugGlobals.a);
    });
    observer.observe(drawTgt);
}

// If already drawn graph, reconstruct one
function keepCmtGraph(cmtCnts) {
    // Draw graph over seekbar
    let drawTgt = document.getElementsByClassName('XSlider')[0];

    drawGraph(drawTgt, cmtCnts);
    addRedrawJobOnResize(drawTgt);
}

let debugGlobals = {
    a: 10,
    b: 15
};

export function overwriteCmtGraph({
    vposMsList  = cmtGraphGlobals.vposMsList,
    movieTimeMs = cmtGraphGlobals.movieTimeMs,
    isNicoads   = cmtGraphGlobals.isNicoads,
    divNum      = cmtGraphGlobals.divNum
}) {
    console.debug(`Called overwrite`);
    // console.debug(`vposMsList: ${vposMsList}`);
    console.debug(`movieTimeMs: ${movieTimeMs}`);
    console.debug(`isNicoads: ${isNicoads}`);
    console.debug(`divNum: ${divNum}`);

    console.debug('before cmtGraphGlobals:');
    console.debug(JSON.stringify(cmtGraphGlobals));
    // Preserve vars for recreating graph
    cmtGraphGlobals.movieTimeMs = movieTimeMs;
    cmtGraphGlobals.vposMsList  = vposMsList;
    cmtGraphGlobals.isNicoads   = isNicoads;
    cmtGraphGlobals.divNum      = divNum;
    console.debug('after cmtGraphGlobals:');
    console.debug(JSON.stringify(cmtGraphGlobals));

    const cmtCnts = aggrCmtCnts(vposMsList, movieTimeMs, isNicoads, divNum);
    keepCmtGraph(cmtCnts);

    console.debug(debugGlobals.a);
    debugGlobals.a++;
    console.debug(debugGlobals.a);
}

export function createCmtGraph(threads) {
    // [ToDo]
    // Get movie time from default called library
    console.debug(`Called createCmtGraph`);

    // Loop in case PlayerPlayTime-duration value is not updated yet
    let timer = setInterval(() => {
        // Get movie duration from document
        const movieDuration = document.getElementsByClassName(
            'PlayTimeFormatter PlayerPlayTime-duration')[0].innerHTML;

        // PlayerPlayTime-document value is updated
        if (movieDuration && movieDuration !== '00:00') {
            const durs = movieDuration.split(':');
            const movieTimeMs = (parseInt(durs[0]) * 60 + parseInt(durs[1])) * 1000;

            const vposMsList = extractVposMsList(threads);
            overwriteCmtGraph({vposMsList: vposMsList, movieTimeMs: movieTimeMs, divNum: 100});

            clearInterval(timer);
        }
    }, 100);

    console.debug(debugGlobals.a);
}

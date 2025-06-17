const pieceMap = new Map();
const reverseMap = new Map();

const PWOB = [2, "AA", "WOB"]
const PSWB = [1, "a", "WB"]
const PWBR = [2, "BB", "WBR"]
const PSWR = [1, "b", "WR"]
const PWRG = [2, "CC", "WRG"]
const PSWG = [1, "c", "WG"]
const PWGO = [2, "DD", "WGO"]
const PSWO = [1, "d", "WO"]

const PSYR = [1, "e", "YR"]
const PYBR = [2, "EE", "YBR"]
const PSYB = [1, "f", "YB"]
const PYOB = [2, "FF", "YOB"]
const PSYO = [1, "g", "YO"]
const PYGO = [2, "GG", "YGO"]
const PSYG = [1, "h", "YG"]
const PYRG = [2, "HH", "YRG"]

const pieces_large_white = [PWOB, PWBR, PWRG, PWGO]
const pieces_small_white = [PSWB, PSWR, PSWG, PSWO]
const pieces_large_yllow = [PYOB, PYBR, PYRG, PYGO]
const pieces_small_yllow = [PSYB, PSYR, PSYG, PSYO]

const pieces_large = [PWOB, PWBR, PWRG, PWGO, PYOB, PYBR, PYRG, PYGO]
const pieces_small = [PSWB, PSWR, PSWG, PSWO, PSYB, PSYR, PSYG, PSYO]

const pieces_white = [PWOB, PSWB, PWBR, PSWR, PWRG, PSWG, PWGO, PSWO]
const pieces_yllow = [PYOB, PSYB, PYBR, PSYR, PYRG, PSYG, PYGO, PSYO]

const all_pieces = [PWOB, PWBR, PWRG, PWGO, PYOB, PYBR, PYRG, PYGO, PSWB, PSWR, PSWG, PSWO, PSYB, PSYR, PSYG, PSYO]

const solvedState = ["AAaBBbCCcDDd", "eEEfFFgGGhHH"]

for (let piece of all_pieces) {
    if (piece[0] == 1) {
        pieceMap.set(piece[2], [piece[1]]);
    } else {
        pieceMap.set(piece[2], [piece[1][0], piece[1][1]]);
    }

    reverseMap.set(piece[1], piece[2]);
}

function buildFace(faceString) {
    let face = ""

    for (let pieceStr of faceString.split(".")) {
        let piece = pieceMap.get(pieceStr);
        console.log("str: " + pieceStr + ", piece: " + piece)
        if (piece.length == 1) {
            face += piece[0];
        } else {
            face += piece[0];
            face += piece[1];
        }
    }

    console.log("built face: " + face)
    return face;
}

function canFlip([topFace, botFace]) {
    return (
        (topFace[0] != topFace[11]) &&
        (topFace[5] != topFace[6]) &&
        (botFace[0] != botFace[11]) &&
        (botFace[5] != botFace[6]) 
    )
}

function flipCube([topFace, botFace]) {
    if (!canFlip([topFace, botFace]))
        return [topFace, botFace];
    return [topFace.slice(0, 6) + botFace.slice(6), botFace.slice(0, 6) + topFace.slice(6)];
}

// assume top and bot rotation are between 0 and 11.
function rotateFaces(topRot, botRot, [topFace, botFace]) {
    return [
        topFace.slice(12 - topRot) + topFace.slice(0, 12 - topRot),
        botFace.slice(12 - botRot) + botFace.slice(0, 12 - botRot),
    ]

}

function faceToString(face) {
    output = "";
    for (let i = 0; i < 12; i++) {
        output += face[i];
    }
    return output;
}

function decodeFaceString(faceStr) {
    let i = 0
    let decodedParts = []
    console.log("decoding face: " + faceStr);
    while (i < 12) {
        // check for pair if two or more chars left
        if (i + 1 < 12) {
            let pair = faceStr.slice(i, i + 2);
            if (reverseMap.has(pair)) {
                decodedParts.push(reverseMap.get(pair))
                i += 2;
                continue;
            }
        }

        // try and decode single char
        let char = faceStr[i];
        if (reverseMap.has(char)) {
            decodedParts.push(reverseMap.get(char))
            i += 1
        } else {
            // wrap char to back
            faceStr = faceStr.slice(1) + faceStr[0];
        }
    }
    console.log("done")
    return decodedParts.join(".")
}
    
function printState(state) {
    console.log("state: " + state);
    const [topFace, botFace] = state;
    console.log("top face: " + topFace);
    console.log("bot face: " + botFace);
    return printFaces(topFace, botFace);
}

function printFaces(topFace, botFace) {
        return ("(" + decodeFaceString(topFace) + "),").padEnd(34) + "(" + decodeFaceString(botFace) + ")"
}



function printCubeRaw(topFace, botFace) {
        return "top: (" + topFace + "), bot: (" + botFace + ")"
}

function strState([top, bot]) {
    return top + "," + bot;
}

const visitedForward = new Map();
const visitedReverse = new Map();

let queueForward;
let queueReverse;


function bidirectionalBFS(start, goal) {
    if (start == goal) return [start];

    visitedForward.set(strState(start), null);
    visitedReverse.set(strState(goal), null);

    queueForward = [strState(start)];
    queueReverse = [strState(goal)];

    let iterations = 0;
    while (queueForward.length && queueReverse.length) {
        iterations++;
        if ((iterations % 1) == 0) console.log("iter: " + iterations);

        const resultForward = expandLayer(queueForward, visitedForward, visitedReverse);
        if (resultForward) return reconstructPathBruteForce(resultForward.meetNode, start, goal, visitedForward, visitedReverse);

        const resultReverse = expandLayer(queueReverse, visitedReverse, visitedForward);
        if (resultReverse) return reconstructPathBruteForce(resultReverse.meetNode, start, goal, visitedForward, visitedReverse);
    }

    return null;
}

function expandLayer(queue, visitedThisSide, visitedOtherSide) {
    const nextQueue = [];

    for (let state of queue) {

        const newStates = []

        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 6; j++) {
                newStates.push(rotateFaces(i, j, state.split(',')))
                //console.log("added rotated state: " + rotateFaces(i, j, state.split(',')));
            }
        }
        newStates.push(flipCube(state.split(',')))
        //console.log("added flipped state: " + flipCube(state.split(',')));

        for (let newStateRaw of newStates) {
            const newState = strState(newStateRaw);

            if (visitedThisSide.has(newState)) continue;

            visitedThisSide.set(newState, state);

            if (visitedOtherSide.has(newState)) {
                return { meetNode: newState };
            }

            nextQueue.push(newState);
        }
    }

    queue.length = 0;
    for (let item of nextQueue) {
        queue.push(item);
    }
    return null;
}

function reconstructPathBruteForce(meetNode, start, goal, visitedForward, visitedReverse) {

    // Invert move helper same as before
    function invertMove(move) {
        if (move === 'flip') return 'flip';
        if (move.startsWith('r')) {
            const [i, j] = move.slice(1).split(',').map(Number);
            return `r${(6 - i) % 6},${(6 - j) % 6}`;
        }
        return move;
    }

    const pathFromStart = [];
    let current = meetNode;
    while (current !== null) {
        pathFromStart.push(current);
        current = visitedForward.get(current) ?? null;
    }
    pathFromStart.reverse();

    const pathFromGoal = [];
    current = visitedReverse.get(meetNode) ?? null; // start after meetNode to avoid duplication
    while (current !== null) {
        pathFromGoal.push(current);
        current = visitedReverse.get(current) ?? null;
    }

    const fullPath = pathFromStart.concat(pathFromGoal);

    let output = "start: ".padEnd(10) + printState(start) + "\n"
    let currentState = start;
    for (let i = 1; i < fullPath.length; i++) {
        let nextState = fullPath[i].split(',');  
        console.log("type of next state: " + typeof(nextState))
        console.log("finding state: " + nextState); 
        let success = false;
        console.log("flipped: " + strState(flipCube(currentState)));
        if (strState(flipCube(currentState)) == strState(nextState)) {
            console.log(i + ": gotta flip.")
            output += "flip: ".padEnd(10) + printState(nextState) + "\n"
            success = true;
        } else {
            console.log("searching for rotation...");
            for (let rt = 0; rt < 6; rt++) {
                for (let rb = 0; rb < 6; rb++) {
                    console.log("trying: " + strState(rotateFaces(rt, rb, currentState)))
                    if (strState(rotateFaces(rt, rb, currentState)) == strState(nextState)) {
                        console.log("found!");
                        console.log(i + ": gotta rotate " + rt + "," + rb);
                        output += ("r" + rt + "," + rb + ": ").padEnd(10) + printState(nextState) + "\n"
                        success = true;
                    }    
                }
            }
        }

        if (!success) {
            console.log("failed this time.")
        console.log("type of next state: " + typeof(nextState))
            console.log("printg: " + printState(nextState))
            "magic: ".padEnd(10) + printState(nextState) + "\n";
        }

        currentState = nextState;
    }

    output += "done!"
    return output;
}

function handleButtonClick() {
    const topFaceInput = document.getElementById("topFaceInput").value;
    const botFaceInput = document.getElementById("botFaceInput").value;

    //const topFaceInput = "WGO.YBR.YR.WO.WOB.YB.WB.YG.WG"
    //const botFaceInput = "YRG.YOB.YO.WR.WRG.WBR.YGO"
    
    const output = document.getElementById("outputLabel");

    [topFace, botFace] = [buildFace(topFaceInput), buildFace(botFaceInput)];
    console.log(topFace + ", " + botFace);
    goalState = solvedState

    console.log("P1 " + printCubeRaw(topFace, botFace));
    console.log("P2 " + printFaces(topFace, botFace));
    
    const timestamp = new Date().toLocaleTimeString();
    output.textContent += (printFaces(topFace, botFace) + "\n");
    output.textContent += "started solving...\n"

    let result = bidirectionalBFS([topFace, botFace], goalState);

    output.textContent += result;

    // Optional: auto-scroll to bottom
    output.scrollTop = output.scrollHeight;
}
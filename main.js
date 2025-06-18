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

const solvedState = ["dAAaBBbCCcDD", "eEEfFFgGGhHH"]

for (let piece of all_pieces) {
    if (piece[0] == 1) {
        pieceMap.set(piece[2], [piece[1]]);
    } else {
        pieceMap.set(piece[2], [piece[1][0], piece[1][1]]);
        pieceMap.set(piece[2].slice(0, -2) + piece[2].slice(-1) + piece[2].slice(-2, -1), [piece[1][0], piece[1][1]]);
    }

    reverseMap.set(piece[1], piece[2]);
}

function buildFace(faceString) {
    let face = ""

    for (let pieceStr of faceString.split(".")) {
        let piece = pieceMap.get(pieceStr);
        
        if (piece.length == 1) {
            face += piece[0];
        } else {
            face += piece[0];
            face += piece[1];
        }
    }

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

function rotateFace(rot, face) {
    return face.slice(12 - rot) + face.slice(0, 12 - rot);
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
    
    return decodedParts.join(".")
}
    
function printState(state) {
    const [topFace, botFace] = state;
    return printFaces(topFace, botFace);
}

function printFaces(topFace, botFace) {
        return ("(" + decodeFaceString(topFace) + "),").padEnd(34) + "(" + decodeFaceString(botFace) + ")"
}



function printCubeRaw(topFace, botFace) {
        return "top: (" + topFace + "), bot: (" + botFace + ")"
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function strState([top, bot]) {
    return top + "," + bot;
}

function canonicalizeFace(face) {
    let best = face;
    for (let i = 1; i < face.length; i++) {
        const rotated = rotateFace(i, face);
        if (rotated < best) {
            best = rotated;
        }
    }
    return best;
}

function canonicalState([topFace, botFace]) {
    const canonTop = canonicalizeFace(topFace);
    const canonBot = canonicalizeFace(botFace);
    return ([canonTop, canonBot])
}

async function bidirectionalBFS(start, goal) {
    if (start == goal) return [start];
    
    const visitedForward = new Map();
    const visitedReverse = new Map();

    visitedForward.set(strState(start), null);
    visitedReverse.set(strState(goal), null);

    let queueForward = [strState(start)];
    let queueReverse = [strState(goal)];

    output.textContent = ""
    let iterations = 0;
    while (queueForward.length && queueReverse.length) {
        iterations++;
        console.log("iter: " + iterations);
        output.textContent += "iteration: " + iterations + ", visited: " + (visitedForward.size + visitedReverse.size) + " states.\n"
        await sleep(1)
        
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
        const justRotations = []
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 6; j++) {
                let rotated = rotateFaces(i, j, state.split(','))
                justRotations.push(rotated);
                if (canFlip(rotated)) {
                    newStates.push(flipCube(rotated))
                }
            }
        }
        //newStates.push(flipCube(state.split(',')))
        //console.log("added flipped state: " + flipCube(state.split(',')));

        //check for rotation only match
        // for (let newRotatedRawState of justRotations) {
        //     const newRotatedState = strState(newRotatedRawState);

        //     if (visitedThisSide.has(newRotatedState)) continue;

        //     if (visitedOtherSide.has(newRotatedState)) {
        //         console.log("found mid node with rotation only.")
        //         console.log("mid node: " + newRotatedState)
        //         visitedThisSide.set(newRotatedState, state);
        //         return { meetNode: newRotatedState };
        //     }
        // }

        for (let newStateRaw of newStates) {
            const newState = strState(canonicalState(newStateRaw));

            if (visitedThisSide.has(newState)) continue;

            visitedThisSide.set(newState, state);

            if (visitedOtherSide.has(newState)) {
                console.log("mid node: " + newState)
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
        let success = false;
        
        console.log("getting from " + printState(currentState) + " to " + printState(nextState))

        console.log("step " + i + ": current state: (" + strState(currentState) + "), target state: (" + strState(nextState) + ")")
        
        if (nextState == currentState) {
            console.log("duplicate face.")
            continue;
        }


        let lastRt = 0;
        let lastRb = 0;

        for (let rt = 0; rt < 12; rt++) {
            for (let rb = 0; rb < 12; rb++) {
                
            }
        }

        for (let rt = 0; rt < 12; rt++) {
            for (let rb = 0; rb < 12; rb++) {
                let rotState = rotateFaces(rt, rb, currentState)
                let rotAndFlip = flipCube(rotState);
                let flipAndRot = rotateFaces(rt, rb, flipCube(currentState))
                //console.log("rot: (" + strState(rotState) + "), rot flip: (" + strState(rotAndFlip) + ")")
                if (strState(rotState) == strState(nextState)) {
                    output += ("r" + rt + "," + rb + ": ").padEnd(10) + printState(nextState) + "\n"
                    success = true;
                    console.log("just rotated.")
                } else if (strState(rotAndFlip) == strState(nextState)) {
                    output += ("r" + rt + "," + rb + ": ").padEnd(10) + printState(rotState) + "\n"
                    output += ("flip: ").padEnd(10) + printState(nextState) + "\n"
                    success = true;
                    console.log("rotated and flipped")
                } else if (strState(flipAndRot) == strState(nextState)) {
                    output += ("flip: ").padEnd(10) + printState(flipCube(currentState)) + "\n"
                    output += ("r" + rt + "," + rb + ": ").padEnd(10) + printState(nextState) + "\n"
                    success = true;
                    console.log("flipped and rotated")
                }
            }
        }

        if (!success) {
            for (let rta = 0; rta < 12; rta++) {
                for (let rba = 0; rba < 12; rba++) {
                    for (let rtb = 0; rtb < 12; rtb++) {
                        for (let rbb = 0; rbb < 12; rbb++) {
                            let rotFlipRot = rotateFaces(rtb, rbb, flipCube(rotateFaces(rta, rba, currentState)))
                            if (strState(rotFlipRot) == strState(nextState)) {
                                output += ("r" + (rta + lastRt) + "," + (rba + lastRb) + ": ").padEnd(10) + printState(rotateFaces(rta, rba, currentState)) + "\n"
                                output += ("flip: ").padEnd(10) + printState(flipCube(rotateFaces(rta, rba, currentState))) + "\n"
                                //output += ("r" + rtb + "," + rbb + ": ").padEnd(10) + printState(rotFlipRot) + "\n"
                                lastRt = rtb;
                                lastRb = rtb;
                                success = true;
                                console.log("did rot flip rot")
                            }
                        }
                    }
                }
            }
        }

        if (!success) {
            output += "magic: ".padEnd(10) + printState(nextState) + "\n";
            console.log("did magic.")
        }

        currentState = nextState;
    }

    output += "done!\n"
    return output;
}

const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');

const exS = 1;
const exE = 1.1;
const shsScale = 0.9;

const parPoint = Math.tan(Math.PI / 12)
const trigPoints = [
    [0, 0],
    [1, parPoint],
    [1, -parPoint]
]

const trigPointsExtra = [
    [exS, parPoint],
    [exE, parPoint],
    [exE, -parPoint],
    [exS, -parPoint],
]

const kitePoints = [
    [0, 0],
    [1, parPoint],
    [1, 1],
    [parPoint, 1]
]

const kitePointsExtraA = [
    [exS, parPoint],
    [exE, parPoint],
    [exE, 1],
    [exS, 1]
]

const kitePointsExtraB = [
    [parPoint, exS],
    [parPoint, exE],
    [1, exE],
    [1, exS]
]

const squarePoints = [
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 0],
]

const colorMap = {
  R: "red",
  G: "green",
  B: "blue",
  Y: "yellow",
  W: "white",
  O: "orange"
};

const tick = Math.PI / 6;

function drawStateOnCanvas([topFace, botFace]) {
    

    const dim = Math.min(canvas.clientWidth / 2, canvas.clientHeight)
    const xOff = (canvas.clientWidth - (dim * 2)) / 2;
    const yOff = (canvas.clientHeight - dim) / 2;

    const d = dim / 2
    const r = dim / 4;

    const topCenter = [d + xOff, d + yOff]
    const botCenter = [(3 * d) + xOff, d + yOff]

    const angleStart = -Math.PI / 3;  // -60 degrees
    const angleEnd = Math.PI / 3;     // 60 degrees
    
    const imageData = ctx.createImageData(dim, dim);
    const data = imageData.data;
    
    // Function to draw polygon from array of points
    function drawPolygon(points, border, fill) {
        if (points.length < 2) return;  // Need at least 2 points to draw

        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);  // Move to the first point

        // Draw lines to subsequent points
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i][0], points[i][1]);
        }

        ctx.closePath();  // Close the polygon by connecting last point to first

        ctx.strokeStyle = border;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = fill;
        ctx.fill();
    }

    function scalePolygon(points, scale, [offsetX, offsetY]) {
        return points.map(([x, y]) => [(x * scale) + offsetX, (y * scale) + offsetY]);
    }

    function rotatePolygon(points, angle) {
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);

        return points.map(([x, y]) => [x * cosA - y * sinA, x * sinA + y * cosA])
    }

    function formatPolygon(points, scale, [offsetX, offsetY], angle) {
        return scalePolygon(rotatePolygon(points, angle), scale, [offsetX, offsetY]);
    }

    function drawPiece(num, pieceStr, top, center) {
        let primary = pieceStr[0]
            let secondary = pieceStr[1]
        if (!top) num++;
        
        if (pieceStr.length == 2) {
            let angle = tick * (num + 3);
            drawPolygon(formatPolygon(trigPoints, r * shsScale, center, angle), 'black', colorMap[primary])
            drawPolygon(formatPolygon(trigPointsExtra, r * shsScale, center, angle), 'black', colorMap[secondary])
        } else {
            let angle = tick * (num + 2);
            let tertiary = pieceStr[2];
            if (primary == 'Y') {
                [secondary, tertiary] = [tertiary, secondary]
            }
            drawPolygon(formatPolygon(kitePoints, r * shsScale, center, angle), 'black', colorMap[primary])
            drawPolygon(formatPolygon(kitePointsExtraA, r * shsScale, center, angle), 'black', colorMap[secondary])
            drawPolygon(formatPolygon(kitePointsExtraB, r * shsScale, center, angle), 'black', colorMap[tertiary])
        }
    }

    function drawState([topFace, botFace]) {
        drawFace(topFace, true, topCenter)
        drawFace(botFace, true, botCenter)
    }

    function drawFace(face, top, center) {
        let i = 0;
        for (let pieceStr of face.split('.')) {
            pieceStr = reverseMap.get((pieceMap.get(pieceStr) + "").replaceAll(',',""))
            drawPiece(i, pieceStr, top, center);
            i += (pieceStr.length == 3) ? 2 : 1;
        }
    }

    //drawPolygon(formatPolygon(outline, d, [topCenter[0] - r, topCenter[1] - r], 0), 'black', 'purple')
    //drawPolygon(formatPolygon(outline, d, [botCenter[0] - r, botCenter[1] - r], 0), 'black', 'purple')

    topFace = topFace.replace(/[()]/g, "").trim();
    botFace = botFace.replace(/[()]/g, "").trim();

    drawPolygon(formatPolygon(squarePoints, dim, [0, 0], 0), 'white', 'white')
    drawPolygon(formatPolygon(squarePoints, dim, [dim, 0], 0), 'white', 'white')

    drawState([topFace, botFace])
}

const stepButton = document.getElementById("stepButton");
const output = document.getElementById("outputLabel");
const topFaceInputBox = document.getElementById("topFaceInput");
const botFaceInputBox = document.getElementById("botFaceInput");
stepButton.disabled = true;

let currentLineIndex = 1;
async function handleSolveButtonClick() {
    stepButton.disabled = true;
    
    const topFaceInput = topFaceInputBox.value;
    const botFaceInput = botFaceInputBox.value;

    //const topFaceInput = "WOG.YBR.YR.WO.WOB.YB.WB.YG.WG"
    //const botFaceInput = "YRG.YOB.YO.WR.WRG.WBR.YGO"
    
    drawStateOnCanvas([topFaceInput, botFaceInput]);

    const [topFace, botFace] = [buildFace(topFaceInput), buildFace(botFaceInput)];
    
    goalState = solvedState
    
    const startTimestamp = performance.now();
    output.textContent += "started solver...\n"

    let result = await bidirectionalBFS([topFace, botFace], goalState);
    output.textContent = ""
    output.textContent += result;

    const endTimestamp = performance.now();
    console.log(`Solver took ${endTimestamp - startTimestamp} ms`);

    output.textContent += `Solver took ${Math.ceil(endTimestamp - startTimestamp)} ms\n`;

    // Optional: auto-scroll to bottom
    output.scrollTop = output.scrollHeight;
    stepButton.disabled = false;
}

// horrible and hacky but fine
function handleStepButtonClick() {
    currentLineIndex++;
    const lines = output.textContent.split('\n');
    if (currentLineIndex >= lines.length) {
        return;
    }

    while (lines[currentLineIndex].indexOf('iteration') != -1) currentLineIndex++;

    let state = lines[currentLineIndex].split(':')[1].trim();
    console.log("found valid line: " + lines[currentLineIndex]);
    drawStateOnCanvas(state.split(','));

    if (lines[currentLineIndex + 1].indexOf(':') == -1)
        stepButton.disabled = true;
}

function showInstructionsButtonClick() {
    alert("Enter cube faces in the format like YOB.WR.WRG etc, where top face colour comes first, then any other colours.")
    alert("Enter the faces going clockwise starting after the bottom of the split. The big part of the middle layer should be on the left when aligned.")
    alert("Once the faces are input, click run solver to generate a solution.")
    alert("Once a solution is generated, click show next step to see what the cube should look like after each operation.")
    alert("Click shuffle cube to get a random cube permutation.")
}

function setRandomCubeButtonClick() {
    stepButton.disabled = true;
    [topFaceStart, botFaceStart] = solvedState;
    let currentState = [topFaceStart, botFaceStart];
    for (let i = 0; i < 100; i++) {
        currentState = rotateFaces(Math.floor(Math.random() * 12), Math.floor(Math.random() * 12), currentState);
        if (canFlip(currentState))
            currentState = flipCube(currentState);
        else
            i--;
    }

    topFaceInputBox.value = decodeFaceString(currentState[0])
    botFaceInputBox.value = decodeFaceString(currentState[1])

    currentLineIndex = 1;
}
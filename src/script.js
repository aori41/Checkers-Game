const board = document.querySelector("#board");

const boardSize = 64;
const rowSize = 8;

const imgFolder = "../checkers pieces";
const blackPiece = "black.jpeg";
const whitePiece = "white.jpeg";
const queenWhitePiece = "white_queen.jpeg";
const queenBlackPiece = "black_queen.jpeg";

let selectedId = -1;

let turn = "white";
const span = document.querySelector("span");

const blackSquareColor = "rgb(35, 35, 35)";
const selectedSquareColor = "rgb(125, 133, 82)";

startGame();
function startGame(restart = false) {
    let rowSwitch = false;

    for (let i = 0; i < boardSize; i++) { // create the board
        const square = (restart ? squares[i] : document.createElement("button"));

        if (restart) clearSquare(i);

        if (i % rowSize === 0) rowSwitch = !rowSwitch;

        if ((rowSwitch && i % 2 !== 0) || (!rowSwitch && i % 2 === 0)) {
            square.style.backgroundColor = blackSquareColor;
            square.classList.add("black_square");
            // check for black and white starting positions
            if (i < ((boardSize / 2) - rowSize)) addPiece(square, "black");
            else if (i >= ((boardSize / 2) + rowSize)) addPiece(square, "white");
        }
        if (!restart) board.append(square);
    }
    span.innerText = turn;
    span.style.color = turn;
}

const squares = document.querySelectorAll("button");

squares.forEach(function (square, id) {
    square.addEventListener("click", function () {
        if (selectedId !== -1) { // checks if selected a piece already
            if (selectedId === id || !this.classList.contains("black_square")) { // checks if tap same piece or white square
                if (squares[selectedId].classList.contains("chain")) {
                    squares[selectedId].classList.remove("chain");
                    if (isGameOver()) {
                        restartGame();
                    } else {
                        turn = (turn === "white" ? "black" : "white");
                        span.innerText = turn;
                        span.style.color = turn;
                    }
                }
                squares[selectedId].style.backgroundColor = blackSquareColor;
                selectedId = -1;
                return; // reset select
            }

            if (selectedId !== id) { // after tapped another black square
                if (this.classList.contains("piece")) { // check if there is another piece in same square
                    if (isTurn(squares[id])) {
                        if (!squares[selectedId].classList.contains("chain")) {
                            squares[selectedId].style.backgroundColor = blackSquareColor;
                            selectedId = id;
                            this.style.backgroundColor = selectedSquareColor;
                        }
                    }
                } else { // empty black square
                    if (isValidMove(selectedId, id)) { // transfer piece to next destination
                        const currentRow = Math.floor(selectedId / rowSize);
                        const currentCol = selectedId % rowSize;
                        const destRow = Math.floor(id / rowSize);
                        const destCol = id % rowSize;

                        const midRow = (currentRow + destRow) / 2;
                        const midCol = (currentCol + destCol) / 2;
                        const midSquare = (midRow * rowSize) + midCol;

                        let checkForChain = false;
                        if (midSquare % 1 === 0) { // remove eaten piece
                            checkForChain = true;
                            clearSquare(midSquare);
                        }

                        const isQueen = (squares[selectedId].classList.contains("queen") ||
                            (squares[selectedId].classList.contains("white") && destRow === 0) ||
                            (squares[selectedId].classList.contains("black") && destRow === (rowSize - 1)));

                        clearSquare(selectedId); // remove player piece
                        addPiece(squares[id], turn, isQueen); // relocate the piece in new place

                        if (checkForChain) {
                            if (hasPotentialMoves(id)) {
                                squares[selectedId].style.backgroundColor = blackSquareColor;
                                selectedId = id; // Keep the same piece for chain-eating
                                squares[id].classList.add("chain");
                                this.style.backgroundColor = selectedSquareColor;
                                return;
                            }
                        }
                        // reset and switch turn
                        squares[selectedId].style.backgroundColor = blackSquareColor;
                        selectedId = -1;
                        if (isGameOver()) {
                            restartGame();
                            return; // reset game and announce winner
                        } else {
                            turn = (turn === "white" ? "black" : "white");
                            span.innerText = turn;
                            span.style.color = turn;
                        }
                    }
                }
            }
            return;
        }

        if (!this.classList.contains("black_square") || // checks if valid piece before select
            !this.classList.contains("black") &&
            !this.classList.contains("white")) return;

        if (selectedId === -1 && isTurn(squares[id])) { // select piece
            this.style.backgroundColor = selectedSquareColor;
            selectedId = id;
        }
    });
});

function isValidMove(squareFrom, squareTo) {
    const currentSquare = squares[squareFrom];
    const destSquare = squares[squareTo];

    // checks if valid square
    if (!destSquare.classList.contains("black_square")) return false;

    // calculate position of square on board
    const currentRow = Math.floor(squareFrom / rowSize);
    const currentCol = squareFrom % rowSize;
    const destRow = Math.floor(squareTo / rowSize);
    const destCol = squareTo % rowSize;

    // checks moving forward
    if (!currentSquare.classList.contains("queen") && !currentSquare.classList.contains("chain")) {
        if (currentSquare.classList.contains("white") && destRow >= currentRow) return false;
        if (currentSquare.classList.contains("black") && destRow <= currentRow) return false;
    }

    // checks for a valid move
    const isCapture = Math.abs(destRow - currentRow) === 2 && Math.abs(destCol - currentCol) === 2;
    const isValid = Math.abs(destRow - currentRow) === 1 &&
        Math.abs(destCol - currentCol) === 1 &&
        !currentSquare.classList.contains("chain");

    if (!isValid && !isCapture) return false;

    // check if jumped over opponent piece
    const midRow = (currentRow + destRow) / 2;
    const midCol = (currentCol + destCol) / 2;
    const midSquare = squares[(midRow * rowSize) + midCol];

    if (midSquare && isCapture) {
        if (!midSquare.classList.contains("piece") || isTurn(midSquare)) return false;
    }
    return true;
}

function hasPotentialMoves(squareId = -1) {
    const directions = [
        { row: -1, col: -1 }, // Up-left
        { row: -1, col: 1 },  // Up-right
        { row: 1, col: -1 },  // Down-left
        { row: 1, col: 1 },   // Down-right
    ];

    function isEmptySquare(destRow, destCol) { // check if empty and inside board borders
        return destRow >= 0 && destRow < rowSize && destCol >= 0 && destCol < rowSize &&
            !squares[destRow * rowSize + destCol].classList.contains("piece");
    }

    function getPotentialCaptureMoves(squareId) { // checks for chain eating
        const currentRow = Math.floor(squareId / rowSize);
        const currentCol = squareId % rowSize;
        for (const direction of directions) {
            const midRow = currentRow + direction.row;
            const midCol = currentCol + direction.col;
            const destRow = currentRow + direction.row * 2;
            const destCol = currentCol + direction.col * 2;

            if (isEmptySquare(destRow, destCol)) {
                const midSquare = squares[midRow * rowSize + midCol];
                const destSquare = squares[destRow * rowSize + destCol];

                if (midSquare && midSquare.classList.contains("piece") && !isTurn(midSquare) && !destSquare.classList.contains("piece")) {
                    return true;
                }
            }
        }
        return false;
    }

    if (squareId !== -1) { // check specific id for chain eating
        return getPotentialCaptureMoves(squareId);
    } else { // check if no available moves to continue the game
        for (let i = 0; i < boardSize; i++) {
            if (squares[i].classList.contains("piece") && !isTurn(squares[i])) {
                squareId = i;

                const currentRow = Math.floor(squareId / rowSize);
                const currentCol = squareId % rowSize;

                for (const direction of directions) {
                    const destRow = currentRow + direction.row;
                    const destCol = currentCol + direction.col;
                    const destSquareId = destRow * rowSize + destCol;

                    if ((isEmptySquare(destRow, destCol) && isValidMove(squareId, destSquareId)) || getPotentialCaptureMoves(squareId)) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

function isGameOver() {
    return (!document.querySelectorAll(".white").length ||
        !document.querySelectorAll(".black").length ||
        !hasPotentialMoves());
}

function isTurn(piece) {
    return !(turn === "white" && piece.classList.contains("black")) &&
        !(turn === "black" && piece.classList.contains("white"));
}

function restartGame() {
    alert(`Winner is ${turn}!!!`);
    turn = "white";
    selectedId = -1;
    startGame(true);
}

function addPiece(square, colorClass, queen = false) { // create piece image
    const img = document.createElement("img");
    if (queen) {
        img.setAttribute("src", `${imgFolder}/${colorClass === "white" ? queenWhitePiece : queenBlackPiece}`);
        square.classList.add("queen");
    } else img.setAttribute("src", `${imgFolder}/${colorClass === "white" ? whitePiece : blackPiece}`);
    square.classList.add(colorClass);
    square.classList.add("piece");
    square.append(img);
}

function clearSquare(id) { // reset square to default
    if (squares[id].children[0]) squares[id].children[0].remove();
    squares[id].classList.remove("white");
    squares[id].classList.remove("black");
    squares[id].classList.remove("queen");
    squares[id].classList.remove("piece");
    squares[id].classList.remove("chain");
}
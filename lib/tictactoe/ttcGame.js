class game {
    constructor(boardSize = 3) {
        this.dim = boardSize
        this.board = []
        this.players = []
        this.turnOf = 0
        this.gameOver = false
        this.turnsMade = 0
        for (let i = 0; i < boardSize; i++) {
            this.board[i] = [];
            for (let j = 0; j < boardSize; j++) {
                this.board[i][j] = -1
            }
        }
    }
    get getGameOver() {
        return this.checkGameOver()
    }
    checkGameOver() {
        // check rows
        let validTemp = true
        for (let i = 0; i < this.dim; i++) {
            validTemp = true
            for (let j = 1; j < this.dim; j++) {
                if (this.board[i][j] == -1 || this.board[i][j] != this.board[i][0]) {
                    validTemp = false
                    break
                }
            }
            if (validTemp) {
                return true
            }
        }
        // check cols
        for (let i = 0; i < this.dim; i++) {
            validTemp = true
            for (let j = 1; j < this.dim; j++) {
                if (this.board[0][i] == -1 || this.board[j][i] != this.board[0][i]) {
                    validTemp = false
                    break
                }
            }
            if (validTemp) {
                return true
            }
        }

        // check top left to bottom right diag
        validTemp = true
        for (let i = 1; i < this.dim; i++) {
            if (this.board[i][i] == -1 || this.board[i][i] != this.board[0][0]) {
                validTemp = false
                break
            }
        }
        if (validTemp) {
                return true
            }
        // check bottom left to top right diag
        validTemp = true
        for (let i = 0; i < this.dim - 1; i++) {
            if (this.board[i][i] == -1 || this.board[i][this.dim - 1 - i] != this.board[this.dim - 1][0]) {
                validTemp = false
                break
            }
        }
        if (validTemp) {
            return true
        }
        return false
    }
}

module.exports = { game }
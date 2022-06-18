class connect4GameObj {
    constructor(width=7,height=6) {
        this.height = height;
        this.width = width;
        this.board = [];
        this.players = [];
        this.turnOf = 0;
        this.movesLeft = width * height;

        for (let i = 0; i < height; i++) {
            this.board[i] = [];
            for (let j = 0; j < width; j++) {
                this.board[i][j] = -1;
            }
        }
    }
    colIsFull(col) {
        if (col < 0 || col >= this.width) return true;
        return this.board[0][col] != -1;
    }
    insertInCol(col) {
        if (this.colIsFull(col)) return -1;
        let row = 0;
        while (row < this.height && this.board[row][col] == -1) {
            row++;
        }
        this.board[row - 1][col] = this.turnOf;
        this.turnOf = 1 - this.turnOf;
        return 0;
    }
}

module.exports = { connect4GameObj }
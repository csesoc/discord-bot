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
}

module.exports = { connect4GameObj }
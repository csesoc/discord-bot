class connect4GameObj {
    constructor(width=7,height=6) {
        this.height = height;
        this.width = width;
        this.board = [];
        this.players = [0, 0];
        this.turnOf = 0;
        this.movesLeft = width * height;
        this.gameWon = false;

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
        this.movesLeft--;
        this.gameWon = this.checkWin(row - 1, col);
        return 0;
    }
    checkWin(row, col) {
        if (row < 0 || row >= this.width || col < 0 || col >= this.height) {
            return false;
        }
        const target = this.board[row][col];
        let count = 0;

        // check horizontal
        let x = col;
        let y = row;
        // go left
        while(x >= 0 && this.board[y][x] == target) {
            x--;
            count++;
        }
        x = col + 1;
        // go right
        while(x < this.width && this.board[y][x] == target) {
            x++;
            count++;
        }

        if (count >= 4) return true;

        count = 0;
        // check vertical
        x = col;
        // go up
        while(y >= 0 && this.board[y][x] == target) {
            y--;
            count++;
        }
        y = row + 1;
        // go down
        while(y < this.height && this.board[y][x] == target) {
            y++;
            count++;
        }

        if (count >= 4) return true;

        count = 0;
        // check diag top left, bottom right
        x = col;
        y = row;

        // go north-west
        while (y >= 0 && x >= 0 && this.board[y][x] == target) {
            x--;
            y--;
            count++;
        }
        // go south-east
        x = col + 1;
        y = row + 1;
        while (y < this.height && x < this.width && this.board[y][x] == target) {
            x++;
            y++;
            count++;
        }

        if (count >= 4) return true;
        count = 0;

        // check diag top right, bottom left
        x = col;
        y = row;

        // go north-east
        while (y >= 0 && x < this.width && this.board[y][x] == target) {
            x++;
            y--;
            count++;
        }
        // go south-west
        x = col - 1;
        y = row + 1;
        while (y < this.height && x >= 0 && this.board[y][x] == target) {
            x--;
            y++;
            count++;
        }

        if (count >= 4) return true;
        return false;
    }
}

module.exports = { connect4GameObj }
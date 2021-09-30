module.exports = {
    name: "ready",
    once: true,
    execute(client) {
        client.cbStuff = new CarrotboardStuff(); // this is really bad
    },
};

class CarrotboardStuff {
    pin = "📌";
    maxMsgLen = 50;
    rowsPerPage = 5;    

    constructor() {
        this.storage = {};
        this._read_config();
    }

    _read_config() {
        ;
    }
}

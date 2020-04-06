#!/usr/bin/env node

const { getValue } = require("./healthcheck");
const { createServer } = require("http");
const { ETHEREUM_ENDPOINT } = process.env;
const PORT = 8080;

function main() {
    const server = createServer(async (req, res) => {
        let resultStatus = 503;
        let returnValue;

        try {
            returnValue = await getValue(ETHEREUM_ENDPOINT);
            if (returnValue.ok) {
                resultStatus = 200;
            }
        } catch (e) {
            returnValue = {
                ok: false,
                error: e.toString(),
            }
        }
        
        res.writeHead(resultStatus, { "Content-Type": "application/json" });
        res.end(JSON.stringify(returnValue));
    });
    console.log(`Server is listening on port ${PORT}`);
    server.listen(PORT);
}

if (!module.parent) {
    main();
}
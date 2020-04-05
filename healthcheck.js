const fetch = require("node-fetch");
const { writeFileSync, mkdirSync } = require("fs");
const { dirname } = require("path");

async function post(endpoint, data) {
    const result = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return result.json();
}

async function getLatestBlockHeaders(endpoint) {
    return post(endpoint, {"method":"eth_getBlockByNumber","params":["latest", false],"id":1,"jsonrpc":"2.0"});
}

function getMachineCurrentTime() {
    return Math.floor(Date.now() / 1000);
}

async function getEthSyncing(endpoint) {
    return post(endpoint, {"method":"eth_syncing","params":[],"id":1,"jsonrpc":"2.0"});
}

async function main() {
    const [ endpoint, output ] = process.argv.slice(2);

    // Check if ethereum is synced
    const ethSyncing = await getEthSyncing(endpoint);
    const latestBlock = await getLatestBlockHeaders(endpoint);
    const latestBlockTimestamp = latestBlock.result && parseInt(latestBlock.result.timestamp);
    const currentMachineTimestamp = getMachineCurrentTime();

    const returnValue = {
        ok: (Math.abs(currentMachineTimestamp - latestBlockTimestamp)) < 5 * 60, // the health check should fail if 5 minutes
        blockNumber: parseInt(latestBlock.result.number),
        latestBlockTimestamp,
        currentMachineTimestamp,
        timeDriftInSeconds: currentMachineTimestamp - latestBlockTimestamp,
    };

    if (returnValue.ok) {
        returnValue.message = 'Ethereum is now fully synced with the mainnet!';
    }

    if (!ethSyncing.result) {
        if (ethSyncing.result.highestBlock === '0x0') {
            returnValue.message = 'Ethereum is downloading an initial snapshot, and will soon start syncing blocks';
        } else {
            returnValue.message = 'Ethereum sync in progress';
            returnValue.blocksRemainingToSync = parseInt(ethSyncing.result.highestBlock) - parseInt(ethSyncing.result.currentBlock);
        }
    }

    console.log(JSON.stringify(returnValue));

    if (output) {
        try {
            mkdirSync(dirname(output));
        } catch (e) { }
        writeFileSync(output, JSON.stringify(returnValue));
    }
}

if (!module.parent) {
    main();
}
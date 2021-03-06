#!/usr/bin/env node

const fetch = require("node-fetch");
const { writeFileSync, mkdirSync } = require("fs");
const { dirname } = require("path");
const { exit } = require("process");

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

async function getValue(endpoint) {
    const ethSyncing = await getEthSyncing(endpoint);
    const latestBlock = await getLatestBlockHeaders(endpoint);
    const latestBlockTimestamp = latestBlock.result && parseInt(latestBlock.result.timestamp);
    const currentMachineTimestamp = getMachineCurrentTime();

    const returnValue = {
        ok: (Math.abs(currentMachineTimestamp - latestBlockTimestamp)) < 5 * 60, // the health check should fail if 5 minutes
        blockNumber: parseInt(latestBlock && latestBlock.result && latestBlock.result.number || "0"),
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


    return returnValue;
}

async function main() {
    if (process.argv.length < 3) {
        console.log("USAGE: ethereum-healthcheck http://localhost:8545 output.json")
        exit(1);
    }

    const [ endpoint, output ] = process.argv.slice(2);

    // Check if ethereum is synced
    const returnValue = await getValue(endpoint, output);
    console.log(JSON.stringify(returnValue));

    if (output) {
        try {
            mkdirSync(dirname(output));
        } catch (e) { }
        writeFileSync(output, JSON.stringify(returnValue));
    }

    if (!returnValue.ok) {
        exit(1);
    }
}

if (!module.parent) {
    main();
} else {
    module.exports = {
        getValue,
    }
}
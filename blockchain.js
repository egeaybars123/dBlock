const sha256 = require("crypto-js/sha256");
const EC = require("elliptic").ec;
const ec = new EC("secp256k1");

class Transaction {
    constructor(fromAddress, toAddress, amount) {
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
    }

    calculateHash() {
        return sha256(this.fromAddress + this.toAddress + this.amount).toString();
    }

    signTransaction(signingKey) {

        if (signingKey.getPublic("hex") !== this.fromAddress) {
            throw new Error("Can't sign transactions for other wallets");
        }

        const hashTx = this.calculateHash();
        const sig = signingKey.sign(hashTx, "base64");
        this.signature = sig.toDER("hex");
    }

    isValid() {
        console.log(this.signature);
        if (this.fromAddress === null) return true;

        if (!this.signature || this.signature.length === 0) {
            throw new Error("No signature in this transaction");
        }

        const publicKey = ec.keyFromPublic(this.fromAddress, "hex");
        return publicKey.verify(this.calculateHash(), this.signature);
    }
}

class Block {
    constructor(timestamp, transactions, previousHash = "") {
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.hash = "";
        this.nonce = 0;
        this.count = 0; 
    }

    calculateHash() {
        this.count++;
        return sha256(this.previousHash + this.timestamp + JSON.stringify(this.data) + this.nonce).toString();
    }

    mineBlock(difficulty) {
        while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
            this.nonce++;
            this.hash = this.calculateHash();
        }
        console.log("Block mined:" + this.hash + " Calculation count:" + this.count);
    }

    hasValidTransactions() {
        for (const tx of this.transactions) {
            if(!tx.isValid()) {
                return false;
            }
        }
        return true;
    }
}

class Blockchain{
    constructor() {
        this.chain = [];
        this.difficulty = 2;
        this.pendingTransactions = [];
        this.miningRewards = 100;
    }

    mineGenesisBlock(miningRewardAddress) {
        const genesis_transaction = [new Transaction(null, miningRewardAddress, this.miningRewards)];
        let block = new Block("09/05/2022", genesis_transaction, "");
        block.mineBlock(this.difficulty);
        console.log("Genesis block mined...");
        this.chain.push(block);
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    minePendingTransactions(miningRewardAddress) {
        
        let block = new Block(Date.now(), this.pendingTransactions);
        block.mineBlock(this.difficulty);
        block.previousHash = this.chain[this.chain.length - 1].hash;
        console.log("Block successfully mined...");

        this.chain.push(block);

        this.pendingTransactions = [new Transaction(null, miningRewardAddress, this.miningRewards)];
    }

    addTransaction(transaction) {

        if(!transaction.toAddress || !transaction.fromAddress) {
            throw new Error("Transaction must include to and from addresses!")
        }

        if(!transaction.isValid()){
            throw new Error("Cannot add invalid transaction to the chain!")
        }

        this.pendingTransactions.push(transaction);
    }

    getBalanceOfAddress(address) {
        let balance = 0;

        for (const block of this.chain) {
            for (const trans of block.transactions) {
                if (trans.toAddress === address) {
                    balance += trans.amount;
                }
                if (trans.fromAddress === address) {
                    balance -= trans.amount;
                }
            }
        }
        return balance;
    }

    addBlock(newBlock) {
        newBlock.previousHash = this.getLatestBlock().hash;
        newBlock.mineBlock(this.difficulty);
        this.chain.push(newBlock);
    }


    isChainValid() {
        for(let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if(!currentBlock.hasValidTransactions()){
                return false;
            }

            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false;
            }

            if (previousBlock.hash !== currentBlock.previousHash) {
                return false;
            }

        return true;
        }
    }
}

module.exports.Blockchain = Blockchain;
module.exports.Transaction = Transaction;

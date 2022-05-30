const { Blockchain, Transaction } = require("./blockchain");
const EC = require("elliptic").ec;
const ec = new EC("secp256k1");

const myKey = ec.keyFromPrivate("55cbf22b76ebbf95b7f7c901b16f0cb620a265601f9b1b564689c0bfc7cdde3e");
const myWalletAddress = myKey.getPublic("hex");

let dBlock = new Blockchain();
dBlock.mineGenesisBlock(myWalletAddress);

const tx1 = new Transaction(myWalletAddress, "public key", 10);
tx1.signTransaction(myKey);

dBlock.addTransaction(tx1);

dBlock.minePendingTransactions("Another address");

console.log("Balance of Ege:" + dBlock.getBalanceOfAddress(myWalletAddress));
console.log(dBlock);



const circomlibjs = require("circomlibjs");
const ethers = require("ethers");

// Deploying the contracts
const merkle_tree_contract = artifacts.require("MerkleTreeWithHistory");
const zk_tree_contract = artifacts.require("ZKTree");
const zk_vote_contract = artifacts.require("ZKTreeVote");
const verifier_contract = artifacts.require("Verifier");

const level = 20;
const numOptions = 2;

// Deploying the contracts

module.exports = function (deployer) {
    deployer.then(async () => {
        const privateKey = '9f87a5c19c406440610a4c1b83f545b21c0e3564b4134a77a2e8e781125a8ef3';  // Replace with a private key from Truffle develop
        const provider = await new ethers.providers.JsonRpcProvider('http://127.0.0.1:9545');
        const wallet = await new ethers.Wallet(privateKey, provider);
        
        const abi = await circomlibjs.mimc7Contract.abi;
        const bytecode = await circomlibjs.mimc7Contract.createCode("mimcsponge", 220);
        const mimc_sponge = new ethers.ContractFactory(abi, bytecode, wallet);
        // Deploy the contract
        const mimcContract = await mimc_sponge.deploy();
        // Wait for the deployment to be mined
        await mimcContract.deployed();
        console.log('MiMCSponge contract deployed at address:', mimcContract.address);

        await deployer.deploy(merkle_tree_contract, level, mimcContract.address);
        console.log("MerkleTreeWithHistory contract deployed at address: ", merkle_tree_contract.address);

        await deployer.deploy(verifier_contract);
        console.log("Verifier contract deployed at address: ", verifier_contract.address);

        await deployer.link(merkle_tree_contract, zk_tree_contract);
        await deployer.deploy(zk_tree_contract, level, mimcContract.address, verifier_contract.address);
        console.log("ZKTree contract deployed at address: ", zk_tree_contract.address);

        await deployer.link(zk_tree_contract, zk_vote_contract);
        await deployer.deploy(zk_vote_contract, level, mimcContract.address, verifier_contract.address, numOptions);
        console.log("ZKTreeVote contract deployed at address: ", zk_vote_contract.address);
    });
}
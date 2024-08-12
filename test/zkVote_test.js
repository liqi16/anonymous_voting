const ethers  = require("ethers");
const circomlibjs = require("circomlibjs");
const zkTree = require("../src/zkTree");
const calculateMerkleRootAndZKProof = zkTree.calculateMerkleRootAndZKProof;

const merkle_tree_contract = artifacts.require("MerkleTreeWithHistory");
const zk_tree_contract = artifacts.require("ZKTree");
const zk_vote_contract = artifacts.require("ZKTreeVote");
const verifier_contract = artifacts.require("Verifier");

contract("zkVote test", async accounts => {
    
    it("Test the full process", async () => {
        // Deploying the contracts
        
        const privateKey = '9f87a5c19c406440610a4c1b83f545b21c0e3564b4134a77a2e8e781125a8ef3';  // Replace with a private key from Truffle develop
        const provider = await new ethers.providers.JsonRpcProvider('http://127.0.0.1:9545');
        const wallet = await new ethers.Wallet(privateKey, provider);
        // console.log(Object.keys(circomlibjs));
        const abi = await circomlibjs.mimcSpongecontract.abi;
        const bytecode = await circomlibjs.mimcSpongecontract.createCode("mimcsponge", 220);
        console.log("ABI:", JSON.stringify(abi));
        const mimc_sponge = new ethers.ContractFactory(abi, bytecode, wallet);
        // Deploy the contract
        const mimcContract = await mimc_sponge.deploy();
        // console.log('MiMCSponge contract', mimcContract);
        let verifierContract = await verifier_contract.deployed();

        let result = await mimcContract.MiMCSponge(1, 2, 0);
        console.log("MiMCSponge Result:", result.xL.toString(),result.xR.toString());

        const level = 20;
        const numOptions = 2;

        let merkleContract = await merkle_tree_contract.deployed(level, mimcContract.address);

        
        result = await debug(merkleContract.hashLeftRight(1, 2));
        console.log("hashLeftRight Result:", result.toString());

        // let verifierContract = await verifier_contract.deployed();
        // await deployer.link(merkle_tree_contract, zk_tree_contract);
        // let zktreeContract = await zk_tree_contract.deployed(level, mimcContract.address, verifierContract.address);
        // await deployer.link(zk_tree_contract, zk_vote_contract);
        let zkvoteContract = await zk_vote_contract.deployed(level, mimcContract.address, verifierContract.address, numOptions);
            

        // Registering a validator
        await zkvoteContract.registerValidator(accounts[0], {from: accounts[0]});

        // Register a voter
        const commitment1 = await zkTree.generateCommitment()
        result = await debug(zkvoteContract.registerCommitment(1, commitment1.commitment,{from: accounts[0]}))
        console.log(result)
        const commitment2 = await zkTree.generateCommitment()
        await zkvoteContract.registerCommitment(2, commitment2.commitment,{from: accounts[0]})
        const commitment3 = await zkTree.generateCommitment()
        await zkvoteContract.registerCommitment(3, commitment3.commitment,{from: accounts[0]})

        // Votes
        const cd1 = await calculateMerkleRootAndZKProof(zktreevote.address, accounts[2], TREE_LEVELS, commitment1, "keys/Verifier.zkey")
        await zktreevote.vote(1, cd1.nullifierHash, cd1.root, cd1.proof_a, cd1.proof_b, cd1.proof_c, {from: accounts[1]})
        const cd2 = await calculateMerkleRootAndZKProof(zktreevote.address, accounts[3], TREE_LEVELS, commitment2, "keys/Verifier.zkey")
        await zktreevote.vote(2, cd2.nullifierHash, cd2.root, cd2.proof_a, cd2.proof_b, cd2.proof_c, {from: accounts[2]})
        const cd3 = await calculateMerkleRootAndZKProof(zktreevote.address, accounts[4], TREE_LEVELS, commitment3, "keys/Verifier.zkey")
        await zktreevote.vote(3, cd3.nullifierHash, cd3.root, cd3.proof_a, cd3.proof_b, cd3.proof_c, {from: accounts[3]})

        // Results
        console.log(await zktreevote.getOptionCounter(1))
        console.log(await zktreevote.getOptionCounter(2))
    });

});
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
        
        const privateKey = '0f35ff2e072272e33811ed2ec944adf6bc1827cf4d79b4355389498441efcda6';  // Replace with a private key from Truffle develop
        const provider = await new ethers.providers.JsonRpcProvider('http://127.0.0.1:9545');
        const wallet = await new ethers.Wallet(privateKey, provider);
        console.log(Object.keys(circomlibjs));
        const abi = await circomlibjs.mimcSpongecontract.abi;
        const bytecode = await circomlibjs.mimcSpongecontract.createCode("mimcsponge", 220);
        console.log("ABI:", JSON.stringify(abi));
        const mimc_sponge = new ethers.ContractFactory(abi, bytecode, wallet);
        const mimcContract = await mimc_sponge.deploy();
        // console.log('MiMCSponge contract', mimcContract);
        let verifierContract = await verifier_contract.new({from: accounts[0]});

        // let result = await mimcContract.MiMCSponge(1, 2, 0);
        // console.log("MiMCSponge Result:", result.xL.toString(),result.xR.toString());

        const TREE_LEVELS = 20;
        const numOptions = 2;

        let merkleContract = await merkle_tree_contract.new(TREE_LEVELS, mimcContract.address);
        // result = await merkleContract.setSender(mimcContract.address);
        // console.log("setSender Result:", result.toString());
        //catch event            
        // result = await merkleContract.testHasher(1, 2);
        //catch event
        
        
        // result = await debug(merkleContract.hashLeftRight(1, 2));
        // console.log("hashLeftRight Result:", result.toString());

        // let verifierContract = await verifier_contract.deployed();
        // await deployer.link(merkle_tree_contract, zk_tree_contract);
        // let zktreeContract = await zk_tree_contract.deployed(level, mimcContract.address, verifierContract.address);
        // await deployer.link(zk_tree_contract, zk_vote_contract);
        let zkvoteContract = await zk_vote_contract.new(TREE_LEVELS, mimcContract.address, verifierContract.address, numOptions);
            

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
        const cd1 = await calculateMerkleRootAndZKProof(zkvoteContract.address, provider, TREE_LEVELS, commitment1, "src/verifier.zkey")
        await zkvoteContract.vote(1, cd1.nullifierHash, cd1.root, cd1.proof_a, cd1.proof_b, cd1.proof_c, {from: accounts[1]})
        const cd2 = await calculateMerkleRootAndZKProof(zkvoteContract.address, provider, TREE_LEVELS, commitment2, "src/verifier.zkey")
        await zkvoteContract.vote(2, cd2.nullifierHash, cd2.root, cd2.proof_a, cd2.proof_b, cd2.proof_c, {from: accounts[2]})
        const cd3 = await calculateMerkleRootAndZKProof(zkvoteContract.address, provider, TREE_LEVELS, commitment3, "src/verifier.zkey")
        await zkvoteContract.vote(2, cd3.nullifierHash, cd3.root, cd3.proof_a, cd3.proof_b, cd3.proof_c, {from: accounts[3]})

        // Results
        console.log(await zkvoteContract.getOptionCounter(1))
        console.log(await zkvoteContract.getOptionCounter(2))
    });

});
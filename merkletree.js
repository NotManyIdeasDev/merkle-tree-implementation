//Many thanks to https://ethereum.org/en/developers/tutorials/merkle-proofs-for-offline-data-integrity/
//nmi <3

const ethers = require("ethers")
const express = require('express')
const app = express()
const port = 3000

const rawStartData = ["A", "B", "C", "D", "E", "F"]
let startData = rawStartData.map(x => hash(x))

function formatBI(bigInt) {
    return "0x" + bigInt.toString(16)
}

function hash(data) {
    return BigInt(ethers.utils.keccak256("0x" + data.toString(16).padStart(64, 0)))
}

function pairHash(a, b) {
    return hash(hash(a) ^ hash(b))
}

function calculateNextLayer(data) {
    let result = []
    let arr = [...data]

    if (arr.length % 2 == 1) arr.push(0n)

    for (let i = 0; i < arr.length; i += 2) {
        result.push(pairHash(arr[i], arr[i + 1]))
    }

    return result
}

function getMerkleRoot(data) {
    let result = [...data]
    while (result.length > 1) {
        result = calculateNextLayer(result)
    }
    return result[0]
}

function getMerkleProof(data, index) {
    let result = []
    let currentLayer = [...data]
    let currentIndex = index

    while (currentLayer.length > 1) {
        if (currentLayer.length % 2 == 1) {
            currentLayer.push(0n)
        }

        result.push(currentIndex % 2 == 1 ? currentLayer[currentIndex - 1] : currentLayer[currentIndex + 1])
        currentIndex = Math.floor(currentIndex / 2)
        currentLayer = calculateNextLayer(currentLayer)

    }

    return result
}

function verifyProof(item, proof, root) {
    let value = item
    for (let i = 0; i < proof.length; i++) {
        value = pairHash(value, proof[i])
    }

    return value == root
}

app.get('/root', (req, res) => {
    try {
        let root = getMerkleRoot(startData)
        res.send(JSON.stringify({
            success: true,
            root: formatBI(root)
        }))
    } catch(e) {
        res.send(JSON.stringify({
            success: false,
            error: e.toString()
        }))
    }
})

app.get('/proof/:item', (req, res) => {
    try {
        let itemIndex = startData.indexOf(hash(req.params.item))
        let rawProof = getMerkleProof(startData, itemIndex)
        let fixedProof = []

        for (let proofFragment of rawProof) {
            let fixedProofFragment = formatBI(proofFragment)
            fixedProof.push(fixedProofFragment)
        }

        res.send(JSON.stringify({
            success: true,
            proof: fixedProof
        }))
    } catch(e) {
        console.log(e)
        res.send(JSON.stringify({
            success: false,
            error: e.toString()
        }))
    }
})

app.get('/verify/:item', (req, res) => {
    try {
        let itemIndex = startData.indexOf(hash(req.params.item))
        let rawProof = getMerkleProof(startData, itemIndex)

        let isValid = verifyProof(hash(req.params.item), rawProof, getMerkleRoot(startData))

        res.send(JSON.stringify({
            success: true,
            valid: isValid,
            message: "This should be done on a smart contract so it doesn't really make sense to do here, Hence why I'm not directly asking for the proof on this endpoint"
        }))
    } catch(e) {
        console.log(e)
        res.send(JSON.stringify({
            success: false,
            error: e.toString()
        }))
    }
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

// function hash(data) {
//     return data != null ? crypto.createHash('sha256').update(data.toString()).digest('hex') : ""
// }

// function calculateNextLayer(data) {
//     let result = []
//     let arr = [...data]

//     if (data.length % 2 == 0) {
//         while (arr.length > 0) {
//             result.push(hash(arr.shift() + arr.shift()))
//         }
//     } else {
//         while (arr.length > 1) {
//             result.push(hash(arr.shift() + arr.shift()))
//         }
//         result.push(arr[0])
//     }

//     return result
// }

// function getMerkleRoot(data) {
//     let result = [...data]
//     while (result.length > 1) {
//         result = calculateNextLayer(result)
//     }
//     return result
// }

// function getMerkleProof(data, index) {
//     let result = []
//     let currentLayer = [...data]
//     let currentIndex = index

//     while (currentLayer.length > 1) {
//         if (currentLayer.length % 2 == 1) {
//             currentLayer.push("")
//         }

//         result.push(currentLayer % 2 == 1 ? currentLayer[currentIndex - 1] : currentLayer[currentIndex + 1])
//         currentIndex = Math.floor(currentIndex / 2)
//         currentLayer = calculateNextLayer(currentLayer)
//     }

//     return result
// }

// function verifyData(root, item, proof) {
//     let itemHash = hash(item)
//     for (let i = 0; i < proof.length; i++) {
//         itemHash = hash(itemHash + proof[i])
//     }

//     return itemHash == root
// }

// function initializeTree(data) {
//     let hashes = []
//     for (let item of data) {
//         hashes.push(hash(item))
//     }

//     let root = getMerkleRoot(hashes)
//     let proofForC = getMerkleProof(hashes, 0)
//     console.log(proofForC)

//     let isGenuine = verifyData(root, "A", proofForC)

//     console.log(chalk.bold('\n\nMerkle Tree Initialized!') + '\n' + chalk.bold('Root: ') + chalk.bold.red(root) + '\n\n')
//     console.log(isGenuine)
// }

// const sampleData = ["A", "B", "C", "D"]
// initializeTree(sampleData)


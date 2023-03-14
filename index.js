import * as IPFS from 'ipfs-core'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'

const data = 'Hello, World!'
const fragmentCount = 10
const nodeCount = 20
const shardSize = 1000
const shardSizeBytes = shardSize * 1024
const shardCount = Math.ceil(data.length / shardSizeBytes)
const shards = []
const pubsubTopic = 'sharding'

async function main() {
    const nodes = []
    try {
        for (let i = 0; i < nodeCount; i++) {
            const node = await IPFS.create({
                repo: `./node${i}`,
                config: {
                    Addresses: {
                        Swarm: []
                    },
                    relay: {
                        enabled: true, // enable relay dialer/listener (STOP)
                        hop: {
                            enabled: true // make this node a relay (HOP)
                        }
                    },
                    pubsub: {
                        enabled: true // enable pubsub
                    }
                }
            })
            nodes.push(node)
            console.log(`Node ${i} started`)
        }
        // Subscribe to pubsub topic
        nodes.forEach(async (node) => {
            await node.pubsub.subscribe(pubsubTopic, (msg) => {
                console.log(`Received message from node ${msg.from}: ${msg.data.toString()}`)
            })
        })

        const shardedData = []
        for (let i = 0; i < shardCount; i++) {
            shardedData.push(uint8ArrayFromString(`shard-${i}`))
        }

        const shards = []

        // Add redundancy by splitting the shards into fragments and storing each fragment in a different node
        for (let i = 0; i < shardCount; i++) {
            const shard = shardedData[i]
            const shardSize = shard.byteLength
            let offset = 0
            const fragments = []

            while (offset < shardSize) {
                const chunkSize = Math.min(shardSizeBytes, shardSize - offset)
                const chunk = shard.subarray(offset, offset + chunkSize)
                const fragment = { data: chunk, nodes: [] }
                for (let j = 0; j < fragmentCount; j++) {
                    const nodeIndex = (i * fragmentCount + j) % nodeCount
                    const node = nodes[nodeIndex]
                    let cid
                    try { cid = await node.add(chunk) } catch (err) { return console.error(`Error adding chunk to node ${nodeIndex}`, err) }
                    fragment.nodes.push({ nodeIndex, cid })
                }
                fragments.push(fragment)
                offset += chunkSize
            }

            // Publish message to pubsub topic with shard information
            const shardInfo = { shardIndex: i, fragments }
            const msg = uint8ArrayFromString(JSON.stringify(shardInfo))
            await nodes.forEach(async (node) => { await node.pubsub.publish(pubsubTopic, msg) })
            shards.push(shardInfo)
        }

        // Download and reassemble shards from nodes
        async function downloadAndReassemble(shardInfo) {
            const { fragments } = shardInfo
            const reassembledShard = new Uint8Array(shardSizeBytes)

            for (let i = 0; i < fragments.length; i++) {
                const fragment = fragments[i]
                const { data: fragmentData, nodes } = fragment
                let reassembledOffset = 0

                for (let j = 0; j < nodes.length; j++) {
                    const { nodeIndex, cid } = nodes[j]
                    const node = nodes[nodeIndex]

                    try {
                        const chunk = await node.get(cid)
                        reassembledShard.set(chunk, reassembledOffset)
                        reassembledOffset += chunk.byteLength
                    } catch (err) {
                        console.error(`Error getting chunk from node ${nodeIndex}`, err)
                    }
                }

                if (!reassembledShard.every((byte, index) => byte === fragmentData[index])) {
                    console.error(`Shard ${shardInfo.shardIndex} failed verification`)
                    return
                }
            }

            console.log(`Shard ${shardInfo.shardIndex} reassembled successfully`)
            return reassembledShard
        }

        // Download and reassemble all shards
        async function downloadAndReassembleAll(shards) {
            const reassembledData = new Uint8Array(data.length)

            for (let i = 0; i < shards.length; i++) {
                const shardInfo = shards[i]
                const reassembledShard = await downloadAndReassemble(shardInfo)

                if (reassembledShard) {
                    const shardStartIndex = shardInfo.shardIndex * shardSizeBytes
                    reassembledData.set(reassembledShard, shardStartIndex)
                } else {
                    console.error(`Failed to reassemble shard ${shardInfo.shardIndex}`)
                }
            }

            console.log(`Data reassembled successfully`)
            console.log(`Data: ${uint8ArrayToString(reassembledData)}`)
            return reassembledData
        }

        // Convert Uint8Array to string
        function uint8ArrayToString(data) {
            return new TextDecoder().decode(data)
        }

        console.log(`Sharded ${data.length} bytes into ${shards.length} shards, each consisting of ${fragmentCount} fragments, and stored them across ${nodeCount} nodes`)
        console.log(shards)
    } catch (err) {
        return console.error('Error creating IPFS nodes', err)
    }
}
main()
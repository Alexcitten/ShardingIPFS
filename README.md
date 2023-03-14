# Sharding IPFS Storage
This code implements a sharding scheme for storing data in a decentralized and redundant way using IPFS (InterPlanetary File System). The code utilizes the IPFS Core library to create multiple IPFS nodes and store shards of data across them.

Sharding is a technique for storing and retrieving large files by splitting them into smaller pieces and distributing them across multiple storage nodes. This makes it possible to store and retrieve files that are too large to fit on a single node.

The code takes in a data string and splits it into multiple shards, each consisting of multiple fragments. Each fragment is stored in a different node to provide redundancy and prevent data loss.

The nodes communicate with each other using IPFS pubsub, which allows them to publish and subscribe to messages on a given topic. The code subscribes to a pubsub topic called `'sharding'`, and when a node receives a message on that topic, it attempts to download and reassemble the corresponding shard.

Once all the shards are downloaded and reassembled, the code outputs the reassembled data string to the console.

## Dependencies
- [Node.js](https://nodejs.org/) v16 or later
- [IPFS](https://www.npmjs.com/package/ipfs-core) v0.18.0 or later

## Usage
```
# Clone the repository
git clone https://github.com/Alexcitten/ShardingIPFS.git
cd ShardingIPFS
npm install
npm start
```

The application will create `nodeCount` IPFS nodes, split the data into `shardCount` shards, and store the shards across the nodes. Each shard is split into `fragmentCount` fragments, and each fragment is stored on a different node. The application uses `pubsub` to communicate between the nodes and coordinate the storage and retrieval of the shards.

Once the shards have been stored, the application will download and reassemble them into the original data.
### Configuration
The application can be configured by editing the variables at the beginning of the `index.js` file:

- `data`: The data to be sharded
- `fragmentCount`: The number of fragments required for recovery
- `nodeCount`: The number of nodes used for storage
- `shardSize`: The size of each shard, in kilobytes
- `pubsubTopic`: The pubsub topic used for communication between the nodes

### Functions
- `main()` creates multiple IPFS nodes and publishes the shard information for each node to the pubsub topic.
- `downloadAndReassemble()` is used to download and reassemble a single shard from its fragments. 
- `downloadAndReassembleAll()` is used to download and reassemble all the shards of data.
- `uint8ArrayToString()` convert Uint8Array to string
With these functions, you can download and reassemble all the shards and obtain the original data as follows:
```js
const reassembledData = await downloadAndReassembleAll(shards)
```
This code downloads and reassembles all the shards, verifies their integrity, and returns the reassembled data as a Uint8Array object. You can then convert the Uint8Array to a string using the `uint8ArrayToString` function.

### Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.
## In plans
* A version of this code with a CLI where you can load files, and configure the code.
* Simplifying the configuration, changing the structure

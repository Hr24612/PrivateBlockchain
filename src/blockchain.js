const SHA256 = require('crypto-js/sha256');
const BlockClass = require('./block.js');
const bitcoinMessage = require('bitcoinjs-message');

class Blockchain {
	constructor() {
		this.chain = [];
		this.height = -1;
		this.initializeChain();
	}
	async initializeChain() {
		if (this.height === -1) {
			let block = new BlockClass.Block({ data: 'Genesis Block' });
			await this._addBlock(block);
		}
	}

	getChainHeight() {
		return new Promise((resolve, reject) => {
			resolve(this.height);
		});
	}

	_addBlock(block) {
		let self = this;
		return new Promise(async (resolve, reject) => {
			let rawBlock = block;
			var date = new Date();
			rawBlock.hash = SHA256(JSON.stringify(rawBlock)).toString();
			rawBlock.time = date.getTime().toString().slice(0, -3);
			rawBlock.height = self.height + 1;
			if (self.height >= 0) {
				rawBlock.previousBlockHash = self.chain[self.height].hash;
				self.chain.push(rawBlock);
			} else {
				self.chain.push(rawBlock);
			}
			self.height = self.chain.length - 1;
			resolve(rawBlock);
		});
	}

	requestMessageOwnershipVerification(address) {
		return new Promise((resolve) => {
			let message = `${address}:${new Date()
				.getTime()
				.toString()
				.slice(0, -3)}:starRegistry`;
			resolve(message);
		});
	}

	submitStar(address, message, signature, star) {
		let self = this;
		return new Promise(async (resolve, reject) => {
			let time = parseInt(message.split(':')[1]);
			let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));
			if (currentTime - time < 300) {
				// verify the signature
				let isValid = bitcoinMessage.verify(message, address, signature);
				if (isValid) {
					let block = new BlockClass.Block({ owner: address, star: star });
					let addedBlock = await self._addBlock(block);
					resolve(addedBlock);
				} else {
					reject('Your signature is not valid');
				}
			} else {
				reject('You should submit the star before 5 minutes');
			}
		});
	}

	getBlockByHash(hash) {
		let self = this;
		return new Promise((resolve, reject) => {
			let block = self.chain.filter((p) => p.hash === hash)[0];
			if (block) {
				resolve(block);
			} else {
				resolve(null);
			}
		});
	}

	getBlockByHeight(height) {
		let self = this;
		return new Promise((resolve, reject) => {
			let block = self.chain.filter((p) => p.height === height)[0];
			if (block) {
				resolve(block);
			} else {
				resolve(null);
			}
		});
	}

	getStarsByWalletAddress(address) {
		let self = this;
		let stars = [];
		return new Promise((resolve, reject) => {
			self.chain.forEach((b) => {
				let data = b.getBData();
				if (data) {
					if (data.owner === address) {
						stars.push(data);
					}
				}
			});
			resolve(stars);
		});
	}

	validateChain() {
		let self = this;
		let errorLog = [];
		return new Promise(async (resolve, reject) => {
			let promises = [];
			let chainIndex = 0;
			self.chain.forEach((block) => {
				promises.push(block.validate());
				if (block.height > 0) {
					let previousBlockHash = block.previousBlockHash;
					let blockHash = self.chain[chainIndex - 1].hash;
					if (blockHash != previousBlockHash) {
						errorLog.push(
							`Error - Block Heigh: ${block.height} - Previous Hash don't match.`
						);
					}
				}
				chainIndex++;
			});
			Promise.all(promises)
				.then((results) => {
					chainIndex = 0;
					results.forEach((valid) => {
						if (!valid) {
							errorLog.push(
								`Error - Block Heigh: ${self.chain[chainIndex].height} - Has been Tampered.`
							);
						}
						chainIndex++;
					});
					resolve(errorLog);
				})
				.catch((err) => {
					console.log(err);
					reject(err);
				});
		});
	}
}

module.exports.Blockchain = Blockchain;

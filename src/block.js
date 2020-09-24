const SHA256 = require('crypto-js/sha256');
const hex2ascii = require('hex2ascii');

class Block {
	constructor(data) {
		this.hash = null;
		this.height = 0;
		this.body = Buffer.from(JSON.stringify(data)).toString('hex');
		this.time = 0;
		this.previousBlockHash = null;
	}

	validate() {
		let self = this;
		return new Promise((resolve, reject) => {
			let auxHash = self.hash;
			self.hash = null;
			let hash = SHA256(JSON.stringify(self)).toString();
			self.hash = ausHash;
			if (hash === auxHash) {
				resolve(true);
			} else {
				resolve(false);
			}
		});
	}

	getBData() {
		let encodedData = this.body;
		let jsonData = hex2ascii(encodedData);
		let data = JSON.parse(jsonData);
		if (data && this.height > 0) {
			return data;
		}
	}
}

module.exports.Block = Block;
le;

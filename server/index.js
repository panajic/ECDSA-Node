const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;
const secp = require("ethereum-cryptography/secp256k1");
const { keccak256 } = require("ethereum-cryptography/keccak");
const { toHex } = require("ethereum-cryptography/utils");


app.use(cors());
app.use(express.json());

const balances = {
  "0xf3f218c871f05d38518550163dc07096a3e1a14f": 100,
  "0xc5ea29cddaebdcadb5e1335b6dd8a6b2209cef63": 50,
  "0x5347afc0a7847364a9fc858359333dd17023611a": 75,
};

// Because of this app is not connecting to a wallet, create an object with public key/private key pairs.
const privateKeys = {
  "0xf3f218c871f05d38518550163dc07096a3e1a14f": "b28b85da26c609a8c420e59b7037ac7a49bffd02d0ef0249f0cbb7cba4c27254",
  "0xc5ea29cddaebdcadb5e1335b6dd8a6b2209cef63": "38c08445531d63b8fbd1fa95c3cb023875b6b4c94931d6c5aeaee39a7cde00f7",
  "0x5347afc0a7847364a9fc858359333dd17023611a": "d3bdea1ffbc2d2ed2c73c9fb422036d9680220b5f85759c481160726f8a39b91"
}

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  const privateKey = privateKeys[address];
  res.send({ balance, privateKey });
});

app.post("/send", async (req, res) => {

  try {

  const { signature, hexMessage, recoveryBit, sender, recipient, amount } = req.body;

  // Get signature, hash and recovery bit from client-sideand recover the address from signature.

  const signaturePublicKey = secp.recoverPublicKey(hexMessage, signature, recoveryBit);
  const signatureAddressNotHex = keccak256(signaturePublicKey.slice(1)).slice(-20);
  const signatureAddress = "0x" + toHex(signatureAddressNotHex);
  

  setInitialBalance(sender);
  setInitialBalance(recipient);

  if (balances[sender] < amount) {
    res.status(400).send({ message: "Not enough funds!" });
  } 
  else if (signatureAddress !== sender) {
    res.status(400).send({message: "You are not the person!"});
  }
  else {
    balances[sender] -= amount;
    balances[recipient] += amount;
    res.send({ balance: balances[sender] });
  }
} catch(error){
  console.log(error);
}
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}


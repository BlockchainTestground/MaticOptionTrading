const getWeb3 = () => {
  return new Promise((resolve, reject) => {
    window.addEventListener("load", async () => {
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        try {
          // ask user permission to access his accounts
          await window.ethereum.request({ method: "eth_requestAccounts" });
          resolve(web3);
        } catch (error) {
          reject(error);
        }
      } else {
        reject("must install MetaMask");
      }
    });
  });
};

function handleRevertError(message) {
  alert(message);
}

async function getRevertReason(txHash) {
  const tx = await web3.eth.getTransaction(txHash);
  await web3.eth
    .call(tx, tx.blockNumber)
    .then((result) => {
      throw Error("unlikely to happen");
    })
    .catch((revertReason) => {
      var str = "" + revertReason;
      json_reason = JSON.parse(str.substring(str.indexOf("{")));
      handleRevertError(json_reason.message);
    });
}

const getContract = async (web3) => {
  const data = await $.getJSON("./contracts/OptionTrades.json");

  const netId = await web3.eth.net.getId();
  const deployedNetwork = data.networks[netId];
  const contract = new web3.eth.Contract(
    data.abi,
    deployedNetwork && deployedNetwork.address
  );
  return contract;
};

const convertToDateString = (epochTime) => {
  const date = new Date(epochTime * 1000);
  return date.toLocaleDateString("en-US");
};

const convertWeiToCrypto = (wei) => {
  const web3 = new Web3(window.ethereum);
  const cryptoValue = web3.utils.fromWei(wei);
  return cryptoValue;
};

const showRetrieveExpiredFunds = (option, accounts) => {
  console.log("option.expiry", option.expiry);
  console.log("now", Date.now());
  return option.writer === accounts[0] &&
    !option.exercised &&
    !option.canceled &&
    option.expiry > Date.now()
    ? ""
    : "none";
};

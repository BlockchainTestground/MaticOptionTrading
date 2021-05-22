const getWeb3 = async () => {
  return new Promise((resolve, reject) => {
    console.log(document.readyState)
    if(document.readyState=="complete")
    {
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        try {
          // ask user permission to access his accounts
          (async function(){
            await window.ethereum.request({ method: "eth_requestAccounts" });
          })()
          resolve(web3);
        } catch (error) {
          reject(error);
        }
      } else {
        reject("must install MetaMask");
      }
    }else
    {
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
    }
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
  const cryptoValue = web3.utils.fromWei(wei, "ether");
  return cryptoValue;
};

const convertCryptoToWei = (crypto) => {
  return web3.utils.toWei(crypto, "ether");
};

const showRetrieveExpiredFunds = (option, accounts) => {
  const expiry = new Date(option.expiry * 1000);
  return option.writer === accounts[0] &&
    !option.exercised &&
    !option.canceled &&
    expiry > Date.now()
    ? ""
    : "none";
};

const showExcercise = (option, accounts) => {
  const expiry = new Date(option.expiry * 1000);
  return option.buyer === accounts[0] &&
    !option.exercised &&
    expiry > Date.now()
    ? ""
    : "none";
};

const showBuy = (option) => {
  const expiry = new Date(option.expiry * 1000);
  return !/^0x0+$/.test(option.buyer) ||
    option.writer === accounts[0] ||
    option.canceled ||
    expiry < Date.now()
    ? "none"
    : "";
};

const showCancel = (option, accounts) => {
  return option.writer === accounts[0] &&
    !option.canceled &&
    /^0x0+$/.test(option.buyer)
    ? ""
    : "none";
};

var getJSON = function (url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);
  xhr.responseType = "json";
  xhr.onload = function () {
    var status = xhr.status;
    if (status === 200) {
      callback(null, xhr.response);
    } else {
      callback(status, xhr.response);
    }
  };
  xhr.send();
};
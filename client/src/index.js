var contract;
var accounts;
var web3;

const displayOptions = async () => {
  options_length = await contract.methods.getMaticOptsLength().call()
  options_html = "<ul>"
  for(i=0; i<options_length; i++)
  {
    option = await contract.methods.maticOpts(i).call()
    options_html += "<li>"
    options_html += "Amount: "
    options_html += convertWeiToCrypto(option.amount);
    options_html += " Buyer: "
    options_html += option.buyer
    options_html += " Writer "
    options_html += option.writer
    options_html += " Canceled: "
    options_html += option.canceled
    options_html += " Exercised: "
    options_html += option.exercised
    options_html += " Expiry: "
    options_html += convertToDateString(option.expiry);
    options_html += " Id: "
    options_html += option.id
    options_html += " Latest_cost: "
    options_html += option.latestCost
    options_html += " Premium: "
    options_html += option.premium
    options_html += " Strike: "
    options_html += option.strike
    options_html += "<button onclick='cancelOption("+ option.id +")'>Cancel</button>"
    options_html += "<button onclick='buyOption("+ option.id +", "+ option.premium +")'>Buy</button>"
    options_html += "<button onclick='exerciseOption("+ option.id +", "+ option.latestCost +")'>Exercise</button>"
    options_html += "<button onclick='retrieveExpiredFunds("+ option.id +")'>Retrieve expired funds</button>"
    options_html += "<button onclick='updateExerciseCost("+ option.id +")'>Update exercise cost</button>"
    options_html += "</li>"
  }
  options_html += "</ul>"
  $("#options").html(options_html);
};

const cancelOption = async (option_id) => {
  const result = await contract.methods
    .cancelOption(option_id)
    .send({ from: accounts[0], gas: 400000 })
    .catch(revertReason =>
    {
      getRevertReason(revertReason.receipt.transactionHash)
    })
  displayOptions(contract);
}

const buyOption = async (option_id, premium) => {
  await contract.methods
    .buyOption(option_id)
    .send({ from: accounts[0], gas: 400000, value: premium })
    .catch(revertReason =>
    {
      getRevertReason(revertReason.receipt.transactionHash)
    })
  displayOptions(contract);
}

const exerciseOption = async (option_id, latest_cost) => {
  await contract.methods
    .exercise(option_id)
    .send({ from: accounts[0], gas: 400000, value: latest_cost })
    .catch(revertReason =>
    {
      getRevertReason(revertReason.receipt.transactionHash)
    })
  displayOptions(contract);
}

const retrieveExpiredFunds = async (option_id) => {
  await contract.methods
    .retrieveExpiredFunds(option_id)
    .send({ from: accounts[0], gas: 400000 })
    .catch(revertReason =>
    {
      getRevertReason(revertReason.receipt.transactionHash)
    })
  displayOptions(contract);
}

const updateExerciseCost = async (option_id) => {
  await contract.methods
    .updateExerciseCost(option_id)
    .send({ from: accounts[0], gas: 400000 })
    .catch(revertReason =>
    {
      getRevertReason(revertReason.receipt.transactionHash)
    })
  displayOptions(contract);
}

const writeOption = (contract, accounts) => {
  let strike;
  let premium;
  let expiry;
  let tknAmt;
  $("#strike").on("change", (e) => {
    strike = e.target.value;
  });
  $("#premium").on("change", (e) => {
    premium = e.target.value;
  });
  $("#expiry").on("change", (e) => {
    expiry = e.target.value;
  });
  $("#tknAmt").on("change", (e) => {
    tknAmt = e.target.value;
  });
  $("#write_option_form").on("submit", async (e) => {
    e.preventDefault();
    await contract.methods
      .writeOption(strike, premium, expiry, tknAmt)
      .send({ from: accounts[0], gas: 400000, value: tknAmt });
      displayOptions(contract)
      .catch(revertReason =>
      {
        getRevertReason(revertReason.receipt.transactionHash)
      })
  });
};

async function optionTradesApp() {
  var awaitWeb3 = async function() {
    web3 = await getWeb3();
    var awaitContract = async function() {
      contract = await getContract(web3)
      var awaitAccounts = async function() {
        accounts = await web3.eth.getAccounts()
        writeOption(contract, accounts)
        displayOptions(contract)
      }
      awaitAccounts()
    }
    awaitContract()
  }
  awaitWeb3()
}

optionTradesApp();
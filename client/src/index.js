var contract;
var accounts;
var web3;


function getOptionHtml(option)
{
  result = ""
  result += "<tr>"
  result += "<td>"
  result += convertWeiToCrypto(option.amount);
  result += "</td>"
  result += "<td>"
  result += option.buyer.substring(0, 7)
  result += "</td>"
  result += "<td>"
  result += option.writer.substring(0, 7)
  result += "</td>"
  result += "<td>"
  result += option.canceled
  result += "</td>"
  result += "<td>"
  result += option.exercised
  result += "</td>"
  result += "<td>"
  result += convertToDateString(option.expiry);
  result += "</td>"
  result += "<td>"
  result += option.id
  result += "</td>"
  result += "<td>"
  result += option.latestCost
  result += "</td>"
  result += "<td>"
  result += option.premium
  result += "</td>"
  result += "<td>"
  result += option.strike
  result += "</td>"
  result += "<td>"
  result += "<button onclick='cancelOption("+ option.id +")'>Cancel</button>"
  result += `<button onclick='buyOption("+ option.id +", "+ option.premium +")' style='display:${showBuy(option)}'>Buy</button>`
  result += `<button onclick='exerciseOption("+ option.id +", "+ option.latestCost +")' style='display:${showExcercise(option, accounts)}'>Exercise</button>`
  result += `<button onclick='retrieveExpiredFunds("+ option.id +")' style='display:${showRetrieveExpiredFunds(option, accounts)}'>Retrieve expired funds </button>`
  result += "<button onclick='updateExerciseCost("+ option.id +")'>Update exercise cost</button>"
  result += "</td>"
  result + "</tr></td>"
  return result
}

const displayMyOptions = async (options_length) => {
  var options_html = "<table class='table'>"
    + "<thead><tr><th>Amount</th>"
    + "<th>Buyer</th>"
    + "<th>Writer</th>"
    + "<th>Canceled</th>"
    + "<th>Exercised</th>"
    + "<th>Expiry</th>"
    + "<th>Id</th>"
    + "<th>Latest_cost</th>"
    + "<th>Premium</th>"
    + "<th>Strike</th>"
    + "<th>Actions</th>"
    + "</thead>"

  for(var i=0; i<options_length; i++)
  {
    option = await contract.methods.maticOpts(i).call()
    if(option.writer == accounts[0])
    {
      options_html += getOptionHtml(option)
    }

  }
  options_html += "</table>"
  $("#my_options").html(options_html);
}

const displayOthersOptions = async (options_length) => {
  var options_html = "<table class='table'>"
    + "<thead><tr><th>Amount</th>"
    + "<th>Buyer</th>"
    + "<th>Writer</th>"
    + "<th>Canceled</th>"
    + "<th>Exercised</th>"
    + "<th>Expiry</th>"
    + "<th>Id</th>"
    + "<th>Latest_cost</th>"
    + "<th>Premium</th>"
    + "<th>Strike</th>"
    + "<th>Actions</th>"
    + "</thead>"

  for(var i=0; i<options_length; i++)
  {
    option = await contract.methods.maticOpts(i).call()
    if(option.writer != accounts[0] && option.buyer != accounts[0])
    {
      options_html += getOptionHtml(option)
    }
  }
  options_html += "</table>"
  $("#others_options").html(options_html);
}

const displayOptionsIBought = async (options_length) => {
  var options_html = "<table class='table'>"
    + "<thead><tr><th>Amount</th>"
    + "<th>Buyer</th>"
    + "<th>Writer</th>"
    + "<th>Canceled</th>"
    + "<th>Exercised</th>"
    + "<th>Expiry</th>"
    + "<th>Id</th>"
    + "<th>Latest_cost</th>"
    + "<th>Premium</th>"
    + "<th>Strike</th>"
    + "<th>Actions</th>"
    + "</thead>"

  for(var i=0; i<options_length; i++)
  {
    option = await contract.methods.maticOpts(i).call()
    if(option.buyer == accounts[0])
    {
      options_html += getOptionHtml(option)
    }
  }
  options_html += "</table>"
  $("#options_I_bought").html(options_html);
}

const displayOptions = async () => {
  options_length = await contract.methods.getMaticOptsLength().call()
  displayMyOptions(options_length)
  displayOthersOptions(options_length)
  displayOptionsIBought(options_length)
}

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
var contract;
var accounts;
var web3;


function getOptionHtml(option)
{
  result = ""
  result += "<tr>"
  result += "<td>"
  if(option.optionType == 0)
  {
    result += "PUT";
  }else
  {
    result += "CALL";
  }
  result += "</td>"
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
  result += option.exercised
  result += "</td>"
  result += "<td>"
  result += convertToDateString(option.expiry);
  result += "</td>"
  result += "<td>"
  result += convertWeiToCrypto(option.latestCost);
  result += "<button onclick='updateExerciseCost("+ option.id +")'>Update exercise cost</button>"
  result += "</td>"
  result += "<td>"
  result += convertWeiToCrypto(option.premium);
  result += "</td>"
  result += "<td>"
  result += convertWeiToCrypto(option.strike);
  result += "</td>"
  result += "<td>"
  result += `<button onclick='cancelOption(${option.id})' style='display:${showCancel(option,accounts)}'>Cancel</button>`
  result += `<button onclick='buyOption(${option.id},${option.premium})' style='display:${showBuy(option)}'>Buy</button>`
  result += `<button onclick='exerciseOption(${option.id},${option.latestCost})' style='display:${showExcercise(option, accounts)}'>Exercise</button>`
  result += `<button onclick='retrieveExpiredFunds(${option.id})' style='display:${showRetrieveExpiredFunds(option, accounts)}'>Retrieve expired funds </button>`
  result += "</td>"
  result + "</tr></td>"
  return result
}

const displayMyOptions = async (options_length) => {
  var options_html = "<table class='table'>"
    + "<thead><tr><th>Type</th>"
    + "<th>Amount</th>"
    + "<th>Buyer</th>"
    + "<th>Writer</th>"
    + "<th>Exercised</th>"
    + "<th>Expiry</th>"
    + "<th>Latest cost</th>"
    + "<th>Premium</th>"
    + "<th>Strike</th>"
    + "<th>Actions</th>"
    + "</thead>"

  var option_count = 0
  for(var i=0; i<options_length; i++)
  {
    option = await contract.methods.maticOpts(i).call()
    if(option.writer == accounts[0]
      && !option.canceled
      )
    {
      options_html += getOptionHtml(option)
      option_count+=1
      if(option_count>5)
        break;
    }
  }
  options_html += "</table>"
  $("#my_options").html(options_html);
}

const displayOthersOptions = async (options_length) => {
  var options_html = "<table class='table'>"
    + "<thead><tr><th>Type</th>"
    + "<th>Amount</th>"
    + "<th>Buyer</th>"
    + "<th>Writer</th>"
    + "<th>Exercised</th>"
    + "<th>Expiry</th>"
    + "<th>Latest cost</th>"
    + "<th>Premium</th>"
    + "<th>Strike</th>"
    + "<th>Actions</th>"
    + "</thead>"

  var option_count = 0
  for(var i=0; i<options_length; i++)
  {
    option = await contract.methods.maticOpts(i).call()
    if(option.writer != accounts[0]
      && option.buyer != accounts[0]
      && !option.canceled
      )
    {
      options_html += getOptionHtml(option)
      option_count+=1
      if(option_count>5)
        break;
    }
  }
  options_html += "</table>"
  $("#others_options").html(options_html);
}

const displayOptionsIBought = async (options_length) => {
  var options_html = "<table class='table'>"
    + "<thead><tr><th>Type</th>"
    + "<th>Amount</th>"
    + "<th>Buyer</th>"
    + "<th>Writer</th>"
    + "<th>Exercised</th>"
    + "<th>Expiry</th>"
    + "<th>Latest cost</th>"
    + "<th>Premium</th>"
    + "<th>Strike</th>"
    + "<th>Actions</th>"
    + "</thead>"

  var option_count = 0
  for(var i=0; i<options_length; i++)
  {
    option = await contract.methods.maticOpts(i).call()
    if(option.buyer == accounts[0]
      && !option.canceled
      )
    {
      options_html += getOptionHtml(option)
      option_count+=1
      if(option_count>5)
        break;
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

let strike = document.getElementById("strike").value;
let premium = document.getElementById("premium").value;
let expiry_days = document.getElementById("expiry").value;
let tknAmt = document.getElementById("tknAmt").value;
let optionType = "CALL";

function updateSummary() {
  document.getElementById("summary_strike").innerHTML = "Strike price: " + strike
  document.getElementById("summary_premium").innerHTML = "Premium: " + premium
  document.getElementById("summary_usd_value").innerHTML = "USD Value:: ??"
  document.getElementById("summary_break_even").innerHTML = "Break Even: ??"
}

const writeOption = (contract, accounts) => {
  $("#strike").on("change", (e) => {
    strike = e.target.value;
    updateSummary()
  });
  $("#premium").on("change", (e) => {
    premium = e.target.value;
    updateSummary()
  });
  $("#expiry").on("change", (e) => {
    expiry_days = e.target.value;
    updateSummary()
  });
  $("#tknAmt").on("change", (e) => {
    tknAmt = e.target.value;
    updateSummary()
  });
  $("#put").on("change", (e) => {
    optionType = "PUT"
    updateSummary()
  });
  $("#call").on("change", (e) => {
    optionType = "CALL"
    updateSummary()
  });
  $("#write_option_form").on("submit", async (e) => {
    e.preventDefault();
    var secondsSinceEpoch = Math.round(Date.now() / 1000)
    var expiry = secondsSinceEpoch+expiry_days*86400
    await contract.methods
      .writeOption(convertCryptoToWei(strike), convertCryptoToWei(premium), expiry, convertCryptoToWei(tknAmt), optionType)
      .send({ from: accounts[0], gas: 400000, value: convertCryptoToWei(tknAmt) });
      displayOptions(contract)
      .catch(revertReason =>
      {
        getRevertReason(revertReason.receipt.transactionHash)
      })
  });
}

function connectWallet()
{
  var awaitAccounts = async function() {
    accounts = await web3.eth.getAccounts()
    writeOption(contract, accounts)
    displayOptions()
    document.getElementById("my-address").innerHTML = accounts[0]
    document.getElementById("wallet-disconnected").style.display = "none"
    document.getElementById("wallet-connected").style.display = "block"
  }
  awaitAccounts()
}

function disconnectWallet()
{
  accounts = null
  document.getElementById("wallet-disconnected").style.display = "block"
  document.getElementById("wallet-connected").style.display = "none"
}

async function optionTradesApp() {
  var awaitWeb3 = async function() {
    web3 = await getWeb3();
    web3.eth.net.getId((err, netId) => {
      console.log(netId)
      if(netId == 80001)
      {
        document.getElementById("loading-web3").style.display = "none"
        document.getElementById("wallet-connected").style.display = "block"
      }else
      {
        document.getElementById("loading-web3").style.display = "none"
        document.getElementById("wallet-disconnected").style.display = "none"
        document.getElementById("wallet-connected").style.display = "none"
        document.getElementById("wrong-network").style.display = "block"
      }
    })
    var awaitContract = async function() {
      contract = await getContract(web3)
      var awaitAccounts = async function() {
        accounts = await web3.eth.getAccounts()
        writeOption(contract, accounts)
        displayOptions()
        document.getElementById("my-address").innerHTML = accounts[0]
        document.getElementById("wallet-disconnected").style.display = "none"
        document.getElementById("wallet-connected").style.display = "block"
      }
      awaitAccounts()
    }
    awaitContract()
  }
  awaitWeb3()
}

optionTradesApp();
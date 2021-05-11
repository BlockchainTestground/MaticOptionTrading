var contract;
var accounts;
var web3;


function getOptionHtml(option)
{
  result = ""
  result += "<tr><td>"
  result += "Amount: "
  result += convertWeiToCrypto(option.amount);
  result += " Buyer: "
  result += option.buyer
  result += " Writer "
  result += option.writer
  result += " Canceled: "
  result += option.canceled
  result += " Exercised: "
  result += option.exercised
  result += " Expiry: "
  result += convertToDateString(option.expiry);
  result += " Id: "
  result += option.id
  result += " Latest_cost: "
  result += option.latestCost
  result += " Premium: "
  result += option.premium
  result += " Strike: "
  result += option.strike
  result += "<button onclick='cancelOption("+ option.id +")'>Cancel</button>"
  result += "<button onclick='buyOption("+ option.id +", "+ option.premium +")'>Buy</button>"
  result += `<button onclick='exerciseOption("+option.id +", "+ option.latestCost +")' style='display:${showExcercise(option, accounts)}'>Exercise</button>`
  result += `<button onclick='retrieveExpiredFunds("+ option.id +")' style='display:${showRetrieveExpiredFunds(option, accounts)}'>Retrieve expired funds </button>`
  result += "<button onclick='updateExerciseCost("+ option.id +")'>Update exercise cost</button>"
  result + "</tr></td>"
  return result
}

const displayMyOptions = async (options_length) => {
  var options_html = "<table class='table'>"
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
  var options_html = "<table>"
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
  var options_html = "<table>"
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
  console.log('tigrenorteno')
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
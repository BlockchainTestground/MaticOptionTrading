var contract;
var accounts;
var balance;
var web3;
var matic_price;
var rows_per_page  = 3;
var current_page = 1;
const pagination_element = document.getElementById('pagination');

function getOptionHtml(option, exercise_cost) {
  var result = "<div class='box'>"
  if (option.optionType == 0) {
    result += "<h4 id='const' class='title is-3'>PUT</h4>"
  } else {
    result += "<h4 id='const' class='title is-3'>CALL</h4>"
  }

  result += "<article class='message is-primary'>"
  result += "<p>Amount: " + convertWeiToCrypto(option.amount) +"</p>"
  result += "<p>Buyer: " + option.buyer.substring(0, 6) + "..." + option.buyer.substring(option.buyer.length-4, option.buyer.length) +"</p>"
  result += "<p>Writer: " + option.writer.substring(0, 6) + "..." + option.writer.substring(option.writer.length-4, option.writer.length) +"</p>"
  result += "<p>Exercise cost: " + convertWeiToCrypto(exercise_cost) +"</p>"
  result += "<p>Expiry: " + convertToDateString(option.expiry) +"</p>"
  result += "<p>Premium: " + convertWeiToCrypto(option.premium) +"</p>"
  result += "<p>Strike: " + convertWeiToCrypto(option.strike) +"</p>"
  
  if(option.exercised)
    result += "<p>This option has been exercised</p>"

  result += `<button class='button is-small is-danger is-outlined' onclick='cancelOption(${
    option.id
  })' style='display:${showCancel(option, accounts)}'>Cancel</button>`;
  result += `<button class='button is-small is-danger is-outlined' onclick='buyOption(${option.id},${
    option.premium
  })' style='display:${showBuy(option)}'>Buy</button>`;
  result += `<button class='button is-small is-danger is-outlined' onclick='exerciseOption(${option.id},${
    exercise_cost
  })' style='display:${showExcercise(option, accounts)}'>Exercise</button>`;
  result += `<button class='button is-small is-danger is-outlined' onclick='retrieveExpiredFunds(${
    option.id
  })' style='display:${showRetrieveExpiredFunds(
    option,
    accounts
  )}'>Retrieve expired funds </button>`;

  result += "</article>"
  result += "</div>"
  return result;
}

const displayMyOptions = async () => {
  var result = ""
  options = await contract.methods
    .getMaticOptsByAddress(
      accounts[0] /*address*/,
      true /*include_if_writer*/,
      false /*include_if_buyer*/,
      false /*exclude_expired*/,
      false /*exclude_canceled*/,
      false /*exclude_exercised*/,
      false /*exclude_bought*/
    ).call()
  setupPagination(options, pagination_element, rows_per_page);
  if(options.length == 0)
  {
    return "<p>You have no written options. Try writing a new one.</p>"
  }
  displayList(options, rows_per_page, current_page, result); 
  return result
};

const displayOthersOptions = async () => {
  var result = ""
  options = await contract.methods
    .getMaticOpts(
      false /*exclude_expired*/,
      false /*exclude_canceled*/,
      false /*exclude_exercised*/,
      false /*exclude_bought*/
    ).call()
  setupPagination(options, pagination_element, rows_per_page);
  if(options.length == 0)
  {
    return "<p>Could now find any options. Try writing one.</p>"
  }
  displayList(options, rows_per_page, current_page, result); 
  return result
};

const displayOptionsIBought = async () => {
  var result = ""
  options = await contract.methods
    .getMaticOptsByAddress(
      accounts[0] /*address*/,
      false /*include_if_writer*/,
      true /*include_if_buyer*/,
      false /*exclude_expired*/,
      false /*exclude_canceled*/,
      false /*exclude_exercised*/,
      false /*exclude_bought*/
    ).call()
  setupPagination(options, pagination_element, rows_per_page);
  if(options.length == 0)
  {
    return "<p>You haven't bought any options. Try buying one.</p>"
  }
  displayList(options, rows_per_page, current_page, result); 
  return result
};

function onSellOptionClick()
{
  setupPagination([], pagination_element, rows_per_page);
  document.getElementById("main-content").innerHTML = ""
  $("#main-content").load("html/write_option_form.html", function(){
    $("#strike").val(matic_price)
    writeOption(contract, accounts)
    updateSummary()
    document.getElementById("tknAmt").value = tknAmt
    document.getElementById("premium").value = premium
  });
  document.getElementById("buy-button").classList.remove("is-active");
  document.getElementById("sell-button").classList.add("is-active");
}

async function displayList (items, rows_per_page, page, result) {
  result = "";
  page--;

  items = [].concat(items).reverse();

  let start = rows_per_page * page;
  let end = start + rows_per_page;
  let paginatedItems = items.slice(start, end);

  for ( let i = 0; i < paginatedItems.length; i++) {
    let item_element = document.createElement(('div'));
    item_element.classList.add('item');
    option = await contract.methods.maticOpts(paginatedItems[i]).call();
    exercise_cost = await contract.methods.getExerciseCost(paginatedItems[i]).call();
    result += getOptionHtml(option, exercise_cost);
  }
  document.getElementById("main-content").innerHTML = result

}

function setupPagination (items, wrapper, rows_per_page) {
  wrapper.innerHTML = "";
  let page_count = Math.ceil(items.length/rows_per_page);
  for(let i =1; i <page_count + 1; i ++) {
    paginationButton(i);
    let btn = paginationButton(i,items);
    wrapper.appendChild(btn);
  }
}

function paginationButton(page, items) {
  let button = document.createElement('button');
  button.innerText = page;

  if(current_page == page) button.classList.add('active');

  button.addEventListener('click', function(){
    current_page = page;
    displayList(items, rows_per_page, current_page);

    let current_btn = document.querySelector('.pagenumbers button.active');
    current_btn.classList.remove('active');;

    button.classList.add('active');
  })

  return button;
}

function onBuyClick()
{
  var options_html;
  document.getElementById("main-content").innerHTML = "<progress class='progress is-small is-primary' max='100'>15%</progress>"
  var awaitOptions = async function () {
    var options_html = await displayOthersOptions()
    document.getElementById("main-content").innerHTML = options_html;
  }
  awaitOptions()
  
  document.getElementById("sell-button").classList.remove("is-active");
  document.getElementById("buy-button").classList.add("is-active");
}

function onMyOptionsClick()
{
  document.getElementById("main-content-title").innerHTML = "My Options"
  document.getElementById("main-content").innerHTML = "<progress class='progress is-small is-primary' max='100'>15%</progress>"
  var awaitOptions = async function () {
    var options_html = await displayMyOptions()
    document.getElementById("main-content").innerHTML = options_html;
  }
  document.getElementById("sell-button").classList.remove("is-active");
  document.getElementById("buy-button").classList.remove("is-active");
  awaitOptions()
}

function onOptionsIBoughtClick()
{
  document.getElementById("main-content-title").innerHTML = "Options I Bought"
  document.getElementById("main-content").innerHTML = "<progress class='progress is-small is-primary' max='100'>15%</progress>"
  var awaitOptions = async function () {
    var options_html = await displayOptionsIBought()
    document.getElementById("main-content").innerHTML = options_html;
  }
  document.getElementById("sell-button").classList.remove("is-active");
  document.getElementById("buy-button").classList.remove("is-active");
  awaitOptions()
}

const cancelOption = async (option_id) => {
  const result = await contract.methods
    .cancelOption(option_id)
    .send({ from: accounts[0], gas: 400000 })
    .catch((revertReason) => {
      getRevertReason(revertReason.receipt.transactionHash);
    });
};

const buyOption = async (option_id, premium) => {
  await contract.methods
    .buyOption(option_id)
    .send({ from: accounts[0], gas: 400000, value: premium })
    .catch((revertReason) => {
      getRevertReason(revertReason.receipt.transactionHash);
    });
};

const exerciseOption = async (option_id, latest_cost) => {
  await contract.methods
    .exercise(option_id)
    .send({ from: accounts[0], gas: 400000, value: latest_cost })
    .catch((revertReason) => {
      getRevertReason(revertReason.receipt.transactionHash);
    });
};

const retrieveExpiredFunds = async (option_id) => {
  await contract.methods
    .retrieveExpiredFunds(option_id)
    .send({ from: accounts[0], gas: 400000 })
    .catch((revertReason) => {
      getRevertReason(revertReason.receipt.transactionHash);
    });
};

const updateExerciseCost = async (option_id) => {
  await contract.methods
    .updateExerciseCost(option_id)
    .send({ from: accounts[0], gas: 400000 })
    .catch((revertReason) => {
      getRevertReason(revertReason.receipt.transactionHash);
    });
};

let strike = 0;
let premium = 5;
let expiry_days = 1;
let tknAmt = 100;
let optionType = "CALL";

function updateSummary() {
  big_strike = new Big(strike);
  big_tknAmt = new Big(tknAmt);
  big_premium = new Big(premium);
  if (optionType == "CALL")
    big_cost_plus_premium = big_strike.mul(big_tknAmt).plus(premium);
  else big_cost_plus_premium = big_strike.mul(big_tknAmt).minus(premium);
  big_break_even = big_cost_plus_premium.div(tknAmt);
  document.getElementById("summary_amount").innerHTML =
    "Matic: " + big_tknAmt;
  document.getElementById("summary_strike").innerHTML =
    "Strike Price: " + big_strike;
  document.getElementById("summary_premium").innerHTML =
    "Premium: " + big_premium;
  document.getElementById("summary_break_even").innerHTML =
    "Break even: " + big_break_even;
}

const writeOption = (contract, accounts) => {
  $("#strike").on("change", (e) => {
    strike = e.target.value;
    updateSummary();
  });
  $("#premium").on("change", (e) => {
    premium = e.target.value;
    updateSummary();
  });
  $("#expiry").on("change", (e) => {
    expiry_days = e.target.value;
    updateSummary();
  });
  $("#tknAmt").on("change", (e) => {
    tknAmt = e.target.value;
    updateSummary();
  });
  $("#put").on("change", (e) => {
    optionType = "PUT";
    updateSummary();
  });
  $("#call").on("change", (e) => {
    optionType = "CALL";
    updateSummary();
  });
  $("#write_option_form").on("submit", async (e) => {
    e.preventDefault();
    var secondsSinceEpoch = Math.round(Date.now() / 1000);
    var expiry = secondsSinceEpoch + expiry_days * 86400;
    console.log("Expiry: " + expiry)
    await contract.methods
      .writeOption(
        convertCryptoToWei(strike),
        convertCryptoToWei(premium),
        expiry,
        convertCryptoToWei(tknAmt),
        optionType
      )
      .send({
        from: accounts[0],
        gas: 400000,
        value: convertCryptoToWei(tknAmt),
      });
  });
};

function connectWallet() {
  var awaitAccounts = async function () {
    getAccounts()
  };
  awaitAccounts();
}

async function getBalance() {
  balance_temp = await web3.eth.getBalance(accounts[0])
  balance = convertWeiToCrypto(balance_temp)
  document.getElementById("my-balance").innerHTML = parseFloat(balance).toFixed(4) + " MATIC"
}

async function getAccounts() {
  accounts = await web3.eth.getAccounts()
  onConnect()
  getBalance()
}

function disconnectWallet() {
  accounts = null
  balance = null
  onDisconnect()
}

function onConnect()
{
  document.getElementById("my-address").innerHTML = accounts[0].substring(0, 6) + "..." + accounts[0].substring(accounts[0].length-4, accounts[0].length)
  document.getElementById("wallet-disconnected").style.display = "none"
  document.getElementById("wallet-connected").style.display = "block"

  document.getElementById("my-option-button").style.display = "block"
  document.getElementById("options-i-bought-button").style.display = "block"
  document.getElementById("logout-button").style.display = "block"
}

function onDisconnect() {
  document.getElementById("wallet-disconnected").style.display = "block"
  document.getElementById("wallet-connected").style.display = "none"
  document.getElementById("wallet-connected").style.display = "none"

  document.getElementById("my-option-button").style.display = "none"
  document.getElementById("options-i-bought-button").style.display = "none"
  document.getElementById("logout-button").style.display = "none"
}

function getMaticPrice() {
  getJSON(
    "https://api.binance.com/api/v3/ticker/price?symbol=MATICUSDT",
    function (err, data) {
      if (err !== null) {
        alert("Something went wrong: " + err);
      } else {
        matic_price = data["price"]
        strike = matic_price
      }
    }
  );
}

async function optionTradesApp() {
  getMaticPrice();
  var awaitWeb3 = async function () {
    web3 = await getWeb3();
    web3.eth.net.getId((err, netId) => {
      if (netId == 137) {
        document.getElementById("loading-web3").style.display = "none";
        var awaitContract = async function () {
          contract = await getContract(web3);
          var awaitAccounts = async function () {
            getAccounts()
            writeOption(contract, accounts);
            onBuyClick()
          };
          awaitAccounts();
        };
        awaitContract();
      } else {
        document.getElementById("loading-web3").style.display = "none";
        document.getElementById("wallet-disconnected").style.display = "none";
        document.getElementById("wallet-connected").style.display = "none";
        document.getElementById("wrong-network").style.display = "block";
      }
    });
  };
  awaitWeb3();
}

$("#footer").load("html/footer.html", function(){
});
$("#navbar").load("html/navbar.html", function(){
  optionTradesApp()
});
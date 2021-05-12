const OptionTrades = artifacts.require("OptionTrades");

module.exports = function (deployer) {
  deployer.deploy(OptionTrades);
};

// SPDX-License-Identifier: MIT

pragma solidity 0.8.0;

import "./dependencies/LinkTokenInterface.sol";
import "./dependencies/AggregatorV3Interface.sol";

contract OptionTrades {
    //Pricefeed interfaces
    AggregatorV3Interface internal maticFeed;
    //Interface for LINK token functions
    LinkTokenInterface internal LINK;
    address payable contractAddr;

    bytes32 callHash = keccak256(abi.encodePacked("CALL"));
    bytes32 putHash = keccak256(abi.encodePacked("PUT"));

    enum OptionType { PUT, CALL }
    
    //Options stored in arrays of structs
    struct option {
        OptionType optionType; //Helper to show last updated cost to exercise
        uint strike; //Price in USD (18 decimal places) option allows buyer to purchase tokens at
        uint premium; //Fee in contract token that option writer charges
        uint expiry; //Unix timestamp of expiration time
        uint amount; //Amount of tokens the option contract is for
        bool exercised; //Has option been exercised
        bool canceled; //Has option been canceled
        uint id; //Unique ID of option, also array index
        address payable writer; //Issuer of option
        address payable buyer; //Buyer of option
    }
    option[] public maticOpts;

    //Kovan feeds: https://docs.chain.link/docs/reference-contracts
    constructor() public {
        // -- Matic --
        
        //MATIC/USD feed
        maticFeed = AggregatorV3Interface(0xAB594600376Ec9fD91F8e885dADF0CE036862dE0);
        //LINK token address
        LINK = LinkTokenInterface(0xb0897686c545045aFc77CF20eC7A532E3120E0F1);
        /**/

        // -- Mumbai --
        /*
        //MATIC/USD feed
        maticFeed = AggregatorV3Interface(0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada);
        //LINK token address
        LINK = LinkTokenInterface(0x326C977E6efc84E512bB9C30f76E30c160eD06FB);
        contractAddr = payable(address(this));
        */
    }
    
    //Returns the latest MATIC price
    function getMaticPrice() public view returns (uint) {
        (
            uint80 roundID, 
            int price,
            uint startedAt,
            uint timeStamp,
            uint80 answeredInRound
        ) = maticFeed.latestRoundData();
        // If the round is not complete yet, timestamp is 0
        require(timeStamp > 0, "Round not complete");
        //Price should never be negative thus cast int to unit is ok
        //Price is 8 decimal places and will require 1e10 correction later to 18 places
        return uint(price);
    }
    
    //Allows user to write a covered call option
    //Takes which token, a strike price(USD per token w/18 decimal places), premium(same unit as token), expiration time(unix) and how many tokens the contract is for
    function writeOption(uint strike, uint premium, uint expiry, uint tknAmt, string memory optionType) public payable {
        bytes32 optionTypeHash = keccak256(abi.encodePacked(optionType));
        require(optionTypeHash == callHash || optionTypeHash == putHash, "Only CALL and PUT option types are supported");
        require(msg.value == tknAmt, "Incorrect amount of Matic supplied"); 
        uint256 maticPrice = getMaticPrice();

        OptionType optionTypeEnum;
        if(optionTypeHash == callHash)
        {
            optionTypeEnum = OptionType.CALL;
        }else
        {
            optionTypeEnum = OptionType.PUT;
        }
        maticOpts.push(option(optionTypeEnum, strike, premium, expiry, tknAmt, false, false, maticOpts.length, payable(msg.sender), payable(address(0))));
    }
    
    //Allows option writer to cancel and get their funds back from an unpurchased option
    function cancelOption(uint ID) public payable {
        require(msg.sender == maticOpts[ID].writer, "You did not write this option");
        //Must not have already been canceled or bought
        require(!maticOpts[ID].canceled && maticOpts[ID].buyer == address(0), "This option cannot be canceled");
        maticOpts[ID].writer.transfer(maticOpts[ID].amount);
        maticOpts[ID].canceled = true;
    }
    
    //Purchase a call option, needs desired token, ID of option and payment
    function buyOption(uint ID) public payable {
        require(!maticOpts[ID].canceled && maticOpts[ID].expiry > block.timestamp, "Option is canceled/expired and cannot be bought");
        //Transfer premium payment from buyer
        require(msg.value == maticOpts[ID].premium, "Incorrect amount of MATIC sent for premium");
        //Transfer premium payment to writer
        maticOpts[ID].writer.transfer(maticOpts[ID].premium);
        maticOpts[ID].buyer = payable(msg.sender);
    }
    
    //Exercise your call option, needs desired token, ID of option and payment
    function exercise(uint ID) public payable {
        //If not expired and not already exercised, allow option owner to exercise
        //To exercise, the strike value*amount equivalent paid to writer (from buyer) and amount of tokens in the contract paid to buyer
        require(maticOpts[ID].buyer == msg.sender, "You do not own this option");
        require(!maticOpts[ID].exercised, "Option has already been exercised");
        require(maticOpts[ID].expiry > block.timestamp, "Option is expired");
        //Conditions are met, proceed to payouts
        uint256 maticPrice = getMaticPrice();
        //Cost to exercise
        uint exerciseVal = maticOpts[ID].strike*maticOpts[ID].amount;
        //Equivalent MATIC value using Chainlink feed
        uint equivMatic = exerciseVal / (maticPrice * 10**10); //move decimal 10 places right to account for 8 places of pricefeed
        //Buyer exercises option by paying strike*amount equivalent MATIC value
        require(msg.value == equivMatic, "Incorrect LINK amount sent to exercise");
        if(maticOpts[ID].optionType == OptionType.CALL)
        {
            //Pay writer the exercise cost
            maticOpts[ID].writer.transfer(equivMatic);
            //Pay buyer contract amount of MATIC
            payable(msg.sender).transfer(maticOpts[ID].amount);
        }else
        {
            //Pay writer contract amount of MATIC
            payable(msg.sender).transfer(maticOpts[ID].amount);
            //Pay buyer the exercise cost
            maticOpts[ID].writer.transfer(equivMatic);
        }
        maticOpts[ID].exercised = true;
    }
    
    //Allows writer to retrieve funds from an expired, non-exercised, non-canceled option
    function retrieveExpiredFunds(uint ID) public payable {
        require(msg.sender == maticOpts[ID].writer, "You did not write this option");
        //Must be expired, not exercised and not canceled
        require(maticOpts[ID].expiry <= block.timestamp && !maticOpts[ID].exercised && !maticOpts[ID].canceled, "This option is not eligible for withdraw");
        maticOpts[ID].writer.transfer(maticOpts[ID].amount);
        //Repurposing canceled flag to prevent more than one withdraw
        maticOpts[ID].canceled = true;
    }
    
    //This is a helper function to help the user see what the cost to exercise an option is currently before they do so
    //Updates lastestCost member of option which is publicly viewable
    function getExerciseCost(uint ID) public view returns(uint256) {
        uint256 maticPrice = getMaticPrice();
        return (maticOpts[ID].strike * maticOpts[ID].amount) / (maticPrice * 10**10);
    }

    function getMaticOptsLength() public view returns (uint256 maticOptsLength) {
        return maticOpts.length;
    }

    function getMaticOptsByAddress(
        address _address,
        bool include_if_writer,
        bool include_if_buyer,
        bool exclude_expired,
        bool exclude_canceled,
        bool exclude_exercised,
        bool exclude_bought
    ) public view returns (uint256[] memory optionIds) {
        uint resultLength = 0;
        for (uint i = 0; i < maticOpts.length; i++)
        {
            if(
                !(exclude_expired && maticOpts[i].expiry > block.timestamp)
                && !(exclude_canceled && maticOpts[i].canceled)
                && !(exclude_exercised && maticOpts[i].canceled)
                && !(exclude_bought && maticOpts[i].buyer != address(0))
                && ((include_if_writer && maticOpts[i].writer == _address)
                    || include_if_buyer && maticOpts[i].buyer == _address)
            )
            {
                resultLength+=1;
            }
        }
        uint[] memory result = new uint[](resultLength);
        uint result_iterator = 0;
        for (uint i = 0; i < maticOpts.length; i++)
        {
            if(
                !(exclude_expired && maticOpts[i].expiry > block.timestamp)
                && !(exclude_canceled && maticOpts[i].canceled)
                && !(exclude_exercised && maticOpts[i].canceled)
                && !(exclude_bought && maticOpts[i].buyer != address(0))
                && ((include_if_writer && maticOpts[i].writer == _address)
                    || include_if_buyer && maticOpts[i].buyer == _address)
            )
            {
                result[result_iterator] = i;
                result_iterator += 1;
            }
        }
        return result;
    }

    function getMaticOpts(
        bool exclude_expired,
        bool exclude_canceled,
        bool exclude_exercised,
        bool exclude_bought
    ) public view returns (uint256[] memory optionIds) {
        uint resultLength = 0;
        for (uint i = 0; i < maticOpts.length; i++)
        {
            if(
                !(exclude_expired && maticOpts[i].expiry > block.timestamp)
                && !(exclude_canceled && maticOpts[i].canceled)
                && !(exclude_exercised && maticOpts[i].canceled)
                && !(exclude_bought && maticOpts[i].buyer != address(0))
            )
            {
                resultLength+=1;
            }
        }
        uint[] memory result = new uint[](resultLength);
        uint result_iterator = 0;
        for (uint i = 0; i < maticOpts.length; i++)
        {
            if(
                !(exclude_expired && maticOpts[i].expiry > block.timestamp)
                && !(exclude_canceled && maticOpts[i].canceled)
                && !(exclude_exercised && maticOpts[i].canceled)
            )
            {
                result[result_iterator] = i;
                result_iterator += 1;
            }
        }
        return result;
    }
}
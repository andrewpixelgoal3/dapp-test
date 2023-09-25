import { NextApiRequest, NextApiResponse } from "next";
import { BigNumber, ethers } from "ethers";
import { Provider, Wallet, utils } from "zksync-web3";
import AAFactory from "../../abi/AAFactory.json";
import TestAccount from "../../abi/TestAccount.json";
import { solidityKeccak256 } from "ethers/lib/utils";

export default async function (req: NextApiRequest, res: NextApiResponse<any>) {
  const ETH_ADDRESS = "0x000000000000000000000000000000000000800A";
  const owner = req.body.address;
  const provider = new Provider("http://localhost:3050");
  const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY || "", provider);
  const walletBalance = await provider.getBalance(wallet.address);
  console.log("walletBalance: ", walletBalance);

  console.log("process.env.FACTORY_ADDRESS: ", process.env.FACTORY_ADDRESS);

  const factory = new ethers.Contract(
    process.env.FACTORY_ADDRESS || "",
    AAFactory.abi,
    wallet
  );
  console.log("owner: ", owner);

  const salt = ethers.constants.HashZero;
  const social = solidityKeccak256(["string"], ["anhtrungnguyen94@gmail.com"]);
  // await (await factory.deployAccount(salt, owner, social)).wait();
  console.log("run here 123");

  const AbiCoder = new ethers.utils.AbiCoder();
  const account_address = utils.create2Address(
    factory.address,
    await factory.aaBytecodeHash(),
    salt,
    AbiCoder.encode(["address", "bytes32"], [owner, social])
  );

  const accountContract = new ethers.Contract(
    account_address,
    TestAccount.abi,
    wallet
  );

  const tx = await accountContract.populateTransaction.setSpendingLimit(
    ETH_ADDRESS,
    BigNumber.from("10"),
    { value: BigNumber.from("0") }
  );
  console.log("tx: ", tx);
  res.status(200).json({
    transaction: tx,
    account: accountContract.address,
  });
}

import { NextApiRequest, NextApiResponse } from "next";
import AAFactory from "../../abi/AAFactory.json";
import TestAccount from "../../abi/TestAccount.json";
import { Wallet, utils, Provider } from "zksync-web3";
import { ethers } from "ethers";

export default async function (req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    const address = req.body.address;
    console.log("address:", address);

    const provider = new Provider({
      url: "http://localhost:3050",
    });
    const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY || "", provider);
    // const walletBalance = await provider.getBalance(wallet.address);
    // console.log("walletBalance: ", walletBalance);

    // console.log("process.env.FACTORY_ADDRESS: ", process.env.FACTORY_ADDRESS);

    const factory = new ethers.Contract(
      process.env.FACTORY_ADDRESS || "",
      AAFactory.abi,
      wallet
    );
    // console.log("owner: ", owner);

    const salt = ethers.constants.HashZero;
    try {
      await (await factory.deployAccount(salt, address)).wait();
    } catch (error) {
      console.log("deployment failed, cause duplicate");
    }
    const AbiCoder = new ethers.utils.AbiCoder();
    const account_address = utils.create2Address(
      factory.address,
      await factory.aaBytecodeHash(),
      salt,
      AbiCoder.encode(["address"], [address])
    );

    const accountContract = new ethers.Contract(
      account_address,
      TestAccount.abi,
      wallet
    );

    res.status(200).json({
      success: true,
      data: {
        account: accountContract.address,
      },
    });
  } catch (error) {
    throw error;
  }
}

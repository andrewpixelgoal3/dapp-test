import { NextApiRequest, NextApiResponse } from "next";
import AAFactory from "../../abi/AAFactory.json";
import TestAccount from "../../abi/TestAccount.json";
import { Wallet, utils, Provider } from "zksync-web3";
import { ethers } from "ethers";
import crypto from "crypto";

export default async function (req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    const socialId = req.body.socialId;
    const socialType = req.body.socialType;
    console.log("secret: ", process.env.SECRET);
    console.log("socialId: ", socialId);
    console.log("socialType: ", socialType);

    const combinedBuffer = Buffer.concat([
      Buffer.from(process.env.SECRET || ""),
      Buffer.from(socialId),
      Buffer.from(socialType),
    ]);
    const privateKey = crypto
      .createHash("sha256")
      .update(combinedBuffer)
      .digest("hex");

    const provider = new Provider({
      url: "http://localhost:3050",
    });
    const owner = new Wallet(privateKey, provider);
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
      await (await factory.deployAccount(salt, owner.address)).wait();
    } catch (error) {
      console.log("deployment failed, cause duplicate");
    }
    const AbiCoder = new ethers.utils.AbiCoder();
    const account_address = utils.create2Address(
      factory.address,
      await factory.aaBytecodeHash(),
      salt,
      AbiCoder.encode(["address"], [owner.address])
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
        socialId: socialId,
        socialType: socialType,
      },
    });
  } catch (error) {
    throw error;
  }
}

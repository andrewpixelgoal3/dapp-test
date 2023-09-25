import { NextApiRequest, NextApiResponse } from "next";
import AAFactory from "../../abi/AAFactory.json";
import TestAccount from "../../abi/TestAccount.json";
import { Wallet, Contract, utils, Provider } from "zksync-web3";
import { ethers } from "ethers";
import crypto from "crypto";
import { solidityKeccak256 } from "ethers/lib/utils";

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
    console.log("privateKey: ", privateKey);

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
    await (
      await factory.deployAccount(
        salt,
        owner.address,
        solidityKeccak256(["string"], [socialId])
      )
    ).wait();
    const AbiCoder = new ethers.utils.AbiCoder();
    const account_address = utils.create2Address(
      factory.address,
      await factory.aaBytecodeHash(),
      salt,
      AbiCoder.encode(
        ["address", "bytes32"],
        [owner.address, solidityKeccak256(["string"], [socialId])]
      )
    );
    console.log("account_address: ", account_address);

    const accountContract = new ethers.Contract(
      account_address,
      TestAccount.abi,
      wallet
    );
    console.log("accountContract: ", accountContract.address);

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    throw error;
  }
}

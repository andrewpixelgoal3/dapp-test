/* eslint-disable import/no-anonymous-default-export */
import { ethers } from "ethers";
import { NextApiRequest, NextApiResponse } from "next";
import AAFactory from "../../abi/AAFactory.json";
import crypto from "crypto";
import { Wallet, utils, Provider } from "zksync-web3";
import TestAccount from "../../abi/TestAccount.json";
import jwt from 'jsonwebtoken';

export default async function (req: NextApiRequest, res: NextApiResponse<any>) {
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

  const factory = new ethers.Contract(
    process.env.FACTORY_ADDRESS || "",
    AAFactory.abi,
    wallet
  );

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

  const jwtSecret = process.env.JWT_SECRET || "";
  var token = jwt.sign({
    account: accountContract.address,
    socialId: socialId,
    socialType: socialType,
  }, jwtSecret, {
    algorithm: 'HS256', 
    expiresIn: '1h',
  });

  res.status(200).json({
    success: true,
    data: {
      access_token: token,
      account: accountContract.address
    },
  });
}
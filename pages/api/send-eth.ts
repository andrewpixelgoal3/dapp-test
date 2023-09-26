/* eslint-disable import/no-anonymous-default-export */
import { NextApiRequest, NextApiResponse } from "next";
import { ethers } from "ethers";
import { EIP712Signer, Provider, Wallet, types, utils } from "zksync-web3";
import AAFactory from "../../abi/AAFactory.json";
import TestAccount from "../../abi/TestAccount.json";
import crypto from "crypto";
import { solidityKeccak256 } from "ethers/lib/utils";
import { withAuth } from "./middleware/authMiddleware";

export default withAuth(async function (req: NextApiRequest, res: NextApiResponse<any>) {
  // const ETH_ADDRESS = "0x000000000000000000000000000000000000800A";
  const {
    socialId,
    socialType
  } = req.body.user;

  const provider = new Provider("http://localhost:3050");
  const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY || "", provider);
  const combinedBuffer = Buffer.concat([
    Buffer.from(process.env.SECRET || ""),
    Buffer.from(socialId),
    Buffer.from(socialType),
  ]);
  const privateKey = crypto
    .createHash("sha256")
    .update(combinedBuffer)
    .digest("hex");

  const owner = new Wallet(privateKey, provider);

  const factory = new ethers.Contract(
    process.env.FACTORY_ADDRESS || "",
    AAFactory.abi,
    wallet
  );

  const salt = ethers.constants.HashZero;
  // await (await factory.deployAccount(salt, owner, social)).wait();

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

  var tx: any = {
    to: "0x5a61E9eCDc8407F21b43f5C3CA82DA68f3222a5C",
    value: ethers.utils.parseEther("1"),
    data: "0x",
  };
  tx = {
    ...tx,
    from: account_address,
    chainId: (await provider.getNetwork()).chainId,
    nonce: await provider.getTransactionCount(account_address),
    type: 113,
    customData: {
      gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
    } as types.Eip712Meta,
  };

  tx.gasPrice = await provider.getGasPrice();
  if (tx.gasLimit == undefined) {
    tx.gasLimit = await provider.estimateGas(tx);
  }

  const signedTxHash = EIP712Signer.getSignedDigest(tx);
  const signature = ethers.utils.arrayify(
    ethers.utils.joinSignature(owner._signingKey().signDigest(signedTxHash))
  );

  tx.customData = {
    ...tx.customData,
    customSignature: signature,
  };
  console.log("tx: ", tx);
  await provider.sendTransaction(utils.serialize(tx));

  res.status(200).json({
    success: true,
  });
})
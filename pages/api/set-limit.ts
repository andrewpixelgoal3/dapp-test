/* eslint-disable import/no-anonymous-default-export */
import { ethers } from "ethers";
import { NextApiRequest, NextApiResponse } from "next";
import { Provider, utils } from "zksync-web3";
import requireAuth from "../../middleware/requireAuth";

export default requireAuth(async (req: NextApiRequest, res: NextApiResponse<any>, session: any) => {
  try {
    console.log("req.body: ", req.body);

    const tx = req.body.tx;

    const signature = ethers.utils.arrayify(
      ethers.utils.joinSignature(req.body.signature)
    );
    tx.customData = {
      ...tx.customData,
      customSignature: signature,
    };
    console.log("tx: ", tx);
    const provider = new Provider({
      url: "http://localhost:3050",
    });
    const data = utils.serialize(tx);
    console.log("data: ", data);

    return await provider.sendTransaction(utils.serialize(tx));
  } catch (error) {
    throw error;
  }
})

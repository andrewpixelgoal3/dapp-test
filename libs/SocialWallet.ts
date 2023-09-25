import { TransactionRequest, Provider } from "@ethersproject/abstract-provider";
import { Signer } from "@ethersproject/abstract-signer";
import { Bytes } from "ethers";
import {
  BytesLike,
  Deferrable,
  computeAddress,
  hashMessage,
  joinSignature,
  keccak256,
} from "ethers/lib/utils";
import { SigningKey } from "@ethersproject/signing-key";
import { Logger } from "@ethersproject/logger";
import { getAddress } from "@ethersproject/address";
import {
  recoverAddress,
  serialize,
  UnsignedTransaction,
} from "@ethersproject/transactions";
import { resolveProperties } from "@ethersproject/properties";
const logger = new Logger("0.1.1");

export enum SocialType {
  GOOGLE = 1,
  TWITTER = 2,
}
export interface SmartAccount {
  readonly socialId: string;
  readonly socicalType: SocialType;
  readonly privateKey: string;
}

export class SocialWallet extends Signer implements SmartAccount {
  readonly socialId: string;
  readonly socicalType: SocialType;
  readonly address: string;
  readonly provider: Provider;

  readonly _signingKey: () => SigningKey;
  constructor(privateKey: SmartAccount, provider: Provider) {
    super();
    const signingKey = new SigningKey(privateKey.privateKey);
    this._signingKey = () => signingKey;
    this.socialId = privateKey.socialId;
    this.socicalType = privateKey.socicalType;
    this.address = computeAddress(this.publicKey);
    if (provider && !Provider.isProvider(provider)) {
      logger.throwArgumentError("invalid provider", "provider", provider);
    }
    this.provider = provider;
  }

  getAddress(): Promise<string> {
    return Promise.resolve(this.address);
  }
  async signMessage(message: string | Bytes): Promise<string> {
    return joinSignature(this._signingKey().signDigest(hashMessage(message)));
  }
  signTransaction(
    transaction: Deferrable<TransactionRequest>
  ): Promise<string> {
    return resolveProperties(transaction).then((tx) => {
      if (tx.from != null) {
        if (getAddress(tx.from) !== this.address) {
          logger.throwArgumentError(
            "transaction from address mismatch",
            "transaction.from",
            transaction.from
          );
        }
        delete tx.from;
      }

      const signature = this._signingKey().signDigest(
        keccak256(serialize(<UnsignedTransaction>tx))
      );
      return serialize(<UnsignedTransaction>tx, signature);
    });
  }
  connect(provider: Provider): Signer {
    return new SocialWallet(this, provider);
  }

  get privateKey(): string {
    return this._signingKey().privateKey;
  }
  get publicKey(): string {
    return this._signingKey().publicKey;
  }
}

// source: https://gist.github.com/ziluvatar/a3feb505c4c0ec37059054537b38fc48
import jwt, { Secret, SignOptions, VerifyOptions } from "jsonwebtoken";
import { jwtSecret, jwtTtl, jwtClaimsPropKey } from "~/constants";

interface RefreshOptions {
  verify?: Exclude<VerifyOptions, "jwtid">;
  jwtid?: string;
}

class TokenGenerator {
  secret;
  options; //algorithm + keyid + noTimestamp + expiresIn + notBefore
  constructor(secret: Secret, options: SignOptions) {
    this.secret = secret;
    if (!options.expiresIn) {
      throw new Error("Token Expiration Time is not provided");
    }
    this.options = options;
  }
  sign(payload: string | object | Buffer, signOptions: SignOptions) {
    // priority: signOptions > this.options
    const jwtSignOptions = Object.assign({}, this.options, signOptions);
    return jwt.sign(payload, this.secret, jwtSignOptions);
  }
  verify(token: string, options?: VerifyOptions & { complete?: boolean }) {
    return jwt.verify(token, this.secret, options);
  }
  refresh(token: string, refreshOptions?: RefreshOptions) {
    const verified = jwt.verify(
      token,
      this.secret,
      refreshOptions?.verify || {}
    );
    if (typeof verified !== "string") {
      if ("payload" in verified) {
        delete verified.payload.iat;
        delete verified.payload.exp;
        delete verified.payload.nbf;
        delete verified.payload.jti; //We are generating a new token, if you are using jwtid during signing, pass it in refreshOptions
      } else {
        delete verified.iat;
        delete verified.exp;
        delete verified.nbf;
        delete verified.jti; //We are generating a new token, if you are using jwtid during signing, pass it in refreshOptions
      }
    }
    const jwtSignOptions = Object.assign({}, this.options, {
      jwtid: refreshOptions?.jwtid,
    });
    // The first signing converted all needed options into claims, they are already in the payload
    return jwt.sign(verified, this.secret, jwtSignOptions);
  }
  signWithClaims(_payload: any, signOptions?: SignOptions) {
    const payload = {
      [jwtClaimsPropKey]: _payload,
    };
    return this.sign(payload, {
      expiresIn: signOptions?.expiresIn || this.options.expiresIn,
      ...signOptions,
    });
  }
}

const tokenGenerator = new TokenGenerator(
  Buffer.from(jwtSecret as string, "base64"),
  {
    algorithm: "HS256",
    noTimestamp: false,
    expiresIn: jwtTtl,
  }
);

export default tokenGenerator;

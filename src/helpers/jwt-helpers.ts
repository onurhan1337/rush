import { JwtPayload, sign, verify } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

export class JwtHelpers {
  static verifyToken(token: string) {
    try {
      return verify(token, process.env.CLIENT_SECRET || '', {}) as JwtPayload;
    } catch (e) {
      console.error('Error verifying token:', e);
      return;
    }
  }

  static createToken(merchantId: string, authorizedAppId: string) {
    return sign({}, process.env.CLIENT_SECRET || '', {
      expiresIn: '4h',
      algorithm: 'HS256',
      subject: merchantId,
      issuer: process.env.NEXT_PUBLIC_DEPLOY_URL || '',
      audience: authorizedAppId,
      jwtid: uuidv4(),
    });
  }
}

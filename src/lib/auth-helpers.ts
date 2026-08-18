import { JwtHelpers } from '../helpers/jwt-helpers';

export function getUserFromRequest(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;

  const token = authHeader.replace('JWT ', '');

  const tokenData = JwtHelpers.verifyToken(token);
  if (!tokenData) return null;

  return {
    authorizedAppId: tokenData.aud as string,
    merchantId: tokenData.sub!,
  };
}
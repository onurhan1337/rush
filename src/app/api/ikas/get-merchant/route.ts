import { GetMerchantQueryData } from '@/lib/ikas-client/generated/graphql';
import { getIkas } from '@/helpers/api-helpers';
import { getUserFromRequest } from '@/lib/auth-helpers';
import { AuthTokenManager } from '@/models/auth-token/manager';
import { NextRequest, NextResponse } from 'next/server';

export type GetMerchantApiResponse = {
  merchantInfo?: GetMerchantQueryData;
};

export async function GET(request: NextRequest,) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authToken = await AuthTokenManager.get(user.authorizedAppId);
    if (!authToken) {
      return NextResponse.json({ error: { statusCode: 404, message: 'Auth token not found' } }, { status: 404 });
    }

    const ikasClient = getIkas(authToken);

    const merchantResponse = await ikasClient.queries.getMerchant();

    if (merchantResponse.isSuccess && merchantResponse.data && merchantResponse.data.getMerchant) {
      return NextResponse.json({ data: { merchantInfo: merchantResponse.data.getMerchant } });
    } else {
      return NextResponse.json({ error: { statusCode: 403, message: 'Merchant not found' } }, { status: 403 });
    }
  } catch (error) {
    console.error('Error fetching merchant:', error);
    return NextResponse.json({ error: { statusCode: 500, message: 'Failed to fetch merchant' } }, { status: 500 });
  }
}

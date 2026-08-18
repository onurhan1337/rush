import { AppBridgeHelper } from '@ikas/app-helpers';
import { useRouter } from 'next/navigation';
import crypto from 'crypto';

const TOKEN_KEY = 'token';

export class TokenHelpers {
  static getTokenForIframeApp = async (): Promise<string | null> => {
    if (window.self !== window.top) {
      try {
        const authorizedAppId = (await AppBridgeHelper.getAuthorizedAppId()) || null;
        
        let token = sessionStorage.getItem(`${TOKEN_KEY}-${authorizedAppId}`);
        
        if (token) {
          const tokenData = JSON.parse(atob(token.split('.')[1]));
          
          if (new Date().getTime() < tokenData.exp * 1000) {
            return token;
          }
          
          sessionStorage.removeItem(`${TOKEN_KEY}-${authorizedAppId}`);
        }
        
        token = (await AppBridgeHelper.getNewToken()) || null;
        
        if (token) {
          sessionStorage.setItem(`${TOKEN_KEY}-${authorizedAppId}`, token);
          return token;
        }
        
      } catch (error) {
        console.error('Error retrieving token from AppBridge:', error);
      }
    }
    
    return null;
  };

  static setToken = async (
    router: ReturnType<typeof useRouter>, 
    params: URLSearchParams
  ): Promise<void> => {
    const hasRequiredParams = params.has('token') && 
                             params.has('redirectUrl') && 
                             params.has('authorizedAppId');
    
    if (hasRequiredParams) {
      const token = params.get('token')!;
      const authorizedAppId = params.get('authorizedAppId')!;
      const redirectUrl = params.get('redirectUrl')!;
      
      sessionStorage.setItem(`${TOKEN_KEY}-${authorizedAppId}`, token);
      
      sessionStorage.setItem('authorizedAppId', authorizedAppId);

      if (window.self !== window.top) {
        router.replace('/dashboard');
        return;
      }

      window.location.replace(redirectUrl);

      throw 'redirectUrl-called';
    }
    
    await router.push('/authorize-store');
  };

  static validateCodeSignature = (code: string, receivedSignature: string, secret: string): boolean => {
    const expected = Buffer.from(crypto.createHmac('sha256', secret).update(code, 'utf8').digest('hex'), 'utf8');
    const received = Buffer.from(receivedSignature, 'utf8');
    return expected.length === received.length && crypto.timingSafeEqual(expected, received);
  };
}

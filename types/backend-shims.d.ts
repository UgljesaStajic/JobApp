declare module 'cors' {
  const cors: any;
  export default cors;
}

declare module 'express' {
  export interface Request {
    headers: Record<string, any>;
    body: any;
  }

  export interface Response {
    status: (code: number) => Response;
    json: (body: any) => Response;
  }

  export type NextFunction = () => void;

  export interface ExpressApp {
    use: (...args: any[]) => any;
    get: (...args: any[]) => any;
    post: (...args: any[]) => any;
    listen: (...args: any[]) => any;
  }

  interface ExpressFn {
    (): ExpressApp;
    json: (opts?: any) => any;
  }

  const express: ExpressFn;
  export default express;
}

declare module 'jsonwebtoken' {
  export interface JwtPayload {
    sub?: string;
    [key: string]: any;
  }

  export function sign(payload: any, secret: string, options?: any): string;
  export function verify(token: string, secret: string, options?: any): any;

  const jwt: {
    sign: typeof sign;
    verify: typeof verify;
  };

  export default jwt;
}

declare module 'nodemailer' {
  export function createTransport(options: any): {
    sendMail: (mail: any) => Promise<any>;
  };

  const nodemailer: {
    createTransport: typeof createTransport;
  };

  export default nodemailer;
}

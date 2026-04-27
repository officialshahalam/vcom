declare global {
  namespace Express {
    interface UserPayload {
      userId: number;
      mobileNumber: string;
    }

    interface Request {
      user?: UserPayload;
    }
  }
}

export {};

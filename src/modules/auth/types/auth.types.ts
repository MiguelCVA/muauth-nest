export interface AuthenticationResult {
  session_token: string;
  session_token_expires: Date;
  isNewUser: boolean;
}

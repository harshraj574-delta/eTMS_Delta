import { Amplify } from "aws-amplify";
import {
  confirmResetPassword,
  confirmSignIn,
  fetchAuthSession,
  resetPassword,
  signIn,
  signOut,
} from "aws-amplify/auth";
import { cognitoUserPoolsTokenProvider } from "aws-amplify/auth/cognito";
import { sessionStorage as amplifySessionStorage } from "aws-amplify/utils";

/**
 * Cognito sign-in for the web app (VITE_AUTH_MODE=cognito).
 *
 * Usernames are employee codes. Passwords never leave the browser in plain form
 * (SRP). Tokens live in sessionStorage, like the rest of the app's session, so
 * closing the tab signs the user out. Loaded on demand: the bundle only pulls in
 * Amplify when Cognito mode is on.
 */
const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const userPoolClientId = import.meta.env.VITE_COGNITO_CLIENT_ID;

let configured = false;
function configure() {
  if (configured) return;
  if (!userPoolId || !userPoolClientId) {
    throw new Error("Set VITE_COGNITO_USER_POOL_ID and VITE_COGNITO_CLIENT_ID for Cognito sign-in");
  }
  Amplify.configure({ Auth: { Cognito: { userPoolId, userPoolClientId, loginWith: { username: true } } } });
  cognitoUserPoolsTokenProvider.setKeyValueStorage(amplifySessionStorage);
  configured = true;
}

/** Current access token for API calls (refreshed by Amplify when needed), or null. */
export async function getAccessToken() {
  configure();
  try {
    const session = await fetchAuthSession();
    return session.tokens?.accessToken?.toString() ?? null;
  } catch {
    return null;
  }
}

/**
 * What the login form should show next:
 *   done        - signed in
 *   newPassword - first sign-in with the emailed temporary password
 *   totp        - the user turned on MFA: ask for the authenticator code
 *   resetRequired - an admin reset the password: use "Forgot password"
 */
const nextStepOf = ({ isSignedIn, nextStep }) => {
  if (isSignedIn || nextStep?.signInStep === "DONE") return "done";
  switch (nextStep?.signInStep) {
    case "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED":
      return "newPassword";
    case "CONFIRM_SIGN_IN_WITH_TOTP_CODE":
      return "totp";
    case "RESET_PASSWORD":
      return "resetRequired";
    default:
      throw new Error(`Unsupported sign-in step: ${nextStep?.signInStep}`);
  }
};

export async function startSignIn(username, password) {
  configure();
  await signOut().catch(() => {}); // drop any leftover session from another user
  return nextStepOf(await signIn({ username, password, options: { authFlowType: "USER_SRP_AUTH" } }));
}

/** Answer the current challenge: the new password or the authenticator code. */
export async function answerSignInChallenge(value) {
  return nextStepOf(await confirmSignIn({ challengeResponse: value }));
}

/** Email a reset code; returns the masked address it went to. */
export async function requestPasswordReset(username) {
  configure();
  const { nextStep } = await resetPassword({ username });
  return nextStep?.codeDeliveryDetails?.destination ?? "your email";
}

export async function completePasswordReset(username, code, newPassword) {
  configure();
  await confirmResetPassword({ username, confirmationCode: code, newPassword });
}

export async function cognitoSignOut() {
  if (!configured) configure();
  await signOut().catch(() => {});
}

export const PASSWORD_RULES = "At least 10 characters, with upper- and lower-case letters and a number.";

/** A message a user can act on, for errors thrown by the functions above. */
export function authErrorMessage(err) {
  switch (err?.name) {
    case "NotAuthorizedException":
      return /expired/i.test(err.message)
        ? "Your temporary password has expired. Ask your administrator to send a new invite."
        : "Incorrect user name or password.";
    case "InvalidPasswordException":
      return `That password doesn't meet the rules. ${PASSWORD_RULES}`;
    case "CodeMismatchException":
      return "That code isn't correct. Check it and try again.";
    case "ExpiredCodeException":
      return "That code has expired. Request a new one.";
    case "LimitExceededException":
    case "TooManyRequestsException":
      return "Too many attempts. Wait a few minutes and try again.";
    case "PasswordResetRequiredException":
      return "Your password must be reset. Use “Forgot password?”.";
    default:
      return err?.message || "Sign-in failed. Please try again.";
  }
}

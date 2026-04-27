import axios from "axios";
import { publishQueue } from "../../configs/rabbitmq/rabbitmq";
import { QUEUES } from "../constants/app.constants";

const isProduction = process.env.NODE_ENV === "production";

type OtpPayload = {
  mobileNumber: string;
  otp: string;
  type: "SIGNUP" | "RESET_PASSWORD";
  userData?: {
    fullName: string;
    username: string;
    mobileNumber: string;
  };
};

const normalizeMobileNumber = (mobileNumber: string): string => {
  if (mobileNumber.startsWith("+")) {
    return mobileNumber;
  }

  const countryCode = process.env.OTP_DEFAULT_COUNTRY_CODE ?? "";
  if (!countryCode) {
    return mobileNumber;
  }

  return `${countryCode}${mobileNumber}`;
};

const buildOtpMessage = (otp: string, type: "SIGNUP" | "RESET_PASSWORD"): string => {
  const action = type === "SIGNUP" ? "account verification" : "password reset";
  return `Your ${action} OTP is ${otp}. It expires in ${process.env.OTP_EXPIRY_MINUTES ?? "10"} minutes.`;
};

const deliverViaTwilio = async (params: OtpPayload): Promise<boolean> => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return false;
  }

  const to = normalizeMobileNumber(params.mobileNumber);
  const body = buildOtpMessage(params.otp, params.type);

  const payload = new URLSearchParams({
    To: to,
    From: fromNumber,
    Body: body,
  });

  await axios.post(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    payload.toString(),
    {
      auth: { username: accountSid, password: authToken },
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 10_000,
    },
  );

  return true;
};

export const sendOtp = async (params: OtpPayload): Promise<void> => {
  const sentByTwilio = await deliverViaTwilio(params);
  if (sentByTwilio) {
    return;
  }

  if (!isProduction) {
    console.log("[OTP] Twilio not configured, falling back to console log", params);
    return;
  }

  await publishQueue(QUEUES.OTP, params);
};

export const deliverOtp = async (params: OtpPayload): Promise<void> => {
  const sentByTwilio = await deliverViaTwilio(params);
  if (sentByTwilio) {
    return;
  }

  if (!isProduction) {
    console.log("[OTP] Twilio not configured, falling back to console log", params);
    return;
  }

  throw new Error(
    "Twilio OTP provider not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER.",
  );
};

import type { Metadata } from "next";
import { ResetPasswordContent } from "./ResetPasswordForm";

export const metadata: Metadata = {
  referrer: "no-referrer",
};

export default function ResetPasswordPage() {
  return <ResetPasswordContent />;
}

import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Next.js SignIn Page | Elan.az Admin - Next.js Dashboard Template",
  description: "This is Next.js Signin Page Elan.az Admin Dashboard Template",
};

export default function SignIn() {
  return <SignInForm />;
}

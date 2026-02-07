import React from "react";
import { SigninForm } from "@/components/auth/signin-form";
const SignInPage = () => {
  return (
    <div className="inset-0 z-0 flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-purple bg-muted md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <SigninForm />
      </div>
    </div>
  );
};

export default SignInPage;

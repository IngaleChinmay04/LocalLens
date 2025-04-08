import SignInForm from "@/components/auth/SigninForm";

export const metadata = {
  title: "Sign In - LocalLens",
  description: "Sign in to your LocalLens account",
};

export default function SignInPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <SignInForm />
    </div>
  );
}

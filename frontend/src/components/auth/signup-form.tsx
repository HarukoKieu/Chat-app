import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNavigate } from "react-router";

const SignUpSchema = z.object({
  surname: z.string().min(2, "Surname must be at least 2 characters long!"),
  name: z.string().min(2, "Name must be at least 2 characters long!"),
  username: z.string().min(3, "Username must be at least 3 characters long!"),
  email: z.email("Invalid email address!"),
  password: z.string().min(8, "Password must be at least 8 characters long!"),
});

type SignUpFormValues = z.infer<typeof SignUpSchema>;
export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { signUp } = useAuthStore();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(SignUpSchema),
  });

  const onSubmit = async (data: SignUpFormValues) => {
    const success = await signUp(
      data.surname,
      data.name,
      data.username,
      data.email,
      data.password,
    );

    if (success) {
      navigate("/");
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="p-0 overflow-hidden border-border">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              {/* header - logo */}
              <div className="flex flex-col items-center gap-2 text-center">
                <a href="/" className="block mx-auto text-center w-fit">
                  <img src="/logo.svg" alt="Logo" />
                </a>

                <h1 className="text-2xl font-bold">Create an account</h1>
                <p className="text-balance text-muted-foreground">
                  Welcome! Sign up to get started!
                </p>
              </div>

              {/* Surname and name */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="surname" className="block text-sm font-bold">
                    Surname
                  </Label>
                  <Input
                    id="surname"
                    type="text"
                    placeholder="Surname"
                    {...register("surname")}
                  />
                  {errors.surname && (
                    <p className="text-sm text-destructive">
                      {errors.surname.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name" className="block text-sm font-bold">
                    Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Name"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>
              </div>

              {/* username */}
              <div className="flex flex-col gap-3">
                <Label htmlFor="username" className="block text-sm font-bold">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Username"
                  {...register("username")}
                />
                {errors.username && (
                  <p className="text-sm text-destructive">
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* email */}
              <div className="flex flex-col gap-3">
                <Label htmlFor="email" className="block text-sm font-bold">
                  Email
                </Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="example@gmail.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* password */}
              <div className="flex flex-col gap-3">
                <Label htmlFor="password" className="block text-sm font-bold">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Signup button */}
              <Button className="w-full" type="submit" disabled={isSubmitting}>
                Create account
              </Button>

              {/* login link */}
              <div className="text-sm text-center">
                Already have an account?{" "}
                <a href="/signin" className="underline underline-offset-4">
                  Login
                </a>
              </div>
            </div>
          </form>
          <div className="relative hidden bg-muted md:block">
            <img
              src="/placeholderSignUp.png"
              alt="Image"
              className="absolute object-cover -translate-y-1/2 top-1/2"
            />
          </div>
        </CardContent>
      </Card>
      <div className="px-6 text-center *:[a]:hover:text-primary text-muted-foreground *:[a]:underline *:[a]:underline-offset-4 text-sm text-balance">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}

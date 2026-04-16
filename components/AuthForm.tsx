"use client";

import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { FirebaseError } from "firebase/app";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

import { auth, firebaseClientConfigIssues } from "@/firebase/client";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { signIn, signUp } from "@/lib/actions/auth.action";
import FormField from "./FormField";

const getFirebaseAuthErrorMessage = (error: FirebaseError, type: FormType) => {
    const authErrorMessages: Record<string, string> = {
        "auth/invalid-credential":
            "Invalid email or password. Please check both and try again.",
        "auth/user-not-found": "No account found for this email.",
        "auth/wrong-password": "Incorrect password. Please try again.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/user-disabled": "This account has been disabled.",
        "auth/too-many-requests":
            "Too many attempts. Please wait a bit and try again.",
        "auth/network-request-failed":
            "Network error. Check your internet connection and try again.",
        "auth/email-already-in-use": "This email is already registered.",
        "auth/weak-password":
            "Password must be strong: min 7 chars, 1 uppercase, and 1 number.",
        "auth/invalid-api-key":
            "Firebase is not configured correctly. Please check your client environment variables.",
        "auth/operation-not-allowed":
            "This sign-in method is disabled in Firebase. Please enable it in the console.",
    };

    const mappedMessage = authErrorMessages[error.code];
    if (mappedMessage) {
        return mappedMessage;
    }

    if (type === "sign-in") {
        return `Sign in failed (${error.code}): ${error.message}`;
    }

    return `Sign up failed (${error.code}): ${error.message}`;
};

const authFormSchema = (type: FormType) => {
    const signUpPasswordSchema = z
        .string()
        .min(7, "Password must be at least 7 characters long")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/\d/, "Password must contain at least one number");

    return z.object({
        name:
            type === "sign-up"
                ? z.string().min(3, "Name must be at least 3 characters long")
                : z.string().optional(),
        email: z.string().email("Please enter a valid email address."),
        password:
            type === "sign-up"
                ? signUpPasswordSchema
                : z.string().min(1, "Password is required"),
    });
};

const AuthForm = ({ type }: { type: FormType }) => {
    const router = useRouter();
    const formSchema = authFormSchema(type);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
        },
    });

    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        try {
            if (firebaseClientConfigIssues.length > 0) {
                toast.error(
                    `Firebase setup is incomplete: ${firebaseClientConfigIssues.join(
                        ", "
                    )}. Please check .env.local and restart the dev server.`
                );
                return;
            }

            if (type === "sign-up") {
                const { name, email, password } = data;

                const userCredential = await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

                const result = await signUp({
                    uid: userCredential.user.uid,
                    name: name!,
                    email,
                    password,
                });

                if (!result.success) {
                    toast.error(result.message);
                    return;
                }

                toast.success("Account created successfully. Please sign in.");
                router.push("/sign-in");
            } else {
                const { email, password } = data;

                const userCredential = await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

                const idToken = await userCredential.user.getIdToken();
                if (!idToken) {
                    toast.error("Sign in failed. Please try again.");
                    return;
                }

                const result = await signIn({
                    email,
                    idToken,
                });

                if (!result?.success) {
                    toast.error(result?.message || "Sign in failed. Please try again.");
                    return;
                }

                toast.success("Signed in successfully.");
                router.push("/");
            }
        } catch (error) {
            if (error instanceof FirebaseError) {
                const authErrorMessage = getFirebaseAuthErrorMessage(error, type);

                if (error.code === "auth/weak-password") {
                    form.setError("password", {
                        type: "manual",
                        message: authErrorMessage,
                    });
                    return;
                }

                if (
                    error.code === "auth/email-already-in-use" ||
                    error.code === "auth/invalid-email"
                ) {
                    form.setError("email", {
                        type: "manual",
                        message: authErrorMessage,
                    });
                    return;
                }

                toast.error(authErrorMessage);
                return;
            }

            toast.error("There was an error. Please try again later.");
        }
    };

    const isSignIn = type === "sign-in";

    return (
        <div className="card-border lg:min-w-[566px]">
            <div className="card flex flex-col gap-6 px-10 py-14">
                <div className="flex flex-row justify-center gap-2">
                    <Image src="/logo.svg" alt="logo" height={32} width={38} />
                    <h2 className="text-primary-100">Prepguru</h2>
                </div>

                <h3>Practice job interviews with AI</h3>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="form mt-4 w-full space-y-6"
                    >
                        {!isSignIn && (
                            <FormField
                                control={form.control}
                                name="name"
                                label="Name"
                                placeholder="Your Name"
                                type="text"
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="email"
                            label="Email"
                            placeholder="Your email address"
                            type="email"
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            label="Password"
                            placeholder="Enter your password"
                            description={
                                !isSignIn
                                    ? "Kindly use a strong password (min 7 chars, 1 uppercase, 1 number)."
                                    : undefined
                            }
                            type="password"
                        />

                        <Button className="btn" type="submit">
                            {isSignIn ? "Sign In" : "Create an Account"}
                        </Button>
                    </form>
                </Form>

                <p className="text-center">
                    {isSignIn ? "No account yet?" : "Have an account already?"}
                    <Link
                        href={!isSignIn ? "/sign-in" : "/sign-up"}
                        className="font-bold text-user-primary ml-1"
                    >
                        {!isSignIn ? "Sign In" : "Sign Up"}
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default AuthForm;
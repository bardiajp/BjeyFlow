import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { axiosInstance } from "@/lib/api";
import { cn } from "@/lib/utils";

const schema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginForm() {
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormValues>({
        mode: "onChange",
    });

    const onSubmit = async (data: FormValues) => {
        setError(null);
        setIsSubmitting(true);
        try {
            await axiosInstance.post("/users/auth/login/", {
                username: data.username,
                password: data.password,
            });
        } catch (err: any) {
            setError(
                err.response?.data?.detail ||
                err.response?.data?.non_field_errors?.[0] ||
                "Login failed",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Welcome back</CardTitle>
                <CardDescription>Sign in to your account to continue</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                    {error && (
                        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            type="text"
                            placeholder="Username"
                            {...register("username")}
                            className={cn(errors.username && "border-destructive")}
                        />
                        {errors.username && (
                            <p className="text-xs text-destructive">{errors.username.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Password"
                            {...register("password")}
                            className={cn(errors.password && "border-destructive")}
                        />
                        {errors.password && (
                            <p className="text-xs text-destructive">{errors.password.message}</p>
                        )}
                    </div>
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                        Sign in
                    </Button>
                </form>
            </CardContent>
            <CardFooter>
                <p className="text-xs text-muted-foreground">
                    Don't have an account?{" "}
                    <a href="#" className="text-primary underline underline-offset-4">
                        Sign up
                    </a>
                </p>
            </CardFooter>
        </Card>
    );
}

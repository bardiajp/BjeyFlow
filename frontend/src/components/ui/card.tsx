import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const cardVariants = cva(
    "rounded-xl bg-card border text-card-foreground shadow-sm",
    {
        variants: {
            variant: {
                default: "",
                outlined: "border-input",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    },
);

function Card({
    className,
    variant = "default",
    ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardVariants>) {
    return (
        <div
            data-slot="card"
            className={cn(cardVariants({ variant }), className)}
            {...props}
        />
    );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-header"
            className={cn("flex flex-col space-y-1.5 p-6", className)}
            {...props}
        />
    );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-title"
            className={cn("text-2xl font-semibold leading-none tracking-tight", className)}
            {...props}
        />
    );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-description"
            className={cn("text-sm text-muted-foreground", className)}
            {...props}
        />
    );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-content"
            className={cn("p-6 pt-0", className)}
            {...props}
        />
    );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-footer"
            className={cn("flex items-center p-6 pt-0", className)}
            {...props}
        />
    );
}

export {
    Card,
    CardHeader,
    CardFooter,
    CardTitle,
    CardDescription,
    CardContent,
};

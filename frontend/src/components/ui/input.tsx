import { Input as InputPrimitive } from "@base-ui/react/input";
import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
    return (
        <InputPrimitive
            type={type}
            data-slot="input"
            className={cn(
                "h-8 w-full rounded-lg border border-input bg-transparent py-1 transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 font-medium px-4 text-xs",
                className,
            )}
            {...props}
        />
    );
}

export { Input };

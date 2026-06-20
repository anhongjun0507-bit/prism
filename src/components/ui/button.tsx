import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * PRISM Button — shadcn 표준 + PRISM v3 토큰.
 * variant: primary(브랜드) / cta(Linear 강한 액션) / secondary / ghost / destructive / outline
 * size: sm(32) / md(40, default) / lg(48) / icon(40 정사각)
 * shape: rect(rounded-md) / pill(rounded-full)
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:opacity-90",
        cta: "bg-cta text-cta-foreground hover:bg-cta-hover",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "bg-transparent hover:bg-secondary",
        destructive:
          "bg-destructive text-destructive-foreground hover:opacity-90",
        outline:
          "border border-border bg-transparent hover:bg-secondary",
      },
      size: {
        sm: "h-8 px-3 text-small",
        md: "h-10 px-4 text-small",
        lg: "h-12 px-6 text-body",
        icon: "h-10 w-10",
      },
      shape: {
        rect: "rounded-md",
        pill: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      shape: "rect",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, shape, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, shape, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

import React from "react";
import cn from "classnames";

interface ButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  loading?: boolean;
  className?: string;
}

const Button = ({ children, className, loading, ...rest }: ButtonProps) => {
  return (
    <button className={cn("btn", className)} {...rest}>
      <span
        className={cn(
          { "opacity-0": !loading },
          "absolute flex items-center gap-2",
        )}
      >
        <span className="loading loading-spinner loading-xs"></span>
      </span>
      <span className={cn({ "opacity-0": loading })}>{children}</span>
    </button>
  );
};

export default Button;

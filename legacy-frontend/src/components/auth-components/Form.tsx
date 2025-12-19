import React from "react";

/**
 * A functional component that renders a form element with additional props and class names.
 *
 * @component
 * @param {React.FormHTMLAttributes<HTMLFormElement>} props - Additional props to spread onto the form element.
 * @param {string} [className=""] - Additional class names to apply to the form element.
 * @returns {JSX.Element} The rendered form element.
 */
const Form = ({
  className = "",
  ...props
}: React.FormHTMLAttributes<HTMLFormElement>) => (
  <form
    {...props}
    className={`px-8 flex flex-col justify-between gap-4 ${className}`}
  />
);

export default Form;

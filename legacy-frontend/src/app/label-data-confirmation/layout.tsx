import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Confirmation",
};

/**
 * Layout component that renders its children.
 *
 * @param {Object} props - The properties object.
 * @param {React.ReactNode} props.children - The child elements to be rendered within the layout.
 * @returns {JSX.Element} The rendered children elements.
 */
function layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}

export default layout;

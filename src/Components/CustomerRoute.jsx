import { useAuthSession } from "../context/AuthSessionContext";

export default function CustomerRoute({ children }) {
  const { customer, loading } = useAuthSession();

  console.log("CustomerRoute");
  console.log("Loading:", loading);
  console.log("Customer:", customer);

  if (loading) {
    return <h1>Loading...</h1>;
  }

  return children;
}
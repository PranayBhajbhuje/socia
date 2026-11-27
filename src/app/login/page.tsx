import LoginForm from "./LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ created?: string; email?: string }> }) {
  const params = await searchParams;
  return <LoginForm accountCreated={params.created === "1"} initialEmail={params.email ?? ""} />;
}

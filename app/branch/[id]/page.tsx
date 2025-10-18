export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const branchId = (await params).id;
  return <div>Branch {branchId}</div>;
}

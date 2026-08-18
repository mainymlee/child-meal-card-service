import { notFound } from "next/navigation";
import { StoreDetailClient } from "@/components/store/StoreDetailClient";
import { getStoreById } from "@/lib/stores";

export default async function StoreDetailPage(props: PageProps<"/store/[id]">) {
  const { id } = await props.params;
  // Route params can arrive still percent-encoded for non-ASCII (Korean) ids.
  const store = getStoreById(decodeURIComponent(id));
  if (!store) notFound();

  return <StoreDetailClient store={store} />;
}

import { notFound } from "next/navigation";

// Mavjud bo'lmagan yo'llar tarjima qilingan 404 sahifasini ko'rsatishi uchun.
export default function CatchAllPage() {
  notFound();
}

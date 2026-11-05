import { LockIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";

export async function NoAccess({ page, email, reason }: { page: string; email: string; reason: "page" | "branches" | "inactive" }) {
  const t = await getTranslations("noAccess");

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <LockIcon aria-hidden className="size-5" />
        </span>
        <h2 className="text-lg font-semibold">{t("title", { page })}</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          {t(reason, { email })}
        </p>
        <p className="max-w-md text-sm text-muted-foreground">{t("contact")}</p>
      </CardContent>
    </Card>
  );
}

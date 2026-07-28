"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import type { ProfileRow } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function ProfileForm({ profile }: { profile: ProfileRow }) {
  const t = useTranslations("account");
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [city, setCity] = useState(profile.city ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [showPhone, setShowPhone] = useState(profile.show_phone);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        city: city.trim() || null,
        phone: phone.trim() || null,
        show_phone: showPhone,
      })
      .eq("id", profile.id);
    setSaving(false);
    toast[error ? "error" : "success"](
      error ? error.message : t("saved"),
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6 rounded-xl border border-border bg-card p-6"
    >
      <div className="space-y-2">
        <Label htmlFor="displayName">{t("displayName")}</Label>
        <Input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="h-11 bg-background"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">{t("city")}</Label>
        <Input
          id="city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="h-11 bg-background"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">{t("phone")}</Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t("phonePlaceholder")}
          className="h-11 bg-background"
        />
      </div>

      <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-background p-4">
        <div className="space-y-1">
          <Label htmlFor="showPhone" className="text-base">
            {t("showPhone")}
          </Label>
          <p className="text-sm text-muted-foreground">{t("showPhoneHint")}</p>
        </div>
        <Switch
          id="showPhone"
          checked={showPhone}
          onCheckedChange={setShowPhone}
        />
      </div>

      <Button type="submit" size="lg" disabled={saving}>
        {saving ? t("saving") : t("save")}
      </Button>
    </form>
  );
}

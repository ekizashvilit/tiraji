"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import type { ProfileRow } from "@/lib/supabase/types";
import { CITIES, cityLabel } from "@/lib/cities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export function ProfileForm({ profile }: { profile: ProfileRow }) {
  const t = useTranslations("account");
  const locale = useLocale();
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [city, setCity] = useState(profile.city ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [showPhone, setShowPhone] = useState(profile.show_phone);
  const [saving, setSaving] = useState(false);

  // Last-saved values — Save stays disabled until something actually differs.
  const [baseline, setBaseline] = useState({
    displayName: (profile.display_name ?? "").trim(),
    city: profile.city ?? "",
    phone: (profile.phone ?? "").trim(),
    showPhone: profile.show_phone,
  });

  const dirty =
    displayName.trim() !== baseline.displayName ||
    city !== baseline.city ||
    phone.trim() !== baseline.phone ||
    showPhone !== baseline.showPhone;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dirty || saving) return;
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
    if (!error) {
      // Reset the baseline so the button disables again until the next change.
      setBaseline({
        displayName: displayName.trim(),
        city,
        phone: phone.trim(),
        showPhone,
      });
      // Let the header's avatar refresh its initial without a full reload.
      window.dispatchEvent(
        new CustomEvent("tiraji:profile-updated", {
          detail: { display_name: displayName.trim() || null },
        }),
      );
    }
    toast[error ? "error" : "success"](error ? error.message : t("saved"));
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-6">
      <div className="space-y-2">
        <Label htmlFor="displayName">{t("displayName")}</Label>
        <Input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">{t("city")}</Label>
        <Select
          id="city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="h-11"
        >
          <option value="">{t("cityPlaceholder")}</option>
          {CITIES.map((c) => (
            <option key={c.code} value={c.code}>
              {cityLabel(c.code, locale)}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">{t("phone")}</Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t("phonePlaceholder")}
        />
      </div>

      <div className="flex items-start justify-between gap-4 pt-6">
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

      <Button type="submit" size="lg" disabled={saving || !dirty}>
        {saving ? t("saving") : t("save")}
      </Button>
    </form>
  );
}

"use client";
import { useState, useTransition } from "react";
import { addStory } from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { haptic } from "@/lib/haptics";
import { t, type Locale } from "@/lib/i18n";

export function StoryForm({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [author, setAuthor] = useState("");
  const [bad, setBad] = useState("");
  const [prev, setPrev] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!bad.trim()) return;
    const fd = new FormData();
    fd.set("authorName", author);
    fd.set("badExperience", bad);
    fd.set("preventionAnswer", prev);
    start(async () => {
      await addStory(fd);
      haptic("medium");
      setAuthor("");
      setBad("");
      setPrev("");
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        {t(locale, "today.addStory")}
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 border border-ink/15 p-5">
      <div className="space-y-1.5">
        <Label htmlFor="authorName">{t(locale, "today.storyAuthor")}</Label>
        <Input
          id="authorName"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="badExperience">{t(locale, "today.storyBad")}</Label>
        <Textarea
          id="badExperience"
          rows={4}
          required
          value={bad}
          onChange={(e) => setBad(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="preventionAnswer">
          {t(locale, "today.storyPrevention")}
        </Label>
        <Textarea
          id="preventionAnswer"
          rows={3}
          value={prev}
          onChange={(e) => setPrev(e.target.value)}
        />
      </div>
      <div className="flex gap-3 justify-end">
        <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
          {t(locale, "today.cancel")}
        </Button>
        <Button type="submit" disabled={pending || !bad.trim()}>
          {t(locale, "today.save")}
        </Button>
      </div>
    </form>
  );
}

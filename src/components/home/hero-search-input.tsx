
"use client";

import { Input } from "@/components/ui/input";

export function HeroSearchInput() {
  const handleHeroSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Placeholder for future search functionality
    // For now, we'll just log it to the console.
    console.log("Hero search term:", event.target.value);
  };

  return (
    <Input
      type="search"
      placeholder="Search for a politician, party, or promise... (coming soon)"
      className="w-full h-12 text-base bg-background shadow-md"
      onChange={handleHeroSearchChange}
    />
  );
}

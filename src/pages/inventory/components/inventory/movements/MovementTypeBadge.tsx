
import React from "react";
import { Badge } from "@/components/ui/badge";
import { MovementBadgeVariant } from "./types";

interface MovementTypeBadgeProps {
  type: string;
}

export function MovementTypeBadge({ type }: MovementTypeBadgeProps) {
  return (
    <Badge variant={getVariantByType(type)}>
      {type}
    </Badge>
  );
}

// Helper function to determine the variant of the Badge based on the type
export function getVariantByType(type: string): MovementBadgeVariant {
  switch (type) {
    case "entrada":
      return "default";
    case "saída":
      return "destructive";
    default:
      return "secondary";
  }
}

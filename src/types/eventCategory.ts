export type EventCategoryId =
  | "infantil"
  | "boda"
  | "xv"
  | "baby-shower"
  | "graduacion"
  | "corporativo";

export interface EventCategoryDefinition {
  id: EventCategoryId;
  label: string;
  description: string;
}

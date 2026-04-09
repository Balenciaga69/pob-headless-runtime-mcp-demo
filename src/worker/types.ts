export type PobWorkerMethod =
  | "health"
  | "get_summary"
  | "get_stats"
  | "get_display_stats"
  | "preview_item_display_stats"
  | "list_equipment"
  | "list_items"
  | "list_skills"
  | "select_skill"
  | "get_selected_skill"
  | "get_config"
  | "set_config"
  | "equip_item"
  | "save_build_code"
  | "save_build_xml"
  | "save_build_file"
  | "get_runtime_status"
  | "load_build_code"
  | "load_build_xml"
  | "load_build_file";

export type PobWorkerRequest = {
  id: string;
  method: PobWorkerMethod | string;
  params: Record<string, unknown>;
};

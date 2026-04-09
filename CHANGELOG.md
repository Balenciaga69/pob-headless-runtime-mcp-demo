# Changelog

## Unreleased

- added `preview_item_display_stats` to the MCP surface
- wired the new preview tool through the persistent worker read-service path
- updated the demo README to document the preview flow
- expanded the tool registry test to cover the new preview method
- added `list_items`, `list_skills`, `get_selected_skill`, and `select_skill` to the MCP surface
- split skill selection into its own tool group for cleaner maintenance
- updated the demo README to match the expanded tool set
- added a unit test that verifies the tool registry exports the new methods

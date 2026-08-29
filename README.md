# ⊹ STYLE JAM ⊹

Fast image-style variants for SillyTavern chat-completion presets.

Style Jam copies an image prompt, lets you edit selected fields, saves reusable
styles, and activates the new variant from one dialog. Styles remain part of
the preset's tagged image prompt.

> [!TIP]
> Style Jam is not limited to image generation. Set a tag for any prompt to
> copy it and edit the copy faster.

## What it does

- Lists prompts with the configured tag in the current Chat Completion preset.
- Creates editable fields from text selected in a base prompt.
- Creates a variant from the edited field values, places it after the base
  prompt, activates it, and deactivates other matching prompts.
- Saves named sets of field values and applies them to fields with matching names.

## Settings

Open **Extensions → ⊹ STYLE JAM ⊹** to configure:

- **Prompt tag** — the XML tag used to identify image prompts. The default is
  `image_gen`. Enter the tag name without angle brackets. The match count shows
  how many prompts in the current preset use that tag.

## How to use

1. Open Style Jam from the palette button in the **Prompt Manager** footer, or
   from the **wand menu**.
2. Pick a **base prompt**.
3. In **Base prompt content**, select the text you want to edit and click
   **Create field**. Enter a field name and repeat for each editable region.
4. Edit the field values or apply a saved style.
5. Optionally select **Save style** to save the current values.
6. Select **Create variant** and enter a name for the new prompt.

Use **Expand the editor** to edit a field in full screen. The base-prompt
preview is used only for selecting text.

Fields remain linked after unrelated changes to the base prompt. If Style Jam
cannot locate a field, select its text again.

## Saving changes

Style Jam updates the current preset settings. Use **Update preset** in
SillyTavern to save them to the preset file.

## Compatibility

Requires SillyTavern 1.18.0 or later, an active Chat Completion preset, and the
Chat Completion Prompt Manager.

## Languages

English is the default. Russian is also available.

## Author

aceenvw · AGPL-3.0-or-later

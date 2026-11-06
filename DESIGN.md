---
name: MedGPT
description: A calm research desk for health questions.
colors:
  canvas: "#f8f9f7"
  rail: "#f1f4f1"
  surface: "#ffffff"
  ink: "#172826"
  muted: "#53635f"
  faint: "#586b63"
  border: "#dce5df"
  teal: "#176b63"
  teal-hover: "#0d554e"
  teal-soft: "#e5f3ef"
  user-surface: "#edf4f0"
  focus: "#258f83"
  error: "#9d3c39"
  night-canvas: "#121b1a"
  night-rail: "#192522"
  night-surface: "#1c2926"
  night-ink: "#edf5f1"
  night-muted: "#bbcac3"
  night-faint: "#96aaa1"
  night-border: "#354640"
  night-teal: "#75d3c2"
  night-teal-hover: "#9de1d5"
  night-teal-soft: "#203d36"
  night-user-surface: "#233a33"
  night-error: "#f2aaa4"
typography:
  display:
    fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(27px, 3vw, 38px)"
    fontWeight: 640
    lineHeight: 1.17
    letterSpacing: "-0.038em"
  title:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 660
    lineHeight: 1.4
    letterSpacing: "-0.015em"
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "15px"
    lineHeight: 1.72
  label:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "12px"
    fontWeight: 650
rounded:
  control: "8px"
  row: "9px"
  message: "11px"
  composer: "17px"
spacing:
  tight: "8px"
  compact: "12px"
  standard: "16px"
  spacious: "24px"
  section: "32px"
components:
  button-primary:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.surface}"
    rounded: "{rounded.row}"
  button-primary-hover:
    backgroundColor: "{colors.teal-hover}"
  button-quiet:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
  composer:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.composer}"
    padding: "16px 17px 12px"
  source-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.row}"
    padding: "11px 12px"
---

# Design System: MedGPT

## Overview

**Creative North Star: "The Calm Research Desk"**

The conversation workspace gives health information room to be read. A pale mineral canvas, restrained teal controls, and a centered document column make the answer and its supporting material the focus. The MedGPT name and existing logo anchor the navigation rail. Dark mode keeps the same hierarchy with charcoal surfaces and lighter teal.

The interface is spacious at the page level and compact inside controls. Questions, answers, attached files, and actual sources remain visibly distinct. The composer stays available below the reading area, with the medical safety sentence beneath it.

**Key Characteristics:**
- A quiet rail beside a single reading column.
- Teal for actions, links, citations, and selected states.
- Fine rules and soft surface changes for separation.
- Matching light and dark semantic roles.

## Colors

The palette is cool, low saturation, and led by teal. The frontmatter records the light and dark semantic values used by the workspace custom properties.

### Primary

- **Deep Teal** (`teal`): primary actions, assistant identity, links, and citation numbers. `teal-hover` strengthens actionable hover states; `teal-soft` marks selected or supporting surfaces.
- **Night Teal** (`night-teal`): corresponding dark mode action and link color, with `night-teal-hover` and `night-teal-soft` for states.

### Neutral

- **Mineral Canvas** (`canvas`): main reading area and composer dock. **Quiet Rail** (`rail`) distinguishes navigation.
- **Paper Surface** (`surface`): composer, source rows, file rows, and controls.
- **Slate Ink** (`ink`): primary text. `muted` carries secondary copy; `faint` carries metadata and helper text.
- **Fine Rule** (`border`): dividers, source cards, and control outlines.
- **User Wash** (`user-surface`): user message body.
- **Charcoal Canvas, Rail, and Surface** (`night-canvas`, `night-rail`, `night-surface`): dark mode layers, paired with `night-ink`, `night-muted`, `night-faint`, `night-border`, and `night-user-surface`.
- **Error** (`error`, `night-error`): failed response state. `focus` is the light mode keyboard and composer focus accent; dark mode uses `night-teal-hover`.

**The Semantic Pair Rule.** A new workspace surface must use the same role in both themes; do not keep a light surface color in dark mode.

## Typography

**Display Font:** Outfit with system sans fallbacks, used for the empty state question.

**Body Font:** The system sans stack, used for reading text and controls.

**Character:** The display has gentle geometric presence. Reading copy stays plain and legible, with a generous line height and restrained metadata.

### Hierarchy

- **Display:** the empty state question uses the `display` token; the smaller empty conversation heading is (26px).
- **Title:** the top bar uses `title`; assistant and user identities are (13px, weight 680).
- **Body:** answer Markdown uses `body`, with a maximum measure of (70ch). Empty state supporting copy is (15px, line-height 1.7).
- **Label:** controls and source titles are mostly (11-13px); quiet timestamps and safety text are (11px).

**The Reading Measure Rule.** Keep answer prose within (70ch) even when the outer reading column is wider.

## Layout

The desktop navigation rail is (280px) wide. The conversation uses a (66px) top bar, a centered reading column no wider than (812px), and a fixed composer dock. The composer itself is no wider than (770px). Message groups are separated by (33px). The empty state uses a narrower (730px) region, and suggestion rows stop at (610px).

At widths below (768px), the rail becomes an overlay, horizontal reading padding reduces to (18px), the top bar makes room for the menu control, and the composer dock uses (12px) side padding plus the device safe area at the bottom. The answer body drops to (14px). The same question, answer, evidence, and composer order remains.

## Elevation & Depth

Fine borders and related surface tones establish most depth. The composer has a soft ambient shadow (`0 8px 27px -20px #29463b70`), and the collapsed menu control has a smaller one (`0 5px 16px -11px #1b3d31`). Focus within the composer adds a low-opacity teal halo. The navigation rail and message content stay flat.

**The Quiet Surface Rule.** Use borders and tonal layers for reading surfaces; reserve soft elevation for the composer and the floating menu control.

## Shapes

Controls use gently curved corners. Compact controls and chat rows use the `control` radius, file and source rows use `row`, the user message uses `message`, and the composer uses `composer`. The empty state mark is a (44px) rounded square with a (14px) radius. Borders are thin (1px); source index and citation markers are small rounded shapes.

## Components

### Buttons

- **Primary:** the navigation New Chat button is solid teal with white text and the `row` radius. The send control is a compact (35px) square with a (10px) radius; its disabled state uses the border and faint text roles.
- **Quiet:** top bar and attachment controls use transparent or paper backgrounds, teal on hover, and the `control` radius.
- **Focus:** visible keyboard focus is a (2px) `focus` outline with a (2px) offset across workspace and rail controls. The theme switch also uses a teal focus ring.

### Cards / Containers

- **User message:** a `user-surface` body inset from its identity line, with (15px 18px 9px) padding. Assistant prose is left open on the canvas.
- **Source and file rows:** paper surfaces with a fine border and the `row` radius; source hover or target state shifts to teal border and soft teal background. A source row has (11px 12px) padding.

### Inputs / Fields

- **Composer:** a paper surface with the `composer` radius, a subtle outline, and (16px 17px 12px) padding. The textarea is borderless and grows up to (180px). The focus halo follows the entire composer.
- **Search and edit:** quieter bordered fields, using the surface and ink roles.

### Navigation

The rail contains product identity, a primary New Chat action, conversation search, chat rows, and account controls. Hovered rows turn to the paper surface; the current row uses the soft teal surface. At narrow widths, the rail opens over the workspace and can be closed with its control.

### Citations and Sources

Numbered citation markers appear only when matching source data is present. They link to numbered rows following the answer. Supporting file rows and source rows stay adjacent to the message they explain.

## Do's and Don'ts

### Do:

- **Do** keep the reading column centered and the composer aligned beneath it.
- **Do** use the semantic color pair for every new light and dark workspace element.
- **Do** show source rows only from actual source data, with citation numbers linked to those rows.
- **Do** retain a visible focus outline and the safety sentence below the composer.

### Don't:

- **Don't** turn the assistant's reading text into a filled message card; the current answer rests on the canvas.
- **Don't** add broad elevation to the rail, source list, or answer body; their separation is tonal and ruled.
- **Don't** make a decorative color or a source claim compete with the health information.

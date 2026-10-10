# Satuminton design QA

- Source visual truth: `C:\Users\faise\.codex\generated_images\01a039e8-bf22-76e3-b392-3cdc1e84d33d\exec-1c6ce9ed-a859-4b24-91e3-cca1a5f900c9.png` (selected direction 3, 979 × 1639 source pixels). The user subsequently directed a registration-first redesign, so the older division-card layout is intentionally superseded.
- Rendered implementation screenshot: full-page capture of `http://localhost:3004/en/satuminton` in in-app Browser tab 6, emitted beside the source image in the same browser-tool result. Browser captures are not persisted as local image files by this tool.
- Viewports: desktop browser default (approximately 1226 × 1244 CSS px, 1×); mobile 390 × 844 CSS px, 1×. Mobile document width is 375 CSS px excluding the scrollbar and the form card measures 335 CSS px, with no horizontal overflow.
- State: Garuda Open 2026, live API data, registration open. Compared the English selected state (Men, Beginner, Feather) against the concept; tested empty, selected, new-player default and existing-account branches. Swedish labels were checked separately. No registration was submitted.

## Findings and resolution

- [P1 resolved] The original card grid and subsequent dropdown form made the registration choice feel like a filter task. The new centered form uses large radio-card choices for category, level and shuttle. It shows the matched class, fee and available spots before the player details. This is an intentional deviation from the older mock and follows the user's latest direction.
- [P2 resolved] Eight stacked mobile choice cards delayed the personal fields. The options now use compact three-column category/level and two-column shuttle grids, while preserving practical touch height and visible selected state.
- [P2 resolved] Account choice appeared after the player details, confusing the order. New-player registration is now the default with the fields visible. An inline existing-account alternative sits before those fields; choosing it hides them and offers the app continuation link. Switching back preserves entered values. Password and terms remain the final account step for new users.
- [P2 resolved] The generic “Choose your division” heading and hero action understated registration. The hero says “Register now,” the section says “Register for Garuda Open,” and the navigation says “Registration.” Swedish counterparts are present.
- No actionable P0/P1/P2 visual issues remain in the scoped registration flow. The API's `DUO` and `SQUAD` values are still passed unchanged to onboarding; only the player-facing choice has been unified.

## Fidelity surfaces

- Typography: the dark-teal display hierarchy remains; compact card labels and field labels are readable at mobile width, including “Intermediate” and Swedish “Avancerad.”
- Layout and rhythm: the original hero and three-fact strip remain. Registration is one centered white surface with section dividers, compact choice rows and a clear details-to-account order. No clipping or horizontal overflow at 390 px.
- Colors and tokens: dark teal text, mint selection, lime price/action and white form surface use existing project tokens. The selected radio card and disabled action are visually distinct.
- Images and icons: the existing Garuda hero image retains its crop and sharpness; selection ticks use the established icon library. No new raster assets or substitute artwork were introduced.
- Copy/content: the class summary uses understandable doubles labels while retaining the organizer's official class code. Live fee and capacity are shown. API-managed tagline/description and missing venue remain outside this scoped change.

## Interaction and verification

- English selected Men + Beginner + Feather: `MD C feather`, 16 spots left, 360 SEK; alternative nylon shows 150 SEK. Existing-account path points to the player app. New-player fields reappear with typed values intact when switching back.
- Swedish page renders the translated registration headings, option groups, account alternative and fields. Browser warnings/errors were empty in checked views.
- Production webpack build and TypeScript compilation passed. Real Firebase account creation, API registration and payment were not submitted in this QA.

## Comparison history

- Earlier iterations implemented the selected concept, then corrected spacing and replaced the split “Doubles”/“Team” cards with a centered dropdown form.
- This iteration's first visual capture showed the new radio-card form but revealed stacked mobile choices and a late account decision. The compact mobile grids and new-player-default branch were applied, then fresh mobile and desktop captures were checked. The final desktop implementation and original concept were emitted together; the changed registration layout is the explicit user-directed deviation.

final result: passed

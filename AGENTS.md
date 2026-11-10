<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Store contact details as one validated object in site_settings and share defaults between public and Admin views, so existing details remain editable without duplication.
- Render home photography only from saved home_slides, with no bundled fallback photo, so removed images cannot reappear while loading or when the gallery is empty.
- Keep sticky menu indexes in MenuPageView and measure their height for section scroll offsets, so wrapped category links never cover destination titles.
- Render the contact map through Google Maps Embed using the connector's public browser key and the saved address; no billable server lookup is needed.
- Store formatted catalog names in existing name fields, render them through RichName, and use plainName for search, selectors, slugs and alternative text; this preserves existing records without duplicating names.

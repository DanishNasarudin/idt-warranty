---
applyTo: "**"
---

guides:
make sure we use nextjs conventional method, keeping the page server component, only apply "use client" to interactive components. and apply clean code architecture & SOLID principle for cases that may require scaling in the future.

Use memoization where applicable to avoid side effects leaking between components or unintentional rerender.

use shadcn component where possible. If a custom component is required, add it inside our design system folder to be a reusable component.

you may use zustand as the state manager if required.

Always check the entire repo for context of the folder structure, refer to docs as well for the architecture. Before apply a code or creating new component, check the repo for similar patterns and reuse or ensure new component have consistent pattern.

not required to create document summary.

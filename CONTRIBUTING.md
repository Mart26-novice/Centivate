# Contributing to CentIvate

Thank you for contributing to the CentIvate Campus Facility Complaint and Maintenance Management System.

---

## 💻 Development Workflow

1. **Branching & Commits:**
   - Use clear commit messages describing functional changes (e.g. `feat: add image base64 validation`, `fix: update firestore rules for list gating`).

2. **Code Quality & Type Safety:**
   - Ensure code passes TypeScript compilation check before pushing:
     ```bash
     npm run lint
     ```

3. **Running Tests:**
   - Execute the unit test suite before creating pull requests:
     ```bash
     npm run test
     ```

4. **Security & Rules Checklist:**
   - Never commit API keys or private service account JSON keys.
   - If modifying Firestore database queries or collections, update `firestore.rules` and verify security constraints.
   - Maintain client payload limits (<500KB per base64 image) and server-side length caps.

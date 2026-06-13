# Release Checklist

**CRITICAL RULE: NEVER LEAVE A RELEASE IN DRAFT MODE.**

Every time a new version is built or pushed, you MUST follow these exact steps before confirming with the user:

1. **Verify GitHub Actions Workflow:** Check that the `release.yml` workflow has successfully completed.
2. **Verify Release Status via CLI:** Run the following command to check the release status:
   `gh release view v<VERSION> --repo omkaspa9505-svg/smg-pos-updates`
3. **Check for "Draft: true":**
   - If the output says `draft: true`, the release is HIDDEN from the auto-updater.
   - **ACTION REQUIRED:** You must immediately run: 
     `gh release edit v<VERSION> --draft=false --latest --repo omkaspa9505-svg/smg-pos-updates`
4. **Confirm the Fix:** Re-run the view command to ensure `draft: false`.
5. **Verify Assets:** Ensure `latest.yml` and the `.exe` file are listed under the assets for that release.

**DO NOT** tell the user the update is ready until steps 1-5 are completely verified.

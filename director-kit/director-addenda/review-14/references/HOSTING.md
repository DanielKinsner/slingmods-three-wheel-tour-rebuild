# Hosting references and decisions

Retrieved in this Review14 audit session. Reconfirm the actual target plan and current CLI help when acting. These pages explain provider behavior; they do not prove a deployment or create publication authority.

## Vercel

- https://vercel.com/docs/plans/hobby — Hobby is restricted to personal non-commercial use. The read-only connected-team query returned Daniel Kinsner's projects (`daniel-kinsners-projects`), plan `hobby`. This is not a claim about every account or team Dan may have elsewhere.
- https://vercel.com/docs/limits — the CLI source-upload ceiling is100 MB for Hobby and1 GB for Pro. The submitted static payload is112,457,877 bytes before its own manifest metadata; the review ZIP is not the deployment payload.
- https://vercel.com/docs/deployments/environments — a new project's first deployment is production, even without --prod. A new project is not automatically an unpublished staging area.
- https://vercel.com/docs/build-output-api/configuration — reference for a separately authorized static Build Output configuration; inspect route/header semantics and actual deployed responses.

## Netlify candidate

- https://www.netlify.com/blog/introducing-netlify-free-plan/ — the provider explicitly includes commercial projects in Free. This is a2024 announcement; **do not use its old traffic/build allowances as current new-plan quotas**.
- https://www.netlify.com/pricing/ — current Free price/hard-limit and publication overview, including quota exhaustion. Free does not generate automatic overage charges, but service can pause. Existing projects sharing quota matter.
- https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/ — new credit-plan Free has300 credits/month, no recharge; web bandwidth20 credits/GB, requests2 credits/10,000, published production deployment15 credits. Inspect the actual account; do not migrate a legacy plan as a side effect.
- https://docs.netlify.com/deploy/create-deploys/ — manual and API deployment options and project visibility. A local static artifact can be deployed without Git-connected continuous deployment.
- https://docs.netlify.com/api-and-cli-guides/cli-guides/get-started-with-cli/ — current manual/draft publication flow, target directory flags and account access. Anonymous unclaimed projects are temporary and unsuitable as the durable handoff.
- https://docs.netlify.com/api-and-cli-guides/api-guides/get-started-with-api/ — file-digest deployment, asynchronous preparation and bounded retries for large transfers. Actual asset-upload acceptance remains untested; do not invent a numeric static per-file limit that was not established here.

## Intended use and risk

This is a small audience development demo, not a high-traffic launch. Do not promise unlimited free traffic. An unindexed publicly reachable origin is not private. Prefer manual prebuilt publication of the exact reviewed output, not a source repository import. No account connection, new project, upload, plan change or publication occurred during Astra's Review14 audit.

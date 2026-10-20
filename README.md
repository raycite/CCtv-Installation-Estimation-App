# FAST-TECH Estimate Studio

A browser-based CCTV installation estimator for FAST-TECH Installation Services. The interface and A4 estimate use the supplied FAST-TECH logo and business card contact details.

## Run locally

Open `index.html` in a modern browser. There is no build step or server dependency. Estimate drafts are saved in that browser's local storage; the customer details and prices are not uploaded by the estimator.

## Deploy to Vercel

Import this GitHub repository in Vercel and keep the project as a static site with the repository root as the output directory. There is no build command. You can also deploy from this folder with the Vercel CLI using `vercel`.

The site is ready to publish as a public web page. Estimate entries remain in the individual browser and are not shared between devices.

## Use the estimator

- Edit the estimate reference, customer, supplier, currency, and notes.
- Add or remove materials and services. Quantity, unit price, line totals, subtotals, installation, and total update automatically.
- Select **Download PDF**, then choose **Save as PDF** in the browser print dialog. Estimates are formatted for A4 portrait; longer estimates continue on additional pages.
- **New estimate** starts a fresh draft. **Reset to sample** restores the sample estimate.

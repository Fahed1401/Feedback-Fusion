# Feedback Fusion · Audience Intelligence

A responsive, portfolio-ready analytics frontend for [Feedback Fusion](https://github.com/Fahed1401/Feedback-Fusion), a tourism-preference segmentation project built on Principal Component Analysis (PCA) and K-Means clustering.

**Live data behavior:** The frontend is fully functional as a standalone static website. It recomputes PCA + K-Means in JavaScript when a compatible CSV is imported, **not** by loading the repository's existing `.joblib` model. This distinction matters when reporting results.

## Features

- Five views: Analytics Overview, Audience Segments, Profile Explorer, Data Sources, Methodology.
- PCA scatterplot, segment donut, distribution bars, normalized preference rankings.
- Fully client-side PCA (two principal components) and reproducible K-Means with k = 5.
- Compatible with the repo's `data_for_clustering.csv` (24 category columns, optional pandas index).
- Load the **original published CSV** using the 'Load original GitHub CSV' action (requires internet access), or import a local CSV using drag-and-drop.
- Search and filter individual profiles; inspect preference patterns in a detail dialog.
- Download clustered results as CSV, including new `cluster` and `segment_name` columns.
- Responsive desktop/tablet/mobile layouts; light/dark theme switch.
- Clearly labeled **synthetic** demo data for visitors who want an instant preview.
- No third-party JS libraries, authentication, paid cloud services, database, API key or build dependency.

## Quick start

Requires Node.js 18+.

```bash
cd feedback-fusion-frontend
npm run dev
```

Visit **http://localhost:5173**. No `npm install` is required.

Alternative: `python3 -m http.server 5173` in this directory.

### Analyze your actual research CSV

1. Open the **Data sources** tab.
2. Click **Load original GitHub CSV** to retrieve `data_for_clustering.csv` from the [source repository](https://github.com/Fahed1401/Feedback-Fusion), or download that CSV yourself and import it locally.
3. The dashboard recomputes the visualization and the five segments using the imported data. Explore the cluster patterns and export the results.

The dataset is held in **memory only** for the active browser tab and is not uploaded to a server. Your color-theme preference is saved locally.

## CSV contract

Exactly these 24 *named numeric columns* are required, in any order:

```
churches,resorts,beaches,parks,theatres,museums,malls,zoo,restaurants,pubs_bars,local_services,burger_pizza,hotels,juice_bars,art_galleries,dance_clubs,swimming_pools,gyms,bakeries,beauty_spas,cafes,view_points,monuments,gardens
```

Extra columns like `Unnamed: 0`, `id`, `user_id`, `profile_id` are allowed. The original repository file `data_for_clustering.csv` includes an unnamed index column; this is ignored. All 24 category cells must be present and numeric. Values over 1 are normalized column-by-column with min-max scaling; pre-normalized 0–1 values are used as supplied. Maximum file size is 12 MB and maximum 15,000 rows. CSV parsing supports quoted values.

**Research reproducibility note:** Fitted scaler/PCA parameters from the notebook are not available as deployable artifacts in the repo. Browser-side normalization and re-fitting are not guaranteed to reproduce the notebook's fitted cluster IDs or results. K-Means labels are arbitrary and may have different numeric IDs even when membership is equivalent.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local development server on `localhost:5173` |
| `npm test` | Node built-in analytical tests |
| `npm run build` | Create deployment directory `dist/` |
| `npm run preview` | Preview `dist/` on `localhost:5173` |

## Cloudflare Pages deployment

1. Push the folder to a GitHub repository, or copy this folder into your existing Feedback-Fusion repository at `/frontend`.
2. Open **Cloudflare Dashboard → Workers & Pages → Create application → Pages → Connect to Git**.
3. Connect your GitHub repository and set:
   - **Root directory:** `frontend` (if nested inside the existing repo); leave blank if this frontend is the repository root.
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Environment:** Node.js 20 or 22.
4. Deploy. No secret variables are needed. The site opens with clearly labeled synthetic data and can retrieve the original CSV once the viewer clicks the remote-load button.

You can also manually upload the contents of `dist/` to a static hosting service, including GitHub Pages (relative paths are used for assets).

## Repo integration

The original repository is primarily Jupyter notebooks and data files. To keep it intact, put this frontend under a new directory:

```
Feedback-Fusion/
├── data_clustering.ipynb
├── data_eda.ipynb
├── data_preprocessing.ipynb
├── data_for_clustering.csv
├── kmeans_clustering.joblib
├── README.md
└── frontend/                 ← copy this project here
    ├── index.html
    ├── package.json
    ├── src/
    │   ├── app.js
    │   ├── analytics.js
    │   └── styles.css
    ├── public/favicon.svg
    ├── tests/
    └── ...
```

Edit the original repository's README to link to your deployed Pages URL and add screenshots of the demo. You can keep the original analytical notebooks unchanged.

## Model-serving enhancement (future)

For **exact inference** by the original Python model rather than browser re-clustering:

1. Revisit the notebook and save the *full fitted preprocessing pipeline*, including the same scaler, PCA and K-Means model, with pinned scikit-learn versions.
2. Add a Python FastAPI service to accept a list of 24 numeric features and return cluster IDs and metadata.
3. Add endpoint configuration and API authentication, input validation, CORS allowlist, rate limiting, and tests.
4. Align the user-facing segment labels to an explicit cluster mapping from the fitted Python pipeline.

**Do not describe this frontend as using the saved joblib model or performing sentiment analysis.** It is an unsupervised tourism rating segmentation and visualization tool.

## Research attribution

- Original repository: [Fahed1401/Feedback-Fusion](https://github.com/Fahed1401/Feedback-Fusion) (MIT license).
- Dataset cited in that repository: Renjith, S. (2018). *Travel Review Ratings*. UCI Machine Learning Repository, [dataset 485](https://archive.ics.uci.edu/dataset/485/travel+review+ratings), DOI [10.24432/C5C31Q](https://doi.org/10.24432/C5C31Q), CC BY 4.0.
- Original paper cited in the repository: Renjith, Shini, A. Sreekumar, and M. Jathavedan (2018), *Evaluation of Partitioning Clustering Algorithms for Processing Social Media Data in Tourism Domain*.

The synthetic demo dataset in this frontend is generated algorithmically. It is **not** a copy of the source dataset.

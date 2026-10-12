# Mekky ERP — Admin Panel

React 18 + Vite + TailwindCSS admin panel for the Mekky International ERP system
(Kuwait, bilingual AR/EN with RTL, multi-branch).

Pairs with the backend API at: https://github.com/Eslamatef1992/meekly-back

## Stack

- **Framework:** React 18 + Vite 5
- **Styling:** TailwindCSS 3 + custom design system
- **State / Data:** Zustand (auth) + TanStack Query (server state)
- **Routing:** React Router 6
- **i18n:** react-i18next (English LTR + Arabic RTL)
- **Icons:** lucide-react
- **Export:** html2pdf.js (PDF), SheetJS (Excel), native print
- **HTTP:** axios

## Features

- Multi-branch dashboard with per-user branch ACL
- Chart of Accounts (hierarchical, drill-down)
- Vouchers (receipt / payment / journal / contra / sales / purchase)
- **Voucher List** with pagination, 7 filters, totals KPIs, export to PDF/Excel/Print
- Trial Balance, General Ledger, Income Statement, Balance Sheet
- HR: employees, salary components, payroll (Kuwait Labor Law), leaves, requests, EOS
- Inventory: items, warehouses, stock movements, transfers, counts
- RBAC: users, roles, permissions
- Full RTL support with mirrored layout, Arabic typography

## Quick start

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env
#   Edit .env — set VITE_API_URL (e.g. http://localhost:4000)

# 3. Run dev server
npm run dev        # http://localhost:5173

# 4. Build for production
npm run build      # outputs to dist/
```

## Project layout

```
src/
├── components/     # Shared UI (Sidebar, ExportToolbar, Pagination, ...)
├── pages/          # Routed pages, grouped by module
│   ├── auth/
│   ├── finance/
│   ├── hr/
│   ├── inventory/
│   ├── pos/
│   └── system/
├── lib/            # api client, auth store, formatters
├── locales/        # en.json, ar.json
├── App.jsx         # Route tree
└── main.jsx        # Entry point
```

## License

Proprietary — Mekky International.

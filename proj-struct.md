class-alter-system/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js
│   │   │   ├── env.js
│   │   │   └── mail.js
│   │   │
│   │   ├── database/
│   │   │   ├── migrations/
│   │   │   └── seeds/
│   │   │
│   │   ├── models/
│   │   │   ├── staff.model.js
│   │   │   ├── department.model.js
│   │   │   ├── attendance.model.js
│   │   │   ├── timetable.model.js
│   │   │   ├── staffStatus.model.js
│   │   │   ├── alterRequest.model.js
│   │   │   └── alterCandidate.model.js
│   │   │
│   │   ├── services/
│   │   │   ├── attendance.service.js
│   │   │   ├── alterEngine.service.js
│   │   │   ├── staffStatus.service.js
│   │   │   ├── mail.service.js
│   │   │   └── autoApproval.service.js
│   │   │
│   │   ├── controllers/
│   │   │   ├── attendance.controller.js
│   │   │   ├── alter.controller.js
│   │   │   └── hod.controller.js
│   │   │
│   │   ├── routes/
│   │   │   ├── attendance.routes.js
│   │   │   ├── alter.routes.js
│   │   │   └── hod.routes.js
│   │   │
│   │   ├── jobs/
│   │   │   ├── autoApproval.job.js
│   │   │   └── staffStatusSync.job.js
│   │   │
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js
│   │   │   └── role.middleware.js
│   │   │
│   │   ├── utils/
│   │   │   ├── time.utils.js
│   │   │   ├── ranking.utils.js
│   │   │   └── response.utils.js
│   │   │
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── StaffDashboard.jsx
│   │   │   ├── HODDashboard.jsx
│   │   │   └── Login.jsx
│   │   │
│   │   ├── components/
│   │   │   ├── AlterRequestCard.jsx
│   │   │   ├── CandidateList.jsx
│   │   │   ├── TimerBadge.jsx
│   │   │   └── Navbar.jsx
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   │
│   │   ├── hooks/
│   │   │   └── useTimer.js
│   │   │
│   │   ├── routes/
│   │   │   └── AppRoutes.jsx
│   │   │
│   │   ├── styles/
│   │   │   └── global.css
│   │   │
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── docs/
│   ├── database.md
│   ├── api.md
│   └── architecture.md
│
├── README.md
└── .gitignore

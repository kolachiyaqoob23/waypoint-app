# Waypoint: Adaptive Path Generator

Waypoint helps school students find out what they need to learn and follow a
personal study plan. A student registers with their class, takes a short
diagnostic quiz, and gets a plan that starts with the weakest topics. The plan
includes a lesson, the student's own mistakes explained, and study links. After
studying, a focused re-test checks progress and re-orders the plan.

Built for OpenHack'26 by **Team Cyber Squad**:

| Role   | Name               |
| ------ | ------------------ |
| Leader | Muhammad Yaqoob    |
| Member | Ab Ghaffar         |
| Member | Hafeezullah Shaikh |

## How it works

1. **Register** with name, email, password and class (1 to 12). The class decides which subjects are shown as "Matches your class".
2. **Diagnostic quiz**: 3 questions per topic (12 per subject), one at a time, no timer. Answers are graded on the server, so correct answers are never sent to the browser.
3. **Rating**: each topic is rated from its score.
   - 80% or more: **Strong**
   - 50% to 79%: **Getting there**
   - below 50%: **Needs work**
4. **Study plan**: topics are sorted weakest first (then by lowest score) and packed into days. The time budget is 25 minutes for a weak topic, 15 for a developing one and 5 for a strong one (quick review). The student chooses minutes per day: 15, 30, 45, 60 or 90.
5. **Learn**: every topic has a short lesson, key points, the questions the student missed (their choice, the correct answer and a reason) and study links (video, reading, practice).
6. **Re-test**: a focused re-test covers only the topics that are not Strong. It prefers questions the student has not seen yet, shows the change since last time and re-orders the plan.
7. **Admin page** (`/admin`): staff see all registered students by class category with readiness per subject, and can download a CSV.

The adaptivity is rule based. There is no AI or machine learning model in this project.

## Run it

Needs **Node.js 22.13 or newer** (https://nodejs.org). No `npm install` is needed:
the project uses only built-in Node modules (including `node:sqlite`).

    node server.js          # or: npm start

Open http://localhost:3000. The first start prints an **admin key**. The admin
page is http://localhost:3000/admin.

## Settings (environment variables)

| Variable        | Default                                    | Meaning                                                                 |
| --------------- | ------------------------------------------ | ----------------------------------------------------------------------- |
| `PORT`          | `3000`                                     | Port to listen on                                                       |
| `DATA_DIR`      | `./data`                                   | Folder for the database and the admin key file                          |
| `ADMIN_KEY`     | generated once, saved in `data/admin.key`  | Key needed by the admin page                                            |
| `COOKIE_SECURE` | unset                                      | Set to `1` when served over HTTPS (also automatic behind a proxy that sets `x-forwarded-proto`) |

## Subjects and categories

Class 1 to 5 is **Primary**, 6 to 8 **Middle**, 9 to 10 **Secondary (Matric)**, 11 to 12 **Higher Secondary (Intermediate)**.

| Subject              | Area             | Made for                | Topics |
| -------------------- | ---------------- | ----------------------- | ------ |
| Fractions & decimals | Mathematics      | Primary, Middle         | Understanding fractions; Adding & subtracting fractions; Decimals & place value; Fractions, decimals & percentages |
| Algebra basics       | Mathematics      | Middle, Secondary       | Linear equations; Exponents & powers; Factoring quadratics; Slope & graphs |
| Photosynthesis       | Biology          | Secondary, Higher       | Chloroplasts & pigments; Light reactions; Calvin cycle; Limiting factors |
| Newton's laws        | Physics          | Secondary, Higher       | First law: inertia; Second law: F = ma; Third law: action and reaction; Weight, mass & friction |
| Python basics        | Computer Science | Secondary, Higher       | Variables & data types; Conditionals & loops; Lists & dictionaries; Functions |

That is 5 subjects, 20 topics and 80 hand-written questions (4 per topic, 3 asked per attempt).

## Add or edit subjects

Edit `content.js`. Each subject has `id`, `title`, `area`, `kw`, `blurb`,
`bands`, `resources` and `topics`. Each topic needs `id`, `name`, `kw`, `lesson`,
`points` and `questions`. Each question has `id`, `q`, `opts`, `why` and an
optional `code`. In every question the first option (`opts[0]`) is the correct
answer; the server shuffles the options. Question ids must be unique.

Study links per topic are built from the topic keywords (`kw`) as search links
to YouTube, Wikipedia and Khan Academy. They are not a hand-curated library.

## Project structure

    server.js          HTTP server, REST API, SQLite, authentication, grading
    content.js         Subjects, topics, lessons and questions
    package.json       Start script and Node version requirement
    public/
      index.html       Student app shell
      app.js           Student app (vanilla JavaScript): quiz, results, plan
      app.css          Styles
      admin.html       Admin page
      admin.js         Admin page script (student list, CSV export)

## API overview

All API calls use JSON. Student calls need the login cookie.

| Method and path                   | Purpose                                         |
| --------------------------------- | ----------------------------------------------- |
| `POST /api/register`              | Create an account and log in                    |
| `POST /api/login`, `/api/logout`  | Log in and out                                  |
| `GET /api/me`                     | Current student                                 |
| `PUT /api/profile`                | Change name, class or minutes per day           |
| `GET /api/catalog`                | Subjects, topics, lessons and study links       |
| `POST /api/enroll`, `DELETE /api/enroll/:id` | Add or remove a subject              |
| `POST /api/quiz/start`            | Get quiz questions (`full` or `focus` scope)    |
| `POST /api/quiz/submit`           | Submit answers; the server grades them          |
| `GET /api/progress`               | Attempts, studied topics and missed questions   |
| `POST /api/studied`               | Mark a topic as studied or not                  |
| `DELETE /api/progress/:id`        | Reset progress for a subject                    |
| `GET /api/admin/students`         | Student list (needs the `x-admin-key` header)   |
| `GET /api/health`                 | Health check                                    |

## Where data is stored

`data/waypoint.db` (SQLite) with the tables `users`, `sessions`, `enrollments`,
`attempts` and `studied`. Back this file up. Set `DATA_DIR` to store it
somewhere else.

## Security in the code

- Passwords are stored only as salted scrypt hashes.
- Session tokens are stored as hashes and sent as HttpOnly, SameSite cookies (14 days).
- Failed logins are limited (8 attempts per 10 minutes per address and email).
- Quizzes are graded on the server.
- Strict Content-Security-Policy and related security headers are set.
- The admin key is compared in constant time.

## Deploying

Any host that runs Node 22.13+ works (Render, Railway, Fly.io, a VPS). Use a
persistent disk for `DATA_DIR`, serve over HTTPS and run a single instance
(SQLite is a single-file database).

## Limitations and not included yet

- Email verification, "forgot password" and teacher accounts. Add them before a public launch.
- Only 5 subjects and 80 questions; there is no editing screen for content.
- Study links are keyword searches, not curated resources.
- Topics are ordered by weakness only; prerequisites between topics are not modelled.
- No automated test suite is included, and the app has not been tested with real students yet.
- SQLite means one server instance. Move to a server database if usage grows.

## License

MIT

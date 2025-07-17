# Cronsultant

Cronsultant is a lightweight, interactive cron expression assistant built to help users write, understand, and preview cron jobs in real time. Inspired by crontab.guru, it features a clean, terminal-style UI with support for natural language parsing, upcoming execution previews, syntax highlighting, and interactive learning tools.

<p align="center">
  <img src="cronsultant cover.png" />
</p>

---

## What is Cronsultant?

Cronsultant helps developers and system administrators:
- Build accurate cron expressions with instant feedback
- Understand what a cron schedule really means in plain English
- Preview upcoming run times across different timezones
- Learn cron syntax interactively with smart templates and challenges

---

## Tech Stack

- **HTML5**
- **CSS3** (custom theme with light & dark mode)
- **JavaScript (ES6+)**
- No frameworks, no build tools — runs purely in the browser with vanilla JS.

---

## How to Use Cronsultant

1. Open the Cronsultant page.
2. Enter your cron expression in the main input field (e.g., `0 9 * * 1`).
3. Cronsultant will:
   - Parse the expression
   - Show a human-readable description
   - Display the next upcoming execution(s)
4. Use the **timezone selector**, **copy button**, or explore preset templates and lightning challenges.
5. Hover your cursor through the input to highlight the corresponding part of the expression in the output.

---

## Cron Format Guide

Cron jobs follow a 5-part schedule format:
```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of Week (0 - 6 or SUN–SAT, where 0 = Sunday)
│ │ │ └───── Month (1 - 12 or JAN–DEC)
│ │ └─────── Day of Month (1 - 31)
│ └───────── Hour (0 - 23)
└─────────── Minute (0 - 59)
```

Each field controls a specific unit of time:

| Field            | Position | Allowed Values                 | Description                          |
|------------------|----------|--------------------------------|--------------------------------------|
| **Minute**        | 1st      | `0–59`                         | Minute of the hour                   |
| **Hour**          | 2nd      | `0–23`                         | Hour of the day                      |
| **Day of Month**  | 3rd      | `1–31`                         | Day of the month                     |
| **Month**         | 4th      | `1–12` or `JAN–DEC`            | Month of the year                    |
| **Day of Week**   | 5th      | `0–6` or `SUN–SAT`             | Day of the week (0 = Sunday)         |

---

### Advanced Syntax

| Syntax           | Example             | Description                                              |
|------------------|---------------------|----------------------------------------------------------|
| **Asterisk `*`**  | `* * * * *`         | Wildcard – every possible value                         |
| **List `,`**      | `0 9,17 * * *`      | Multiple values – at 9:00 and 17:00                     |
| **Range `-`**     | `0 9-17 * * *`      | Range – every hour from 9:00 to 17:00                   |
| **Step `/`**      | `*/15 * * * *`      | Step – every 15 minutes                                 |
| **Last `L`**      | `0 0 L * *`         | Last day of the month                                   |
| **Nth `#`**       | `0 9 * * 1#2`       | Second Monday of the month (weekday 1, occurrence 2)    |

---

## Features

- ✅ Real-time cron expression parsing
- ✅ Clean, terminal-inspired UI with light & dark modes
- ✅ Upcoming executions viewer (up to 5 future runs)
- ✅ Timezone support (IANA-compliant)
- ✅ Hover-based field highlighting tied to cursor position
- ✅ Copy cron expression to clipboard
- ✅ Smart cron templates (presets)
- ✅ Lightning Cron Challenges (mini quiz mode)
- ✅ Cron syntax reference with interactive formatting

---

## Author
Built with care by Jodi Gabano an IT Intern at Tutorials Dojo and BS Computer Science student at the University of the Philippines - Mindanao.
